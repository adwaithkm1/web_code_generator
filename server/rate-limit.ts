import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const remainingLimit = await storage.decrementRateLimit(req.user.id);
    
    if (remainingLimit <= 0) {
      return res.status(429).json({
        error: "Rate limit exceeded.Wait for a minute",
      });
    }

    // Add remaining limit to response headers
   // res.setHeader("X-RateLimit-Remaining", remainingLimit.toString());
    next();
  } catch (error) {
    next(error);
  }
}

// Reset rate limits daily
setInterval(async () => {
  const users = Array.from(storage.users.values());
  for (const user of users) {
    await storage.resetRateLimit(user.id);
  }
}, 60 * 1000);
