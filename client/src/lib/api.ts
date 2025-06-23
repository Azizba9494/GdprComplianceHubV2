import { apiRequest } from "./queryClient";

// Auth API
export const authApi = {
  register: async (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => {
    console.log('API: Making register request:', userData);
    return await apiRequest("POST", "/api/auth/register", userData);
  },
  
  login: async (credentials: { identifier: string; password: string }) => {
    console.log('API: Making login request:', { identifier: credentials.identifier });
    return await apiRequest("POST", "/api/auth/login", credentials);
  },
    
  logout: async () => {
    console.log('API: Making logout request');
    return await apiRequest("POST", "/api/auth/logout", {});
  },
    
  me: async () => {
    console.log('API: Making me request');
    return await apiRequest("GET", "/api/auth/me");
  },
    
  findUserByEmail: async (email: string) => {
    console.log('API: Making findUserByEmail request:', email);
    return await apiRequest("GET", `/api/auth/find-user?email=${encodeURIComponent(email)}`);
  },
};

// Company API
export const companyApi = {
  get: (userId: number) =>
    apiRequest("GET", `/api/companies/${userId}`),
  
  getCurrentUserCompany: () =>
    apiRequest("GET", "/api/user/company"),
  
  create: (companyData: { name: string; sector?: string; size?: string; userId: number }) =>
    apiRequest("POST", "/api/companies", companyData),
  
  update: (id: number, updates: any) =>
    apiRequest("PUT", `/api/companies/${id}`, updates),
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
  
  generate: (data: any) =>
    apiRequest("POST", "/api/records/generate", data),
  
  create: (recordData: any) =>
    apiRequest("POST", "/api/records", recordData),
  
  update: (id: number, data: any) =>
    apiRequest("PUT", `/api/records/${id}`, data),
  
  delete: (id: number) =>
    apiRequest("DELETE", `/api/records/${id}`),
  
  analyzeDpia: (record: any) =>
    apiRequest("POST", "/api/records/analyze-dpia", record),
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
  
  create: (breachData: any) =>
    apiRequest("POST", "/api/breaches", breachData),
  
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
  
  create: (data: { companyId: number; processingName: string; processingDescription: string }) =>
    apiRequest("POST", "/api/dpia", data),
  
  assess: (data: { companyId: number; processingName: string; processingDescription: string }) =>
    apiRequest("POST", "/api/dpia/assess", data),
  
  delete: (id: number) =>
    apiRequest("DELETE", `/api/dpia/${id}`),
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

// Learning API
export const learningApi = {
  getModules: () => apiRequest("GET", "/api/learning/modules"),
  getModulesByCategory: (category: string) => 
    apiRequest("GET", `/api/learning/modules/${category}`),
  getModule: (id: number) => apiRequest("GET", `/api/learning/module/${id}`),
  completeModule: (userId: number, moduleId: number) => 
    apiRequest("POST", "/api/learning/complete-module", { userId, moduleId }),
  updateProgress: (userId: number, moduleId: number, progress: number, timeSpent: number) =>
    apiRequest("POST", "/api/learning/update-progress", { userId, moduleId, progress, timeSpent })
};

// Gamification API
export const gamificationApi = {
  getUserProgress: (userId: number) => 
    apiRequest("GET", `/api/gamification/progress/${userId}`),
  getAchievements: () => apiRequest("GET", "/api/gamification/achievements"),
  getLeaderboard: (limit = 10) => 
    apiRequest("GET", `/api/gamification/leaderboard?limit=${limit}`)
};

// RAG Documents API
export const ragDocumentsApi = {
  getDocuments: () => apiRequest("GET", "/api/admin/documents"),
  uploadDocument: (formData: FormData) => 
    fetch("/api/admin/documents", {
      method: "POST",
      body: formData
    }).then(res => res.json()),
  deleteDocument: (id: number) => 
    apiRequest("DELETE", `/api/admin/documents/${id}`),
  getPromptDocuments: (promptId: number) => 
    apiRequest("GET", `/api/admin/prompt-documents/${promptId}`),
  createPromptDocument: (data: { promptId: number; documentId: number; priority: number }) =>
    apiRequest("POST", "/api/admin/prompt-documents", data),
  deletePromptDocument: (promptId: number, documentId: number) =>
    apiRequest("DELETE", `/api/admin/prompt-documents/${promptId}/${documentId}`)
};
