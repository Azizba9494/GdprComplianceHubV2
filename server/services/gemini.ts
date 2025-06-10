import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  private ensureClient() {
    if (!this.client) {
      throw new Error('Google API key not configured');
    }
    return this.client;
  }

  async generateResponse(prompt: string, context?: any): Promise<{ response: string }> {
    const client = this.ensureClient();
    
    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const fullPrompt = `Vous êtes un expert en conformité RGPD qui aide les entreprises françaises VSE/PME. Répondez en français de manière claire et professionnelle.

${prompt}${context ? `\n\nContexte: ${JSON.stringify(context)}` : ''}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        response: text || 'Désolé, je n\'ai pas pu générer une réponse.'
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Erreur Gemini API: ${error.message}`);
    }
  }

  async generateStructuredResponse(prompt: string, schema: any, context?: any): Promise<any> {
    const client = this.ensureClient();
    
    try {
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
        }
      });

      const fullPrompt = `Vous êtes un expert en conformité RGPD. Répondez uniquement avec un JSON valide selon le schéma demandé.

${prompt}

Schéma de réponse attendu: ${JSON.stringify(schema)}

Contexte: ${JSON.stringify(context || {})}

Répondez UNIQUEMENT avec un JSON valide, sans texte supplémentaire.`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (parseError) {
        // Attempt to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Impossible de parser la réponse JSON');
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Erreur Gemini API: ${error.message}`);
    }
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
    const prompt = `Analysez les réponses du diagnostic RGPD et générez un plan d'action personnalisé pour cette entreprise VSE/PME française.

Réponses du diagnostic: ${JSON.stringify(diagnosticData)}
Informations de l'entreprise: ${JSON.stringify(companyInfo)}

Générez un plan d'action avec des actions concrètes et réalisables adaptées aux ressources limitées d'une VSE/PME.
Priorisez les actions selon leur urgence légale et leur impact sur la conformité.`;

    const schema = {
      actions: [
        {
          title: "string",
          description: "string", 
          category: "string",
          priority: "string (critical|high|medium|low)",
          dueDate: "string (optional, ISO date)"
        }
      ],
      overallRiskScore: "number (0-100)",
      summary: "string"
    };

    return await this.generateStructuredResponse(prompt, schema, { diagnosticData, companyInfo });
  }

  async getChatbotResponse(message: string, context?: any): Promise<{ response: string }> {
    const prompt = `L'utilisateur demande: ${message}

Vous êtes un assistant IA spécialisé en conformité RGPD pour les VSE/PME françaises. 
Répondez de manière claire et pratique, en donnant des conseils concrets et adaptés au contexte français.
Utilisez un langage accessible et évitez le jargon juridique complexe.`;

    return await this.generateResponse(prompt, context);
  }

  async generatePrivacyPolicy(company: any, processingRecords: any[]): Promise<{ content: string }> {
    const prompt = `Générez une politique de confidentialité conforme au RGPD pour cette entreprise française.

Informations de l'entreprise: ${JSON.stringify(company)}
Registres de traitement: ${JSON.stringify(processingRecords)}

La politique doit être:
- Conforme au RGPD et à la loi française
- Adaptée à une VSE/PME
- Claire et compréhensible pour les utilisateurs
- Complète mais pas excessive`;

    const result = await this.generateResponse(prompt, { company, processingRecords });
    return { content: result.response };
  }

  async analyzeDataBreach(breachData: any): Promise<{
    notificationRequired: boolean;
    justification: string;
    riskLevel: string;
    recommendations: string[];
  }> {
    const prompt = `Analysez cette violation de données personnelles selon le RGPD et la réglementation française.

Données de la violation: ${JSON.stringify(breachData)}

Déterminez:
1. Si une notification à la CNIL est obligatoire (72h)
2. Si une information aux personnes concernées est nécessaire
3. Le niveau de risque
4. Les actions recommandées`;

    const schema = {
      notificationRequired: "boolean",
      justification: "string",
      riskLevel: "string (faible|moyen|élevé|critique)",
      recommendations: ["string"]
    };

    return await this.generateStructuredResponse(prompt, schema, breachData);
  }

  async generateProcessingRecord(company: any, processingType: string, description: string): Promise<any> {
    const prompt = `Générez un registre de traitement RGPD pour cette entreprise française.

Entreprise: ${JSON.stringify(company)}
Type de traitement: ${processingType}
Description: ${description}

Le registre doit inclure tous les éléments obligatoires selon l'article 30 du RGPD.`;

    const schema = {
      name: "string",
      purpose: "string",
      legalBasis: "string",
      dataCategories: ["string"],
      recipients: ["string"],
      retention: "string",
      securityMeasures: ["string"],
      transfersOutsideEU: "boolean"
    };

    return await this.generateStructuredResponse(prompt, schema, { company, processingType, description });
  }

  async assessDPIA(processingName: string, processingDescription: string, company: any): Promise<any> {
    const prompt = `Réalisez une analyse d'impact relative à la protection des données (AIPD/DPIA) pour ce traitement.

Nom du traitement: ${processingName}
Description: ${processingDescription}
Entreprise: ${JSON.stringify(company)}

Analysez les risques et proposez des mesures de protection adaptées à une VSE/PME.`;

    const schema = {
      riskAssessment: {
        likelihood: "string (faible|moyen|élevé)",
        severity: "string (faible|moyen|élevé)",
        overallRisk: "string (faible|moyen|élevé|critique)"
      },
      measures: {
        technical: ["string"],
        organizational: ["string"],
        legal: ["string"]
      },
      conclusion: "string",
      dpiaRequired: "boolean"
    };

    return await this.generateStructuredResponse(prompt, schema, { processingName, processingDescription, company });
  }
}

export const geminiService = new GeminiService();