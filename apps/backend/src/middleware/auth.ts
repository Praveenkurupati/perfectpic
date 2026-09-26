import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role?: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized - Missing or invalid token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as { id: string; role?: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token) as { id: string; role?: string };
      req.user = decoded;
    } catch (error) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};
