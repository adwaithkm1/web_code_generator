import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  // Trust first proxy for Render deployment
  app.set('trust proxy', 1);

  // Get the base URL from environment variable or default to localhost
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const googleCallbackUrl = `${baseUrl}/auth/google/callback`;

  log(`Configuring authentication with base URL: ${baseUrl}`);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours by default
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  log("Configuring local authentication strategy");
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        console.error("Local auth error:", err);
        return done(err);
      }
    }),
  );

  // Only setup Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    log("Configuring Google OAuth strategy");
    log(`Google OAuth callback URL: ${googleCallbackUrl}`);

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback", // Use relative URL
          proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByGoogleId(profile.id);

            if (!user) {
              log(`Creating new user for Google profile: ${profile.id}`);
              user = await storage.createUser({
                username: profile.emails?.[0]?.value || profile.id,
                password: await hashPassword(randomBytes(32).toString("hex")),
                googleId: profile.id,
              });
            }

            return done(null, user);
          } catch (error) {
            console.error("Google auth error:", error);
            return done(error);
          }
        }
      )
    );

    // Google OAuth routes
    app.get(
      "/auth/google",
      (req, res, next) => {
        log(`Initiating Google OAuth flow from: ${req.headers.referer}`);
        log(`Using callback URL: ${googleCallbackUrl}`);
        next();
      },
      passport.authenticate("google", { 
        scope: ["profile", "email"],
        callbackURL: googleCallbackUrl, // Explicitly set the full callback URL
      })
    );

    app.get(
      "/auth/google/callback",
      (req, res, next) => {
        log(`Received Google OAuth callback`);
        next();
      },
      passport.authenticate("google", { 
        failureRedirect: "/auth",
        callbackURL: googleCallbackUrl, // Explicitly set the full callback URL
      }),
      (req, res) => {
        log(`Google OAuth authentication successful, redirecting to home`);
        res.redirect("/");
      }
    );
  } else {
    log("Google OAuth not configured - skipping setup");
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      console.error("Session deserialization error:", err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Update session cookie expiry if remember me is selected
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Update session cookie expiry if remember me is selected
    if (req.body.rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  log("Authentication setup completed");
}