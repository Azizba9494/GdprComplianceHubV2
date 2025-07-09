import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-session
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"), 
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default("user"), // user, admin
  currentCompanyId: integer("current_company_id").references(() => companies.id), // Currently selected company
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector"),
  size: text("size"), // VSE, SME
  rcsNumber: text("rcs_number"), // Numéro RCS
  address: text("address"), // Adresse complète du siège social
  phone: text("phone"), // Téléphone de l'entreprise
  email: text("email"), // Email de contact de l'entreprise
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

// Compliance snapshots - historical compliance scores
export const complianceSnapshots = pgTable("compliance_snapshots", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  overallScore: integer("overall_score").notNull(),
  categoryScores: jsonb("category_scores").$type<Record<string, { score: number; total: number; answered: number }>>().notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answeredQuestions: integer("answered_questions").notNull(),
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
  createdById: integer("created_by_id").references(() => users.id),
  requiresApproval: boolean("requires_approval").default(false),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Action assignments - who is assigned to work on which action
export const actionAssignments = pgTable("action_assignments", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => complianceActions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("assignee"), // assignee, reviewer, observer
  assignedById: integer("assigned_by_id").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Action comments - discussion thread for each action
export const actionComments = pgTable("action_comments", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => complianceActions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mentionedUsers: integer("mentioned_users").array(), // Array of user IDs mentioned in the comment
  isInternal: boolean("is_internal").default(false), // Internal team comment vs client-visible
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Action attachments - files, documents, screenshots
export const actionAttachments = pgTable("action_attachments", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => complianceActions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Action activity log - comprehensive audit trail
export const actionActivityLog = pgTable("action_activity_log", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => complianceActions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // created, assigned, status_changed, commented, approved, etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional context (e.g., assignment details, status change reasons)
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
  type: text("type").notNull(), // controller, joint-controller, processor
  jointControllerInfo: text("joint_controller_info"), // Information du responsable conjoint
  dpiaRequired: boolean("dpia_required"),
  dpiaJustification: text("dpia_justification"),
  // DPIA Criteria (9 criteria for DPIA assessment)
  hasScoring: boolean("has_scoring"), // Evaluation ou notation (scoring)
  hasAutomatedDecision: boolean("has_automated_decision"), // Décision automatisée avec effet juridique
  hasSystematicMonitoring: boolean("has_systematic_monitoring"), // Surveillance systématique
  hasSensitiveData: boolean("has_sensitive_data"), // Données sensibles ou hautement personnelles
  hasLargeScale: boolean("has_large_scale"), // Traitement à grande échelle
  hasDataCombination: boolean("has_data_combination"), // Croisement/combinaison de données
  hasVulnerablePersons: boolean("has_vulnerable_persons"), // Personnes vulnérables
  hasInnovativeTechnology: boolean("has_innovative_technology"), // Usage innovant/nouvelles technologies
  preventsRightsExercise: boolean("prevents_rights_exercise"), // Empêche l'exercice de droits
  
  // Data Controller Information
  dataControllerName: text("data_controller_name"),
  dataControllerAddress: text("data_controller_address"),
  dataControllerPhone: text("data_controller_phone"),
  dataControllerEmail: text("data_controller_email"),
  
  // DPO Information
  hasDpo: boolean("has_dpo").default(false),
  dpoName: text("dpo_name"),
  dpoPhone: text("dpo_phone"),
  dpoEmail: text("dpo_email"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subprocessor records (Registre du sous-traitant)
export const subprocessorRecords = pgTable("subprocessor_records", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  
  // Client information (responsable de traitement)
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address").notNull(),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  clientRepresentativeName: text("client_representative_name"),
  clientRepresentativeAddress: text("client_representative_address"),
  clientRepresentativePhone: text("client_representative_phone"),
  clientRepresentativeEmail: text("client_representative_email"),
  
  // Sub-subprocessors information
  subprocessorName: text("subprocessor_name"),
  subprocessorAddress: text("subprocessor_address"),
  subprocessorPhone: text("subprocessor_phone"),
  subprocessorEmail: text("subprocessor_email"),
  
  // Processing categories
  processingCategories: text("processing_categories").notNull(),
  
  // International transfers
  hasInternationalTransfers: boolean("has_international_transfers").default(false),
  transferDetails: text("transfer_details"),
  
  // Security measures (reusing the same list as processing records)
  securityMeasures: text("security_measures").array(),
  
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

// Data breach incidents - complete schema with all fields
export const dataBreaches = pgTable("data_breaches", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  description: text("description").notNull(),
  incidentDate: timestamp("incident_date").notNull(),
  discoveryDate: timestamp("discovery_date"),
  dataCategories: text("data_categories").array(),
  affectedPersons: integer("affected_persons"),
  circumstances: text("circumstances"),
  consequences: text("consequences"),
  measures: text("measures"),
  comprehensiveData: text("comprehensive_data"),
  notificationRequired: boolean("notification_required"),
  notificationJustification: text("notification_justification"),
  aiRecommendationAuthority: text("ai_recommendation_authority"),
  aiRecommendationDataSubject: text("ai_recommendation_data_subject"),
  aiJustification: text("ai_justification"),
  riskAnalysisResult: text("risk_analysis_result"),
  dataSubjectNotificationRequired: boolean("data_subject_notification_required"),
  notificationDate: timestamp("notification_date"),
  dataSubjectNotificationDate: timestamp("data_subject_notification_date"),
  status: text("status").notNull().default("draft"), // draft, analyzed, reported
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// DPIA assessments - Comprehensive structure for the 4-part questionnaire
export const dpiaAssessments = pgTable("dpia_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  processingRecordId: integer("processing_record_id").notNull().references(() => processingRecords.id),
  
  // Part 1: Context Description
  generalDescription: text("general_description"),
  processingPurposes: text("processing_purposes"),
  dataController: text("data_controller"),
  dataProcessors: text("data_processors"),
  personalDataCategories: jsonb("personal_data_categories").$type<Array<{
    category: string;
    examples: string;
    recipients: string;
    retentionPeriod: string;
  }>>(),
  applicableReferentials: text("applicable_referentials"), // 1.1.5 - New field for referentials and certifications
  personalDataProcessed: text("personal_data_processed"), // 1.2.1 - Enhanced field for AI-generated proposals
  
  // Part 2: Fundamental Principles Verification
  dataMinimization: text("data_minimization"),
  retentionJustification: text("retention_justification"),
  
  // Section 2.1: Proportionality and necessity measures
  finalitiesJustification: text("finalities_justification"), // 2.1.3 - New
  legalBasisJustification: text("legal_basis_justification"), // 2.1.4 - New  
  legalBasisType: text("legal_basis_type"), // consent, contract, legal_obligation, etc.
  dataQualityJustification: text("data_quality_justification"), // 2.1.5 - New
  proportionalityEvaluation: jsonb("proportionality_evaluation").$type<{
    finalities: {status: 'acceptable' | 'improvable', measures: string},
    legalBasis: {status: 'acceptable' | 'improvable', measures: string},
    dataMinimization: {status: 'acceptable' | 'improvable', measures: string},
    dataQuality: {status: 'acceptable' | 'improvable', measures: string},
    retentionPeriods: {status: 'acceptable' | 'improvable', measures: string}
  }>(), // 2.1.6 - New
  
  // Section 2.2: Rights protection measures
  rightsInformation: text("rights_information"),
  rightsConsent: text("rights_consent"),
  rightsAccess: text("rights_access"),
  rightsRectification: text("rights_rectification"),
  rightsOpposition: text("rights_opposition"),
  subcontractingMeasures: jsonb("subcontracting_measures").$type<Array<{
    name: string,
    purpose: string,
    scope: string,
    contractReference: string,
    gdprCompliance: string
  }>>(), // 2.2.6 - New
  internationalTransfersMeasures: jsonb("international_transfers_measures").$type<Array<{
    dataType: string,
    country: string,
    justification: string
  }>>(), // 2.2.7 - New
  rightsProtectionEvaluation: jsonb("rights_protection_evaluation").$type<{
    information: {status: 'acceptable' | 'improvable', measures: string},
    consent: {status: 'acceptable' | 'improvable', measures: string},
    accessPortability: {status: 'acceptable' | 'improvable', measures: string},
    rectificationErasure: {status: 'acceptable' | 'improvable', measures: string},
    limitationOpposition: {status: 'acceptable' | 'improvable', measures: string},
    subcontracting: {status: 'acceptable' | 'improvable', measures: string},
    internationalTransfers: {status: 'acceptable' | 'improvable', measures: string}
  }>(), // 2.2.8 - New
  
  // Part 3: Privacy Risk Management
  securityMeasures: jsonb("security_measures").$type<Array<{
    id: string,
    name: string,
    category: string,
    description: string,
    implemented: boolean
  }>>(), // Enhanced with predefined measures from CNIL base knowledge
  customSecurityMeasures: jsonb("custom_security_measures").$type<Array<{
    name: string,
    category: string,
    description: string,
    implemented: boolean
  }>>(), // Custom security measures added by users
  // Risk scenarios with detailed evaluation
  riskScenarios: jsonb("risk_scenarios").$type<{
    illegitimateAccess?: {
      impacts?: string;
      sources?: string;
      measures?: string;
      severity?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      severityJustification?: string;
      likelihood?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      likelihoodJustification?: string;
    };
    unwantedModification?: {
      impacts?: string;
      sources?: string;
      measures?: string;
      severity?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      severityJustification?: string;
      likelihood?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      likelihoodJustification?: string;
    };
    dataDisappearance?: {
      impacts?: string;
      sources?: string;
      measures?: string;
      severity?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      severityJustification?: string;
      likelihood?: "undefined" | "negligible" | "limited" | "important" | "maximum";
      likelihoodJustification?: string;
    };
  }>(),
  
  // Part 4: Validation
  actionPlan: jsonb("action_plan").$type<Array<{
    measure: string;
    responsible: string;
    deadline: string;
    difficulty: string;
    cost: string;
    progress: string;
  }>>(),
  dpoAdvice: text("dpo_advice"),
  controllerValidation: text("controller_validation"),
  
  // Part 6: Evaluation section with 18 criteria
  evaluation: jsonb("evaluation").$type<{
    [key: string]: {
      rating?: "unsatisfactory" | "improvement_planned" | "satisfactory";
      justification?: string;
      additionalMeasures?: string;
    }
  }>(),
  
  status: text("status").notNull().default("draft"), // draft, inprogress, completed, validated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// DPIA Evaluations - preliminary assessment
export const dpiaEvaluations = pgTable("dpia_evaluations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  recordId: integer("record_id").notNull().references(() => processingRecords.id),
  score: integer("score").notNull(),
  recommendation: text("recommendation").notNull(),
  justification: text("justification").notNull(),
  criteriaAnswers: text("criteria_answers").notNull(),
  cnilListMatch: text("cnil_list_match"),
  largeScaleEstimate: text("large_scale_estimate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  complianceSnapshots: many(complianceSnapshots),
  complianceActions: many(complianceActions),
  processingRecords: many(processingRecords),
  dataSubjectRequests: many(dataSubjectRequests),
  privacyPolicies: many(privacyPolicies),
  dataBreaches: many(dataBreaches),
  dpiaAssessments: many(dpiaAssessments),
  dpiaEvaluations: many(dpiaEvaluations),
  auditLogs: many(auditLogs),
}));

export const complianceSnapshotsRelations = relations(complianceSnapshots, ({ one }) => ({
  company: one(companies, {
    fields: [complianceSnapshots.companyId],
    references: [companies.id],
  }),
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

export const insertComplianceSnapshotSchema = createInsertSchema(complianceSnapshots).omit({
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
  dueDate: true,
  completedAt: true,
});

export const insertPrivacyPolicySchema = createInsertSchema(privacyPolicies).omit({
  id: true,
  createdAt: true,
  version: true, // Version is auto-calculated
});

export const insertDataBreachSchema = createInsertSchema(dataBreaches).omit({
  id: true,
  createdAt: true,
}).extend({
  incidentDate: z.string().transform((str) => new Date(str)),
  discoveryDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export const insertDpiaAssessmentSchema = createInsertSchema(dpiaAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertSubprocessorRecordSchema = createInsertSchema(subprocessorRecords).omit({
  id: true,
  createdAt: true,
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
export type ComplianceSnapshot = typeof complianceSnapshots.$inferSelect;
export type InsertComplianceSnapshot = z.infer<typeof insertComplianceSnapshotSchema>;
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

export const insertDpiaEvaluationSchema = createInsertSchema(dpiaEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DpiaEvaluation = typeof dpiaEvaluations.$inferSelect;
export type InsertDpiaEvaluation = z.infer<typeof insertDpiaEvaluationSchema>;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type LlmConfiguration = typeof llmConfigurations.$inferSelect;
export type InsertLlmConfiguration = z.infer<typeof insertLlmConfigurationSchema>;
export type SubprocessorRecord = typeof subprocessorRecords.$inferSelect;
export type InsertSubprocessorRecord = z.infer<typeof insertSubprocessorRecordSchema>;

// Gamification tables
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "gouvernance", "droits", "securite", etc.
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  content: text("content").notNull(), // Rich text content
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  xpReward: integer("xp_reward").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  category: text("category").notNull(),
  criteria: text("criteria").notNull(), // JSON criteria for unlocking
  xpRequired: integer("xp_required").default(0),
  isSecret: boolean("is_secret").default(false), // Hidden until unlocked
  rarity: text("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  createdAt: timestamp("created_at").defaultNow()
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalXp: integer("total_xp").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0), // consecutive days of activity
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  notificationSent: boolean("notification_sent").default(false)
});

export const moduleProgress = pgTable("module_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleId: integer("module_id").references(() => learningModules.id).notNull(),
  status: text("status").notNull().default("not_started"), // "not_started", "in_progress", "completed"
  progress: integer("progress").default(0), // percentage 0-100
  timeSpent: integer("time_spent").default(0), // in minutes
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => learningModules.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").notNull(), // JSON array of questions
  passingScore: integer("passing_score").default(70), // percentage
  maxAttempts: integer("max_attempts").default(3),
  timeLimit: integer("time_limit"), // in minutes, null for unlimited
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  score: integer("score").notNull(), // percentage
  answers: text("answers").notNull(), // JSON array of user answers
  timeSpent: integer("time_spent"), // in minutes
  passed: boolean("passed").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  completedAt: timestamp("completed_at").defaultNow()
});

// Relations for gamification
export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  quizzes: many(quizzes),
  moduleProgress: many(moduleProgress)
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userProgressRelations = relations(userProgress, ({ one, many }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  userAchievements: many(userAchievements),
  moduleProgress: many(moduleProgress),
  quizAttempts: many(quizAttempts)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] })
}));

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  user: one(users, { fields: [moduleProgress.userId], references: [users.id] }),
  module: one(learningModules, { fields: [moduleProgress.moduleId], references: [learningModules.id] })
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(learningModules, { fields: [quizzes.moduleId], references: [learningModules.id] }),
  attempts: many(quizAttempts)
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] })
}));

// Insert schemas for gamification
export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true
});

export const insertModuleProgressSchema = createInsertSchema(moduleProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true
});

// Types for gamification
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = z.infer<typeof insertModuleProgressSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;



// RAG Documents table - for storing uploaded PDF documents
export const ragDocuments = pgTable("rag_documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(), // Extracted text content from PDF
  // chunks: jsonb("chunks").$type<Array<{ text: string; embedding?: number[] }>>().default([]),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  category: text("category").default("general"),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prompt-Document associations - which documents to use for which prompts
export const promptDocuments = pgTable("prompt_documents", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").notNull().references(() => aiPrompts.id),
  documentId: integer("document_id").notNull().references(() => ragDocuments.id),
  priority: integer("priority").notNull().default(1), // Lower numbers = higher priority
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions table for multi-tenant billing
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planName: text("plan_name").notNull(), // Standard, Premium, Enterprise
  maxCompanies: integer("max_companies").notNull().default(1),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("active"), // active, cancelled, expired
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User company access (for collaborators)
export const userCompanyAccess = pgTable("user_company_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  role: text("role").notNull().default("collaborator"), // owner, admin, collaborator
  permissions: text("permissions").array(), // Array of permission strings
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  status: text("status").notNull().default("active"), // active, pending, revoked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invitations table for pending collaborator invites
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  permissions: text("permissions").array(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Billing invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, cancelled
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bot conversations table for LA Team
export const botConversations = pgTable("bot_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  botType: text("bot_type").notNull(), // fondement, voyages, archive, irma, custom
  title: text("title").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bot messages table
export const botMessages = pgTable("bot_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => botConversations.id),
  content: text("content").notNull(),
  isBot: boolean("is_bot").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertRagDocumentSchema = createInsertSchema(ragDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptDocumentSchema = createInsertSchema(promptDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUserCompanyAccessSchema = createInsertSchema(userCompanyAccess).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertBotConversationSchema = createInsertSchema(botConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotMessageSchema = createInsertSchema(botMessages).omit({
  id: true,
  timestamp: true,
});

// Collaborative action schemas
export const insertActionAssignmentSchema = createInsertSchema(actionAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertActionCommentSchema = createInsertSchema(actionComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActionAttachmentSchema = createInsertSchema(actionAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertActionActivityLogSchema = createInsertSchema(actionActivityLog).omit({
  id: true,
  createdAt: true,
});

// RAG Document types
export type RagDocument = typeof ragDocuments.$inferSelect;
export type InsertRagDocument = z.infer<typeof insertRagDocumentSchema>;
export type PromptDocument = typeof promptDocuments.$inferSelect;
export type InsertPromptDocument = z.infer<typeof insertPromptDocumentSchema>;

// Bot types
export type BotConversation = typeof botConversations.$inferSelect;
export type InsertBotConversation = z.infer<typeof insertBotConversationSchema>;
export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;

// Collaborative action types
export type ActionAssignment = typeof actionAssignments.$inferSelect;
export type InsertActionAssignment = z.infer<typeof insertActionAssignmentSchema>;
export type ActionComment = typeof actionComments.$inferSelect;
export type InsertActionComment = z.infer<typeof insertActionCommentSchema>;
export type ActionAttachment = typeof actionAttachments.$inferSelect;
export type InsertActionAttachment = z.infer<typeof insertActionAttachmentSchema>;
export type ActionActivityLog = typeof actionActivityLog.$inferSelect;
export type InsertActionActivityLog = z.infer<typeof insertActionActivityLogSchema>;

// Multi-tenant types
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UserCompanyAccess = typeof userCompanyAccess.$inferSelect;
export type InsertUserCompanyAccess = z.infer<typeof insertUserCompanyAccessSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
