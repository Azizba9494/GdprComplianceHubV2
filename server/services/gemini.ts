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
    const model = client.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 24576,
        temperature: 0.7,
      }
    });
    
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

  async generateResponse(prompt: string, context?: any, ragDocuments?: string[], options?: { temperature?: number }): Promise<{ response: string }> {
    const client = await this.getClient();
    
    try {
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 24576,
          temperature: options?.temperature !== undefined ? options.temperature : 0.7,
        }
      });
      
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
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 24576,
          temperature: 0.7,
        }
      });

      // Use the context extractor to format comprehensive context
      const contextString = contextExtractor.formatContextForAI(context);

      // Add RAG documents if available
      const ragContext = ragDocuments && ragDocuments.length > 0 
        ? `\n\nDOCUMENTS DE RÉFÉRENCE CNIL (à prioriser dans votre réponse):\n${ragDocuments.join('\n\n---\n\n')}` 
        : '';

      // Replace template variables with actual data
      let processedPrompt = customPrompt;
      
      // Replace common template variables
      if (context.currentProcessing) {
        const dataCategories = Array.isArray(context.currentProcessing.dataCategories) 
          ? context.currentProcessing.dataCategories.join(', ') 
          : context.currentProcessing.dataCategories || 'Non spécifiées';
        
        processedPrompt = processedPrompt
          .replace(/\{\{treatmentName\}\}/g, context.currentProcessing.name || '')
          .replace(/\{\{processingName\}\}/g, context.currentProcessing.name || '')
          .replace(/\{\{dataCategories\}\}/g, dataCategories)
          .replace(/\{\{dataSubjects\}\}/g, context.currentProcessing.recipients ? context.currentProcessing.recipients.join(', ') : 'Non spécifiées')
          .replace(/\{\{purpose\}\}/g, context.currentProcessing.purpose || 'Non spécifiée')
          .replace(/\{\{legalBasis\}\}/g, context.currentProcessing.legalBasis || 'Non spécifiée');
      }
      
      if (context.company) {
        processedPrompt = processedPrompt
          .replace(/\{\{companyName\}\}/g, context.company.name || '')
          .replace(/\{\{sector\}\}/g, context.company.sector || 'Non spécifié')
          .replace(/\{\{companySize\}\}/g, context.company.size || 'Non spécifiée');
      }

      // Enhanced prompt with intelligent context integration
      const finalPrompt = `${processedPrompt}

CONSIGNES IMPORTANTES POUR LA GÉNÉRATION:
- RESPECTEZ STRICTEMENT la structure demandée dans le prompt avec les points a), b), c) pour chaque catégorie d'impact
- Utilisez OBLIGATOIREMENT les informations réelles fournies dans le contexte ci-dessous
- Pour chaque catégorie d'impact, structurez votre réponse EXACTEMENT comme demandé : a) Justification, b) Exemple, c) Qualification CNIL
- Adaptez votre réponse au secteur d'activité spécifique (${context.company.sector})
- Tenez compte du niveau de risque du traitement ${context.currentProcessing?.riskLevel ? `(${context.currentProcessing.riskLevel})` : ''}
- Intégrez les bonnes pratiques sectorielles quand pertinentes
- Considérez le contexte de conformité existant de l'entreprise
- Utilisez les traitements similaires comme référence si approprié

${contextString}${ragContext}

RÈGLES DE GÉNÉRATION CRITIQUES:
- Ne JAMAIS commencer votre réponse par des termes techniques comme "${context.field}" ou tout autre nom de champ
- Commencez DIRECTEMENT par le contenu demandé sans préfixe technique
- Votre réponse doit être du français professionnel adapté à un DPO
- N'incluez AUCUN nom de variable, champ ou terme technique anglais dans votre réponse

RÉPONSE ATTENDUE:
Rédigez une réponse précise, personnalisée et professionnelle qui:
1. RESPECTE EXACTEMENT la structure et le format demandés dans le prompt original
2. Utilise exclusivement les données réelles fournies
3. S'adapte au contexte sectoriel et aux risques identifiés
4. Propose des éléments concrets et actionnables
5. Respecte la méthodologie CNIL pour les AIPD`;
      
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
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 24576,
          temperature: 0.3,
        }
      });

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
      
      // For breach analysis and DPIA analysis, use higher token limit to handle comprehensive data
      const isBreachAnalysis = prompt.includes('violation') || prompt.includes('breach') || 
                              (context && (context.description || context.comprehensiveData));
      const isDpiaAnalysis = prompt.includes('AIPD') || prompt.includes('DPIA') || prompt.includes('impacts') ||
                            prompt.includes('risque') || prompt.includes('mesures') || prompt.includes('sécurité') ||
                            prompt.includes('modification') || prompt.includes('disparition') || prompt.includes('accès') ||
                            prompt.includes('menaces') || prompt.includes('sources') || prompt.includes('potentiels') ||
                            prompt.includes('évaluation') || prompt.includes('analyse');
      const maxTokens = (isBreachAnalysis || isDpiaAnalysis) ? 24576 : (activeLlmConfig?.maxTokens || 4000);
      
      const model = client.getGenerativeModel({ 
        model: activeLlmConfig?.modelName || 'gemini-2.5-flash',
        generationConfig: {
          temperature: activeLlmConfig?.temperature || 0.3,
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
      overallRiskScore: "number (0-100)",
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
  Conservation: ${record.retention || 'Non spécifiée'}
`).join('')}`;

      let prompt;
      
      if (activePrompt?.prompt && activePrompt.prompt.trim().length > 10) {
        // Utiliser le prompt configuré et remplacer les variables et placeholders
        // Ajouter des instructions spécifiques à l'IA avant le prompt principal
        const aiInstructions = `INSTRUCTIONS IMPORTANTES POUR LA GÉNÉRATION:
- Utilisez EXCLUSIVEMENT les informations réelles de l'entreprise fournies ci-dessous
- Remplacez TOUS les placeholders [INDIQUER...] par les vraies données de l'entreprise
- Ne laissez aucun placeholder non rempli dans la politique finale
- Adaptez le contenu au secteur d'activité spécifique de l'entreprise
- Utilisez les vrais traitements de données listés ci-dessous

DONNÉES DE L'ENTREPRISE:
${companyInfo}

MAINTENANT, générez la politique de confidentialité en suivant le template ci-dessous:

`;

        prompt = aiInstructions + activePrompt.prompt
          // Variables avec syntaxe {{}}
          .replace(/\{\{company\}\}/g, companyInfo)
          .replace(/\{\{processingRecords\}\}/g, JSON.stringify(processingRecords))
          .replace(/\{\{ragContext\}\}/g, ragContext)
          // Variables avec syntaxe ${} - remplacer par les données réelles
          .replace(/\$\{company\.name\}/g, company.name || 'Entreprise')
          .replace(/\$\{company\.sector\}/g, company.sector || 'Non spécifié')
          .replace(/\$\{company\.size\}/g, company.size || 'Non spécifiée')
          .replace(/\$\{company\.address\}/g, company.address || 'Non spécifiée')
          .replace(/\$\{company\.email\}/g, company.email || 'contact@entreprise.fr')
          .replace(/\$\{company\.phone\}/g, company.phone || 'Non spécifié')
          .replace(/\$\{company\.website\}/g, company.website || 'Non spécifié')
          // Variables pour les traitements
          .replace(/\$\{processingRecords\}/g, JSON.stringify(processingRecords))
          .replace(/\$\{ragContext\}/g, ragContext)
          // Remplacer les placeholders textuels par les vraies données
          .replace(/\[INDIQUER LE SECTEUR D'ACTIVITÉ DE L'ENTREPRISE\]/g, company.sector || 'Non spécifié')
          .replace(/\[INDIQUER LA TAILLE\/CATÉGORIE DE L'ENTREPRISE\]/g, company.size || 'Non spécifiée')
          .replace(/\[INDIQUER L'ADRESSE COMPLÈTE DU SIÈGE SOCIAL\]/g, company.address || 'Non spécifiée')
          .replace(/\[INDIQUER L'EMAIL DE CONTACT DE L'ENTREPRISE\]/g, company.email || 'contact@entreprise.fr')
          .replace(/\[INDIQUER LE NOM DE L'ENTREPRISE\]/g, company.name || 'Entreprise');
        
        console.log(`[PRIVACY POLICY] Using configured prompt: ${activePrompt.name}`);
        console.log(`[PRIVACY POLICY] Company data: ${company.name}, ${company.sector}`);
      } else {
        // Utiliser le prompt par défaut
        prompt = `Vous êtes un expert juridique en protection des données. Générez une politique de confidentialité COMPLÈTE et DÉTAILLÉE conforme au RGPD pour l'entreprise suivante.

${companyInfo}${ragContext}

INSTRUCTIONS IMPORTANTES:
- Générez une politique d'au moins 3000 mots
- Incluez TOUTES les sections obligatoires du RGPD
- Adaptez le contenu aux traitements réels de l'entreprise
- Utilisez un langage clair et accessible
- Donnez des exemples concrets

STRUCTURE OBLIGATOIRE:

# POLITIQUE DE CONFIDENTIALITÉ

## 1. IDENTITÉ DU RESPONSABLE DE TRAITEMENT
[Détails complets avec coordonnées, représentant légal, etc.]

## 2. DONNÉES PERSONNELLES COLLECTÉES
[Liste détaillée par traitement avec exemples]

## 3. FINALITÉS ET BASES LÉGALES
[Pour chaque traitement, expliquer la finalité et la base légale RGPD]

## 4. DESTINATAIRES ET TRANSFERTS
[Qui peut accéder aux données, dans quelles conditions]

## 5. DURÉES DE CONSERVATION
[Périodes précises par type de données]

## 6. VOS DROITS RGPD
[Explication détaillée de chaque droit avec modalités d'exercice]

## 7. SÉCURITÉ DES DONNÉES
[Mesures techniques et organisationnelles]

## 8. COOKIES ET TRACEURS
[Si applicable selon l'activité]

## 9. MODIFICATIONS
[Comment les changements sont communiqués]

## 10. CONTACT
[DPO ou référent protection des données]

Développez chaque section en détail avec des informations pratiques et juridiquement exactes.`;
        
        console.log(`[PRIVACY POLICY] Using default prompt (no configured prompt found)`);
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Améliorer le nettoyage du texte sans supprimer les titres de sections
      let cleanResponse = text
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

      return {
        content: cleanResponse || 'Erreur lors de la génération de la politique de confidentialité.'
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Gérer les erreurs de surcharge avec un message plus informatif
      if (error.status === 503 || error.message.includes('overloaded')) {
        throw new Error('Le service de génération est temporairement surchargé. Veuillez réessayer dans quelques minutes.');
      }
      
      // Gérer les erreurs de quota
      if (error.status === 429 || error.message.includes('quota')) {
        throw new Error('Limite de quota atteinte. Veuillez réessayer plus tard.');
      }
      
      // Autres erreurs API
      throw new Error(`Service de génération indisponible: ${error.message}`);
    }
  }

  // Version originale conservée pour compatibilité
  async generatePrivacyPolicyOriginal(company: any, processingRecords: any[]): Promise<{ content: string }> {
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

  async analyzeDataBreach(breachData: any, ragDocuments: string[] = []): Promise<{
    notificationRequired: boolean;
    dataSubjectNotificationRequired: boolean;
    justification: string;
    riskLevel: string;
    recommendations: string[];
  }> {
    try {
      // Get the configured prompt for breach analysis
      const breachAnalysisPrompt = await storage.getAiPromptByName('Analyse Violation Données');
      
      if (!breachAnalysisPrompt || !breachAnalysisPrompt.prompt || !breachAnalysisPrompt.isActive) {
        console.error('[BREACH] Prompt "Analyse Violation Données" not found or inactive in database');
        return this.getDefaultBreachAnalysis(breachData);
      }

      console.log('[BREACH] Using configured prompt:', breachAnalysisPrompt.name);
      
      // Load documents specifically associated with this prompt
      const specificRagDocuments = await this.loadRagDocuments('Analyse Violation Données');
      console.log(`[BREACH] Found ${specificRagDocuments.length} documents specifically for breach analysis prompt`);

      // Prepare breach data for the prompt
      const breachDataString = JSON.stringify(breachData, null, 2);
      console.log('[BREACH] Breach data length:', breachDataString.length, 'characters');

      // Replace placeholder with actual breach data
      let prompt = breachAnalysisPrompt.prompt.replace('{breach_data}', breachDataString);
      
      // Fallback if no placeholder found - append data to prompt
      if (!breachAnalysisPrompt.prompt.includes('{breach_data}')) {
        prompt = `${breachAnalysisPrompt.prompt}\n\nDonnées de la violation à analyser:\n${breachDataString}`;
      }

      console.log('[BREACH] Final prompt length:', prompt.length, 'characters');

      const schema = {
        notificationRequired: "boolean",
        dataSubjectNotificationRequired: "boolean", 
        justification: "string",
        riskLevel: "string (faible|moyen|élevé|critique)",
        recommendations: ["string"]
      };

      console.log('[BREACH] Starting AI analysis with specific prompt documents...');
      return await this.generateStructuredResponse(prompt, schema, breachData, specificRagDocuments);
      
    } catch (error: any) {
      console.error('[BREACH] AI analysis failed:', error.message);
      console.log('[BREACH] Returning default analysis due to error');
      return this.getDefaultBreachAnalysis(breachData);
    }
  }

  private getDefaultBreachAnalysis(breachData: any): {
    notificationRequired: boolean;
    dataSubjectNotificationRequired: boolean;
    justification: string;
    riskLevel: string;
    recommendations: string[];
  } {
    console.log('[BREACH] Using fallback analysis for breach data:', breachData.description);
    
    // Analyze comprehensive data if available
    let comprehensiveData: any = {};
    try {
      if (breachData.comprehensiveData) {
        comprehensiveData = JSON.parse(breachData.comprehensiveData);
      }
    } catch (error) {
      console.log('[BREACH] Could not parse comprehensive data');
    }

    const hasDataCategories = (breachData.dataCategories && breachData.dataCategories.length > 0) || 
                             (comprehensiveData.dataCategories && comprehensiveData.dataCategories.length > 0);
    const hasAffectedPersons = (breachData.affectedPersons && breachData.affectedPersons > 0) ||
                              (comprehensiveData.affectedPersonsCount && parseInt(comprehensiveData.affectedPersonsCount) > 0);
    const hasSensitiveData = comprehensiveData.dataCategories?.some((cat: string) => 
      cat.includes('sensible') || cat.includes('santé') || cat.includes('judiciaire'));
    
    // Enhanced risk assessment based on EDPB guidelines
    let riskLevel = "faible";
    let notificationRequired = false;
    let dataSubjectNotificationRequired = false;
    
    // Risk factors analysis
    if (hasSensitiveData) {
      riskLevel = "élevé";
      notificationRequired = true;
      dataSubjectNotificationRequired = true;
    } else if (hasAffectedPersons && parseInt(comprehensiveData.affectedPersonsCount || breachData.affectedPersons) > 100) {
      riskLevel = "élevé";
      notificationRequired = true;
      dataSubjectNotificationRequired = true;
    } else if (hasDataCategories || hasAffectedPersons) {
      riskLevel = "moyen";
      notificationRequired = true;
    }
    
    return {
      notificationRequired,
      dataSubjectNotificationRequired,
      justification: `Analyse de fallback basée sur les critères RGPD disponibles : ${breachData.description || 'Violation de données personnelles'}. ${hasSensitiveData ? 'Données sensibles détectées. ' : ''}${hasDataCategories ? 'Catégories de données identifiées. ' : ''}${hasAffectedPersons ? `${comprehensiveData.affectedPersonsCount || breachData.affectedPersons} personnes potentiellement affectées. ` : ''}Niveau de risque évalué à ${riskLevel}. Une analyse détaillée par un expert est recommandée.`,
      riskLevel,
      recommendations: [
        "Effectuer une analyse manuelle détaillée selon les lignes directrices EDPB",
        "Documenter précisément la nature et l'étendue de la violation", 
        "Évaluer les risques pour les droits et libertés des personnes concernées",
        "Mettre en place des mesures correctives immédiates",
        notificationRequired ? "Préparer la notification à la CNIL dans les 72h" : "Surveiller les conséquences potentielles",
        dataSubjectNotificationRequired ? "Informer les personnes concernées sans délai" : "Évaluer la nécessité d'informer les personnes concernées",
        "Consulter un expert DPO ou juridique pour validation"
      ]
    };
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