import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const memoryStore = MemoryStore(session);
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: new memoryStore({
      checkPeriod: sessionTtl, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Demo login route - creates a demo user
  app.get("/api/login", async (req, res) => {
    try {
      // Create or get demo user
      const demoUser = await storage.upsertUser({
        id: "demo-user-123",
        email: "demo@example.com",
        firstName: "Utilisateur",
        lastName: "Demo",
        profileImageUrl: null,
      });

      console.log("Setting user in session:", demoUser);

      // Set user in session directly
      (req.session as any).user = demoUser;
      
      console.log("Session after setting user:", req.session);
      res.redirect("/");
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - Session data:", req.session);
  
  const user = (req.session as any)?.user;
  console.log("Auth check - User from session:", user);

  if (!user) {
    console.log("Auth check - No user found, returning 401");
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request for route handlers
  (req as any).user = user;
  console.log("Auth check - User authenticated successfully");
  next();
};