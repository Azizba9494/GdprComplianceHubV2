import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';

export class GeminiService {
  constructor() {}

  private async getClient(): Promise<GoogleGenerativeAI> {
    // Try to get active LLM configuration
    try {
      const activeLlmConfig = await storage.getActiveLlmConfiguration();
      
      if (activeLlmConfig && activeLlmConfig.provider === 'google') {
        const apiKey = process.env[activeLlmConfig.apiKeyName];
        if (apiKey) {
          console.log(`[LLM] Using configuration: ${activeLlmConfig.name}`);
          return new GoogleGenerativeAI(apiKey);
        }
      }
    } catch (error) {
      console.log('[LLM] Error getting active config, using fallback');
    }
    
    // Fallback to environment variable
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }
    
    console.log('[LLM] Using fallback environment API key');
    return new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(prompt: string, context?: any, ragDocuments?: string[]): Promise<{ response: string }> {
    const client = await this.getClient();
    
    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      let contextSection = '';
      if (ragDocuments && ragDocuments.length > 0) {
        contextSection = `\n\nDocuments de référence à prioriser dans votre réponse:\n${ragDocuments.join('\n\n---\n\n')}`;
      }
      
      const fullPrompt = `Vous êtes un expert en conformité RGPD qui aide les entreprises françaises VSE/PME. Répondez en français de manière claire et professionnelle.

${contextSection ? 'IMPORTANT: Utilisez en priorité les informations des documents de référence fournis ci-dessous pour répondre à la question.' : ''}
${contextSection}

${prompt}${context ? `\n\nContexte additionnel: ${JSON.stringify(context)}` : ''}`;

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

  async generateStructuredResponse(prompt: string, schema: any, context?: any, ragDocuments?: string[]): Promise<any> {
    const client = await this.getClient();
    
    try {
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
        }
      });

      let contextSection = '';
      if (ragDocuments && ragDocuments.length > 0) {
        contextSection = `\n\nDocuments de référence à prioriser:\n${ragDocuments.join('\n\n---\n\n')}`;
      }

      const fullPrompt = `Vous êtes un expert en conformité RGPD. Répondez uniquement avec un JSON valide selon le schéma demandé.

${contextSection ? 'IMPORTANT: Utilisez en priorité les informations des documents de référence fournis.' : ''}
${contextSection}

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

  async generateActionPlan(diagnosticData: any, companyInfo: any, ragDocuments?: string[]): Promise<{
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

    return await this.generateStructuredResponse(prompt, schema, { diagnosticData, companyInfo }, ragDocuments);
  }

  async getChatbotResponse(message: string, context?: any, ragDocuments?: string[]): Promise<{ response: string }> {
    // Récupérer le prompt actif pour le chatbot
    const activePrompt = await storage.getActivePromptByCategory('chatbot');
    
    let prompt = activePrompt?.prompt || `L'utilisateur demande: ${message}

Vous êtes un assistant IA spécialisé en conformité RGPD pour les VSE/PME françaises. 
Répondez de manière claire et pratique, en donnant des conseils concrets et adaptés au contexte français.
Utilisez un langage accessible et évitez le jargon juridique complexe.`;

    // Remplacer les variables dans le prompt
    prompt = prompt.replace(/\{\{message\}\}/g, message);
    
    console.log(`[CHATBOT] Using prompt from database: ${activePrompt ? 'YES' : 'NO (fallback)'}`);

    return await this.generateResponse(prompt, context, ragDocuments);
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

  async analyzeDataBreach(breachData: any, ragDocuments?: string[]): Promise<{
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

    return await this.generateStructuredResponse(prompt, schema, breachData, ragDocuments);
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

  async generateDPIA(processingName: string, processingDescription: string, company: any, customPrompt: string): Promise<any> {
    const prompt = `${customPrompt}

Traitement à analyser:
Nom: ${processingName}
Description: ${processingDescription}
Entreprise: ${JSON.stringify(company)}

Générez une DPIA complète selon la structure demandée.`;

    const schema = {
      description: {
        finalites: "string",
        categoriesDonnees: ["string"],
        categoriesPersonnes: ["string"],
        destinataires: ["string"],
        dureeConservation: "string",
        transfertsHorsUE: "boolean"
      },
      necessite: {
        justificationNecessite: "string",
        adequationMoyens: "string",
        proportionnalite: "string"
      },
      risques: {
        risquesViePrivee: ["string"],
        risquesSecurite: ["string"],
        risquesDiscrimination: ["string"],
        autresRisques: ["string"]
      },
      evaluation: {
        probabilite: "string (faible|moyen|élevé)",
        gravite: "string (faible|moyen|élevé)",
        niveauRisque: "string (faible|moyen|élevé|critique)"
      },
      mesures: {
        techniqueExistantes: ["string"],
        organisationnellesExistantes: ["string"],
        complementaires: ["string"],
        transferts: ["string"]
      },
      conclusion: {
        acceptabilite: "string",
        actionsCorrectices: ["string"],
        suivi: "string"
      }
    };

    return await this.generateStructuredResponse(prompt, schema, { processingName, processingDescription, company });
  }
}

export const geminiService = new GeminiService();