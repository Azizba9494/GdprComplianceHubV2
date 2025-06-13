import type { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Enhanced authentication with multiple methods
const authenticatedUsers = new Map<string, any>();

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function setupAuth(app: Express) {
  // Passport configuration
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy", 
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Check if user exists with same email
        user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
        
        if (user) {
          // Link Google ID to existing account
          await storage.updateUser(user.id, { googleId: profile.id });
        } else {
          // Create new user
          user = await storage.createUser({
            id: generateToken(),
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value,
            emailVerified: new Date(),
            role: "user"
          });
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));

  app.use(passport.initialize());

  // Email/Password Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Un compte existe déjà avec cette adresse email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        id: generateToken(),
        email,
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        role: "user"
      });

      // Generate auth token
      const token = generateToken();
      authenticatedUsers.set(token, user);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      res.json({ message: "Inscription réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Generate auth token
      const token = generateToken();
      authenticatedUsers.set(token, user);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      res.json({ message: "Connexion réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { session: false }),
    (req, res) => {
      const user = req.user as any;
      const token = generateToken();
      authenticatedUsers.set(token, user);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      res.redirect("/");
    }
  );

  // Demo login route (keep for testing)
  app.get("/api/login", async (req, res) => {
    try {
      const demoUser = await storage.upsertUser({
        id: "demo-user-123",
        email: "demo@example.com",
        firstName: "Utilisateur",
        lastName: "Demo",
        profileImageUrl: null,
        role: "user"
      });

      const token = generateToken();
      authenticatedUsers.set(token, demoUser);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      res.redirect("/");
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
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

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = authenticatedUsers.get(token);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = user;
  next();
};

export const isSuperAdmin: RequestHandler = async (req, res, next) => {
  const user = (req as any).user;
  
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
};