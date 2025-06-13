import type { RequestHandler } from "express";

// Middleware de développement qui simule un utilisateur authentifié
export const devAuthMiddleware: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && !req.isAuthenticated()) {
    // Simulate authenticated user in development
    (req as any).user = {
      claims: {
        sub: "dev-user-123",
        email: "dev@example.com",
        first_name: "Développeur",
        last_name: "Mode"
      }
    };
    
    // Mock isAuthenticated for development
    (req as any).isAuthenticated = () => true;
  }
  next();
};

// Enhanced isAuthenticated that works in development mode
export const isAuthenticatedDev: RequestHandler = async (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, always allow access
    if (!req.isAuthenticated()) {
      (req as any).user = {
        claims: {
          sub: "dev-user-123",
          email: "dev@example.com",
          first_name: "Développeur",
          last_name: "Mode"
        }
      };
      (req as any).isAuthenticated = () => true;
    }
    return next();
  }

  // Production mode - use normal authentication
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};