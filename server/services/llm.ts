import { openaiService } from './openai';
import { mistralService } from './mistral';
import { geminiService } from './gemini';
import { storage } from '../storage';

export class LLMService {
  private async getActiveService() {
    const config = await storage.getActiveLlmConfiguration();
    
    if (!config) {
      // Fallback to OpenAI if no config
      return openaiService;
    }

    switch (config.provider.toLowerCase()) {
      case 'google':
      case 'gemini':
        return geminiService;
      case 'mistral':
        return mistralService;
      case 'openai':
      default:
        return openaiService;
    }
  }

  async generateResponse(prompt: string, context?: any): Promise<{ response: string }> {
    const service = await this.getActiveService();
    return service.generateResponse(prompt, context);
  }

  async generateStructuredResponse(prompt: string, schema: any, context?: any): Promise<any> {
    const service = await this.getActiveService();
    return service.generateStructuredResponse(prompt, schema, context);
  }

  async generateActionPlan(diagnosticData: any, companyInfo: any): Promise<{
    actions: Array<{
      title: string;
      description: string;
      category: string;
      priority: string;
      dueDate?: string;
    }>;
    overallRiskScore: number;
    summary: string;
  }> {
    const service = await this.getActiveService();
    return service.generateActionPlan(diagnosticData, companyInfo);
  }

  async getChatbotResponse(message: string, context?: any): Promise<{ response: string }> {
    const service = await this.getActiveService();
    return service.getChatbotResponse(message, context);
  }

  async generatePrivacyPolicy(company: any, processingRecords: any[]): Promise<{ content: string }> {
    const service = await this.getActiveService();
    return service.generatePrivacyPolicy(company, processingRecords);
  }

  async analyzeDataBreach(breachData: any): Promise<{
    notificationRequired: boolean;
    justification: string;
    riskLevel?: string;
    recommendations?: string[];
  }> {
    const service = await this.getActiveService();
    return service.analyzeDataBreach(breachData);
  }

  async generateProcessingRecord(company: any, processingType: string, description: string): Promise<any> {
    const service = await this.getActiveService();
    return service.generateProcessingRecord(company, processingType, description);
  }

  async assessDPIA(processingName: string, processingDescription: string, company: any): Promise<any> {
    const service = await this.getActiveService();
    return service.assessDPIA(processingName, processingDescription, company);
  }
}

export const llmService = new LLMService();