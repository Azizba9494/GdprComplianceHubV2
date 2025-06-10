import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { 
  insertUserSchema, insertCompanySchema, insertDiagnosticQuestionSchema,
  insertDiagnosticResponseSchema, insertComplianceActionSchema,
  insertProcessingRecordSchema, insertDataSubjectRequestSchema,
  insertPrivacyPolicySchema, insertDataBreachSchema,
  insertDpiaAssessmentSchema, insertAiPromptSchema, insertLlmConfigurationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }
      
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error: any) {
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
            title: `Action pour: ${question.question.substring(0, 50)}...`,
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
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/records", async (req, res) => {
    try {
      const recordData = insertProcessingRecordSchema.parse(req.body);
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
      const analysis = await geminiService.analyzeDataBreach(breachData);
      
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

  app.post("/api/dpia", async (req, res) => {
    try {
      const { companyId, processingName, processingDescription } = req.body;
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      // Get the DPIA generation prompt
      const dpiaPrompt = await storage.getActivePromptByCategory("dpia_generation");
      if (!dpiaPrompt) {
        throw new Error("Prompt DPIA non configuré");
      }

      const riskAssessment = await geminiService.generateDPIA(processingName, processingDescription, company, dpiaPrompt.prompt);
      
      const assessment = await storage.createDpiaAssessment({
        companyId,
        processingName,
        processingDescription,
        riskAssessment,
        measures: riskAssessment.measures,
        status: "completed",
      });

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dpia/assess", async (req, res) => {
    try {
      const { companyId, processingName, processingDescription } = req.body;
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      const riskAssessment = await geminiService.assessDPIA(processingName, processingDescription, company);
      
      const assessment = await storage.createDpiaAssessment({
        companyId,
        processingName,
        processingDescription,
        riskAssessment,
        measures: riskAssessment.measures,
        status: "completed",
      });

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
      const evaluation = await storage.createDpiaEvaluation(req.body);
      res.json(evaluation);
    } catch (error: any) {
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

  // Chatbot
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

      const response = await geminiService.getChatbotResponse(message, context);
      res.json(response);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
