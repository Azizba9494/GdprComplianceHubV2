import { apiRequest } from "./queryClient";

// Auth API
export const authApi = {
  register: (userData: { username: string; email: string; password: string }) =>
    apiRequest("POST", "/api/auth/register", userData),
  
  login: (credentials: { username: string; password: string }) =>
    apiRequest("POST", "/api/auth/login", credentials),
};

// Company API
export const companyApi = {
  get: (userId: number) =>
    apiRequest("GET", `/api/companies/${userId}`),
  
  create: (companyData: { name: string; sector?: string; size?: string; userId: number }) =>
    apiRequest("POST", "/api/companies", companyData),
};

// Diagnostic API
export const diagnosticApi = {
  getQuestions: () =>
    apiRequest("GET", "/api/diagnostic/questions"),
  
  getResponses: (companyId: number) =>
    apiRequest("GET", `/api/diagnostic/responses/${companyId}`),
  
  submitResponse: (responseData: { companyId: number; questionId: number; response: string; score?: number }) =>
    apiRequest("POST", "/api/diagnostic/responses", responseData),
  
  analyze: (companyId: number) =>
    apiRequest("POST", "/api/diagnostic/analyze", { companyId }),
};

// Actions API
export const actionsApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/actions/${companyId}`),
  
  update: (id: number, updates: any) =>
    apiRequest("PUT", `/api/actions/${id}`, updates),
};

// Records API
export const recordsApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/records/${companyId}`),
  
  generate: (data: { companyId: number; processingType: string; description: string }) =>
    apiRequest("POST", "/api/records/generate", data),
  
  create: (recordData: any) =>
    apiRequest("POST", "/api/records", recordData),
};

// Privacy Policy API
export const privacyPolicyApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/privacy-policies/${companyId}`),
  
  generate: (companyId: number) =>
    apiRequest("POST", "/api/privacy-policies/generate", { companyId }),
};

// Data Breach API
export const breachApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/breaches/${companyId}`),
  
  analyze: (breachData: any) =>
    apiRequest("POST", "/api/breaches/analyze", breachData),
};

// Data Subject Requests API
export const requestsApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/requests/${companyId}`),
  
  create: (requestData: any) =>
    apiRequest("POST", "/api/requests", requestData),
  
  update: (id: number, updates: any) =>
    apiRequest("PUT", `/api/requests/${id}`, updates),
};

// DPIA API
export const dpiaApi = {
  get: (companyId: number) =>
    apiRequest("GET", `/api/dpia/${companyId}`),
  
  assess: (data: { companyId: number; processingName: string; processingDescription: string }) =>
    apiRequest("POST", "/api/dpia/assess", data),
};

// Admin API
export const adminApi = {
  getPrompts: () =>
    apiRequest("GET", "/api/admin/prompts"),
  
  createPrompt: (promptData: any) =>
    apiRequest("POST", "/api/admin/prompts", promptData),
  
  updatePrompt: (id: number, updates: any) =>
    apiRequest("PUT", `/api/admin/prompts/${id}`, updates),

  createQuestion: (questionData: any) =>
    apiRequest("POST", "/api/admin/questions", questionData),
  
  updateQuestion: (id: number, updates: any) =>
    apiRequest("PUT", `/api/admin/questions/${id}`, updates),
  
  deleteQuestion: (id: number) =>
    apiRequest("DELETE", `/api/admin/questions/${id}`),

  // LLM Configurations
  getLlmConfigs: () =>
    apiRequest("GET", "/api/admin/llm-configs"),
  
  createLlmConfig: (configData: any) =>
    apiRequest("POST", "/api/admin/llm-configs", configData),
  
  updateLlmConfig: (id: number, updates: any) =>
    apiRequest("PUT", `/api/admin/llm-configs/${id}`, updates),
  
  deleteLlmConfig: (id: number) =>
    apiRequest("DELETE", `/api/admin/llm-configs/${id}`),
};

// Chatbot API
export const chatbotApi = {
  sendMessage: (message: string, companyId?: number) =>
    apiRequest("POST", "/api/chatbot", { message, companyId }),
};

// Dashboard API
export const dashboardApi = {
  getStats: (companyId: number) =>
    apiRequest("GET", `/api/dashboard/${companyId}`),
};
