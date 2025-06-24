import { GeminiService } from './gemini';
import { storage } from '../storage';

export class LLMFallbackService {
  private geminiService: GeminiService;
  private maxRetries = 2;
  private retryDelay = 3000; // 3 secondes

  constructor() {
    this.geminiService = new GeminiService();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async tryGeminiWithRetry(
    method: string,
    ...args: any[]
  ): Promise<any> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[FALLBACK] Tentative ${attempt}/${this.maxRetries} avec Gemini pour ${method}`);
        
        // Appeler la méthode Gemini
        const result = await (this.geminiService as any)[method](...args);
        
        console.log(`[FALLBACK] Succès avec Gemini au ${attempt}e essai`);
        return result;
      } catch (error: any) {
        console.log(`[FALLBACK] Échec tentative ${attempt}: ${error.message}`);
        
        if (attempt < this.maxRetries && (
          error.status === 503 || 
          error.status === 429 || 
          error.message.includes('overloaded') ||
          error.message.includes('surchargé')
        )) {
          console.log(`[FALLBACK] Attente de ${this.retryDelay}ms avant nouvelle tentative`);
          await this.delay(this.retryDelay);
          continue;
        }
        
        // Si c'est la dernière tentative ou une erreur non récupérable
        throw error;
      }
    }
  }

  private async getBasicPrivacyPolicyTemplate(company: any, processingRecords: any[]): Promise<{ content: string }> {
    console.log('[FALLBACK] Génération de politique de base sans IA');
    
    const companyName = company.name || 'Votre Entreprise';
    const companyEmail = company.email || 'contact@entreprise.fr';
    
    const content = `# POLITIQUE DE CONFIDENTIALITÉ

## 1. IDENTITÉ DU RESPONSABLE DE TRAITEMENT

**${companyName}**
Secteur d'activité : ${company.sector || 'Non spécifié'}
Email : ${companyEmail}

## 2. FINALITÉS DES TRAITEMENTS

Dans le cadre de nos activités, nous sommes amenés à traiter vos données personnelles pour les finalités suivantes :

${processingRecords.map((record: any) => `
### ${record.name}
- **Finalité** : ${record.purpose}
- **Base légale** : ${record.legalBasis}
- **Catégories de données** : ${Array.isArray(record.dataCategories) ? record.dataCategories.join(', ') : 'Données nécessaires au traitement'}
- **Durée de conservation** : ${record.retentionPeriod || 'Durée nécessaire aux finalités du traitement'}
`).join('\n')}

## 3. DROITS DES PERSONNES

Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données personnelles
- Droit de rectification
- Droit à l'effacement ("droit à l'oubli")
- Droit à la limitation du traitement
- Droit à la portabilité des données
- Droit d'opposition

Pour exercer ces droits, contactez-nous à : ${companyEmail}

## 4. SÉCURITÉ DES DONNÉES

Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir la sécurité de vos données personnelles.

## 5. CONTACT

Pour toute question relative à cette politique de confidentialité ou à l'exercice de vos droits :
**${companyName}**
Email : ${companyEmail}

---
*Document généré automatiquement - Version de base*
*Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}*`;

    return { content };
  }

  async generatePrivacyPolicy(company: any, processingRecords: any[]): Promise<{ content: string }> {
    try {
      // Essayer avec Gemini (avec retry automatique)
      return await this.tryGeminiWithRetry('generatePrivacyPolicy', company, processingRecords);
    } catch (error: any) {
      console.error('[FALLBACK] Tous les essais Gemini ont échoué:', error.message);
      
      // Fallback vers un template de base
      console.log('[FALLBACK] Utilisation du template de base');
      return await this.getBasicPrivacyPolicyTemplate(company, processingRecords);
    }
  }

  async generateDpiaResponse(customPrompt: string, context: any, ragDocuments: string[] = []): Promise<{ response: string }> {
    try {
      return await this.tryGeminiWithRetry('generateDpiaResponse', customPrompt, context, ragDocuments);
    } catch (error: any) {
      console.error('[FALLBACK] DPIA generation failed:', error.message);
      throw new Error('Service de génération temporairement indisponible. Veuillez réessayer dans quelques minutes.');
    }
  }

  async analyzeDataBreach(breachData: any, ragDocuments?: string[]): Promise<any> {
    try {
      return await this.tryGeminiWithRetry('analyzeDataBreach', breachData, ragDocuments);
    } catch (error: any) {
      console.error('[FALLBACK] Breach analysis failed:', error.message);
      throw new Error('Service d\'analyse temporairement indisponible. Veuillez réessayer dans quelques minutes.');
    }
  }

  async getChatbotResponse(message: string, context?: any, ragDocuments?: string[]): Promise<{ response: string }> {
    try {
      return await this.tryGeminiWithRetry('getChatbotResponse', message, context, ragDocuments);
    } catch (error: any) {
      console.error('[FALLBACK] Chatbot response failed:', error.message);
      return { 
        response: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants ou reformuler votre question.' 
      };
    }
  }
}

export const llmFallbackService = new LLMFallbackService();