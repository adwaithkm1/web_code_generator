import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { rateLimiter } from "./rate-limit";
import { generateCode } from "./openai";
import { codeGenerationSchema, insertSharedCodeSchema } from "@shared/schema";
import { storage } from "./storage"; // Assuming storage is defined here

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/generate", rateLimiter, async (req, res, next) => {
    try {
      const validatedRequest = codeGenerationSchema.parse(req.body);
      const generatedCode = await generateCode(validatedRequest);
      res.json({ code: generatedCode });
    } catch (error) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid request format" });
      } else {
        next(error);
      }
    }
  });

  // Share code endpoint
  app.post("/api/share", rateLimiter, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedRequest = insertSharedCodeSchema.parse(req.body);
      const sharedCode = await storage.createSharedCode(req.user.id, validatedRequest);
      res.status(201).json(sharedCode);
    } catch (error) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid request format" });
      } else {
        next(error);
      }
    }
  });

  // Get shared code by ID
  app.get("/api/share/:shareId", async (req, res) => {
    const sharedCode = await storage.getSharedCode(req.params.shareId);
    if (!sharedCode) {
      return res.status(404).json({ error: "Shared code not found or expired" });
    }
    res.json(sharedCode);
  });

  // Get user's shared code
  app.get("/api/user/shared", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sharedCode = await storage.getUserSharedCode(req.user.id);
    res.json(sharedCode);
  });

  const httpServer = createServer(app);
  return httpServer;
}