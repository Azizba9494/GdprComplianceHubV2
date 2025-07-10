import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { db, testDatabaseConnection } from "./db";
import { contextExtractor } from "./services/contextExtractor";
import userRoutes from "./routes/userRoutes";
import { 
  insertUserSchema, insertCompanySchema, insertDiagnosticQuestionSchema,
  insertDiagnosticResponseSchema, insertComplianceActionSchema,
  insertProcessingRecordSchema, insertSubprocessorRecordSchema,
  insertDataSubjectRequestSchema,
  insertPrivacyPolicySchema, insertDataBreachSchema,
  insertDpiaAssessmentSchema, insertAiPromptSchema, insertLlmConfigurationSchema,
  insertRagDocumentSchema, insertPromptDocumentSchema, promptDocuments,
  processingRecords, subprocessorRecords, dpiaEvaluations
} from "@shared/schema";
import { eq, and, or, gte, like } from "drizzle-orm";
import multer from "multer";
// import pdfParse from "pdf-parse";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Helper function to get RAG documents for AI prompts
async function getRagDocuments(promptName?: string): Promise<string[]> {
  try {
    const ragDocuments: string[] = [];

    // If a promptName is provided, load only documents associated with that prompt
    if (promptName) {
      const prompt = await storage.getAiPromptByName(promptName); // Assuming you have a method to get a prompt by name
      if (prompt) {
        const promptDocuments = await storage.getPromptDocuments(prompt.id);
        if (promptDocuments.length > 0) {
          const documentIds = promptDocuments
            .sort((a, b) => a.priority - b.priority)
            .map(pd => pd.documentId);

          for (const docId of documentIds) {
            const document = await storage.getRagDocument(docId);
            if (document && document.isActive && !ragDocuments.includes(document.content)) {
              ragDocuments.push(document.content);
            }
          }
        }
      }
    } else {
      // Get all active prompts and their documents (default behavior)
      const allPrompts = await storage.getAiPrompts();
      const activePrompts = allPrompts.filter(p => p.isActive);

      // For each active prompt, get associated documents
      for (const prompt of activePrompts) {
        const promptDocuments = await storage.getPromptDocuments(prompt.id);
        if (promptDocuments.length > 0) {
          const documentIds = promptDocuments
            .sort((a, b) => a.priority - b.priority)
            .map(pd => pd.documentId);

          for (const docId of documentIds) {
            const document = await storage.getRagDocument(docId);
            if (document && document.isActive && !ragDocuments.includes(document.content)) {
              ragDocuments.push(document.content);
            }
          }
        }
      }
    }

    return ragDocuments;
  } catch (error) {
    console.error('Error getting RAG documents:', error);
    return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register user management routes first
  app.use("/api/user", userRoutes);
  app.use("/api/company", userRoutes);

  // Test database connection before setting up routes
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn('Database connection failed, some routes may not work properly');
  }

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    // Populate req.user from session
    req.user = req.session.user || { id: req.session.userId };
    next();
  };

  // Multi-tenancy middleware - ensures data isolation by company
  const requireCompanyAccess = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
    
    if (companyId) {
      // Verify user has access to this specific company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, parseInt(companyId));
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }
    }
    
    next();
  };

  // Granular permission middleware - checks specific module permissions
  const requireModulePermission = (module: string, permission: string) => {
    return async (req: any, res: any, next: any) => {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let companyId = req.params.companyId || req.body.companyId || req.query.companyId;
      
      // For routes with :id parameter (like PUT/DELETE /api/breaches/:id), 
      // try to get companyId from the existing object
      if (!companyId && req.params.id) {
        try {
          let existingObject = null;
          
          // Get the existing object based on module type
          if (module === 'breaches') {
            existingObject = await storage.getDataBreach(parseInt(req.params.id));
          } else if (module === 'records') {
            existingObject = await storage.getProcessingRecord(parseInt(req.params.id));
          } else if (module === 'actions') {
            existingObject = await storage.getAction(parseInt(req.params.id));
          } else if (module === 'dpia') {
            existingObject = await storage.getDpiaEvaluation(parseInt(req.params.id));
          }
          
          if (existingObject && existingObject.companyId) {
            companyId = existingObject.companyId;
          }
        } catch (error) {
          console.error(`Error retrieving ${module} object for permission check:`, error);
        }
      }
      
      if (!companyId) {
        return res.status(400).json({ error: "Company ID required" });
      }

      try {
        // Get user's company access
        const userAccess = await storage.getUserCompanyAccess(req.session.userId);
        const access = userAccess.find(a => a.companyId === parseInt(companyId));
        
        if (!access) {
          return res.status(403).json({ error: "Access denied to this company" });
        }

        // Owners have all permissions (but we'll still log for testing)
        if (access.role === 'owner') {
          console.log(`[PERMISSIONS] Owner ${req.session.userId} bypassing permission check for ${module}.${permission}`);
          return next();
        }

        // Check specific permission
        const requiredPermission = `${module}.${permission}`;
        console.log(`[PERMISSIONS] User ${req.session.userId} (role: ${access.role}) checking ${requiredPermission}. Has permissions:`, access.permissions);
        
        if (!access.permissions?.includes(requiredPermission)) {
          console.log(`[PERMISSIONS] DENIED - User ${req.session.userId} missing permission: ${requiredPermission}`);
          
          // Create user-friendly error message based on module and permission
          const moduleLabels: { [key: string]: string } = {
            'records': 'fiches de traitement',
            'actions': 'plan d\'action',
            'breaches': 'violations de données',
            'dpia': 'analyses d\'impact AIPD',
            'privacy': 'politiques de confidentialité',
            'rights': 'demandes de droits',
            'subprocessors': 'registre des sous-traitants',
            'team': 'formation équipe',
            'admin': 'administration'
          };
          
          const permissionLabels: { [key: string]: string } = {
            'read': 'consulter',
            'write': 'modifier',
            'generate': 'générer',
            'analyze': 'analyser',
            'manage': 'administrer'
          };
          
          const moduleLabel = moduleLabels[module] || module;
          const permissionLabel = permissionLabels[permission] || permission;
          
          return res.status(403).json({ 
            error: `Droits insuffisants pour ${permissionLabel} les ${moduleLabel}. Contactez l'administrateur pour obtenir les permissions nécessaires.`,
            technicalError: `Permission denied. Required: ${requiredPermission}`,
            userPermissions: access.permissions,
            requiredPermission,
            userRole: access.role
          });
        }

        console.log(`[PERMISSIONS] GRANTED - User ${req.session.userId} has permission: ${requiredPermission}`);
        next();
      } catch (error: any) {
        console.error('Permission check error:', error);
        res.status(500).json({ error: "Permission check failed" });
      }
    };
  };

  // Owner-only middleware - ensures only company owners can perform critical actions
  const requireOwnerRole = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ error: "Company ID required" });
    }

    try {
      // Get user's company access
      const userAccess = await storage.getUserCompanyAccess(req.session.userId);
      const access = userAccess.find(a => a.companyId === parseInt(companyId));
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Only owners allowed
      if (access.role !== 'owner') {
        console.log(`[SECURITY] User ${req.session.userId} (role: ${access.role}) denied owner-only access to company ${companyId}`);
        return res.status(403).json({ 
          error: "Cette action est réservée aux propriétaires de l'entreprise.",
          technicalError: "Owner role required",
          userRole: access.role
        });
      }

      console.log(`[SECURITY] Owner ${req.session.userId} granted owner-only access to company ${companyId}`);
      next();
    } catch (error: any) {
      console.error('Owner role check error:', error);
      res.status(500).json({ error: "Role verification failed" });
    }
  };

  // Enhanced Authentication routes with security
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists by email or username
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      const existingUserByUsername = await storage.getUserByUsername(userData.username);

      if (existingUserByEmail) {
        return res.status(400).json({ error: "Un compte avec cet email existe déjà" });
      }

      if (existingUserByUsername) {
        return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris" });
      }

      // Hash password before storing
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Create a new company for the user (multi-tenancy)
      const newCompany = await storage.createCompany({
        name: `${user.firstName} ${user.lastName} Company`,
        userId: user.id,
        sector: 'Non spécifié',
        size: 'Non spécifié'
      });

      // Grant user access to their company
      await storage.createUserCompanyAccess({
        userId: user.id,
        companyId: newCompany.id,
        role: 'owner',
        permissions: ['read', 'write', 'admin'],
        status: 'active'
      });

      // Store user session
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        } 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body; // Allow login with username or email

      // Find user by username or email
      let user = await storage.getUserByUsername(identifier);
      if (!user) {
        user = await storage.getUserByEmail(identifier);
      }

      if (!user) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Verify password with bcrypt
      const bcrypt = await import('bcryptjs');
      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Update last login time
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Store user session
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };

      // Force session save
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully with userId:', user.id);
            resolve(true);
          }
        });
      });

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        } 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: "Erreur lors de la déconnexion" });
      }
      res.clearCookie('gdpr.sid');
      res.clearCookie('connect.sid'); // Clear default cookie name too
      res.json({ success: true, message: "Déconnexion réussie" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      const session = req.session as any;
      
      // Debug session information
      console.log('Session check:', {
        hasSession: !!session,
        userId: session?.userId,
        sessionId: req.sessionID,
        cookieExists: !!req.headers.cookie?.includes('gdpr.sid')
      });

      if (session?.userId && session?.user) {
        // Refresh session on each auth check
        session.touch();
        
        res.json({ 
          user: session.user,
          authenticated: true 
        });
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      res.json({ authenticated: false });
    }
  });

  // Find user by email - useful for password reset and user lookup
  app.get("/api/auth/find-user", async (req, res) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email requis" });
      }

      const user = await storage.getUserByEmail(email);

      if (user) {
        // Return limited user info for security
        res.json({
          found: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } else {
        res.json({ found: false });
      }
    } catch (error: any) {
      console.error('Find user error:', error);
      res.status(500).json({ error: error.message });
    }
  });



  // Company routes
  app.get("/api/companies/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const company = await storage.getCompanyByUserId(userId);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get company by user ID - specific route for user context
  app.get("/api/companies/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify that the user is requesting their own company or is an admin
      if (req.session.userId !== userId && req.session.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied to this user's company data" });
      }
      
      const company = await storage.getCompanyByUserId(userId);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all companies accessible to a user
  app.get("/api/users/:userId/companies", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessionUserId = req.session?.userId;
      
      // Users can only access their own company list
      if (sessionUserId !== userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      // Get companies where user is owner
      const ownedCompany = await storage.getCompanyByUserId(userId);
      
      // Get companies where user is collaborator
      const collaboratorAccess = await storage.getUserCompanyAccess(userId);
      
      const companies = [];
      const seenCompanyIds = new Set();
      
      // Add owned company first
      if (ownedCompany) {
        companies.push({
          id: ownedCompany.id,
          name: ownedCompany.name,
          sector: ownedCompany.sector,
          role: 'owner',
          permissions: ['all']
        });
        seenCompanyIds.add(ownedCompany.id);
      }
      
      // Add collaborator companies (only if not already added as owner)
      for (const access of collaboratorAccess) {
        if (access.company && !seenCompanyIds.has(access.company.id)) {
          companies.push({
            id: access.company.id,
            name: access.company.name,
            sector: access.company.sector,
            role: access.role,
            permissions: access.permissions
          });
          seenCompanyIds.add(access.company.id);
        }
      }
      
      res.json(companies);
    } catch (error: any) {
      console.error('Get user companies error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Diagnostic routes (questions are global)
  app.get("/api/diagnostic/questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getDiagnosticQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/diagnostic/responses/:companyId", requireModulePermission('diagnostic', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const responses = await storage.getDiagnosticResponses(companyId);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/diagnostic/responses", requireModulePermission('diagnostic', 'write'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Get user's company ID from authenticated session
      const userCompany = await storage.getCompanyByUserId(userId);
      if (!userCompany) {
        return res.status(404).json({ error: "Aucune entreprise associée à cet utilisateur" });
      }

      // Override companyId with authenticated user's company
      const responseData = insertDiagnosticResponseSchema.parse({
        ...req.body,
        companyId: userCompany.id
      });
      
      console.log(`[DIAGNOSTIC] Creating response for user ${userId}, company ${userCompany.id}`);
      const response = await storage.createDiagnosticResponse(responseData);
      res.json(response);
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Error creating response:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/diagnostic/analyze", requireModulePermission('diagnostic', 'write'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Get user's company ID from authenticated session
      const userCompany = await storage.getCompanyByUserId(userId);
      if (!userCompany) {
        return res.status(404).json({ error: "Aucune entreprise associée à cet utilisateur" });
      }
      const companyId = userCompany.id;

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const responses = await storage.getDiagnosticResponses(companyId);
      const questions = await storage.getDiagnosticQuestions();

      // Generate action plans based on manual configuration
      const actions = [];
      let overallRiskScore = 0;
      let riskCount = { faible: 0, moyen: 0, elevé: 0, critique: 0 };

      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) continue;

        const isYes = response.response.toLowerCase() === 'oui';
        const actionPlan = isYes ? question.actionPlanYes : question.actionPlanNo;
        const riskLevel = isYes ? question.riskLevelYes : question.riskLevelNo;

        if (actionPlan && actionPlan.trim()) {
          const riskScore = riskLevel === 'critique' ? 25 : riskLevel === 'elevé' ? 15 : riskLevel === 'moyen' ? 10 : 5;
          overallRiskScore += riskScore;
          riskCount[riskLevel as keyof typeof riskCount]++;

          actions.push({
            title: `Action pour: ${question.question}`,
            description: actionPlan,
            category: question.category,
            priority: riskLevel === 'critique' ? 'critical' : riskLevel === 'elevé' ? 'high' : riskLevel === 'moyen' ? 'medium' : 'low',
            riskLevel: riskLevel,
          });
        }
      }

      // Create compliance actions from manual configuration
      for (const action of actions) {
        await storage.createComplianceAction({
          companyId,
          title: action.title,
          description: action.description,
          category: action.category,
          priority: action.priority,
          status: "todo",
        });
      }

      const analysis = {
        actions,
        overallRiskScore: Math.min(100, overallRiskScore),
        riskDistribution: riskCount,
        totalActions: actions.length,
        summary: `Diagnostic terminé. ${actions.length} actions identifiées basées sur vos réponses.`
      };

      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Compliance actions routes
  app.get("/api/actions/:companyId", requireModulePermission('actions', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const actions = await storage.getComplianceActions(companyId);
      res.json(actions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/actions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Convert date strings to Date objects if present
      if (updates.dueDate && typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }

      // Log activity when status changes
      if (updates.status) {
        const userId = req.session?.userId;
        await storage.createActionActivityLog({
          actionId: id,
          userId,
          activityType: 'status_changed',
          oldValue: updates.previousStatus || 'unknown',
          newValue: updates.status,
          description: `Statut modifié de "${updates.previousStatus || 'inconnu'}" vers "${updates.status}"`
        });
      }

      const action = await storage.updateComplianceAction(id, updates);
      res.json(action);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Action Assignments Routes
  app.get("/api/actions/:actionId/assignments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const assignments = await storage.getActionAssignments(actionId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/actions/:actionId/assignments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const { userId, role } = req.body;
      const assignedById = req.session?.userId;

      const assignment = await storage.createActionAssignment({
        actionId,
        userId,
        role: role || 'assignee',
        assignedById
      });

      // Log assignment activity
      await storage.createActionActivityLog({
        actionId,
        userId: assignedById,
        activityType: 'assigned',
        newValue: userId.toString(),
        description: `Tâche assignée à l'utilisateur ${userId} avec le rôle ${role || 'assignee'}`
      });

      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/actions/:actionId/assignments/:assignmentId", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const assignmentId = parseInt(req.params.assignmentId);
      const userId = req.session?.userId;

      await storage.deleteActionAssignment(assignmentId);

      // Log unassignment activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'unassigned',
        description: `Assignment supprimé (ID: ${assignmentId})`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Action Comments Routes
  app.get("/api/actions/:actionId/comments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const comments = await storage.getActionComments(actionId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/actions/:actionId/comments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const { content, mentionedUsers, isInternal } = req.body;
      const userId = req.session?.userId;

      const comment = await storage.createActionComment({
        actionId,
        userId,
        content,
        mentionedUsers: mentionedUsers || [],
        isInternal: isInternal || false
      });

      // Log comment activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'commented',
        description: `Nouveau commentaire ajouté`
      });

      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/actions/:actionId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const actionId = parseInt(req.params.actionId);
      const { content } = req.body;
      const userId = req.session?.userId;

      const comment = await storage.updateActionComment(commentId, { content });

      // Log edit activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'comment_edited',
        description: `Commentaire modifié (ID: ${commentId})`
      });

      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/actions/:actionId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const actionId = parseInt(req.params.actionId);
      const userId = req.session?.userId;

      await storage.deleteActionComment(commentId);

      // Log deletion activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'comment_deleted',
        description: `Commentaire supprimé (ID: ${commentId})`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Action Activity Log Routes
  app.get("/api/actions/:actionId/activity", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const activity = await storage.getActionActivityLog(actionId);
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Action Attachments Routes
  app.get("/api/actions/:actionId/attachments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const attachments = await storage.getActionAttachments(actionId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/actions/:actionId/attachments", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const userId = req.session?.userId;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      // For now, we'll store file metadata only (in a real app, upload to cloud storage)
      const attachment = await storage.createActionAttachment({
        actionId,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        filePath: `uploads/actions/${actionId}/${file.originalname}`, // placeholder path
        description: req.body.description || ''
      });

      // Log attachment activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'attachment_added',
        description: `Fichier joint: ${file.originalname}`
      });

      res.json(attachment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/actions/:actionId/attachments/:attachmentId", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const attachmentId = parseInt(req.params.attachmentId);
      const userId = req.session?.userId;

      await storage.deleteActionAttachment(attachmentId);

      // Log deletion activity
      await storage.createActionActivityLog({
        actionId,
        userId,
        activityType: 'attachment_deleted',
        description: `Pièce jointe supprimée (ID: ${attachmentId})`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Processing records routes
  app.get("/api/records/:companyId", requireModulePermission('records', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const records = await storage.getProcessingRecords(companyId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records/generate", requireAuth, requireModulePermission('records', 'write'), async (req, res) => {
    try {
      const { companyId, processingType, description } = req.body;

      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session?.userId, companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const recordTemplate = await geminiService.generateProcessingRecord(company, processingType, description);

      const record = await storage.createProcessingRecord({
        companyId,
        ...recordTemplate,
        type: processingType,
        // Auto-fill data controller information from company data
        dataControllerName: req.body.dataControllerName || company.name,
        dataControllerAddress: req.body.dataControllerAddress || company.address,
        dataControllerPhone: req.body.dataControllerPhone || company.phone,
        dataControllerEmail: req.body.dataControllerEmail || company.email,
        // Include DPO fields from request data if provided
        hasDpo: req.body.hasDpo || false,
        dpoName: req.body.dpoName || null,
        dpoPhone: req.body.dpoPhone || null,
        dpoEmail: req.body.dpoEmail || null,
        // Include joint controller information if provided
        jointControllerInfo: req.body.jointControllerInfo || null,
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records", requireAuth, requireModulePermission('records', 'write'), async (req, res) => {
    try {
      const recordData = insertProcessingRecordSchema.parse(req.body);

      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session?.userId, recordData.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Auto-fill data controller information from company data if not provided
      if (!recordData.dataControllerName || !recordData.dataControllerAddress) {
        const company = await storage.getCompany(recordData.companyId);
        if (company) {
          recordData.dataControllerName = recordData.dataControllerName || company.name;
          recordData.dataControllerAddress = recordData.dataControllerAddress || company.address;
          recordData.dataControllerPhone = recordData.dataControllerPhone || company.phone;
          recordData.dataControllerEmail = recordData.dataControllerEmail || company.email;
        }
      }

      const record = await storage.createProcessingRecord(recordData);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Get the existing record to verify company access
      const existingRecord = await storage.getProcessingRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      // Verify user has access to this company
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      const hasAccess = await storage.verifyUserCompanyAccess(userId, existingRecord.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Check write permissions for records
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === existingRecord.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Owners have all permissions
      if (access.role !== 'owner') {
        const requiredPermission = 'records.write';
        if (!access.permissions?.includes(requiredPermission)) {
          return res.status(403).json({ 
            error: `Droits insuffisants pour modifier les fiches de traitement. Contactez l'administrateur pour obtenir les permissions nécessaires.`,
            technicalError: `Permission denied. Required: ${requiredPermission}`,
            userPermissions: access.permissions,
            requiredPermission,
            userRole: access.role
          });
        }
      }

      const record = await storage.updateProcessingRecord(id, updates);
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing record to verify company access
      const existingRecord = await storage.getProcessingRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      // Verify user has access to this company
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      const hasAccess = await storage.verifyUserCompanyAccess(userId, existingRecord.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Check write permissions for records
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === existingRecord.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Owners have all permissions
      if (access.role !== 'owner') {
        const requiredPermission = 'records.write';
        if (!access.permissions?.includes(requiredPermission)) {
          return res.status(403).json({ 
            error: `Droits insuffisants pour modifier les fiches de traitement. Contactez l'administrateur pour obtenir les permissions nécessaires.`,
            technicalError: `Permission denied. Required: ${requiredPermission}`,
            userPermissions: access.permissions,
            requiredPermission,
            userRole: access.role
          });
        }
      }

      await storage.deleteProcessingRecord(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records/analyze-dpia", async (req, res) => {
    try {
      const record = req.body;
      const analysis = await geminiService.assessDPIA(record.name, record.purpose, { companyId: record.companyId });

      res.json({
        dpiaRequired: analysis.dpiaRequired,
        justification: analysis.conclusion,
        riskLevel: analysis.riskAssessment?.overallRisk || 'moyen'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Privacy policy routes
  app.get("/api/privacy-policies/:companyId", requireModulePermission('policies', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const policies = await storage.getPrivacyPolicies(companyId);
      res.json(policies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/privacy-policies/:id", requireAuth, async (req, res) => {
    try {
      const policyId = parseInt(req.params.id);
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Get policy to check which company it belongs to
      const policy = await storage.getPrivacyPolicy(policyId);
      if (!policy) {
        return res.status(404).json({ error: "Politique non trouvée" });
      }

      // Check user has policies.write permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === policy.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Accès refusé à cette entreprise" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('policies.write') && !access.permissions?.includes('policies.delete')) {
        return res.status(403).json({ error: "Droits insuffisants pour supprimer des politiques de confidentialité" });
      }

      await storage.deletePrivacyPolicy(policyId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/privacy-policies/generate", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Company ID required" });
      }

      // Check user has policies.write permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('policies.write')) {
        return res.status(403).json({ error: "Droits insuffisants pour générer des politiques de confidentialité" });
      }

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const records = await storage.getProcessingRecords(companyId);

      try {
        const policyData = await geminiService.generatePrivacyPolicy(company, records);

        const policy = await storage.createPrivacyPolicy({
          companyId,
          content: policyData.content,
          isActive: true,
        });

        res.json(policy);
      } catch (aiError: any) {
        console.error('AI generation failed:', aiError.message);

        // Retourner une erreur spécifique avec suggestions
        if (aiError.message.includes('surchargé') || aiError.message.includes('overloaded')) {
          return res.status(503).json({ 
            error: "Service temporairement indisponible",
            message: "Le service de génération IA est actuellement surchargé. Veuillez réessayer dans quelques minutes.",
            retry: true,
            suggestions: [
              "Réessayez dans 2-3 minutes",
              "Vérifiez votre connexion internet", 
              "Contactez le support si le problème persiste"
            ]
          });
        }

        return res.status(500).json({ 
          error: "Erreur de génération",
          message: aiError.message,
          retry: true
        });
      }
    } catch (error: any) {
      console.error('Privacy policy generation error:', error);
      res.status(500).json({ 
        error: "Erreur système",
        message: "Une erreur interne s'est produite. Veuillez réessayer."
      });
    }
  });

  // Data breach routes
  app.get("/api/breaches/:companyId", requireModulePermission('breaches', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const breaches = await storage.getDataBreaches(companyId);
      res.json(breaches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/breaches", requireAuth, requireModulePermission('breaches', 'write'), async (req, res) => {
    try {
      console.log('Raw breach data received:', JSON.stringify(req.body, null, 2));

      // Validate with the schema that handles string-to-date transformation
      const breachData = insertDataBreachSchema.parse(req.body);

      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, breachData.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      console.log('Validated breach data:', JSON.stringify(breachData, null, 2));

      const breach = await storage.createDataBreach(breachData);
      res.json(breach);
    } catch (error: any) {
      console.error('Breach creation error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/breaches/:id", requireAuth, requireModulePermission('breaches', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const breach = await storage.updateDataBreach(id, updates);
      res.json(breach);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/breaches/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing breach to verify company access
      const existingBreach = await storage.getDataBreach(id);
      if (!existingBreach) {
        return res.status(404).json({ error: "Violation not found" });
      }
      
      // Verify user has access to this company
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      const hasAccess = await storage.verifyUserCompanyAccess(userId, existingBreach.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Check write permissions for breaches
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === existingBreach.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Owners have all permissions
      if (access.role !== 'owner') {
        const requiredPermission = 'breaches.write';
        if (!access.permissions?.includes(requiredPermission)) {
          return res.status(403).json({ 
            error: `Droits insuffisants pour modifier les violations de données. Contactez l'administrateur pour obtenir les permissions nécessaires.`,
            technicalError: `Permission denied. Required: ${requiredPermission}`,
            userPermissions: access.permissions,
            requiredPermission,
            userRole: access.role
          });
        }
      }

      await storage.deleteDataBreach(id);
      res.json({ success: true, message: "Violation supprimée avec succès" });
    } catch (error: any) {
      console.error('Breach deletion error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/breaches/analyze", requireAuth, requireModulePermission('breaches', 'write'), async (req, res) => {
    try {
      const breachData = insertDataBreachSchema.parse(req.body);

      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, breachData.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Get RAG documents for enhanced analysis
      const ragDocuments = await getRagDocuments('Analyse Violation Données');
      console.log(`[RAG] Found ${ragDocuments.length} documents for breach analysis`);

      const analysis = await geminiService.analyzeDataBreach(breachData, ragDocuments);

      const breach = await storage.createDataBreach({
        ...breachData,
        notificationRequired: analysis.notificationRequired,
        notificationJustification: analysis.justification,
        status: "analyzed",
      });

      res.json({ breach, analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/breaches/ai-analysis", requireAuth, requireModulePermission('breaches', 'write'), async (req, res) => {
    try {
      // Debug session and headers information
      console.log('Session debug:', {
        sessionId: req.sessionID,
        userId: (req.session as any)?.userId,
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : 'no session',
        cookies: req.headers.cookie,
        sessionCookie: req.headers.cookie?.includes('connect.sid')
      });

      // Temporary workaround: bypass authentication for breach analysis during development
      console.log('AI Analysis request for breach:', JSON.stringify(req.body, null, 2));

      const breachData = req.body;

      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, breachData.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      // Get RAG documents for enhanced analysis
      const ragDocuments = await getRagDocuments('Analyse Violation Données');
      console.log(`[RAG] Found ${ragDocuments.length} documents for breach analysis`);

      const analysis = await geminiService.analyzeDataBreach(breachData, ragDocuments);

      // Update the existing breach with AI analysis results
      const updatedBreach = await storage.updateDataBreach(breachData.id, {
        aiRecommendationAuthority: analysis.notificationRequired ? 'required' : 'not_required',
        aiRecommendationDataSubject: analysis.dataSubjectNotificationRequired ? 'required' : 'not_required',
        aiJustification: analysis.justification,
        riskAnalysisResult: analysis.riskLevel,
        status: "analyzed",
      });

      res.json({ breach: updatedBreach, analysis });
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Data subject requests routes
  app.get("/api/requests/:companyId", requireModulePermission('requests', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const requests = await storage.getDataSubjectRequests(companyId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/requests", requireModulePermission('requests', 'write'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      console.log('Request user ID:', userId);
      const requestData = insertDataSubjectRequestSchema.parse(req.body);
      console.log('Request data:', requestData);
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      // Verify user has access to this company (already done by requireModulePermission middleware)

      // Auto-calculate due date (1 month from now)
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      const request = await storage.createDataSubjectRequest({
        ...requestData,
        dueDate,
      });

      res.json(request);
    } catch (error: any) {
      console.error('Error creating data subject request:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/requests/:id", requireModulePermission('requests', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      // Get the existing request to verify company access
      const existingRequest = await storage.getDataSubjectRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      // Verify user has access to this company (already done by requireModulePermission middleware)

      const request = await storage.updateDataSubjectRequest(id, updates);
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DPIA routes
  app.get("/api/dpia/:companyId", requireModulePermission('dpia', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const assessments = await storage.getDpiaAssessments(companyId);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dpia/assessment/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getDpiaAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "AIPD non trouvée" });
      }

      // Verify user has access to the company that owns this assessment
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, assessment.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comprehensive AI-assisted DPIA routes
  app.post("/api/dpia", requireModulePermission('dpia', 'write'), async (req, res) => {
    try {
      const dpiaData = insertDpiaAssessmentSchema.parse(req.body);
      const assessment = await storage.createDpiaAssessment(dpiaData);
      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/dpia/assessment/:id", requireModulePermission('dpia', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const assessment = await storage.updateDpiaAssessment(id, updates);
      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/dpia/:id", requireModulePermission('dpia', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const assessment = await storage.updateDpiaAssessment(id, updates);
      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/dpia/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      // Get the DPIA assessment to verify company access
      const assessment = await storage.getDpiaAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "AIPD non trouvée" });
      }
      
      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(userId, assessment.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }
      
      await storage.deleteDpiaAssessment(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI-assisted risk analysis for DPIA
  app.post("/api/dpia/ai-risk-analysis", requireModulePermission('dpia', 'write'), async (req, res) => {
    try {
      const { companyId, dpiaId, riskCategory, section, promptKey, processingRecord } = req.body;

      // Get the specific prompt for this risk analysis
      const prompt = await storage.getActivePromptByCategory(promptKey);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt non trouvé" });
      }

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const ragDocuments = await getRagDocuments();

      const analysisResult = await geminiService.generateRiskAnalysis(
        riskCategory,
        section,
        prompt.prompt,
        company,
        processingRecord,
        ragDocuments
      );

      res.json({ analysis: analysisResult.analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI-assisted response generation for DPIA fields
  app.post("/api/dpia/ai-assist", requireModulePermission('dpia', 'write'), async (req, res) => {
    try {
      const { questionField, companyId, existingDpiaData } = req.body;

      console.log("[DPIA AI-ASSIST] Request:", { questionField, companyId });

      // Map questionField to prompt category (more reliable than name)
      const fieldToCategoryMap: Record<string, string> = {
        'generalDescription': 'generalDescription',
        'processingPurposes': 'purposes',
        'dataController': 'dataController',
        'dataProcessors': 'dataProcessors',
        'applicableReferentials': 'applicableReferentials',
        'personalDataProcessed': 'personalDataProcessed',
        'personalDataCategories': 'personalDataCategories',
        'finalitiesJustification': 'finalitiesJustification',
        'dataMinimization': 'dataMinimization',
        'retentionJustification': 'retentionJustification',
        'legalBasisJustification': 'legalBasisJustification',
        'dataQualityJustification': 'dataQualityMeasures',
        'rightsInformation': 'informationMeasures',
        'rightsConsent': 'consentMeasures',
        'rightsAccess': 'accessMeasures',
        'rightsRectification': 'rectificationMeasures',
        'rightsOpposition': 'oppositionMeasures',
        'subcontractingMeasures': 'subcontractingMeasures',
        'internationalTransfersMeasures': 'internationalTransferMeasures',
        // Risk analysis fields
        'illegitimateAccessImpacts': 'illegitimateAccessImpacts',
        'illegitimateAccessSources': 'illegitimateAccessSources',
        'illegitimateAccessMeasures': 'illegitimateAccessMeasures',
        'dataModificationImpacts': 'dataModificationImpacts',
        'dataModificationSources': 'dataModificationSources',
        'dataModificationMeasures': 'dataModificationMeasures',
        'dataDisappearanceImpacts': 'dataDisappearanceImpacts',
        'dataDisappearanceSources': 'dataDisappearanceSources',
        'dataDisappearanceMeasures': 'dataDisappearanceMeasures'
      };

      const promptCategory = fieldToCategoryMap[questionField];
      if (!promptCategory) {
        console.log("[DPIA AI-ASSIST] No prompt mapping found for field:", questionField);
        return res.status(400).json({ error: "Champ non supporté pour la génération IA" });
      }

      // Get the specific prompt from database using category
      const aiPrompt = await storage.getAiPromptByCategory(promptCategory);
      if (!aiPrompt) {
        console.log("[DPIA AI-ASSIST] No prompt found in database for category:", promptCategory);
        return res.status(404).json({ error: "Prompt IA non trouvé pour ce champ" });
      }

      console.log("[DPIA AI-ASSIST] Using prompt:", aiPrompt.name, "- Length:", aiPrompt.prompt.length);

      // Extract comprehensive context using the new context extractor
      const context = await contextExtractor.extractContext(
        companyId, 
        questionField, 
        existingDpiaData,
        req.body.processingRecordId
      );

      // Get RAG documents for enhanced context
      const ragDocuments = await getRagDocuments();

      // Use the custom prompt with Gemini
      const response = await geminiService.generateDpiaResponse(
        aiPrompt.prompt,
        context,
        ragDocuments
      );

      console.log("[DPIA AI-ASSIST] Response generated successfully");
      res.json(response);

    } catch (error: any) {
      console.error("[DPIA AI-ASSIST] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate risk assessment with AI
  app.post("/api/dpia/ai-risk-assessment", async (req, res) => {
    try {
      const { processingDescription, dataCategories, companyId } = req.body;

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const ragDocuments = await getRagDocuments();

      const riskAssessment = await geminiService.generateRiskAssessment(
        processingDescription,
        dataCategories,
        company,
        ragDocuments
      );

      res.json(riskAssessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/dpia/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDpiaAssessment(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get processing records that require DPIA based on evaluations - simplified version
  app.get("/api/dpia/assessment/processing-selection", requireModulePermission('dpia', 'read'), async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
      console.log('[DPIA PROCESSING SELECTION] Company ID from query:', companyId);
      
      if (!companyId || isNaN(companyId)) {
        return res.status(400).json({ error: "Company ID requis" });
      }

      const company = await storage.getCompany(companyId);
      console.log('[DPIA PROCESSING SELECTION] Company:', company?.id);
      
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      // Simple direct query to avoid complex parsing issues
      const recordsRequiringDpia = await db
        .select({
          id: processingRecords.id,
          name: processingRecords.name,
          purpose: processingRecords.purpose,
          dataCategories: processingRecords.dataCategories,
          legalBasis: processingRecords.legalBasis,
          companyId: processingRecords.companyId,
          score: dpiaEvaluations.score,
          recommendation: dpiaEvaluations.recommendation
        })
        .from(processingRecords)
        .innerJoin(dpiaEvaluations, eq(processingRecords.id, dpiaEvaluations.recordId))
        .where(
          and(
            eq(processingRecords.companyId, companyId),
            eq(dpiaEvaluations.companyId, companyId),
            or(
              gte(dpiaEvaluations.score, 2),
              like(dpiaEvaluations.recommendation, '%obligatoire%'),
              like(dpiaEvaluations.recommendation, '%recommandée%')
            )
          )
        );

      console.log('[DPIA PROCESSING SELECTION] Records requiring DPIA:', recordsRequiringDpia.length);
      res.json(recordsRequiringDpia);
    } catch (error: any) {
      console.error('Error fetching processing records requiring DPIA:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DPIA Evaluation endpoints
  app.get("/api/dpia-evaluations/:companyId", requireModulePermission('dpia', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const evaluations = await storage.getDpiaEvaluations(companyId);
      res.json(evaluations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dpia-evaluations", requireAuth, async (req, res) => {
    try {
      const evaluationData = {
        ...req.body,
        criteriaAnswers: JSON.stringify(req.body.criteriaAnswers || {}),
        cnilListMatch: req.body.cnilListMatch || null,
        largeScaleEstimate: req.body.largeScaleEstimate || null
      };
      const evaluation = await storage.createDpiaEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error: any) {
      console.error('Error creating DPIA evaluation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/dpia-evaluations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluation = await storage.updateDpiaEvaluation(id, req.body);
      res.json(evaluation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subprocessor records endpoints
  app.get("/api/subprocessor-records/:companyId", requireModulePermission('subprocessors', 'read'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }
      
      const records = await storage.getSubprocessorRecords(companyId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subprocessor-records", requireModulePermission('subprocessors', 'write'), async (req, res) => {
    try {
      const recordData = insertSubprocessorRecordSchema.parse(req.body);
      
      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, recordData.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      const record = await storage.createSubprocessorRecord(recordData);
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/subprocessor-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recordData = req.body;
      
      // Verify user has access to this record's company
      const existingRecord = await storage.getSubprocessorRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, existingRecord.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      const record = await storage.updateSubprocessorRecord(id, recordData);
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/subprocessor-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify user has access to this record's company
      const existingRecord = await storage.getSubprocessorRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      const hasAccess = await storage.verifyUserCompanyAccess(req.session.userId, existingRecord.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      await storage.deleteSubprocessorRecord(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // AI Prompts management (Admin only)
  app.get("/api/admin/prompts", async (req, res) => {
    try {
      const prompts = await storage.getAiPrompts();
      res.json(prompts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/prompts", async (req, res) => {
    try {
      const promptData = insertAiPromptSchema.parse(req.body);
      const prompt = await storage.createAiPrompt(promptData);
      res.json(prompt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/prompts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const prompt = await storage.updateAiPrompt(id, updates);
      res.json(prompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Diagnostic Questions management (Admin only)
  app.post("/api/admin/questions", async (req, res) => {
    try {
      const questionData = insertDiagnosticQuestionSchema.parse(req.body);
      const question = await storage.createDiagnosticQuestion(questionData);
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const question = await storage.updateDiagnosticQuestion(id, updates);
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDiagnosticQuestion(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RAG Documents management (Admin only)
  app.get("/api/admin/documents", async (req, res) => {
    try {
      const documents = await storage.getRagDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/documents", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Temporarily store file metadata (PDF text extraction will be added later)
      const documentData = {
        name: req.body.name || req.file.originalname.replace('.pdf', ''),
        filename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        content: `Document uploaded: ${req.file.originalname}. Text extraction will be implemented.`,
        uploadedBy: 1, // TODO: Get from authenticated user
        category: req.body.category || 'general',
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      const document = await storage.createRagDocument(documentData);
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRagDocument(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt-Document associations
  app.get("/api/admin/prompt-documents/:promptId", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const associations = await storage.getPromptDocuments(promptId);
      res.json(associations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/prompt-documents", async (req, res) => {
    try {
      const associationData = insertPromptDocumentSchema.parse(req.body);
      const association = await storage.createPromptDocument(associationData);
      res.json(association);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/prompt-documents/:promptId/:documentId", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const documentId = parseInt(req.params.documentId);
      await storage.deletePromptDocument(promptId, documentId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Associate prompt with document
  app.post("/api/admin/prompt-documents", async (req, res) => {
    try {
      const { promptId, documentId, priority } = req.body;

      if (!promptId || !documentId) {
        return res.status(400).json({ error: "promptId et documentId sont requis" });
      }

      const association = await storage.createPromptDocument({
        promptId,
        documentId,
        priority: priority || 1
      });

      res.json(association);
    } catch (error: any) {
      console.error('Associate document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all prompt-document associations
  app.get("/api/admin/prompt-documents", async (req, res) => {
    try {
      // Récupérer toutes les associations via une requête SQL directe
      const allAssociations = await storage.getAllPromptDocuments();
      res.json(allAssociations);
    } catch (error: any) {
      console.error('Get all prompt documents error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get prompt-document associations for specific prompt
  app.get("/api/admin/prompt-documents/:promptId", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const associations = await storage.getPromptDocuments(promptId);
      res.json(associations);
    } catch (error: any) {
      console.error('Get prompt documents error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete prompt-document association
  app.delete("/api/admin/prompt-documents/:promptId/:documentId", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const documentId = parseInt(req.params.documentId);
      await storage.deletePromptDocument(promptId, documentId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete prompt document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Chatbot with RAG support
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, companyId } = req.body;

      let context = null;
      if (companyId) {
        const company = await storage.getCompany(companyId);
        if (company) {
          context = { company };
        }
      }

      // Get documents using helper function
      const ragDocuments = await getRagDocuments();
      console.log(`[RAG] Found ${ragDocuments.length} documents for chatbot context`);

      const response = await geminiService.getChatbotResponse(message, context, ragDocuments);
      res.json(response);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fix chatbot prompt endpoint
  app.post("/api/fix-chatbot", async (req, res) => {
    try {
      // Get current chatbot prompt
      const chatbotPrompt = await storage.getActivePromptByCategory('chatbot');

      if (chatbotPrompt) {
        // Update with the enhanced prompt including legal disclaimers
        const workingPrompt = `Vous êtes "l'Assistant Conformité RGPD", un expert IA intégré à notre solution SaaS. Votre mission est d'aider les dirigeants et employés de TPE et PME françaises à comprendre et à mettre en œuvre le RGPD de manière simple et pratique.

**VOTRE RÔLE :**
- Répondre aux questions sur le RGPD de manière claire, concise et pratique
- Donner des conseils concrets adaptés aux ressources limitées des VSE/PME
- Utiliser un langage accessible, éviter le jargon juridique complexe
- Être professionnel mais bienveillant dans vos réponses
- Structurer vos réponses avec des paragraphes courts et aérés

**LIMITES IMPORTANTES :**
Vous n'êtes PAS un avocat. Vous ne fournissez JAMAIS, sous aucun prétexte, de conseil juridique. Vos réponses sont informatives et éducatives uniquement.

**GESTION DES QUESTIONS JURIDIQUES SPÉCIFIQUES :**
Face à une question qui demande :
- Une validation juridique
- Une analyse de risque spécifique  
- Une interprétation de la loi pour un cas particulier
- Des questions du type : "Est-ce que je risque une amende si...?", "Mon cas est-il conforme?", "Suis-je en règle?", "Que dit la loi dans mon cas?"

Vous devez IMPÉRATIVEMENT :
1. Expliquer la règle générale applicable
2. Puis inclure cette phrase exacte : "Pour une analyse validée de votre situation spécifique, il est essentiel de consulter un avocat ou un conseil spécialisé."

**CONTEXTE VSE/PME FRANÇAIS :**
- Ressources humaines et financières limitées
- Besoin de solutions pratiques et économiques
- Conformité à la réglementation française (RGPD + Loi Informatique et Libertés)
- Secteurs d'activité variés avec spécificités propres

**FORMAT DE RÉPONSE :**
- Paragraphes courts et aérés
- Points clés en début de réponse si pertinent
- Exemples concrets quand possible
- Étapes d'action claires et réalisables
- Saut de ligne entre les sections pour la lisibilité

Question de l'utilisateur : {{message}}

Répondez de manière complète et utile à cette question en respectant tous les critères ci-dessus.`;

        await storage.updateAiPrompt(chatbotPrompt.id, {
          prompt: workingPrompt,
          description: "Prompt corrigé pour le chatbot RGPD"
        });

        res.json({
          success: true,
          message: "Prompt chatbot corrigé",
          promptId: chatbotPrompt.id
        });
      } else {
        res.status(404).json({ error: "Prompt chatbot non trouvé" });
      }

    } catch (error: any) {
      console.error('Fix chatbot error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update company route
  app.put("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const updates = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify user has permission to update this company
      const hasAccess = await storage.verifyUserCompanyAccess(userId, companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }

      const updatedCompany = await storage.updateCompany(companyId, updates);
      res.json(updatedCompany);
    } catch (error: any) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/:companyId", requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);

      const actions = await storage.getComplianceActions(companyId);
      const requests = await storage.getDataSubjectRequests(companyId);
      const diagnosticResponses = await storage.getDiagnosticResponses(companyId);
      const questions = await storage.getDiagnosticQuestions();

      // Calculate category-based compliance scores
      const categoryScores: Record<string, { score: number; total: number; answered: number }> = {};
      const categories = Array.from(new Set(questions.map(q => q.category)));

      categories.forEach(category => {
        const categoryQuestions = questions.filter(q => q.category === category);
        const categoryResponses = diagnosticResponses.filter(r => 
          categoryQuestions.some(q => q.id === r.questionId)
        );

        const yesResponses = categoryResponses.filter(r => r.response.toLowerCase() === 'oui').length;
        categoryScores[category] = {
          score: categoryResponses.length > 0 ? Math.round((yesResponses / categoryResponses.length) * 100) : 0,
          total: categoryQuestions.length,
          answered: categoryResponses.length
        };
      });

      // Calculate overall compliance score based on diagnostic responses
      const totalResponses = diagnosticResponses.length;
      const yesResponses = diagnosticResponses.filter(r => r.response.toLowerCase() === 'oui').length;
      const diagnosticScore = totalResponses > 0 ? Math.round((yesResponses / totalResponses) * 100) : 0;

      // Calculate real risk levels based on diagnostic question responses
      const riskAreas: Array<{ category: string; score: number; severity: string; specificRisks: Array<{ questionId: number; question: string; response: string; riskLevel: string }> }> = [];

      categories.forEach(category => {
        const categoryQuestions = questions.filter(q => q.category === category);
        const categoryResponses = diagnosticResponses.filter(r => 
          categoryQuestions.some(q => q.id === r.questionId)
        );

        if (categoryResponses.length > 0) {
          const specificRisks: Array<{ questionId: number; question: string; response: string; riskLevel: string }> = [];
          let totalRiskScore = 0;
          let riskCount = 0;

          categoryResponses.forEach(response => {
            const question = questions.find(q => q.id === response.questionId);
            if (question) {
              const riskLevel = response.response.toLowerCase() === 'oui' 
                ? question.riskLevelYes 
                : question.riskLevelNo;

              if (riskLevel) {
                specificRisks.push({
                  questionId: question.id,
                  question: question.question,
                  response: response.response,
                  riskLevel
                });

                // Convert risk level to numeric score for category calculation
                const riskScore = riskLevel === 'critique' ? 4 : riskLevel === 'elevé' ? 3 : riskLevel === 'moyen' ? 2 : 1;
                totalRiskScore += riskScore;
                riskCount++;
              }
            }
          });

          if (riskCount > 0) {
            // Use the highest risk level found in the category instead of average
            const maxRiskScore = Math.max(...specificRisks.map(r => 
              r.riskLevel === 'critique' ? 4 : r.riskLevel === 'elevé' ? 3 : r.riskLevel === 'moyen' ? 2 : 1
            ));
            const categoryScore = categoryScores[category].score;
            const severity = maxRiskScore >= 4 ? 'critique' : maxRiskScore >= 3 ? 'elevé' : maxRiskScore >= 2 ? 'moyen' : 'faible';

            riskAreas.push({
              category,
              score: categoryScore,
              severity,
              specificRisks
            });
          }
        }
      });

      // Save compliance snapshot if there are diagnostic responses
      if (totalResponses > 0) {
        try {
          await storage.createComplianceSnapshot({
            companyId,
            overallScore: diagnosticScore,
            categoryScores,
            totalQuestions: questions.length,
            answeredQuestions: totalResponses
          });
        } catch (error) {
          // Ignore duplicate snapshots for the same timestamp
        }
      }

      const stats = {
        compliance: {
          score: diagnosticScore,
          categoryScores,
          diagnosticProgress: Math.round((totalResponses / Math.max(questions.length, 1)) * 100),
        },
        actions: {
          total: actions.length,
          completed: actions.filter(a => a.status === 'completed').length,
          inProgress: actions.filter(a => a.status === 'inprogress').length,
          urgent: actions.filter(a => a.priority === 'urgent' && a.status !== 'completed').length,
        },
        requests: {
          pending: requests.filter(r => r.status !== 'closed').length,
          overdue: requests.filter(r => r.status !== 'closed' && new Date(r.dueDate) < new Date()).length,
        },
        riskMapping: {
          riskAreas,
          totalCategories: categories.length,
          completedCategories: Object.values(categoryScores).filter(c => c.answered === c.total && c.total > 0).length,
        },
        priorityActions: actions
          .filter(a => a.status !== 'completed')
          .sort((a, b) => {
            const priorityOrder = { urgent: 3, important: 2, normal: 1 };
            return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                   (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          })
          .slice(0, 5),
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // LLM Configuration routes
  app.get("/api/admin/llm-configs", async (req, res) => {
    try {
      const configs = await storage.getLlmConfigurations();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/llm-configs", async (req, res) => {
    try {
      const configData = insertLlmConfigurationSchema.parse(req.body);
      const config = await storage.createLlmConfiguration(configData);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/llm-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertLlmConfigurationSchema.partial().parse(req.body);
      const config = await storage.updateLlmConfiguration(id, updates);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/llm-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLlmConfiguration(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // Update user profile route
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const { firstName, lastName, phoneNumber } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        phoneNumber
      });

      // Update session user data
      (req.session as any).user = {
        ...(req.session as any).user,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      };

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role
        }
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Apply authentication middleware to protected routes
  app.use([
    '/api/companies',
    '/api/diagnostic',
    '/api/actions',
    '/api/records',
    '/api/privacy-policies',
    '/api/breaches',
    '/api/requests',
    '/api/dpia',
    '/api/admin',

    '/api/user'
  ], requireAuth);

  // Compliance snapshots routes
  app.get("/api/compliance-snapshots/:companyId", requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const snapshots = await storage.getComplianceSnapshots(companyId, limit);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI justification generation for processing records
  app.post('/api/ai/generate-detailed-justification', requireAuth, async (req, res) => {
    try {
      const { field, record } = req.body;
      
      console.log('[JUSTIFICATION AI] Request:', { field, recordName: record.name });

      // Build context-specific prompt for legal justification
      let basePrompt = '';
      
      switch (field) {
        case 'purpose':
          basePrompt = `Justifiez la finalité "${record.purpose}" pour le traitement "${record.name}" (secteur : ${record.sector}).

Répondez en 2-3 phrases maximum avec :
- Conformité à l'art. 5.1.b du RGPD (finalités déterminées, explicites, légitimes)
- Standards sectoriels applicables
- Références juridiques précises

Soyez factuel et concis, sans formule d'introduction.`;
          break;

        case 'legalBasis':
          const basisTranslations = {
            'consent': 'consentement (art. 6.1.a)',
            'contract': 'exécution du contrat (art. 6.1.b)', 
            'legal_obligation': 'obligation légale (art. 6.1.c)',
            'vital_interests': 'sauvegarde des intérêts vitaux (art. 6.1.d)',
            'public_task': 'mission d\'intérêt public (art. 6.1.e)',
            'legitimate_interests': 'intérêts légitimes (art. 6.1.f)'
          };
          
          const basisLabel = basisTranslations[record.legalBasis] || record.legalBasis;
          
          basePrompt = `Justifiez la base légale "${basisLabel}" pour le traitement "${record.name}" (finalité : ${record.purpose}).

Répondez en 2-3 phrases maximum avec :
- Critères d'application de l'art. 6.1 du RGPD
- Test de nécessité selon les lignes directrices CEPD
- Références CNIL ou jurisprudence si pertinente

Secteur : ${record.sector}
Données : ${Array.isArray(record.dataCategories) ? record.dataCategories.join(', ') : record.dataCategories || 'Non spécifiées'}

Soyez précis et factuel, sans formule d'introduction.`;
          break;

        case 'retention':
          basePrompt = `Justifiez la durée "${record.retention}" pour le traitement "${record.name}" (secteur : ${record.sector}).

Répondez en 2-3 phrases maximum avec :
- Conformité art. 5.1.e RGPD (limitation conservation)
- Obligations légales sectorielles applicables
- Références CNIL/jurisprudence

Finalité : ${record.purpose}
Base légale : ${record.legalBasis}

Soyez factuel et concis, sans formule d'introduction.`;
          break;

        default:
          basePrompt = `Justifiez le champ "${field}" pour le traitement "${record.name}". Répondez en 2-3 phrases avec références RGPD/CEPD/CNIL pertinentes. Soyez factuel et concis.`;
      }

      try {
        const aiResponse = await generateAIContent(basePrompt, { temperature: 0.1 });
        
        console.log('[JUSTIFICATION AI] Response generated successfully');
        
        res.json({ 
          justification: aiResponse,
          field,
          recordName: record.name
        });
      } catch (aiError: any) {
        console.error('AI justification generation failed:', aiError);
        res.status(500).json({ 
          error: 'Erreur lors de la génération de la justification',
          fallback: 'Cette recommandation s\'appuie sur l\'analyse des obligations du RGPD et les lignes directrices du CEPD.'
        });
      }
    } catch (error: any) {
      console.error('Justification generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI content generation for risk assessment
  app.post('/api/ai/generate-risk-content', async (req, res) => {
    try {
      const { field, companyId, processingRecordId, riskType } = req.body;

      console.log('[RISK AI] Request:', { field, companyId, processingRecordId, riskType });

      // Get processing record and company data for context
      const processingRecord = processingRecordId ? await storage.getProcessingRecord(processingRecordId) : null;
      const company = await storage.getCompany(companyId);

      // Build context-specific prompt for risk assessment
      let basePrompt = '';

      // Handle different risk sections
      if (field === 'potentialImpacts') {
        basePrompt = `Analysez les impacts potentiels sur les personnes concernées pour le traitement "${processingRecord?.name || 'Non spécifié'}" dans le contexte du risque "${riskType}".

Contexte du traitement:
- Secteur: ${company?.sector || 'Non spécifié'}
- Finalités: ${processingRecord?.purpose || 'Non spécifiées'}
- Données traitées: ${processingRecord?.dataCategories?.join(', ') || 'Non spécifiées'}
- Personnes concernées: ${processingRecord?.recipients?.join(', ') || 'Non spécifiées'}

Décrivez les conséquences possibles pour les individus en cas de réalisation de ce risque, en tenant compte des vulnérabilités spécifiques et de la gravité des impacts.`;
      } else if (field === 'threats') {
        basePrompt = `Identifiez les menaces spécifiques liées au risque "${riskType}" pour le traitement "${processingRecord?.name || 'Non spécifié'}".

Analysez:
- Les sources de menaces internes et externes
- Les vecteurs d'attaque possibles
- Les vulnérabilités exploitables
- Les scénarios de menaces réalistes

Contexte technique:
- Systèmes utilisés: ${processingRecord?.securityMeasures?.join(', ') || 'Non spécifiés'}
- Mesures de sécurité existantes: ${processingRecord?.securityMeasures?.join(', ') || 'Non spécifiées'}`;
      } else if (field === 'riskSources' || field === 'sources') {
        basePrompt = `Identifiez les sources et origines du risque "${riskType}" pour le traitement "${processingRecord?.name || 'Non spécifié'}".

Analysez:
- Les causes racines du risque
- Les facteurs internes et externes
- Les défaillances organisationnelles possibles
- Les lacunes techniques ou humaines

Soyez spécifique au contexte du secteur ${company?.sector || 'générique'}.`;
      } else if (field === 'existingMeasures' || field === 'measures') {
        basePrompt = `Proposez des mesures préventives et correctives pour atténuer le risque "${riskType}" dans le traitement "${processingRecord?.name || 'Non spécifié'}".

Incluez:
- Mesures techniques de protection
- Mesures organisationnelles
- Procédures de détection et réaction
- Mécanismes de surveillance

Adaptez les recommandations au secteur ${company?.sector || 'générique'} et aux contraintes opérationnelles.`;
      } else {
        basePrompt = `Générez du contenu d'évaluation des risques RGPD pour le champ "${field}" dans le contexte du risque "${riskType}".

Traitement: ${processingRecord?.name || 'Non spécifié'}
Secteur: ${company?.sector || 'Non spécifié'}
Données traitées: ${processingRecord?.dataCategories?.join(', ') || 'Non spécifiées'}`;
      }

      // Generate content with AI
      const aiResponse = await generateAIContent(basePrompt);

      console.log('[RISK AI] Response generated successfully');

      res.json({ 
        content: aiResponse,
        field: field
      });
    } catch (error: any) {
      console.error('Risk content generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bot conversation routes
  app.get("/api/bots/conversations/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Check user has team.access or team.read permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.access') && !access.permissions?.includes('team.read')) {
        return res.status(403).json({ error: "Droits insuffisants pour consulter LA Team Jean Michel" });
      }

      const conversations = await storage.getBotConversations(companyId);
      res.json(conversations);
    } catch (error: any) {
      console.error('Get bot conversations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific bot conversation by ID
  app.get("/api/bots/conversation/:conversationId", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      const conversation = await storage.getBotConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Verify user has access to this company
      const hasAccess = await storage.verifyUserCompanyAccess(userId, conversation.companyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this company data" });
      }
      
      res.json(conversation);
    } catch (error: any) {
      console.error('Get bot conversation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/conversations", async (req, res) => {
    try {
      const { companyId, botType, title } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Check user has team.access or team.write permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.access') && !access.permissions?.includes('team.write')) {
        return res.status(403).json({ error: "Droits insuffisants pour créer une conversation avec LA Team Jean Michel" });
      }

      const conversation = await storage.createBotConversation({
        userId,
        companyId,
        botType,
        title,
      });
      res.json(conversation);
    } catch (error: any) {
      console.error('Create bot conversation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      // Get conversation to get companyId for permission check
      const conversation = await storage.getBotConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check user has team.read permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === conversation.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.access') && !access.permissions?.includes('team.read')) {
        return res.status(403).json({ error: "Droits insuffisants pour consulter la formation équipe" });
      }
      
      const messages = await storage.getBotMessages(conversationId);
      res.json(messages);
    } catch (error: any) {
      console.error('Get bot messages error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, isBot } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }
      
      // Get conversation to get companyId for permission check
      const conversation = await storage.getBotConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Check user has team.access or team.chat permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === conversation.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.access') && !access.permissions?.includes('team.chat')) {
        return res.status(403).json({ error: "Droits insuffisants pour discuter avec la formation équipe" });
      }
      
      const message = await storage.createBotMessage({
        conversationId,
        content,
        isBot,
      });

      // Update conversation timestamp
      await storage.updateBotConversation(conversationId, {
        updatedAt: new Date(),
      });

      res.json(message);
    } catch (error: any) {
      console.error('Create bot message error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:botType/chat", requireAuth, async (req, res) => {
    try {
      const { botType } = req.params;
      const { message, conversationId } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Get conversation for company context and permission check
      const conversation = await storage.getBotConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check user has team.access or team.chat permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === conversation.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.access') && !access.permissions?.includes('team.chat')) {
        return res.status(403).json({ error: "Droits insuffisants pour discuter avec la formation équipe" });
      }

      // Get bot-specific prompt
      const promptName = `Jean Michel ${botType.charAt(0).toUpperCase() + botType.slice(1)}`;
      const botPrompt = await storage.getActivePromptByCategory(promptName);
      
      let finalPrompt = "";
      if (botPrompt) {
        // Use template replacement if available, otherwise append message
        finalPrompt = botPrompt.prompt.includes('{{message}}') 
          ? botPrompt.prompt.replace('{{message}}', message)
          : botPrompt.prompt + "\n\nQuestion de l'utilisateur : " + message;
      } else {
        // Fallback prompts for each bot type
        const fallbackPrompts = {
          fondement: "Vous êtes Jean Michel Fondement, expert en détermination des fondements juridiques pour les traitements de données personnelles selon le RGPD. Votre mission est d'aider les entreprises à identifier la base légale appropriée pour leurs traitements. Posez des questions complémentaires si nécessaire pour bien comprendre le contexte avant de donner votre réponse.\n\nQuestion : ",
          voyages: "Vous êtes Jean Michel Voyages, expert en transferts de données personnelles vers les pays tiers. Vous connaissez parfaitement les décisions d'adéquation, les clauses contractuelles types et toutes les modalités de transfert selon le RGPD. Posez des questions complémentaires si nécessaire.\n\nQuestion : ",
          archive: "Vous êtes Jean Michel Archive, spécialiste des durées de conservation des données personnelles. Vous aidez à déterminer les durées appropriées selon les obligations légales et les finalités de traitement. Donnez toujours des justifications détaillées.\n\nQuestion : ",
          irma: "Vous êtes Jean Michel Irma, spécialiste en jurisprudence CNIL et sanctions. Vous analysez les risques de non-conformité et estimez les sanctions potentielles selon les décisions de la CNIL et les guidelines EDPB.\n\nQuestion : "
        };
        finalPrompt = (fallbackPrompts[botType as keyof typeof fallbackPrompts] || fallbackPrompts.fondement) + message;
      }

      // Generate AI response
      const aiResponse = await generateAIContent(finalPrompt);

      res.json({ response: aiResponse });
    } catch (error: any) {
      console.error('Bot chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bots/conversations/:id", requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated properly" });
      }

      // Get conversation for company context and permission check
      const conversation = await storage.getBotConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check user has team.write permission for this company
      const userAccess = await storage.getUserCompanyAccess(userId);
      const access = userAccess.find(a => a.companyId === conversation.companyId);
      
      if (!access) {
        return res.status(403).json({ error: "Access denied to this company" });
      }
      
      if (access.role !== 'owner' && !access.permissions?.includes('team.write')) {
        return res.status(403).json({ error: "Droits insuffisants pour supprimer les conversations de formation équipe" });
      }

      await storage.deleteBotConversation(conversationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete bot conversation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =================== COLLABORATOR MANAGEMENT ROUTES ===================

  // Get collaborators for a company
  app.get("/api/companies/:companyId/collaborators", requireAuth, requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const collaborators = await storage.getCompanyCollaboratorsWithUsers(companyId);
      res.json(collaborators);
    } catch (error: any) {
      console.error('Get collaborators error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Invite a collaborator to a company
  app.post("/api/companies/:companyId/invite", requireAuth, requireOwnerRole, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = req.session?.userId;
      const { email, role, permissions } = req.body;

      // Generate invitation token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const invitation = await storage.createInvitation({
        email,
        companyId,
        invitedBy: userId,
        permissions: permissions || [],
        token,
        expiresAt,
      });

      // TODO: Send invitation email with token

      res.json({ success: true, invitation });
    } catch (error: any) {
      console.error('Invite collaborator error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get invitations for a company
  app.get("/api/companies/:companyId/invitations", requireAuth, requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const invitations = await storage.getCompanyInvitations(companyId);
      res.json(invitations);
    } catch (error: any) {
      console.error('Get invitations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept invitation (public endpoint)
  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { userId } = req.body; // User must be authenticated

      // Get invitation
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Check if invitation is expired
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ error: "Invitation expired" });
      }

      // Check if invitation is already accepted
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation already processed" });
      }

      // Create user company access
      await storage.createUserCompanyAccess({
        userId,
        companyId: invitation.companyId,
        role: 'collaborator',
        permissions: invitation.permissions || [],
        invitedBy: invitation.invitedBy,
        status: 'active'
      });

      // Update invitation status
      await storage.updateInvitation(invitation.id, { status: 'accepted' });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update collaborator permissions
  app.put("/api/companies/:companyId/collaborators/:accessId", requireAuth, requireOwnerRole, async (req, res) => {
    try {
      const accessId = parseInt(req.params.accessId);
      const { role, permissions } = req.body;

      const updatedAccess = await storage.updateUserCompanyAccess(accessId, {
        role,
        permissions
      });

      res.json(updatedAccess);
    } catch (error: any) {
      console.error('Update collaborator error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove collaborator from company
  app.delete("/api/companies/:companyId/collaborators/:accessId", requireAuth, requireOwnerRole, async (req, res) => {
    try {
      const accessId = parseInt(req.params.accessId);
      await storage.deleteUserCompanyAccess(accessId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Remove collaborator error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete invitation
  app.delete("/api/companies/:companyId/invitations/:invitationId", requireAuth, requireOwnerRole, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.invitationId);
      await storage.deleteInvitation(invitationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete invitation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update collaborator permissions (granular access control)
  app.put("/api/companies/:companyId/collaborators/:collaboratorId/permissions", requireAuth, requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const collaboratorId = parseInt(req.params.collaboratorId);
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array" });
      }

      // Update the permissions in the user_company_access table
      await storage.updateCollaboratorPermissions(collaboratorId, permissions);
      
      res.json({ 
        success: true, 
        message: "Permissions updated successfully",
        permissions 
      });
    } catch (error: any) {
      console.error('Update collaborator permissions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Search users by email (for adding existing users as collaborators)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email parameter required" });
      }

      const users = await storage.searchUsersByEmail(email);
      res.json(users);
    } catch (error: any) {
      console.error('Search users error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add existing user as collaborator to company
  app.post("/api/companies/:companyId/collaborators/add-existing", requireAuth, requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const { userId, permissions, role } = req.body;
      const currentUserId = req.session?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify current user is owner/admin of this company
      const userAccess = await storage.getUserCompanyAccessForCompany(currentUserId, companyId);
      if (!userAccess || !['owner', 'admin'].includes(userAccess.role || '')) {
        return res.status(403).json({ error: "Seuls les propriétaires et administrateurs peuvent ajouter des collaborateurs" });
      }

      // Check if user is already a collaborator for this company
      const existingAccess = await storage.getUserCompanyAccessForCompany(userId, companyId);
      if (existingAccess) {
        return res.status(400).json({ error: "Cet utilisateur est déjà collaborateur de cette entreprise" });
      }

      // Add user as collaborator
      const collaborator = await storage.createUserCompanyAccess({
        userId,
        companyId,
        role: role || 'collaborator',
        permissions: permissions || [],
        invitedBy: currentUserId,
        status: 'active'
      });

      res.json(collaborator);
    } catch (error: any) {
      console.error('Add existing collaborator error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get available users for assignment (collaborators of current company)
  app.get("/api/companies/:companyId/users", requireAuth, requireCompanyAccess, async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const collaborators = await storage.getCompanyCollaboratorsWithUsers(companyId);
      
      // Return only user info for assignment purposes
      const users = collaborators.map(collab => ({
        id: collab.user.id,
        firstName: collab.user.firstName,
        lastName: collab.user.lastName,
        email: collab.user.email,
        role: collab.role,
        permissions: collab.permissions
      }));

      res.json(users);
    } catch (error: any) {
      console.error('Get company users error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =================== ACTION COLLABORATION ROUTES ===================

  // Get action assignments
  app.get("/api/actions/:actionId/assignments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const assignments = await storage.getActionAssignments(actionId);
      res.json(assignments);
    } catch (error: any) {
      console.error('Get action assignments error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create action assignment
  app.post("/api/actions/:actionId/assignments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const { userId, role } = req.body;
      const assignedBy = req.session?.userId;

      const assignment = await storage.createActionAssignment({
        actionId,
        userId,
        assignedBy,
        role: role || 'assignee',
        assignedAt: new Date()
      });

      res.json(assignment);
    } catch (error: any) {
      console.error('Create action assignment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete action assignment
  app.delete("/api/actions/:actionId/assignments/:assignmentId", requireAuth, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      await storage.deleteActionAssignment(assignmentId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete action assignment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get action comments
  app.get("/api/actions/:actionId/comments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const comments = await storage.getActionComments(actionId);
      res.json(comments);
    } catch (error: any) {
      console.error('Get action comments error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create action comment
  app.post("/api/actions/:actionId/comments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const { content } = req.body;
      const userId = req.session?.userId;

      const comment = await storage.createActionComment({
        actionId,
        userId,
        content,
        createdAt: new Date()
      });

      res.json(comment);
    } catch (error: any) {
      console.error('Create action comment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update action comment
  app.put("/api/actions/:actionId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;

      const comment = await storage.updateActionComment(commentId, {
        content,
        updatedAt: new Date()
      });

      res.json(comment);
    } catch (error: any) {
      console.error('Update action comment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete action comment
  app.delete("/api/actions/:actionId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      await storage.deleteActionComment(commentId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete action comment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get action activity log
  app.get("/api/actions/:actionId/activity", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const activity = await storage.getActionActivityLog(actionId);
      res.json(activity);
    } catch (error: any) {
      console.error('Get action activity error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get action attachments
  app.get("/api/actions/:actionId/attachments", requireAuth, async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId);
      const attachments = await storage.getActionAttachments(actionId);
      res.json(attachments);
    } catch (error: any) {
      console.error('Get action attachments error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateAIContent(prompt: string, options: { temperature?: number } = {}): Promise<string> {
  try {
    // Use your AI service to generate content based on the prompt
    const aiResponse = await geminiService.generateResponse(prompt, undefined, undefined, options);
    return aiResponse.response;
  } catch (error) {
    console.error('AI content generation failed:', error);
    throw new Error('AI content generation failed');
  }
}