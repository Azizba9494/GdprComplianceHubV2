import { 
  users, companies, diagnosticQuestions, diagnosticResponses, complianceActions,
  processingRecords, dataSubjectRequests, privacyPolicies, dataBreaches,
  dpiaAssessments, aiPrompts, auditLogs, llmConfigurations,
  type User, type InsertUser, type Company, type InsertCompany,
  type DiagnosticQuestion, type InsertDiagnosticQuestion,
  type DiagnosticResponse, type InsertDiagnosticResponse,
  type ComplianceAction, type InsertComplianceAction,
  type ProcessingRecord, type InsertProcessingRecord,
  type DataSubjectRequest, type InsertDataSubjectRequest,
  type PrivacyPolicy, type InsertPrivacyPolicy,
  type DataBreach, type InsertDataBreach,
  type DpiaAssessment, type InsertDpiaAssessment,
  type AiPrompt, type InsertAiPrompt,
  type AuditLog, type InsertAuditLog,
  type LlmConfiguration, type InsertLlmConfiguration
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
  
  // Diagnostic Questions
  getDiagnosticQuestions(): Promise<DiagnosticQuestion[]>;
  createDiagnosticQuestion(question: InsertDiagnosticQuestion): Promise<DiagnosticQuestion>;
  updateDiagnosticQuestion(id: number, updates: Partial<InsertDiagnosticQuestion>): Promise<DiagnosticQuestion>;
  deleteDiagnosticQuestion(id: number): Promise<void>;
  
  // Diagnostic Responses
  getDiagnosticResponses(companyId: number): Promise<DiagnosticResponse[]>;
  createDiagnosticResponse(response: InsertDiagnosticResponse): Promise<DiagnosticResponse>;
  
  // Compliance Actions
  getComplianceActions(companyId: number): Promise<ComplianceAction[]>;
  createComplianceAction(action: InsertComplianceAction): Promise<ComplianceAction>;
  updateComplianceAction(id: number, updates: Partial<InsertComplianceAction>): Promise<ComplianceAction>;
  deleteComplianceAction(id: number): Promise<void>;
  
  // Processing Records
  getProcessingRecords(companyId: number): Promise<ProcessingRecord[]>;
  createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord>;
  updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord>;
  deleteProcessingRecord(id: number): Promise<void>;
  
  // Data Subject Requests
  getDataSubjectRequests(companyId: number): Promise<DataSubjectRequest[]>;
  createDataSubjectRequest(request: InsertDataSubjectRequest): Promise<DataSubjectRequest>;
  updateDataSubjectRequest(id: number, updates: Partial<InsertDataSubjectRequest>): Promise<DataSubjectRequest>;
  
  // Privacy Policies
  getPrivacyPolicies(companyId: number): Promise<PrivacyPolicy[]>;
  getActivePrivacyPolicy(companyId: number): Promise<PrivacyPolicy | undefined>;
  createPrivacyPolicy(policy: InsertPrivacyPolicy): Promise<PrivacyPolicy>;
  
  // Data Breaches
  getDataBreaches(companyId: number): Promise<DataBreach[]>;
  createDataBreach(breach: InsertDataBreach): Promise<DataBreach>;
  updateDataBreach(id: number, updates: Partial<InsertDataBreach>): Promise<DataBreach>;
  
  // DPIA Assessments
  getDpiaAssessments(companyId: number): Promise<DpiaAssessment[]>;
  createDpiaAssessment(assessment: InsertDpiaAssessment): Promise<DpiaAssessment>;
  updateDpiaAssessment(id: number, updates: Partial<InsertDpiaAssessment>): Promise<DpiaAssessment>;
  
  // AI Prompts
  getAiPrompts(): Promise<AiPrompt[]>;
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

  // Processing Records
  async getProcessingRecords(companyId: number): Promise<ProcessingRecord[]> {
    return await db.select().from(processingRecords).where(eq(processingRecords.companyId, companyId)).orderBy(desc(processingRecords.createdAt));
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
    await db.delete(processingRecords).where(eq(processingRecords.id, id));
  }

  // Data Subject Requests
  async getDataSubjectRequests(companyId: number): Promise<DataSubjectRequest[]> {
    return await db.select().from(dataSubjectRequests).where(eq(dataSubjectRequests.companyId, companyId)).orderBy(desc(dataSubjectRequests.createdAt));
  }

  async createDataSubjectRequest(request: InsertDataSubjectRequest): Promise<DataSubjectRequest> {
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

  async createPrivacyPolicy(policy: InsertPrivacyPolicy): Promise<PrivacyPolicy> {
    const [created] = await db.insert(privacyPolicies).values(policy).returning();
    return created;
  }

  // Data Breaches
  async getDataBreaches(companyId: number): Promise<DataBreach[]> {
    return await db.select().from(dataBreaches).where(eq(dataBreaches.companyId, companyId)).orderBy(desc(dataBreaches.createdAt));
  }

  async createDataBreach(breach: InsertDataBreach): Promise<DataBreach> {
    const [created] = await db.insert(dataBreaches).values(breach).returning();
    return created;
  }

  async updateDataBreach(id: number, updates: Partial<InsertDataBreach>): Promise<DataBreach> {
    const [updated] = await db.update(dataBreaches).set(updates).where(eq(dataBreaches.id, id)).returning();
    return updated;
  }

  // DPIA Assessments
  async getDpiaAssessments(companyId: number): Promise<DpiaAssessment[]> {
    return await db.select().from(dpiaAssessments).where(eq(dpiaAssessments.companyId, companyId)).orderBy(desc(dpiaAssessments.createdAt));
  }

  async createDpiaAssessment(assessment: InsertDpiaAssessment): Promise<DpiaAssessment> {
    const [created] = await db.insert(dpiaAssessments).values(assessment).returning();
    return created;
  }

  async updateDpiaAssessment(id: number, updates: Partial<InsertDpiaAssessment>): Promise<DpiaAssessment> {
    const [updated] = await db.update(dpiaAssessments).set(updates).where(eq(dpiaAssessments.id, id)).returning();
    return updated;
  }

  // AI Prompts
  async getAiPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts).orderBy(aiPrompts.category, aiPrompts.name);
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
}

export const storage = new DatabaseStorage();
