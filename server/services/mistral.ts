import { MistralApi } from '@mistralai/mistralai';

export class MistralService {
  private client: MistralApi | null = null;

  constructor() {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (apiKey) {
      this.client = new MistralApi({
        apiKey: apiKey,
      });
    }
  }

  private ensureClient() {
    if (!this.client) {
      throw new Error('Mistral API key not configured');
    }
    return this.client;
  }

  async generateResponse(prompt: string, context?: any): Promise<{ response: string }> {
    const client = this.ensureClient();
    
    try {
      const response = await client.chat({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un expert en conformité RGPD qui aide les entreprises françaises VSE/PME. Répondez en français de manière claire et professionnelle.'
          },
          {
            role: 'user',
            content: prompt + (context ? `\n\nContexte: ${JSON.stringify(context)}` : '')
          }
        ],
        temperature: 0.7,
        maxTokens: 2000,
      });

      return {
        response: response.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.'
      };
    } catch (error: any) {
      console.error('Mistral API error:', error);
      throw new Error(`Erreur Mistral API: ${error.message}`);
    }
  }

  async generateStructuredResponse(prompt: string, schema: any, context?: any): Promise<any> {
    const client = this.ensureClient();
    
    try {
      const response = await client.chat({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un expert en conformité RGPD. Répondez uniquement avec un JSON valide selon le schéma demandé.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nSchéma de réponse attendu: ${JSON.stringify(schema)}\n\nContexte: ${JSON.stringify(context || {})}`
          }
        ],
        temperature: 0.3,
        maxTokens: 3000,
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Pas de réponse du modèle');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Attempt to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Impossible de parser la réponse JSON');
      }
    } catch (error: any) {
      console.error('Mistral API error:', error);
      throw new Error(`Erreur Mistral API: ${error.message}`);
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
    const prompt = `Analysez les réponses du diagnostic RGPD et générez un plan d'action personnalisé pour cette entreprise.

Réponses du diagnostic: ${JSON.stringify(diagnosticData)}
Informations de l'entreprise: ${JSON.stringify(companyInfo)}

Générez un plan d'action avec des actions concrètes et réalisables pour une VSE/PME française.`;

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
Répondez de manière claire et pratique, en donnant des conseils concrets et adaptés au contexte français.`;

    return await this.generateResponse(prompt, context);
  }
}

export const mistralService = new MistralService();