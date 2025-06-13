import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Simple in-memory authentication store
const authenticatedUsers = new Map<string, any>();

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function setupAuth(app: Express) {
  // Demo login route - creates a demo user and sets a token
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

      console.log("Creating login token for user:", demoUser);

      // Generate a simple token and store user
      const token = generateToken();
      authenticatedUsers.set(token, demoUser);

      // Set token as cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: 'lax'
      });

      console.log("Token set, redirecting to home");
      res.redirect("/");
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/logout", (req, res) => {
    const token = req.cookies?.auth_token;
    if (token) {
      authenticatedUsers.delete(token);
    }
    res.clearCookie('auth_token');
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.auth_token;
  console.log("Auth check - Token:", token);

  if (!token) {
    console.log("Auth check - No token found, returning 401");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = authenticatedUsers.get(token);
  console.log("Auth check - User from token:", user);

  if (!user) {
    console.log("Auth check - Invalid token, returning 401");
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request for route handlers
  (req as any).user = user;
  console.log("Auth check - User authenticated successfully");
  next();
};