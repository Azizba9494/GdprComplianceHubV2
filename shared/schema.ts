import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector"),
  size: text("size"), // VSE, SME
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Diagnostic questionnaire questions
export const diagnosticQuestions = pgTable("diagnostic_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  category: text("category").notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true),
  // Action plan for "Yes" response
  actionPlanYes: text("action_plan_yes"),
  riskLevelYes: text("risk_level_yes"), // 'faible', 'moyen', 'elevé', 'critique'
  // Action plan for "No" response
  actionPlanNo: text("action_plan_no"),
  riskLevelNo: text("risk_level_no"), // 'faible', 'moyen', 'elevé', 'critique'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Diagnostic responses
export const diagnosticResponses = pgTable("diagnostic_responses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  questionId: integer("question_id").notNull().references(() => diagnosticQuestions.id),
  response: text("response").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Compliance actions
export const complianceActions = pgTable("compliance_actions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(), // urgent, important, normal
  status: text("status").notNull().default("todo"), // todo, inprogress, completed
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Processing records
export const processingRecords = pgTable("processing_records", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  legalBasis: text("legal_basis").notNull(),
  dataCategories: text("data_categories").array(),
  recipients: text("recipients").array(),
  retention: text("retention"),
  securityMeasures: text("security_measures").array(),
  transfersOutsideEU: boolean("transfers_outside_eu").default(false),
  type: text("type").notNull(), // controller, processor
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data subject requests
export const dataSubjectRequests = pgTable("data_subject_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  requesterId: text("requester_id").notNull(),
  requesterEmail: text("requester_email").notNull(),
  requestType: text("request_type").notNull(), // access, rectification, erasure, portability, objection
  status: text("status").notNull().default("new"), // new, inprogress, verification, closed
  description: text("description"),
  identityVerified: boolean("identity_verified").default(false),
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Privacy policies
export const privacyPolicies = pgTable("privacy_policies", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data breach incidents
export const dataBreaches = pgTable("data_breaches", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  description: text("description").notNull(),
  incidentDate: timestamp("incident_date").notNull(),
  dataCategories: text("data_categories").array(),
  affectedPersons: integer("affected_persons"),
  circumstances: text("circumstances"),
  consequences: text("consequences"),
  measures: text("measures"),
  notificationRequired: boolean("notification_required"),
  notificationJustification: text("notification_justification"),
  status: text("status").notNull().default("draft"), // draft, analyzed, reported
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// DPIA assessments
export const dpiaAssessments = pgTable("dpia_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  processingName: text("processing_name").notNull(),
  processingDescription: text("processing_description").notNull(),
  riskAssessment: jsonb("risk_assessment"),
  measures: jsonb("measures"),
  status: text("status").notNull().default("draft"), // draft, inprogress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI prompts management
export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // diagnostic, records, policy, breach, dpia, chatbot
  prompt: text("prompt").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const llmConfigurations = pgTable("llm_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKeyName: text("api_key_name").notNull(),
  modelName: text("model_name").notNull(),
  maxTokens: integer("max_tokens").default(4000),
  temperature: text("temperature").default("0.7"),
  isActive: boolean("is_active").default(false),
  supportsJsonMode: boolean("supports_json_mode").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  auditLogs: many(auditLogs),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  diagnosticResponses: many(diagnosticResponses),
  complianceActions: many(complianceActions),
  processingRecords: many(processingRecords),
  dataSubjectRequests: many(dataSubjectRequests),
  privacyPolicies: many(privacyPolicies),
  dataBreaches: many(dataBreaches),
  dpiaAssessments: many(dpiaAssessments),
  auditLogs: many(auditLogs),
}));

export const diagnosticQuestionsRelations = relations(diagnosticQuestions, ({ many }) => ({
  responses: many(diagnosticResponses),
}));

export const diagnosticResponsesRelations = relations(diagnosticResponses, ({ one }) => ({
  company: one(companies, {
    fields: [diagnosticResponses.companyId],
    references: [companies.id],
  }),
  question: one(diagnosticQuestions, {
    fields: [diagnosticResponses.questionId],
    references: [diagnosticQuestions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertDiagnosticQuestionSchema = createInsertSchema(diagnosticQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertDiagnosticResponseSchema = createInsertSchema(diagnosticResponses).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceActionSchema = createInsertSchema(complianceActions).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingRecordSchema = createInsertSchema(processingRecords).omit({
  id: true,
  createdAt: true,
});

export const insertDataSubjectRequestSchema = createInsertSchema(dataSubjectRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPrivacyPolicySchema = createInsertSchema(privacyPolicies).omit({
  id: true,
  createdAt: true,
});

export const insertDataBreachSchema = createInsertSchema(dataBreaches).omit({
  id: true,
  createdAt: true,
});

export const insertDpiaAssessmentSchema = createInsertSchema(dpiaAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertLlmConfigurationSchema = createInsertSchema(llmConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type DiagnosticQuestion = typeof diagnosticQuestions.$inferSelect;
export type InsertDiagnosticQuestion = z.infer<typeof insertDiagnosticQuestionSchema>;
export type DiagnosticResponse = typeof diagnosticResponses.$inferSelect;
export type InsertDiagnosticResponse = z.infer<typeof insertDiagnosticResponseSchema>;
export type ComplianceAction = typeof complianceActions.$inferSelect;
export type InsertComplianceAction = z.infer<typeof insertComplianceActionSchema>;
export type ProcessingRecord = typeof processingRecords.$inferSelect;
export type InsertProcessingRecord = z.infer<typeof insertProcessingRecordSchema>;
export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type InsertDataSubjectRequest = z.infer<typeof insertDataSubjectRequestSchema>;
export type PrivacyPolicy = typeof privacyPolicies.$inferSelect;
export type InsertPrivacyPolicy = z.infer<typeof insertPrivacyPolicySchema>;
export type DataBreach = typeof dataBreaches.$inferSelect;
export type InsertDataBreach = z.infer<typeof insertDataBreachSchema>;
export type DpiaAssessment = typeof dpiaAssessments.$inferSelect;
export type InsertDpiaAssessment = z.infer<typeof insertDpiaAssessmentSchema>;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type LlmConfiguration = typeof llmConfigurations.$inferSelect;
export type InsertLlmConfiguration = z.infer<typeof insertLlmConfigurationSchema>;
