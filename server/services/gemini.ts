import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';
import { contextExtractor, type AIContext } from './contextExtractor';

export class GeminiService {
  constructor() {}

  private async loadRagDocuments(): Promise<string[]> {
    try {
      // Cette méthode charge les documents RAG depuis la base de données
      const ragDocuments: string[] = [];
      
      // Get all active prompts
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

  // AI-assisted DPIA questionnaire responses
  async generateDpiaResponse(
    questionField: string, 
    companyInfo: any, 
    existingDpiaData: any, 
    processingRecords: any[], 
    ragDocuments?: string[]
  ): Promise<{ response: string }> {
    // Find the specific processing record for this DPIA
    const specificProcessingRecord = processingRecords.find(r => r.id === existingDpiaData?.processingRecordId);
    
    // Context analysis focused on the specific treatment
    const companyContext = `
Profil de l'entreprise:
- Nom: ${companyInfo.name}
- Secteur: ${companyInfo.sector || 'Non spécifié'}  
- Taille: ${companyInfo.size || 'Non spécifiée'}

TRAITEMENT ANALYSÉ DANS CETTE AIPD:
${specificProcessingRecord ? `
- Nom: ${specificProcessingRecord.name}
- Finalité: ${specificProcessingRecord.purpose}
- Base légale: ${specificProcessingRecord.legalBasis || 'Non spécifiée'}
- Catégories de données: ${specificProcessingRecord.dataCategories || 'Non spécifiées'}
- Personnes concernées: ${specificProcessingRecord.dataSubjects || 'Non spécifiées'}
- Durée de conservation: ${specificProcessingRecord.retentionPeriod || 'Non spécifiée'}
` : 'Aucun traitement spécifique identifié'}

IMPORTANT: Cette AIPD concerne UNIQUEMENT le traitement "${specificProcessingRecord?.name || 'en cours d\'analyse'}", pas l'ensemble des activités de l'entreprise.
`;

    // Knowledge base from RAG documents
    const knowledgeBase = ragDocuments && ragDocuments.length > 0 ? 
      `\n\nDocuments de référence CNIL à prioriser:\n${ragDocuments.join('\n\n---\n\n')}` : '';

    let specificPrompt = '';
    
    switch (questionField) {
      case 'generalDescription':
        specificPrompt = `En tant qu'expert DPIA, rédigez une description générale UNIQUEMENT pour le traitement "${specificProcessingRecord?.name}" en cours d'analyse.

ATTENTION: Ne mentionnez pas l'ensemble des traitements de l'entreprise. Concentrez-vous exclusivement sur ce traitement spécifique.

Incluez pour ce traitement uniquement:
- Nature précise du traitement analysé
- Portée spécifique (qui est concerné par ce traitement particulier)
- Contexte et objectifs de ce traitement

Commencez par: "Le traitement '${specificProcessingRecord?.name}' consiste en..."`;
        break;

      case 'processingPurposes':
        specificPrompt = `Définissez les finalités précises de ce traitement AIPD selon les exigences RGPD.
        
Les finalités doivent être déterminées, explicites et légitimes. Distinguez:
- Finalité principale (objectif principal du traitement)
- Finalités secondaires éventuelles (statistiques, amélioration du service)

Basez-vous sur le secteur d'activité "${companyInfo.sector}" pour proposer des finalités cohérentes.`;
        break;

      case 'dataProcessors':
        specificPrompt = `Identifiez les sous-traitants potentiels pour ce type de traitement.
        
D'après vos informations, votre entreprise utilise déjà plusieurs prestataires. Analysez lesquels pourraient être impliqués dans ce nouveau traitement et rappellez les obligations contractuelles RGPD.

Structure attendue: Pour chaque sous-traitant, précisez son rôle et rappelez la nécessité d'un contrat de sous-traitance conforme à l'article 28 du RGPD.`;
        break;

      case 'dataMinimization':
        specificPrompt = `Analysez la minimisation des données pour ce traitement selon l'article 5.1.c du RGPD.
        
Pour chaque catégorie de données collectées, justifiez en quoi elle est "adéquate, pertinente et limitée à ce qui est nécessaire".
Proposez des alternatives si certaines données semblent excessives.

Exemple: "Pour la finalité de livraison, l'adresse complète est nécessaire, mais le numéro de téléphone fixe pourrait être optionnel si le mobile est fourni."`;
        break;

      case 'retentionJustification':
        specificPrompt = `Justifiez les durées de conservation selon les obligations légales du secteur "${companyInfo.sector}".
        
Référez-vous aux délais légaux applicables et proposez des durées différenciées selon:
- La phase active du traitement
- L'archivage intermédiaire (si applicable)
- Les obligations légales de conservation

Mentionnez les processus de suppression/archivage à mettre en place.`;
        break;

      case 'rightsInformation':
        specificPrompt = `Décrivez les modalités d'information des personnes concernées selon les articles 13-14 du RGPD.
        
Précisez:
- Les supports d'information (formulaires, site web, affichage)
- Le moment de l'information (collecte directe/indirecte)
- Le contenu obligatoire (responsable, finalités, droits, etc.)
- L'adaptation au public cible`;
        break;

      case 'securityMeasures':
        specificPrompt = `Listez les mesures de sécurité techniques et organisationnelles selon l'article 32 du RGPD.
        
Structurez par catégories:
- Contrôle d'accès (authentification, habilitations)
- Chiffrement (stockage, transit)  
- Traçabilité et logging
- Sauvegardes et continuité
- Sécurité physique
- Formation du personnel
- Gestion des incidents

Adaptez au niveau de risque et aux moyens d'une ${companyInfo.size || 'PME'}.`;
        break;

      case 'dpoAdvice':
        specificPrompt = `Rédigez l'avis du Délégué à la Protection des Données sur cette AIPD.
        
L'avis doit porter sur:
- La méthodologie utilisée
- La complétude de l'analyse
- La pertinence des mesures proposées
- Les points d'attention particuliers
- Les recommandations d'amélioration

Adoptez un ton professionnel de DPO expérimenté.`;
        break;

      case 'riskScenarios':
        specificPrompt = `Analysez les risques pour les droits et libertés des personnes selon la méthodologie CNIL pour le traitement "${specificProcessingRecord?.name}".

Évaluez les 3 scénarios de risque fondamentaux:

1. ACCÈS ILLÉGITIME AUX DONNÉES
- Impacts potentiels sur les personnes concernées
- Menaces identifiées (piratage, vol, indiscrétion, etc.)
- Sources de risque (humaines, techniques, organisationnelles)
- Mesures existantes ou prévues

2. MODIFICATION NON DÉSIRÉE DES DONNÉES
- Impacts sur les personnes (erreurs, décisions erronées, etc.)
- Menaces (erreurs humaines, bugs, malveillance, etc.)
- Sources de risque spécifiques à l'intégrité
- Mesures de protection

3. DISPARITION DES DONNÉES
- Conséquences pour les personnes concernées
- Menaces (pannes, suppressions, catastrophes, etc.)
- Sources de risque pour la disponibilité
- Mesures de sauvegarde et continuité

Pour chaque scénario, proposez une évaluation sur l'échelle CNIL: négligeable, limitée, importante, maximale.

Répondez en format structuré avec des sections claires pour chaque scénario.`;
        break;

      default:
        specificPrompt = `Analysez le champ "${questionField}" UNIQUEMENT pour le traitement "${specificProcessingRecord?.name}" en cours d'analyse.

IMPORTANT: Cette analyse concerne exclusivement ce traitement spécifique, pas l'ensemble des activités de l'entreprise.

Fournissez une réponse adaptée dans le contexte d'une AIPD RGPD pour ce traitement particulier.`;
    }

    const fullPrompt = `${companyContext}${specificPrompt}${knowledgeBase}

Répondez de manière professionnelle, précise et directement applicable. Citez les articles RGPD pertinents quand approprié.`;

    const client = await this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const response = await model.generateContent(fullPrompt);
    return { response: response.response.text() || "" };
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
      const model = client.getGenerativeModel({ 
        model: activeLlmConfig?.modelName || 'gemini-1.5-flash',
        generationConfig: {
          temperature: activeLlmConfig?.temperature || 0.3,
          maxOutputTokens: activeLlmConfig?.maxTokens || 3000,
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

      console.log(`[LLM] Using model: ${activeLlmConfig?.modelName || 'gemini-1.5-flash'}`);
      console.log('[LLM] Sending prompt for breach analysis...');

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('[LLM] Raw response received:', text.substring(0, 200) + '...');

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('[LLM] JSON parse error:', parseError);
        console.error('[LLM] Raw response:', text);
        
        // Attempt to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
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
      const model = client.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 16384, // Augmenté pour éviter la troncature
          temperature: 0.3,
        }
      });

      const ragDocuments = await this.loadRagDocuments();
      const ragContext = ragDocuments && ragDocuments.length > 0 
        ? `\n\nDocuments de référence CNIL:\n${ragDocuments.join('\n\n---\n\n')}` 
        : '';

      const prompt = `Vous êtes un expert juridique en protection des données. Générez une politique de confidentialité COMPLÈTE et DÉTAILLÉE conforme au RGPD pour l'entreprise suivante.

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
`).join('')}

${ragContext}

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
      throw new Error(`Erreur Gemini API: ${error.message}`);
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

  async analyzeDataBreach(breachData: any, ragDocuments?: string[]): Promise<{
    notificationRequired: boolean;
    dataSubjectNotificationRequired: boolean;
    justification: string;
    riskLevel: string;
    recommendations: string[];
  }> {
    // Get the configurable prompt from the database
    const breachAnalysisPrompt = await storage.getAiPromptByName('Analyse Violation Données');
    
    if (!breachAnalysisPrompt || !breachAnalysisPrompt.isActive) {
      throw new Error('Prompt d\'analyse des violations non trouvé ou inactif');
    }

    // Replace placeholder with actual breach data
    const prompt = breachAnalysisPrompt.prompt.replace('{breach_data}', JSON.stringify(breachData, null, 2));

    const schema = {
      notificationRequired: "boolean",
      dataSubjectNotificationRequired: "boolean", 
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