import { 
  users, companies, diagnosticQuestions, diagnosticResponses, complianceActions,
  processingRecords, subprocessorRecords, dataSubjectRequests, privacyPolicies, dataBreaches,
  dpiaAssessments, aiPrompts, auditLogs, llmConfigurations, complianceSnapshots,
  learningModules, achievements, userProgress, userAchievements, moduleProgress,
  quizzes, quizAttempts, dpiaEvaluations, ragDocuments, promptDocuments,
  subscriptions, userCompanyAccess, invitations, invoices, botConversations, botMessages,
  actionAssignments, actionComments, actionAttachments, actionActivityLog,
  type User, type InsertUser, type Company, type InsertCompany,
  type Subscription, type InsertSubscription, type UserCompanyAccess, type InsertUserCompanyAccess,
  type Invitation, type InsertInvitation, type Invoice, type InsertInvoice,
  type BotConversation, type InsertBotConversation, type BotMessage, type InsertBotMessage,
  type DiagnosticQuestion, type InsertDiagnosticQuestion,
  type DiagnosticResponse, type InsertDiagnosticResponse,
  type ComplianceSnapshot, type InsertComplianceSnapshot,
  type ComplianceAction, type InsertComplianceAction,
  type ProcessingRecord, type InsertProcessingRecord,
  type SubprocessorRecord, type InsertSubprocessorRecord,
  type DataSubjectRequest, type InsertDataSubjectRequest,
  type PrivacyPolicy, type InsertPrivacyPolicy,
  type DataBreach, type InsertDataBreach,
  type DpiaAssessment, type InsertDpiaAssessment,
  type AiPrompt, type InsertAiPrompt,
  type AuditLog, type InsertAuditLog,
  type LlmConfiguration, type InsertLlmConfiguration,
  type LearningModule, type InsertLearningModule,
  type Achievement, type InsertAchievement,
  type UserProgress, type InsertUserProgress,
  type UserAchievement, type InsertUserAchievement,
  type ModuleProgress, type InsertModuleProgress,
  type Quiz, type InsertQuiz,
  type QuizAttempt, type InsertQuizAttempt,
  type DpiaEvaluation, type InsertDpiaEvaluation,
  type RagDocument, type InsertRagDocument,
  type PromptDocument, type InsertPromptDocument,
  type ActionAssignment, type InsertActionAssignment,
  type ActionComment, type InsertActionComment,
  type ActionAttachment, type InsertActionAttachment,
  type ActionActivityLog, type InsertActionActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByUserId(userId: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company>;
  verifyUserCompanyAccess(userId: number, companyId: number): Promise<boolean>;
  createUserCompanyAccess(access: InsertUserCompanyAccess): Promise<UserCompanyAccess>;

  // Diagnostic Questions
  getDiagnosticQuestions(): Promise<DiagnosticQuestion[]>;
  createDiagnosticQuestion(question: InsertDiagnosticQuestion): Promise<DiagnosticQuestion>;
  updateDiagnosticQuestion(id: number, updates: Partial<InsertDiagnosticQuestion>): Promise<DiagnosticQuestion>;
  deleteDiagnosticQuestion(id: number): Promise<void>;

  // Diagnostic Responses
  getDiagnosticResponses(companyId: number): Promise<DiagnosticResponse[]>;
  createDiagnosticResponse(response: InsertDiagnosticResponse): Promise<DiagnosticResponse>;

  // Compliance Snapshots
  getComplianceSnapshots(companyId: number, limit?: number): Promise<ComplianceSnapshot[]>;
  createComplianceSnapshot(snapshot: InsertComplianceSnapshot): Promise<ComplianceSnapshot>;

  // Compliance Actions
  getComplianceActions(companyId: number): Promise<ComplianceAction[]>;
  createComplianceAction(action: InsertComplianceAction): Promise<ComplianceAction>;
  updateComplianceAction(id: number, updates: Partial<InsertComplianceAction>): Promise<ComplianceAction>;
  deleteComplianceAction(id: number): Promise<void>;

  // Processing Records
  getProcessingRecords(companyId: number): Promise<ProcessingRecord[]>;
  getProcessingRecord(id: number): Promise<ProcessingRecord | undefined>;
  createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord>;
  updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord>;
  deleteProcessingRecord(id: number): Promise<void>;

  // Subprocessor Records
  getSubprocessorRecords(companyId: number): Promise<SubprocessorRecord[]>;
  getSubprocessorRecord(id: number): Promise<SubprocessorRecord | undefined>;
  createSubprocessorRecord(record: InsertSubprocessorRecord): Promise<SubprocessorRecord>;
  updateSubprocessorRecord(id: number, updates: Partial<InsertSubprocessorRecord>): Promise<SubprocessorRecord>;
  deleteSubprocessorRecord(id: number): Promise<void>;

  // Data Subject Requests
  getDataSubjectRequests(companyId: number): Promise<DataSubjectRequest[]>;
  getDataSubjectRequest(id: number): Promise<DataSubjectRequest | undefined>;
  createDataSubjectRequest(request: InsertDataSubjectRequest): Promise<DataSubjectRequest>;
  updateDataSubjectRequest(id: number, updates: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest>;

  // Privacy Policies
  getPrivacyPolicies(companyId: number): Promise<PrivacyPolicy[]>;
  getActivePrivacyPolicy(companyId: number): Promise<PrivacyPolicy | undefined>;
  getPrivacyPolicy(id: number): Promise<PrivacyPolicy | undefined>;
  createPrivacyPolicy(policy: InsertPrivacyPolicy): Promise<PrivacyPolicy>;
  updatePrivacyPolicy(id: number, updates: Partial<InsertPrivacyPolicy>): Promise<PrivacyPolicy>;
  deletePrivacyPolicy(id: number): Promise<void>;

  // Data Breaches
  getDataBreaches(companyId: number): Promise<DataBreach[]>;
  getDataBreach(id: number): Promise<DataBreach | undefined>;
  createDataBreach(breach: InsertDataBreach): Promise<DataBreach>;
  updateDataBreach(id: number, updates: Partial<InsertDataBreach>): Promise<DataBreach>;
  deleteDataBreach(id: number): Promise<void>;

  // DPIA Assessments
  getDpiaAssessments(companyId: number): Promise<DpiaAssessment[]>;
  getDpiaAssessment(id: number): Promise<DpiaAssessment | undefined>;
  createDpiaAssessment(assessment: InsertDpiaAssessment): Promise<DpiaAssessment>;
  updateDpiaAssessment(id: number, updates: Partial<InsertDpiaAssessment>): Promise<DpiaAssessment>;
  deleteDpiaAssessment(id: number): Promise<void>;

  // AI Prompts
  getAiPrompts(): Promise<AiPrompt[]>;
  getAiPromptByName(name: string): Promise<AiPrompt | undefined>;
  getAiPromptByCategory(category: string): Promise<AiPrompt | undefined>;
  getActivePromptByCategory(category: string): Promise<AiPrompt | undefined>;
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  updateAiPrompt(id: number, updates: Partial<InsertAiPrompt>): Promise<AiPrompt>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(companyId?: number): Promise<AuditLog[]>;

  // LLM Configurations
  getLlmConfigurations(): Promise<LlmConfiguration[]>;
  getActiveLlmConfiguration(): Promise<LlmConfiguration | undefined>;
  createLlmConfiguration(config: InsertLlmConfiguration): Promise<LlmConfiguration>;
  updateLlmConfiguration(id: number, updates: Partial<InsertLlmConfiguration>): Promise<LlmConfiguration>;
  deleteLlmConfiguration(id: number): Promise<void>;

  // Learning Modules
  getLearningModules(): Promise<LearningModule[]>;
  getLearningModule(id: number): Promise<LearningModule | undefined>;
  getLearningModulesByCategory(category: string): Promise<LearningModule[]>;
  createLearningModule(module: InsertLearningModule): Promise<LearningModule>;
  updateLearningModule(id: number, updates: Partial<InsertLearningModule>): Promise<LearningModule>;
  deleteLearningModule(id: number): Promise<void>;

  // User Progress & Gamification
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, updates: Partial<InsertUserProgress>): Promise<UserProgress>;
  addExperience(userId: number, xp: number): Promise<UserProgress>;
  updateStreak(userId: number): Promise<UserProgress>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]>;

  // Module Progress
  getModuleProgress(userId: number, moduleId: number): Promise<ModuleProgress | undefined>;
  getUserModuleProgress(userId: number): Promise<ModuleProgress[]>;
  createModuleProgress(progress: InsertModuleProgress): Promise<ModuleProgress>;
  updateModuleProgress(id: number, updates: Partial<InsertModuleProgress>): Promise<ModuleProgress>;
  completeModule(userId: number, moduleId: number): Promise<ModuleProgress>;

  // Quizzes
  getQuizzes(): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByModule(moduleId: number): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, updates: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;

  // Quiz Attempts
  getQuizAttempts(userId: number, quizId: number): Promise<QuizAttempt[]>;
  getUserQuizAttempts(userId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getLeaderboard(limit?: number): Promise<UserProgress[]>;

  // DPIA Evaluations
  getDpiaEvaluations(companyId: number): Promise<DpiaEvaluation[]>;
  getDpiaEvaluation(recordId: number): Promise<DpiaEvaluation | undefined>;
  createDpiaEvaluation(evaluation: InsertDpiaEvaluation): Promise<DpiaEvaluation>;
  updateDpiaEvaluation(id: number, updates: Partial<InsertDpiaEvaluation>): Promise<DpiaEvaluation>;
  deleteDpiaEvaluation(id: number): Promise<void>;

  // RAG Documents
  getRagDocuments(): Promise<RagDocument[]>;
  getRagDocument(id: number): Promise<RagDocument | undefined>;
  createRagDocument(document: InsertRagDocument): Promise<RagDocument>;
  updateRagDocument(id: number, updates: Partial<InsertRagDocument>): Promise<RagDocument>;
  deleteRagDocument(id: number): Promise<void>;

  // Prompt-Document associations
  getAllPromptDocuments(): Promise<PromptDocument[]>;
  getPromptDocuments(promptId: number): Promise<PromptDocument[]>;
  getDocumentPrompts(documentId: number): Promise<PromptDocument[]>;
  createPromptDocument(association: InsertPromptDocument): Promise<PromptDocument>;
  deletePromptDocument(promptId: number, documentId: number): Promise<void>;

  // User update methods
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription>;
  getUserCompanyAccess(userId: number): Promise<UserCompanyAccess[]>;
  createUserCompanyAccess(access: InsertUserCompanyAccess): Promise<UserCompanyAccess>;
  deleteUserCompanyAccess(id: number): Promise<void>;
  getCompanyCollaborators(companyId: number): Promise<UserCompanyAccess[]>;
  getCompanyCollaboratorsWithUsers(companyId: number): Promise<(UserCompanyAccess & { user: User })[]>;
  updateUserCompanyAccess(id: number, updates: Partial<InsertUserCompanyAccess>): Promise<UserCompanyAccess>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getCompanyInvitations(companyId: number): Promise<Invitation[]>;
  updateInvitation(id: number, updates: Partial<InsertInvitation>): Promise<Invitation>;
  deleteInvitation(id: number): Promise<void>;
  getUserInvoices(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  // Bot Conversations
  getBotConversations(companyId: number): Promise<BotConversation[]>;
  getBotConversation(id: number): Promise<BotConversation | undefined>;
  createBotConversation(conversation: InsertBotConversation): Promise<BotConversation>;
  updateBotConversation(id: number, updates: Partial<InsertBotConversation>): Promise<BotConversation>;
  deleteBotConversation(id: number): Promise<void>;

  // Bot Messages
  getBotMessages(conversationId: number): Promise<BotMessage[]>;
  createBotMessage(message: InsertBotMessage): Promise<BotMessage>;

  // Action Assignments
  getActionAssignments(actionId: number): Promise<ActionAssignment[]>;
  getUserActionAssignments(userId: number): Promise<ActionAssignment[]>;
  createActionAssignment(assignment: InsertActionAssignment): Promise<ActionAssignment>;
  deleteActionAssignment(id: number): Promise<void>;

  // Action Comments
  getActionComments(actionId: number): Promise<ActionComment[]>;
  createActionComment(comment: InsertActionComment): Promise<ActionComment>;
  updateActionComment(id: number, updates: Partial<InsertActionComment>): Promise<ActionComment>;
  deleteActionComment(id: number): Promise<void>;

  // Action Attachments
  getActionAttachments(actionId: number): Promise<ActionAttachment[]>;
  createActionAttachment(attachment: InsertActionAttachment): Promise<ActionAttachment>;
  deleteActionAttachment(id: number): Promise<void>;

  // Action Activity Log
  getActionActivityLog(actionId: number): Promise<ActionActivityLog[]>;
  createActionActivityLog(log: InsertActionActivityLog): Promise<ActionActivityLog>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByUserId(userId: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return company;
  }

  async verifyUserCompanyAccess(userId: number, companyId: number): Promise<boolean> {
    try {
      // Check if user has direct access to company
      const access = await db.select()
        .from(userCompanyAccess)
        .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.companyId, companyId)))
        .limit(1);
      
      if (access.length > 0) {
        return true;
      }

      // Check if user owns the company directly
      const company = await db.select()
        .from(companies)
        .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
        .limit(1);
      
      return company.length > 0;
    } catch (error) {
      console.error('Error verifying user company access:', error);
      return false;
    }
  }

  async createUserCompanyAccess(access: InsertUserCompanyAccess): Promise<UserCompanyAccess> {
    const [result] = await db.insert(userCompanyAccess).values(access).returning();
    return result;
  }

  // Diagnostic Questions
  async getDiagnosticQuestions(): Promise<DiagnosticQuestion[]> {
    return await db.select().from(diagnosticQuestions).where(eq(diagnosticQuestions.isActive, true)).orderBy(diagnosticQuestions.order);
  }

  async createDiagnosticQuestion(question: InsertDiagnosticQuestion): Promise<DiagnosticQuestion> {
    const [created] = await db.insert(diagnosticQuestions).values(question).returning();
    return created;
  }

  async updateDiagnosticQuestion(id: number, updates: Partial<InsertDiagnosticQuestion>): Promise<DiagnosticQuestion> {
    const [updated] = await db.update(diagnosticQuestions).set(updates).where(eq(diagnosticQuestions.id, id)).returning();
    return updated;
  }

  async deleteDiagnosticQuestion(id: number): Promise<void> {
    await db.update(diagnosticQuestions).set({ isActive: false }).where(eq(diagnosticQuestions.id, id));
  }

  // Diagnostic Responses
  async getDiagnosticResponses(companyId: number): Promise<DiagnosticResponse[]> {
    return await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.companyId, companyId));
  }

  async createDiagnosticResponse(response: InsertDiagnosticResponse): Promise<DiagnosticResponse> {
    const [created] = await db.insert(diagnosticResponses).values(response).returning();
    return created;
  }

  // Compliance Snapshots
  async getComplianceSnapshots(companyId: number, limit: number = 12): Promise<ComplianceSnapshot[]> {
    return await db.select()
      .from(complianceSnapshots)
      .where(eq(complianceSnapshots.companyId, companyId))
      .orderBy(desc(complianceSnapshots.createdAt))
      .limit(limit);
  }

  async createComplianceSnapshot(snapshot: InsertComplianceSnapshot): Promise<ComplianceSnapshot> {
    const [created] = await db.insert(complianceSnapshots).values(snapshot).returning();
    return created;
  }

  // Compliance Actions
  async getComplianceActions(companyId: number): Promise<ComplianceAction[]> {
    return await db.select().from(complianceActions).where(eq(complianceActions.companyId, companyId)).orderBy(desc(complianceActions.createdAt));
  }

  async createComplianceAction(action: InsertComplianceAction): Promise<ComplianceAction> {
    const [created] = await db.insert(complianceActions).values(action).returning();
    return created;
  }

  async updateComplianceAction(id: number, updates: Partial<InsertComplianceAction>): Promise<ComplianceAction> {
    const [updated] = await db.update(complianceActions).set(updates).where(eq(complianceActions.id, id)).returning();
    return updated;
  }

  async deleteComplianceAction(id: number): Promise<void> {
    await db.delete(complianceActions).where(eq(complianceActions.id, id));
  }

  // Action Assignments
  async getActionAssignments(actionId: number): Promise<ActionAssignment[]> {
    return await db.select().from(actionAssignments).where(eq(actionAssignments.actionId, actionId)).orderBy(desc(actionAssignments.assignedAt));
  }

  async getUserActionAssignments(userId: number): Promise<ActionAssignment[]> {
    return await db.select().from(actionAssignments).where(eq(actionAssignments.userId, userId)).orderBy(desc(actionAssignments.assignedAt));
  }

  async createActionAssignment(assignment: InsertActionAssignment): Promise<ActionAssignment> {
    const [created] = await db.insert(actionAssignments).values(assignment).returning();
    return created;
  }

  async deleteActionAssignment(id: number): Promise<void> {
    await db.delete(actionAssignments).where(eq(actionAssignments.id, id));
  }

  // Action Comments
  async getActionComments(actionId: number): Promise<ActionComment[]> {
    return await db.select().from(actionComments).where(eq(actionComments.actionId, actionId)).orderBy(desc(actionComments.createdAt));
  }

  async createActionComment(comment: InsertActionComment): Promise<ActionComment> {
    const [created] = await db.insert(actionComments).values(comment).returning();
    return created;
  }

  async updateActionComment(id: number, updates: Partial<InsertActionComment>): Promise<ActionComment> {
    const [updated] = await db.update(actionComments).set(updates).where(eq(actionComments.id, id)).returning();
    return updated;
  }

  async deleteActionComment(id: number): Promise<void> {
    await db.delete(actionComments).where(eq(actionComments.id, id));
  }

  // Action Attachments
  async getActionAttachments(actionId: number): Promise<ActionAttachment[]> {
    return await db.select().from(actionAttachments).where(eq(actionAttachments.actionId, actionId)).orderBy(desc(actionAttachments.createdAt));
  }

  async createActionAttachment(attachment: InsertActionAttachment): Promise<ActionAttachment> {
    const [created] = await db.insert(actionAttachments).values(attachment).returning();
    return created;
  }

  async deleteActionAttachment(id: number): Promise<void> {
    await db.delete(actionAttachments).where(eq(actionAttachments.id, id));
  }

  // Action Activity Log
  async getActionActivityLog(actionId: number): Promise<ActionActivityLog[]> {
    return await db.select().from(actionActivityLog).where(eq(actionActivityLog.actionId, actionId)).orderBy(desc(actionActivityLog.createdAt));
  }

  async createActionActivityLog(activity: InsertActionActivityLog): Promise<ActionActivityLog> {
    const [created] = await db.insert(actionActivityLog).values(activity).returning();
    return created;
  }

  // Processing Records
  async getProcessingRecords(companyId: number): Promise<ProcessingRecord[]> {
    return await db.select().from(processingRecords).where(eq(processingRecords.companyId, companyId)).orderBy(desc(processingRecords.createdAt));
  }

  async getProcessingRecord(id: number): Promise<ProcessingRecord | undefined> {
    const [record] = await db.select().from(processingRecords).where(eq(processingRecords.id, id));
    return record;
  }

  async createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord> {
    const [created] = await db.insert(processingRecords).values(record).returning();
    return created;
  }

  async updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord> {
    const [updated] = await db.update(processingRecords).set(updates).where(eq(processingRecords.id, id)).returning();
    return updated;
  }

  async deleteProcessingRecord(id: number): Promise<void> {
    // First delete related records to avoid foreign key constraint violations
    
    // Delete DPIA assessments that reference this processing record
    await db.delete(dpiaAssessments).where(eq(dpiaAssessments.processingRecordId, id));
    
    // Delete DPIA evaluations that reference this processing record
    await db.delete(dpiaEvaluations).where(eq(dpiaEvaluations.recordId, id));
    
    // Finally delete the processing record
    await db.delete(processingRecords).where(eq(processingRecords.id, id));
  }

  // Subprocessor Records
  async getSubprocessorRecords(companyId: number): Promise<SubprocessorRecord[]> {
    return await db.select().from(subprocessorRecords).where(eq(subprocessorRecords.companyId, companyId)).orderBy(desc(subprocessorRecords.createdAt));
  }

  async getSubprocessorRecord(id: number): Promise<SubprocessorRecord | undefined> {
    const [record] = await db.select().from(subprocessorRecords).where(eq(subprocessorRecords.id, id));
    return record || undefined;
  }

  async createSubprocessorRecord(record: InsertSubprocessorRecord): Promise<SubprocessorRecord> {
    const [created] = await db.insert(subprocessorRecords).values(record).returning();
    return created;
  }

  async updateSubprocessorRecord(id: number, updates: Partial<InsertSubprocessorRecord>): Promise<SubprocessorRecord> {
    const [updated] = await db.update(subprocessorRecords).set(updates).where(eq(subprocessorRecords.id, id)).returning();
    return updated;
  }

  async deleteSubprocessorRecord(id: number): Promise<void> {
    await db.delete(subprocessorRecords).where(eq(subprocessorRecords.id, id));
  }

  // Data Subject Requests
  async getDataSubjectRequests(companyId: number): Promise<DataSubjectRequest[]> {
    return await db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.companyId, companyId)).orderBy(desc(dataSubjectRequests.createdAt));
  }

  async getDataSubjectRequest(id: number): Promise<DataSubjectRequest | undefined> {
    const [request] = await db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.id, id));
    return request;
  }

  async createDataSubjectRequest(request: InsertDataSubjectRequest & { dueDate: Date }): Promise<DataSubjectRequest> {
    const [created] = await db.insert(dataSubjectRequests).values(request).returning();
    return created;
  }

  async updateDataSubjectRequest(id: number, updates: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest> {
    const [updated] = await db.update(dataSubjectRequests).set(updates).where(eq(dataSubjectRequests.id, id)).returning();
    return updated;
  }

  // Privacy Policies
  async getPrivacyPolicies(companyId: number): Promise<PrivacyPolicy[]> {
    return await db.select().from(privacyPolicies).where(eq(privacyPolicies.companyId, companyId)).orderBy(desc(privacyPolicies.createdAt));
  }

  async getActivePrivacyPolicy(companyId: number): Promise<PrivacyPolicy | undefined> {
    const [policy] = await db.select().from(privacyPolicies).where(and(eq(privacyPolicies.companyId, companyId), eq(privacyPolicies.isActive, true)));
    return policy || undefined;
  }

  async getPrivacyPolicy(id: number): Promise<PrivacyPolicy | undefined> {
    const [policy] = await db.select().from(privacyPolicies).where(eq(privacyPolicies.id, id));
    return policy || undefined;
  }

  async createPrivacyPolicy(policy: InsertPrivacyPolicy): Promise<PrivacyPolicy> {
    // Get the highest version number for this company
    const existingPolicies = await db.select({ version: privacyPolicies.version })
      .from(privacyPolicies)
      .where(eq(privacyPolicies.companyId, policy.companyId))
      .orderBy(desc(privacyPolicies.version))
      .limit(1);

    // Calculate next version number
    const nextVersion = existingPolicies.length > 0 ? existingPolicies[0].version + 1 : 1;

    // Deactivate all existing policies for the company if this new policy should be active
    if (policy.isActive) {
      await db.update(privacyPolicies)
        .set({ isActive: false })
        .where(eq(privacyPolicies.companyId, policy.companyId));
    }

    // Create new policy with calculated version
    const [created] = await db.insert(privacyPolicies)
      .values({ ...policy, version: nextVersion })
      .returning();
    return created;
  }

  async updatePrivacyPolicy(id: number, updates: Partial<InsertPrivacyPolicy>): Promise<PrivacyPolicy> {
    const [updated] = await db.update(privacyPolicies).set(updates).where(eq(privacyPolicies.id, id)).returning();
    return updated;
  }

  async deletePrivacyPolicy(id: number): Promise<void> {
    await db.delete(privacyPolicies).where(eq(privacyPolicies.id, id));
  }

  // Data Breaches
  async getDataBreaches(companyId: number): Promise<DataBreach[]> {
    return await db.select().from(dataBreaches).where(eq(dataBreaches.companyId, companyId)).orderBy(desc(dataBreaches.createdAt));
  }

  async createDataBreach(breach: InsertDataBreach): Promise<DataBreach> {
    console.log('Creating data breach with validated data:', JSON.stringify(breach, null, 2));
    
    try {
      const [created] = await db.insert(dataBreaches).values(breach).returning();
      console.log('Breach created successfully:', created);
      return created;
    } catch (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
  }

  async getDataBreach(id: number): Promise<DataBreach | undefined> {
    const [breach] = await db.select().from(dataBreaches).where(eq(dataBreaches.id, id));
    return breach || undefined;
  }

  async updateDataBreach(id: number, updates: Partial<InsertDataBreach>): Promise<DataBreach> {
    const [updated] = await db.update(dataBreaches).set(updates).where(eq(dataBreaches.id, id)).returning();
    return updated;
  }

  async deleteDataBreach(id: number): Promise<void> {
    await db.delete(dataBreaches).where(eq(dataBreaches.id, id));
  }

  // DPIA Assessments
  async getDpiaAssessments(companyId: number): Promise<DpiaAssessment[]> {
    return await db.select().from(dpiaAssessments).where(eq(dpiaAssessments.companyId, companyId)).orderBy(desc(dpiaAssessments.createdAt));
  }

  async getDpiaAssessment(id: number): Promise<DpiaAssessment | undefined> {
    const [assessment] = await db.select().from(dpiaAssessments).where(eq(dpiaAssessments.id, id));
    return assessment || undefined;
  }

  async createDpiaAssessment(assessment: InsertDpiaAssessment): Promise<DpiaAssessment> {
    const cleanAssessment = {
      ...assessment,
      securityMeasures: Array.isArray(assessment.securityMeasures) ? assessment.securityMeasures : [],
      customSecurityMeasures: Array.isArray(assessment.customSecurityMeasures) ? assessment.customSecurityMeasures : [],
      subcontractingMeasures: Array.isArray(assessment.subcontractingMeasures) ? assessment.subcontractingMeasures : [],
      internationalTransfersMeasures: Array.isArray(assessment.internationalTransfersMeasures) ? assessment.internationalTransfersMeasures : [],
      riskScenarios: assessment.riskScenarios || {},
      proportionalityEvaluation: assessment.proportionalityEvaluation || {
        finalities: { status: "acceptable", measures: "" },
        legalBasis: { status: "acceptable", measures: "" },
        dataMinimization: { status: "acceptable", measures: "" },
        dataQuality: { status: "acceptable", measures: "" },
        retentionPeriods: { status: "acceptable", measures: "" }
      },
      rightsProtectionEvaluation: assessment.rightsProtectionEvaluation || {
        information: { status: "acceptable", measures: "" },
        consent: { status: "acceptable", measures: "" },
        accessPortability: { status: "acceptable", measures: "" },
        rectificationErasure: { status: "acceptable", measures: "" },
        limitationOpposition: { status: "acceptable", measures: "" },
        subcontracting: { status: "acceptable", measures: "" },
        internationalTransfers: { status: "acceptable", measures: "" }
      },
      actionPlan: Array.isArray(assessment.actionPlan) ? assessment.actionPlan : []
    };

    const [created] = await db.insert(dpiaAssessments).values([cleanAssessment]).returning();
    return created;
  }



  async updateDpiaAssessment(id: number, updates: Partial<InsertDpiaAssessment>): Promise<DpiaAssessment> {
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date(),
      // Clean array fields to ensure proper serialization
      ...(updates.securityMeasures !== undefined && {
        securityMeasures: Array.isArray(updates.securityMeasures) ? updates.securityMeasures : []
      }),
      ...(updates.customSecurityMeasures !== undefined && {
        customSecurityMeasures: Array.isArray(updates.customSecurityMeasures) ? updates.customSecurityMeasures : []
      }),
      ...(updates.subcontractingMeasures !== undefined && {
        subcontractingMeasures: Array.isArray(updates.subcontractingMeasures) ? updates.subcontractingMeasures : []
      }),
      ...(updates.internationalTransfersMeasures !== undefined && {
        internationalTransfersMeasures: Array.isArray(updates.internationalTransfersMeasures) ? updates.internationalTransfersMeasures : []
      })
    };

    const [updated] = await db.update(dpiaAssessments).set(cleanUpdates).where(eq(dpiaAssessments.id, id)).returning();
    return updated;
  }

  async deleteDpiaAssessment(id: number): Promise<void> {
    await db.delete(dpiaAssessments).where(eq(dpiaAssessments.id, id));
  }

  // AI Prompts
  async getAiPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts).orderBy(aiPrompts.category, aiPrompts.name);
  }

  async getAiPromptByName(name: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(and(eq(aiPrompts.name, name), eq(aiPrompts.isActive, true)));
    return prompt;
  }

  async getAiPromptByCategory(category: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(and(eq(aiPrompts.category, category), eq(aiPrompts.isActive, true)));
    return prompt;
  }

  async getActivePromptByCategory(category: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(and(eq(aiPrompts.category, category), eq(aiPrompts.isActive, true))).orderBy(desc(aiPrompts.version)).limit(1);
    return prompt || undefined;
  }

  async createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const [created] = await db.insert(aiPrompts).values(prompt).returning();
    return created;
  }

  async updateAiPrompt(id: number, updates: Partial<InsertAiPrompt>): Promise<AiPrompt> {
    const [updated] = await db.update(aiPrompts).set(updates).where(eq(aiPrompts.id, id)).returning();
    return updated;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(companyId?: number): Promise<AuditLog[]> {
    if (companyId) {
      return await db.select().from(auditLogs).where(eq(auditLogs.companyId, companyId)).orderBy(desc(auditLogs.timestamp));
    }
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
  }

  // LLM Configurations
  async getLlmConfigurations(): Promise<LlmConfiguration[]> {
    return await db.select().from(llmConfigurations).orderBy(desc(llmConfigurations.createdAt));
  }

  async getActiveLlmConfiguration(): Promise<LlmConfiguration | undefined> {
    const [config] = await db.select().from(llmConfigurations).where(eq(llmConfigurations.isActive, true));
    return config || undefined;
  }

  async createLlmConfiguration(config: InsertLlmConfiguration): Promise<LlmConfiguration> {
    // Deactivate all other configurations if this one is set to active
    if (config.isActive) {
      await db.update(llmConfigurations).set({ isActive: false });
    }
    const [created] = await db.insert(llmConfigurations).values(config).returning();
    return created;
  }

  async updateLlmConfiguration(id: number, updates: Partial<InsertLlmConfiguration>): Promise<LlmConfiguration> {
    // Deactivate all other configurations if this one is being set to active
    if (updates.isActive) {
      await db.update(llmConfigurations).set({ isActive: false });
    }
    const [updated] = await db.update(llmConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteLlmConfiguration(id: number): Promise<void> {
    await db.delete(llmConfigurations).where(eq(llmConfigurations.id, id));
  }

  // Learning Modules
  async getLearningModules(): Promise<LearningModule[]> {
    return await db.select().from(learningModules).where(eq(learningModules.isActive, true)).orderBy(learningModules.createdAt);
  }

  async getLearningModule(id: number): Promise<LearningModule | undefined> {
    const result = await db.select().from(learningModules).where(eq(learningModules.id, id)).limit(1);
    return result[0];
  }

  async getLearningModulesByCategory(category: string): Promise<LearningModule[]> {
    return await db.select().from(learningModules)
      .where(and(eq(learningModules.category, category), eq(learningModules.isActive, true)))
      .orderBy(learningModules.difficulty, learningModules.createdAt);
  }

  async createLearningModule(module: InsertLearningModule): Promise<LearningModule> {
    const result = await db.insert(learningModules).values(module).returning();
    return result[0];
  }

  async updateLearningModule(id: number, updates: Partial<InsertLearningModule>): Promise<LearningModule> {
    const result = await db.update(learningModules).set({ ...updates, updatedAt: new Date() }).where(eq(learningModules.id, id)).returning();
    return result[0];
  }

  async deleteLearningModule(id: number): Promise<void> {
    await db.delete(learningModules).where(eq(learningModules.id, id));
  }

  // User Progress & Gamification
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const result = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
    return result[0];
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const result = await db.insert(userProgress).values(progress).returning();
    return result[0];
  }

  async updateUserProgress(userId: number, updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const result = await db.update(userProgress).set({ ...updates, updatedAt: new Date() }).where(eq(userProgress.userId, userId)).returning();
    return result[0];
  }

  async addExperience(userId: number, xp: number): Promise<UserProgress> {
    // Get current progress or create if not exists
    let progress = await this.getUserProgress(userId);
    if (!progress) {
      progress = await this.createUserProgress({ userId, totalXp: 0, level: 1 });
    }

    const newXp = (progress.totalXp || 0) + xp;
    const newLevel = Math.floor(newXp / 100) + 1; // 100 XP per level

    return await this.updateUserProgress(userId, {
      totalXp: newXp,
      level: newLevel,
      lastActivityDate: new Date()
    });
  }

  async updateStreak(userId: number): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return await this.createUserProgress({ userId, totalXp: 0, level: 1, streak: 1, lastActivityDate: new Date() });
    }

    const today = new Date();
    const lastActivity = progress.lastActivityDate ? new Date(progress.lastActivityDate) : null;
    let newStreak = progress.streak ?? 0;

    if (lastActivity) {
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak = (newStreak ?? 0) + 1; // Continue streak
      } else if (daysDiff > 1) {
        newStreak = 1; // Reset streak
      }
      // If daysDiff === 0, same day, don't change streak
    } else {
      newStreak = 1;
    }

    return await this.updateUserProgress(userId, {
      streak: newStreak,
      lastActivityDate: today
    });
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.category, achievements.rarity);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
    return result[0];
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(userAchievements.unlockedAt);
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const result = await db.insert(userAchievements).values({
      userId,
      achievementId
    }).returning();
    return result[0];
  }

  async checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]> {
    const progress = await this.getUserProgress(userId);
    const userAchievements = await this.getUserAchievements(userId);
    const allAchievements = await this.getAchievements();
    const unlockedIds = userAchievements.map(ua => ua.achievementId);
    const newUnlocks: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      const criteria = JSON.parse(achievement.criteria);
      let shouldUnlock = false;

      // Check different achievement criteria
      if (criteria.type === 'xp' && progress && (progress.totalXp || 0) >= criteria.value) {
        shouldUnlock = true;
      } else if (criteria.type === 'level' && progress && (progress.level || 1) >= criteria.value) {
        shouldUnlock = true;
      } else if (criteria.type === 'streak' && progress && (progress.streak || 0) >= criteria.value) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        const newAchievement = await this.unlockAchievement(userId, achievement.id);
        newUnlocks.push(newAchievement);
      }
    }

    return newUnlocks;
  }

  // Module Progress
  async getModuleProgress(userId: number, moduleId: number): Promise<ModuleProgress | undefined> {
    const result = await db.select().from(moduleProgress)
      .where(and(eq(moduleProgress.userId, userId), eq(moduleProgress.moduleId, moduleId)))
      .limit(1);
    return result[0];
  }

  async getUserModuleProgress(userId: number): Promise<ModuleProgress[]> {
    return await db.select().from(moduleProgress)
      .where(eq(moduleProgress.userId, userId))
      .orderBy(moduleProgress.updatedAt);
  }

  async createModuleProgress(progress: InsertModuleProgress): Promise<ModuleProgress> {
    const result = await db.insert(moduleProgress).values(progress).returning();
    return result[0];
  }

  async updateModuleProgress(id: number, updates: Partial<InsertModuleProgress>): Promise<ModuleProgress> {
    const result = await db.update(moduleProgress).set({ ...updates, updatedAt: new Date() }).where(eq(moduleProgress.id, id)).returning();
    return result[0];
  }

  async completeModule(userId: number, moduleId: number): Promise<ModuleProgress> {
    const existing = await this.getModuleProgress(userId, moduleId);
    if (existing) {
      return await this.updateModuleProgress(existing.id, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });
    } else {
      return await this.createModuleProgress({
        userId,
        moduleId,
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });
    }
  }

  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(quizzes.createdAt);
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return result[0];
  }

  async getQuizzesByModule(moduleId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId)).orderBy(quizzes.createdAt);
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const result = await db.insert(quizzes).values(quiz).returning();
    return result[0];
  }

  async updateQuiz(id: number, updates: Partial<InsertQuiz>): Promise<Quiz> {
    const result = await db.update(quizzes).set({ ...updates, updatedAt: new Date() }).where(eq(quizzes.id, id)).returning();
    return result[0];
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Quiz Attempts
  async getQuizAttempts(userId: number, quizId: number): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(quizAttempts.attemptNumber);
  }

  async getUserQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(quizAttempts.completedAt);
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const result = await db.insert(quizAttempts).values(attempt).returning();
    return result[0];
  }

  async getLeaderboard(limit: number = 10): Promise<UserProgress[]> {
    return await db.select().from(userProgress)
      .orderBy(desc(userProgress.totalXp), desc(userProgress.level))
      .limit(limit);
  }

  // DPIA Evaluations
  async getDpiaEvaluations(companyId: number): Promise<DpiaEvaluation[]> {
    return await db.select().from(dpiaEvaluations)
      .where(eq(dpiaEvaluations.companyId, companyId))
      .orderBy(desc(dpiaEvaluations.createdAt));
  }

  async getDpiaEvaluation(recordId: number): Promise<DpiaEvaluation | undefined> {
    const result = await db.select().from(dpiaEvaluations)
      .where(eq(dpiaEvaluations.recordId, recordId))
      .limit(1);
    return result[0];
  }

  async createDpiaEvaluation(evaluation: InsertDpiaEvaluation): Promise<DpiaEvaluation> {
    const result = await db.insert(dpiaEvaluations).values(evaluation).returning();
    return result[0];
  }

  async updateDpiaEvaluation(id: number, updates: Partial<InsertDpiaEvaluation>): Promise<DpiaEvaluation> {
    const result = await db.update(dpiaEvaluations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dpiaEvaluations.id, id))
      .returning();
    return result[0];
  }

  async deleteDpiaEvaluation(id: number): Promise<void> {
    await db.delete(dpiaEvaluations).where(eq(dpiaEvaluations.id, id));
  }

  // RAG Documents
  async getRagDocuments(): Promise<RagDocument[]> {
    return await db.select().from(ragDocuments).where(eq(ragDocuments.isActive, true)).orderBy(desc(ragDocuments.createdAt));
  }

  async getRagDocument(id: number): Promise<RagDocument | undefined> {
    const [document] = await db.select().from(ragDocuments).where(eq(ragDocuments.id, id));
    return document || undefined;
  }

  async createRagDocument(document: InsertRagDocument): Promise<RagDocument> {
    const [created] = await db.insert(ragDocuments).values(document).returning();
    return created;
  }

  async updateRagDocument(id: number, updates: Partial<InsertRagDocument>): Promise<RagDocument> {
    const [updated] = await db.update(ragDocuments).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(ragDocuments.id, id)).returning();
    return updated;
  }

  async deleteRagDocument(id: number): Promise<void> {
    await db.update(ragDocuments).set({ isActive: false, updatedAt: new Date() }).where(eq(ragDocuments.id, id));
  }

  // Prompt-Document associations
  async getAllPromptDocuments(): Promise<PromptDocument[]> {
    return await db.select().from(promptDocuments);
  }

  async getPromptDocuments(promptId: number): Promise<PromptDocument[]> {
    return await db.select().from(promptDocuments).where(eq(promptDocuments.promptId, promptId)).orderBy(promptDocuments.priority);
  }

  async getDocumentPrompts(documentId: number): Promise<PromptDocument[]> {
    return await db.select().from(promptDocuments).where(eq(promptDocuments.documentId, documentId));
  }

  async createPromptDocument(association: InsertPromptDocument): Promise<PromptDocument> {
    const [created] = await db.insert(promptDocuments).values(association).returning();
    return created;
  }

  async deletePromptDocument(promptId: number, documentId: number): Promise<void> {
    await db.delete(promptDocuments).where(
      and(
        eq(promptDocuments.promptId, promptId),
        eq(promptDocuments.documentId, documentId)
      )
    );
  }

  // Multi-tenant implementations
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(users.id, id)).returning();
    return updated;
  }

  // Enhanced Breach management
  async getBreachesByCompany(companyId: number) {
    const breaches = await db.select().from(dataBreaches).where(eq(dataBreaches.companyId, companyId));
    return breaches;
  }

  async createBreach(breachData: any) {
    console.log('Creating breach with data:', JSON.stringify(breachData, null, 2));
    
    try {
      const [breach] = await db.insert(dataBreaches).values({
        companyId: breachData.companyId,
        description: breachData.description,
        incidentDate: breachData.incidentDate,
        dataCategories: breachData.dataCategories,
        affectedPersons: breachData.affectedPersons,
        circumstances: breachData.circumstances,
        consequences: breachData.consequences,
        measures: breachData.measures,
        status: breachData.status
      }).returning();
      
      console.log('Breach created successfully:', breach);
      return breach;
    } catch (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
  }

  async updateBreach(id: number, updates: any) {
    const [breach] = await db.update(dataBreaches).set(updates).where(eq(dataBreaches.id, id)).returning();
    return breach;
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).returning();
    return updated;
  }

  async getUserCompanyAccess(userId: number): Promise<UserCompanyAccess[]> {
    return await db.select({
      id: userCompanyAccess.id,
      userId: userCompanyAccess.userId,
      companyId: userCompanyAccess.companyId,
      role: userCompanyAccess.role,
      permissions: userCompanyAccess.permissions,
      invitedBy: userCompanyAccess.invitedBy,
      invitedAt: userCompanyAccess.invitedAt,
      status: userCompanyAccess.status,
      createdAt: userCompanyAccess.createdAt,
      company: {
        id: companies.id,
        name: companies.name,
        sector: companies.sector,
        size: companies.size,
        rcsNumber: companies.rcsNumber,
        address: companies.address,
      }
    })
    .from(userCompanyAccess)
    .leftJoin(companies, eq(userCompanyAccess.companyId, companies.id))
    .where(eq(userCompanyAccess.userId, userId));
  }

  async createUserCompanyAccess(access: InsertUserCompanyAccess): Promise<UserCompanyAccess> {
    const [created] = await db.insert(userCompanyAccess).values(access).returning();
    return created;
  }

  async deleteUserCompanyAccess(id: number): Promise<void> {
    await db.delete(userCompanyAccess).where(eq(userCompanyAccess.id, id));
  }

  async getCompanyCollaborators(companyId: number): Promise<UserCompanyAccess[]> {
    return await db.select().from(userCompanyAccess)
      .where(eq(userCompanyAccess.companyId, companyId));
  }

  async getCompanyCollaboratorsWithUsers(companyId: number): Promise<(UserCompanyAccess & { user: User })[]> {
    return await db.select({
      id: userCompanyAccess.id,
      userId: userCompanyAccess.userId,
      companyId: userCompanyAccess.companyId,
      role: userCompanyAccess.role,
      permissions: userCompanyAccess.permissions,
      invitedBy: userCompanyAccess.invitedBy,
      invitedAt: userCompanyAccess.invitedAt,
      status: userCompanyAccess.status,
      createdAt: userCompanyAccess.createdAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        username: users.username,
        role: users.role,
        phoneNumber: users.phoneNumber,
        currentCompanyId: users.currentCompanyId,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        password: users.password
      }
    })
    .from(userCompanyAccess)
    .leftJoin(users, eq(userCompanyAccess.userId, users.id))
    .where(eq(userCompanyAccess.companyId, companyId));
  }

  async updateUserCompanyAccess(id: number, updates: Partial<InsertUserCompanyAccess>): Promise<UserCompanyAccess> {
    const [updated] = await db.update(userCompanyAccess).set(updates).where(eq(userCompanyAccess.id, id)).returning();
    return updated;
  }

  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [created] = await db.insert(invitations).values(invitation).returning();
    return created;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invitation;
  }

  async getCompanyInvitations(companyId: number): Promise<Invitation[]> {
    return await db.select().from(invitations)
      .where(eq(invitations.companyId, companyId))
      .orderBy(desc(invitations.createdAt));
  }

  async updateInvitation(id: number, updates: Partial<InsertInvitation>): Promise<Invitation> {
    const [updated] = await db.update(invitations).set(updates).where(eq(invitations.id, id)).returning();
    return updated;
  }

  async deleteInvitation(id: number): Promise<void> {
    await db.delete(invitations).where(eq(invitations.id, id));
  }

  async getUserInvoices(userId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  // Bot conversation methods
  async getBotConversations(companyId: number): Promise<BotConversation[]> {
    return await db.select().from(botConversations)
      .where(eq(botConversations.companyId, companyId))
      .orderBy(desc(botConversations.updatedAt));
  }

  async getBotConversation(id: number): Promise<BotConversation | undefined> {
    const [conversation] = await db.select().from(botConversations)
      .where(eq(botConversations.id, id));
    return conversation;
  }

  async createBotConversation(conversation: InsertBotConversation): Promise<BotConversation> {
    const [created] = await db.insert(botConversations).values(conversation).returning();
    return created;
  }

  async updateBotConversation(id: number, updates: Partial<InsertBotConversation>): Promise<BotConversation> {
    const [updated] = await db.update(botConversations).set(updates)
      .where(eq(botConversations.id, id)).returning();
    return updated;
  }

  async deleteBotConversation(id: number): Promise<void> {
    // Delete messages first
    await db.delete(botMessages).where(eq(botMessages.conversationId, id));
    // Then delete conversation
    await db.delete(botConversations).where(eq(botConversations.id, id));
  }

  async getBotMessages(conversationId: number): Promise<BotMessage[]> {
    return await db.select().from(botMessages)
      .where(eq(botMessages.conversationId, conversationId))
      .orderBy(botMessages.timestamp);
  }

  async createBotMessage(message: InsertBotMessage): Promise<BotMessage> {
    const [created] = await db.insert(botMessages).values(message).returning();
    return created;
  }



}

export const storage = new DatabaseStorage();