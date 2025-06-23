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
  insertProcessingRecordSchema, insertDataSubjectRequestSchema,
  insertPrivacyPolicySchema, insertDataBreachSchema,
  insertDpiaAssessmentSchema, insertAiPromptSchema, insertLlmConfigurationSchema,
  insertRagDocumentSchema, insertPromptDocumentSchema, promptDocuments
} from "@shared/schema";
import multer from "multer";
// import pdfParse from "pdf-parse";
import { Request, Response, NextFunction } from 'express';

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
async function getRagDocuments(): Promise<string[]> {
  try {
    const ragDocuments: string[] = [];

    // Get all active prompts
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
        return res.status(500).json({ error: "Erreur lors de la déconnexion" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Déconnexion réussie" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if ((req.session as any)?.userId) {
      res.json({ 
        user: (req.session as any).user,
        authenticated: true 
      });
    } else {
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
  app.get("/api/companies/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const company = await storage.getCompanyByUserId(userId);
      res.json(company);
    } catch (error: any) {
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

  // Diagnostic routes
  app.get("/api/diagnostic/questions", async (req, res) => {
    try {
      const questions = await storage.getDiagnosticQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/diagnostic/responses/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const responses = await storage.getDiagnosticResponses(companyId);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/diagnostic/responses", async (req, res) => {
    try {
      const responseData = insertDiagnosticResponseSchema.parse(req.body);
      const response = await storage.createDiagnosticResponse(responseData);
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/diagnostic/analyze", async (req, res) => {
    try {
      const { companyId } = req.body;

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
  app.get("/api/actions/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const actions = await storage.getComplianceActions(companyId);
      res.json(actions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Convert date strings to Date objects if present
      if (updates.dueDate && typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }

      const action = await storage.updateComplianceAction(id, updates);
      res.json(action);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Processing records routes
  app.get("/api/records/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const records = await storage.getProcessingRecords(companyId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records/generate", async (req, res) => {
    try {
      const { companyId, processingType, description } = req.body;

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
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records", async (req, res) => {
    try {
      const recordData = insertProcessingRecordSchema.parse(req.body);

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

  app.put("/api/records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const record = await storage.updateProcessingRecord(id, updates);
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  app.get("/api/privacy-policies/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const policies = await storage.getPrivacyPolicies(companyId);
      res.json(policies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/privacy-policies/:id", async (req, res) => {
    try {
      const policyId = parseInt(req.params.id);
      await storage.deletePrivacyPolicy(policyId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/privacy-policies/generate", async (req, res) => {
    try {
      const { companyId } = req.body;

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const records = await storage.getProcessingRecords(companyId);
      const policyData = await geminiService.generatePrivacyPolicy(company, records);

      const policy = await storage.createPrivacyPolicy({
        companyId,
        content: policyData.content,
        version: 1,
        isActive: true,
      });

      res.json(policy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data breach routes
  app.get("/api/breaches/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const breaches = await storage.getDataBreaches(companyId);
      res.json(breaches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/breaches", async (req, res) => {
    try {
      const breachData = insertDataBreachSchema.parse(req.body);
      const breach = await storage.createDataBreach(breachData);
      res.json(breach);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/breaches/analyze", async (req, res) => {
    try {
      const breachData = insertDataBreachSchema.parse(req.body);

      // Get RAG documents for enhanced analysis
      const ragDocuments = await getRagDocuments();
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

  // Data subject requests routes
  app.get("/api/requests/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const requests = await storage.getDataSubjectRequests(companyId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertDataSubjectRequestSchema.parse(req.body);
      // Auto-calculate due date (1 month from now)
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      const request = await storage.createDataSubjectRequest({
        ...requestData,
        dueDate,
      });

      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const request = await storage.updateDataSubjectRequest(id, updates);
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DPIA routes
  app.get("/api/dpia/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const assessments = await storage.getDpiaAssessments(companyId);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dpia/assessment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getDpiaAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "AIPD non trouvée" });
      }
      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comprehensive AI-assisted DPIA routes
  app.post("/api/dpia", async (req, res) => {
    try {
      const dpiaData = insertDpiaAssessmentSchema.parse(req.body);
      const assessment = await storage.createDpiaAssessment(dpiaData);
      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/dpia/assessment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const assessment = await storage.updateDpiaAssessment(id, updates);
      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/dpia/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const assessment = await storage.updateDpiaAssessment(id, updates);
      res.json(assessment);
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

  // AI-assisted risk analysis for DPIA
  app.post("/api/dpia/ai-risk-analysis", async (req, res) => {
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
  app.post("/api/dpia/ai-assist", async (req, res) => {
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
        'illegitimateAccessThreats': 'illegitimateAccessThreats',
        'illegitimateAccessSources': 'illegitimateAccessSources',
        'illegitimateAccessMeasures': 'illegitimateAccessMeasures',
        'dataModificationImpacts': 'dataModificationImpacts',
        'dataModificationThreats': 'dataModificationThreats',
        'dataModificationSources': 'dataModificationSources',
        'dataModificationMeasures': 'dataModificationMeasures',
        'dataDisappearanceImpacts': 'dataDisappearanceImpacts',
        'dataDisappearanceThreats': 'dataDisappearanceThreats',
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

  // DPIA Evaluation endpoints
  app.get("/api/dpia-evaluations/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const evaluations = await storage.getDpiaEvaluations(companyId);
      res.json(evaluations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dpia-evaluations", async (req, res) => {
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

  app.put("/api/dpia-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluation = await storage.updateDpiaEvaluation(id, req.body);
      res.json(evaluation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Learning & Gamification endpoints
  app.get("/api/learning/modules", async (req, res) => {
    try {
      const modules = await storage.getLearningModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching learning modules:", error);
      res.status(500).json({ error: "Failed to fetch learning modules" });
    }
  });

  app.get("/api/learning/modules/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const modules = await storage.getLearningModulesByCategory(category);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules by category:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.get("/api/learning/module/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getLearningModule(id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.get("/api/gamification/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let progress = await storage.getUserProgress(userId);

      if (!progress) {
        progress = await storage.createUserProgress({ userId, totalXp: 0, level: 1 });
      }

      const achievements = await storage.getUserAchievements(userId);
      const moduleProgress = await storage.getUserModuleProgress(userId);

      res.json({
        progress,
        achievements,
        moduleProgress
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/gamification/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/gamification/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/learning/complete-module", async (req, res) => {
    try {
      const { userId, moduleId } = req.body;

      // Complete the module
      const moduleProgress = await storage.completeModule(userId, moduleId);

      // Get module to award XP
      const module = await storage.getLearningModule(moduleId);
      if (module) {
        await storage.addExperience(userId, module.xpReward || 0);
        await storage.updateStreak(userId);
      }

      // Check for new achievements
      const newAchievements = await storage.checkAndUnlockAchievements(userId);

      res.json({
        moduleProgress,
        newAchievements
      });
    } catch (error) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Failed to complete module" });
    }
  });

  app.post("/api/learning/update-progress", async (req, res) => {
    try {
      const { userId, moduleId, progress, timeSpent } = req.body;

      let moduleProgress = await storage.getModuleProgress(userId, moduleId);

      if (moduleProgress) {
        moduleProgress = await storage.updateModuleProgress(moduleProgress.id, {
          progress,
          timeSpent: (moduleProgress.timeSpent || 0) + timeSpent,
          status: progress >= 100 ? 'completed' : 'in_progress'
        });
      } else {
        moduleProgress = await storage.createModuleProgress({
          userId,
          moduleId,
          progress,
          timeSpent,
          status: progress >= 100 ? 'completed' : 'in_progress'
        });
      }

      // Update daily streak
      await storage.updateStreak(userId);

      res.json(moduleProgress);
    } catch (error) {
      console.error("Error updating module progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
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
        // Update with a working prompt
        const workingPrompt = `Vous êtes un assistant expert en conformité RGPD spécialisé pour les entreprises françaises VSE/PME.

Votre rôle :
- Répondre aux questions sur le RGPD de manière claire et pratique
- Donner des conseils concrets adaptés aux ressources limitées des VSE/PME
- Utiliser un langage accessible, éviter le jargon juridique complexe
- Être professionnel mais bienveillant dans vos réponses

Question de l'utilisateur : {{message}}

Répondez de manière complète et utile à cette question.`;

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
  app.put("/api/companies/:id", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const updates = req.body;

      // For demo purposes, we'll skip authentication check
      // In production, verify user has permission to update this company

      const updatedCompany = await storage.updateCompany(companyId, updates);
      res.json(updatedCompany);
    } catch (error: any) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/:companyId", async (req, res) => {
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

  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as any;
    if (!session?.userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    next();
  };

  // Utility function to check if user has access to company
  const checkCompanyAccess = async (userId: number, companyId: number): Promise<boolean> => {
    try {
      const userAccess = await storage.getUserCompanyAccess(userId);
      return userAccess.some(access => access.companyId === companyId);
    } catch (error) {
      console.error('Error checking company access:', error);
      return false;
    }
  };

  // Update user profile route
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
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
    '/api/learning',
    '/api/gamification',
    '/api/dashboard'
  ], requireAuth);

  // Compliance snapshots routes
  app.get("/api/compliance-snapshots/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const snapshots = await storage.getComplianceSnapshots(companyId, limit);
      res.json(snapshots);
    } catch (error: any) {
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
- Finalités: ${processingRecord?.purposes?.join(', ') || 'Non spécifiées'}
- Données traitées: ${processingRecord?.dataCategories?.join(', ') || 'Non spécifiées'}
- Personnes concernées: ${processingRecord?.dataSubjects?.join(', ') || 'Non spécifiées'}

Décrivez les conséquences possibles pour les individus en cas de réalisation de ce risque, en tenant compte des vulnérabilités spécifiques et de la gravité des impacts.`;
      } else if (field === 'threats') {
        basePrompt = `Identifiez les menaces spécifiques liées au risque "${riskType}" pour le traitement "${processingRecord?.name || 'Non spécifié'}".

Analysez:
- Les sources de menaces internes et externes
- Les vecteurs d'attaque possibles
- Les vulnérabilités exploitables
- Les scénarios de menaces réalistes

Contexte technique:
- Systèmes utilisés: ${processingRecord?.systems || 'Non spécifiés'}
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

  const httpServer = createServer(app);
  return httpServer;
}