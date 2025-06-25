import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';
import { contextExtractor, type AIContext } from './contextExtractor';

export class GeminiService {
  constructor() {}

  private async loadRagDocuments(promptName?: string): Promise<string[]> {
    try {
      const ragDocuments: string[] = [];

      if (promptName) {
        // Load documents only for the specific prompt
        const specificPrompt = await storage.getAiPromptByName(promptName);
        if (specificPrompt && specificPrompt.isActive) {
          console.log(`[RAG] Loading documents specifically for prompt: ${promptName}`);
          const promptDocuments = await storage.getPromptDocuments(specificPrompt.id);
          if (promptDocuments.length > 0) {
            const documentIds = promptDocuments
              .sort((a, b) => a.priority - b.priority)
              .map(pd => pd.documentId);

            for (const docId of documentIds) {
              const document = await storage.getRagDocument(docId);
              if (document && document.isActive) {
                ragDocuments.push(document.content);
              }
            }
          }
        }
      } else {
        // Original behavior: Get all active prompts
        const allPrompts = await storage.getAiPrompts();
        const activePrompts = allPrompts.filter(p => p.isActive);

        // For each active prompt, get associated documents
        for (const prompt of activePrompts) {
          try {
            const promptDocuments = await storage.getPromptDocuments(prompt.id);
            if (promptDocuments.length > 0) {
              const documentIds = promptDocuments
                .sort((a, b) => a.priority - b.priority)
                .map(pd => pd.documentId);

              for (const docId of documentIds) {
                const document = await storage.getRagDocument(docId);
                if (document && document.isActive && !ragDocuments.includes(document.content)) {
                  ragDocuments.push(document.content);
                }
              }
            }
          } catch (error) {
            console.error(`Error loading documents for prompt ${prompt.id}:`, error);
          }
        }
      }

      console.log(`[RAG] Found ${ragDocuments.length} documents${promptName ? ` for prompt ${promptName}` : ' total'}`);
      return ragDocuments;
    } catch (error) {
      console.error('Error loading RAG documents:', error);
      return [];
    }
  }

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

  // AI-assisted DPIA questionnaire responses (legacy method)

  // Generate risk assessment suggestions
  async generateRiskAssessment(
    processingDescription: string,
    dataCategories: any[],
    companyInfo: any,
    ragDocuments?: string[]
  ): Promise<{
    risks: Array<{
      riskType: string;
      riskSources: string;
      threats: string;
      potentialImpacts: string;
      severity: string;
      likelihood: string;
    }>;
  }> {
    const knowledgeBase = ragDocuments && ragDocuments.length > 0 ? 
      `\n\nBase de connaissances CNIL:\n${ragDocuments.join('\n\n---\n\n')}` : '';

    const prompt = `En tant qu'expert en analyse de risques AIPD selon la méthodologie CNIL, évaluez les trois types de risques fondamentaux.

Description du traitement: ${processingDescription}

Catégories de données: ${JSON.stringify(dataCategories)}

Entreprise: ${companyInfo.sector || 'Secteur non spécifié'} - ${companyInfo.size || 'Taille non spécifiée'}
${knowledgeBase}

Analysez selon la méthodologie CNIL les 3 risques:

1. ACCÈS ILLÉGITIME (atteinte à la confidentialité)
- Sources de risques possibles
- Menaces concrètes  
- Impacts potentiels sur les personnes
- Évaluation gravité (négligeable/limitée/importante/maximale)
- Évaluation vraisemblance (négligeable/limitée/importante/maximale)

2. MODIFICATION NON DÉSIRÉE (atteinte à l'intégrité)
- Mêmes éléments d'analyse

3. DISPARITION DE DONNÉES (atteinte à la disponibilité)  
- Mêmes éléments d'analyse

Répondez en JSON structuré:
{
  "risks": [
    {
      "riskType": "illegitimate_access|unwanted_modification|data_disappearance",
      "riskSources": "string",
      "threats": "string", 
      "potentialImpacts": "string",
      "severity": "negligible|limited|significant|maximum",
      "likelihood": "negligible|limited|significant|maximum"
    }
  ]
}`;

    const client = await this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const response = await model.generateContent(prompt);

    try {
      const jsonMatch = response.response.text().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing risk assessment JSON:', error);
    }

    return { risks: [] };
  }

  async generateResponse(prompt: string, context?: any, ragDocuments?: string[]): Promise<{ response: string }> {
    const client = await this.getClient();

    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

      // Clean response by removing markdown formatting
      const cleanedText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/###\s*(.*?)$/gm, '$1') // Remove ### headers
        .replace(/##\s*(.*?)$/gm, '$1')  // Remove ## headers
        .replace(/^\*\s+/gm, '• ')       // Convert * bullets to •
        .replace(/^\d+\.\s+/gm, (match, offset, string) => {
          const lineStart = string.lastIndexOf('\n', offset) + 1;
          const isStartOfLine = offset === lineStart;
          return isStartOfLine ? match : match;
        })
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n'); // Add spacing between paragraphs

      return {
        response: cleanedText || 'Désolé, je n\'ai pas pu générer une réponse.'
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Erreur Gemini API: ${error.message}`);
    }
  }

  // DPIA specific response generation using custom prompts with automated context extraction
  async generateDpiaResponse(customPrompt: string, context: AIContext, ragDocuments: string[] = []): Promise<{ response: string }> {
    try {
      const client = await this.getClient();
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Use the context extractor to format comprehensive context
      const contextString = contextExtractor.formatContextForAI(context);

      // Add RAG documents if available
      const ragContext = ragDocuments && ragDocuments.length > 0 
        ? `\n\nDOCUMENTS DE RÉFÉRENCE CNIL (à prioriser dans votre réponse):\n${ragDocuments.join('\n\n---\n\n')}` 
        : '';

      // Enhanced prompt with intelligent context integration
      const finalPrompt = `${customPrompt}

CONSIGNES IMPORTANTES POUR LA GÉNÉRATION:
- Utilisez OBLIGATOIREMENT les informations réelles fournies dans le contexte ci-dessous
- Remplacez tous les placeholders comme {{treatmentName}}, {{companyName}}, etc. par les vraies données
- Adaptez votre réponse au secteur d'activité spécifique (${context.company.sector})
- Tenez compte du niveau de risque du traitement ${context.currentProcessing?.riskLevel ? `(${context.currentProcessing.riskLevel})` : ''}
- Intégrez les bonnes pratiques sectorielles quand pertinentes
- Considérez le contexte de conformité existant de l'entreprise
- Utilisez les traitements similaires comme référence si approprié

${contextString}${ragContext}

CHAMP À COMPLÉTER: ${context.field}

RÉPONSE ATTENDUE:
Rédigez une réponse précise, personnalisée et professionnelle qui:
1. Utilise exclusivement les données réelles fournies
2. S'adapte au contexte sectoriel et aux risques identifiés
3. Propose des éléments concrets et actionnables
4. Respecte la méthodologie CNIL pour les AIPD`;

      console.log("[DPIA AI] Using automated context extraction for field:", context.field);
      console.log("[DPIA AI] Custom prompt length:", customPrompt.length, "chars");
      console.log("[DPIA AI] Processing:", context.currentProcessing?.name || 'None');
      console.log("[DPIA AI] Industry context:", context.industryContext ? 'Available' : 'Generic');
      console.log("[DPIA AI] Related records:", context.relatedProcessingRecords.length);

      const response = await model.generateContent(finalPrompt);

      return {
        response: response.response.text() || "Impossible de générer une réponse pour ce champ."
      };
    } catch (error: any) {
      console.error('Gemini DPIA response error:', error);
      throw new Error(`Erreur lors de la génération: ${error.message}`);
    }
  }

  async generateRiskAnalysis(
    riskCategory: string,
    section: string,
    promptTemplate: string,
    company: any,
    processingRecord: any,
    ragDocuments?: string[]
  ): Promise<{ analysis: string }> {
    const client = await this.getClient();

    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const contextInfo = `
Entreprise: ${company.name} (${company.sector || 'Non spécifié'})
Traitement analysé: ${processingRecord?.name || 'Non spécifié'}
Finalité: ${processingRecord?.purpose || 'Non spécifiée'}
Catégorie de risque: ${riskCategory}
Section d'analyse: ${section}
`;

      const ragContext = ragDocuments && ragDocuments.length > 0 
        ? `\n\nDocuments de référence CNIL:\n${ragDocuments.join('\n\n---\n\n')}` 
        : '';

      const fullPrompt = `${promptTemplate}

${contextInfo}
${ragContext}

Répondez de manière structurée et professionnelle en français. Concentrez-vous spécifiquement sur ${section} pour le risque "${riskCategory}".`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      let text = response.text();

      // Clean response by removing markdown formatting
      text = text
        .replace(/\*\*(.*?)\*\*/g, '$1') 
        .replace(/###\s*(.*?)$/gm, '$1')
        .replace(/##\s*(.*?)$/gm, '$1')
        .replace(/^\*\s+/gm, '• ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');

      return {
        analysis: text || 'Impossible de générer une analyse pour cette section.'
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Erreur Gemini API: ${error.message}`);
    }
  }

  async generateStructuredResponse(prompt: string, schema: any, context?: any, ragDocuments?: string[]): Promise<any> {
    const client = await this.getClient();

    try {
      const activeLlmConfig = await storage.getActiveLlmConfiguration();

      // For breach analysis, use higher token limit to handle comprehensive data
      const isBreachAnalysis = prompt.includes('violation') || prompt.includes('breach') || 
                              (context && (context.description || context.comprehensiveData));
      const maxTokens = isBreachAnalysis ? 8192 : (activeLlmConfig?.maxTokens || 3000);

      const model = client.getGenerativeModel({ 
        model: activeLlmConfig?.modelName || 'gemini-2.5-flash',
        generationConfig: {
          temperature: typeof activeLlmConfig?.temperature === 'string' ? parseFloat(activeLlmConfig.temperature) : activeLlmConfig?.temperature || 0.3,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
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

      console.log(`[LLM] Using model: ${activeLlmConfig?.modelName || 'gemini-2.5-flash'}`);
      console.log('[LLM] Sending prompt for breach analysis...');
      console.log('[LLM] Prompt length:', fullPrompt.length, 'characters');
      console.log('[LLM] Model configuration:', {
        model: activeLlmConfig?.modelName || 'gemini-2.5-flash',
        temperature: activeLlmConfig?.temperature || 0.3,
        maxTokens: maxTokens,
        isBreachAnalysis: isBreachAnalysis
      });

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;

      // Check if the response object exists
      if (!response) {
        console.error('[LLM] No response object received from Gemini');
        throw new Error('Aucune réponse reçue du service IA');
      }

      // Check for blocked content or safety issues
      if (response.promptFeedback?.blockReason) {
        console.error('[LLM] Content blocked by Gemini:', response.promptFeedback.blockReason);
        throw new Error('Contenu bloqué par le service IA pour des raisons de sécurité');
      }

      // Check if candidates exist
      if (!response.candidates || response.candidates.length === 0) {
        console.error('[LLM] No candidates in response:', response);
        throw new Error('Aucune réponse générée par le service IA');
      }

      // Check candidate finish reason
      const candidate = response.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.error('[LLM] Generation stopped unexpectedly:', candidate.finishReason);
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Génération arrêtée pour des raisons de sécurité');
        } else if (candidate.finishReason === 'MAX_TOKENS') {
          throw new Error('Réponse tronquée - limite de tokens atteinte');
        }
      }

      const text = response.text();
      console.log('[LLM] Raw response received:', text ? text.substring(0, 200) + '...' : 'EMPTY RESPONSE');
      console.log('[LLM] Response length:', text ? text.length : 0, 'characters');

      // Check if response is empty or too short
      if (!text || text.trim().length < 10) {
        console.error('[LLM] Empty or too short response:', text);
        console.error('[LLM] Full response object:', JSON.stringify(response, null, 2));
        throw new Error('Réponse IA vide ou trop courte');
      }

      try {
        const cleanText = text.trim();
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error('[LLM] JSON parse error:', parseError);
        console.error('[LLM] Raw response:', text);

        // Attempt to extract JSON from markdown code blocks
        let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          // Try to find any JSON-like structure
          jsonMatch = text.match(/\{[\s\S]*\}/);
        }

        if (jsonMatch) {
          try {
            const extractedJson = jsonMatch[1] || jsonMatch[0];
            console.log('[LLM] Attempting to parse extracted JSON:', extractedJson.substring(0, 200));
            return JSON.parse(extractedJson.trim());
          } catch (secondParseError) {
            console.error('[LLM] Second parse attempt failed:', secondParseError);
          }
        }

        // Return fallback response for breach analysis
        if (prompt.includes('violation') || prompt.includes('breach')) {
          console.log('[LLM] Returning fallback response for breach analysis');
          return {
            notificationRequired: false,
            dataSubjectNotificationRequired: false,
            justification: "Erreur lors de l'analyse automatique. Une évaluation manuelle est recommandée selon les critères CNIL.",
            riskLevel: "moyen",
            recommendations: [
              "Effectuer une analyse manuelle complète",
              "Consulter un expert RGPD ou DPO",
              "Vérifier les critères de notification selon l'article 33 du RGPD"
            ]
          };
        }

        throw new Error('Impossible de parser la réponse JSON');
      }
    } catch (error: any) {
      console.error('[LLM] Gemini API error:', error);

      // For breach analysis, provide a meaningful fallback
      if (prompt.includes('violation') || prompt.includes('breach')) {
        console.log('[LLM] API error - returning fallback response for breach analysis');
        return {
          notificationRequired: false,
          dataSubjectNotificationRequired: false,
          justification: `Erreur technique lors de l'analyse: ${error.message}. Une évaluation manuelle est requise.`,
          riskLevel: "moyen",
          recommendations: [
            "Effectuer une analyse manuelle selon les lignes directrices CNIL",
            "Vérifier si les critères de l'article 33 RGPD sont remplis",
            "Consulter un expert en protection des données"
          ]
        };
      }

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
      overallRiskScore: 0,
      summary: "string"
    };

    return await this.generateStructuredResponse(prompt, schema, { diagnosticData, companyInfo }, ragDocuments);
  }

  async getChatbotResponse(message: string, context?: any, ragDocuments?: string[]): Promise<{ response: string }> {
    // Récupérer le prompt actif pour le chatbot
    const activePrompt = await storage.getActivePromptByCategory('chatbot');

    // Charger les documents spécifiquement associés au chatbot
    if (!ragDocuments) {
      ragDocuments = await this.loadRagDocuments('chatbot');
    }

    let basePrompt;
    if (activePrompt?.prompt && activePrompt.prompt.trim().length > 10) {
      basePrompt = activePrompt.prompt;
      console.log(`[CHATBOT] Using custom prompt: ${activePrompt.name}`);
    } else {
      basePrompt = `Vous êtes "l'Assistant Conformité RGPD", un expert IA intégré à notre solution SaaS. Votre mission est d'aider les dirigeants et employés de TPE et PME françaises à comprendre et à mettre en œuvre le RGPD de manière simple et pratique.

**VOTRE RÔLE :**
- Répondre aux questions sur le RGPD de manière claire, concise et pratique
- Donner des conseils concrets adaptés aux ressources limitées des VSE/PME
- Utiliser un langage accessible, éviter le jargon juridique complexe
- Être professionnel mais bienveillant dans vos réponses
- Structurer vos réponses avec des paragraphes courts et aérés

**LIMITES IMPORTANTES :**
Vous n'êtes PAS un avocat. Vous ne fournissez JAMAIS, sous aucun prétexte, de conseil juridique. Vos réponses sont informatives et éducatives uniquement.

**GESTION DES QUESTIONS JURIDIQUES SPÉCIFIQUES :**
Face à une question qui demande :
- Une validation juridique
- Une analyse de risque spécifique  
- Une interprétation de la loi pour un cas particulier
- Des questions du type : "Est-ce que je risque une amende si...?", "Mon cas est-il conforme?", "Suis-je en règle?", "Que dit la loi dans mon cas?"

Vous devez IMPÉRATIVEMENT :
1. Expliquer la règle générale applicable
2. Puis inclure cette phrase exacte : "Pour une analyse validée de votre situation spécifique, il est essentiel de consulter un avocat ou un conseil spécialisé."

**CONTEXTE VSE/PME FRANÇAIS :**
- Ressources humaines et financières limitées
- Besoin de solutions pratiques et économiques
- Conformité à la réglementation française (RGPD + Loi Informatique et Libertés)
- Secteurs d'activité variés avec spécificités propres

**FORMAT DE RÉPONSE :**
- Paragraphes courts et aérés
- Points clés en début de réponse si pertinent
- Exemples concrets quand possible
- Étapes d'action claires et réalisables
- Saut de ligne entre les sections pour la lisibilité

Question de l'utilisateur : {{message}}

Répondez de manière complète et utile à cette question en respectant tous les critères ci-dessus.`;
      console.log(`[CHATBOT] Using enhanced default prompt with legal disclaimers`);
    }

    // Construire le prompt final avec la question de l'utilisateur
    const finalPrompt = basePrompt.includes('{{message}}') 
      ? basePrompt.replace(/\{\{message\}\}/g, message)
      : `${basePrompt}\n\nQuestion de l'utilisateur: ${message}`;

    console.log(`[CHATBOT] Final prompt length: ${finalPrompt.length} chars`);

    return await this.generateResponse(finalPrompt, context, ragDocuments);
  }

  async generatePrivacyPolicy(company: any, processingRecords: any[]): Promise<{ content: string }> {
    const client = await this.getClient();

    try {
      // Récupérer le prompt actif pour la génération de politique de confidentialité
      const prompts = await storage.getAiPrompts();
      const activePrompt = prompts.find(p => p.name === 'Génération Politique Confidentialité' && p.isActive);

      const model = client.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 16384,
          temperature: 0.3,
        }
      });

      const ragDocuments = await this.loadRagDocuments('Génération Politique Confidentialité');
      const ragContext = ragDocuments && ragDocuments.length > 0 
        ? `\n\nDocuments de référence CNIL:\n${ragDocuments.join('\n\n---\n\n')}` 
        : '';

      // Construire les informations de contexte
      const companyInfo = `
ENTREPRISE:
- Nom: ${company.name}
- Secteur: ${company.sector || 'Non spécifié'}
- Taille: ${company.size || 'Non spécifiée'}
- Adresse: ${company.address || 'Non spécifiée'}

TRAITEMENTS DE DONNÉES:
${processingRecords.map((record: any) => `
• ${record.name}
  Finalité: ${record.purpose}
  Base légale: ${record.legalBasis}
  Données: ${Array.isArray(record.dataCategories) ? record.dataCategories.join(', ') : 'Non spécifiées'}
  Destinataires: ${Array.isArray(record.recipients) ? record.recipients.join(', ') : 'Non spécifiés'}
`).join('')}
`;

      // Utiliser le prompt configuré ou un prompt par défaut
      const prompt = activePrompt?.prompt || `
Générez une politique de confidentialité complète et conforme au RGPD pour l'entreprise {{company}}.

{{processingRecords}}

{{ragContext}}

La politique doit inclure toutes les sections obligatoires selon la CNIL et être rédigée en français.
`;

      // Construire le prompt final avec les variables de template
      const finalPrompt = prompt
        .replace(/{{company}}/g, company.name)
        .replace(/{{processingRecords}}/g, companyInfo)
        .replace(/{{ragContext}}/g, ragContext);

      console.log('Génération de la politique de confidentialité avec Gemini...');

      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      let cleanResponse = response.text()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')  
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^\*\s+/gm, '• ')
        .replace(/^\-\s+/gm, '• ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Vérifier la longueur et regénérer si nécessaire
      if (cleanResponse.length < 2000) {
        console.log('Politique trop courte, régénération...');

        const detailedPrompt = `${prompt}\n\nIMPORTANT: La politique précédente était trop courte. Générez une version COMPLÈTE et DÉTAILLÉE d'au moins 3000 mots avec tous les détails juridiques et pratiques nécessaires.`;

        const retryResult = await model.generateContent(detailedPrompt);
        const retryResponse = await retryResult.response;
        const retryText = retryResponse.text();

        if (retryText && retryText.length > cleanResponse.length) {
          cleanResponse = retryText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')  
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^\*\s+/gm, '• ')
            .replace(/^\-\s+/gm, '• ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }
      }

      return { content: cleanResponse };
    } catch (error) {
      console.error('Error generating privacy policy:', error);
      throw new Error('Erreur lors de la génération de la politique de confidentialité');
    }
  }
}

export const geminiService = new GeminiService();