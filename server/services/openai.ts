import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  // Generate diagnostic analysis and action plan
  async generateActionPlan(diagnosticData: any, companyInfo: any): Promise<{
    score: number;
    actions: Array<{
      title: string;
      description: string;
      category: string;
      priority: string;
      dueDate?: string;
    }>;
  }> {
    const prompt = `En tant qu'expert en conformité RGPD, analysez les réponses du diagnostic suivant et générez un plan d'action personnalisé.

Informations de l'entreprise:
- Nom: ${companyInfo.name}
- Secteur: ${companyInfo.sector || 'Non spécifié'}
- Taille: ${companyInfo.size || 'Non spécifiée'}

Réponses au diagnostic:
${JSON.stringify(diagnosticData, null, 2)}

Veuillez fournir une réponse JSON avec:
1. Un score de conformité de 0 à 100
2. Une liste d'actions prioritaires avec titre, description, catégorie (registres, politiques, sécurité, formation), priorité (urgent, important, normal) et échéance suggérée

Format de réponse JSON:
{
  "score": number,
  "actions": [
    {
      "title": "string",
      "description": "string", 
      "category": "string",
      "priority": "string",
      "dueDate": "YYYY-MM-DD"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // Generate processing record template
  async generateProcessingRecord(companyInfo: any, processingType: string, description: string): Promise<{
    name: string;
    purpose: string;
    legalBasis: string;
    dataCategories: string[];
    recipients: string[];
    retention: string;
    securityMeasures: string[];
  }> {
    const prompt = `En tant qu'expert DPO, générez un modèle de registre de traitement RGPD conforme au modèle CNIL.

Informations de l'entreprise:
- Nom: ${companyInfo.name}
- Secteur: ${companyInfo.sector || 'Non spécifié'}

Type de traitement: ${processingType}
Description: ${description}

Générez un registre structuré en JSON avec tous les champs obligatoires selon le RGPD et les recommandations CNIL.

Format JSON requis:
{
  "name": "string",
  "purpose": "string",
  "legalBasis": "string",
  "dataCategories": ["string"],
  "recipients": ["string"],
  "retention": "string",
  "securityMeasures": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // Generate privacy policy
  async generatePrivacyPolicy(companyInfo: any, processingData: any[]): Promise<{ content: string }> {
    const prompt = `En tant qu'expert juridique en protection des données, rédigez une politique de confidentialité complète et conforme au RGPD pour cette entreprise.

Informations de l'entreprise:
- Nom: ${companyInfo.name}
- Secteur: ${companyInfo.sector || 'Non spécifié'}

Traitements de données identifiés:
${JSON.stringify(processingData, null, 2)}

La politique doit être:
- Rédigée en français clair et accessible
- Conforme aux exigences RGPD (articles 13 et 14)
- Adaptée au secteur d'activité de l'entreprise
- Incluant tous les droits des personnes concernées

Répondez en JSON avec le contenu HTML de la politique:
{
  "content": "string (HTML)"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // Analyze data breach
  async analyzeDataBreach(breachData: any): Promise<{
    notificationRequired: boolean;
    justification: string;
    riskLevel: string;
    recommendations: string[];
  }> {
    const prompt = `En tant qu'expert DPO, analysez cette violation de données selon les Lignes directrices 9/2022 de l'EDPB sur la notification des violations de données personnelles.

Données de l'incident:
${JSON.stringify(breachData, null, 2)}

Analysez selon les critères EDPB 9/2022:
1. Nature de la violation
2. Catégories de données concernées
3. Nombre de personnes affectées
4. Conséquences probables
5. Mesures prises

Répondez en JSON:
{
  "notificationRequired": boolean,
  "justification": "string (justification détaillée avec références EDPB)",
  "riskLevel": "string (faible, modéré, élevé)",
  "recommendations": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // DPIA risk assessment
  async assessDpiaRisks(processingDescription: string, companyInfo: any): Promise<{
    risks: Array<{
      threat: string;
      impact: string;
      likelihood: string;
      severity: string;
    }>;
    measures: Array<{
      type: string;
      description: string;
      effectiveness: string;
    }>;
  }> {
    const prompt = `En tant qu'expert en analyse d'impact (DPIA), évaluez les risques de ce traitement selon la méthodologie CNIL.

Description du traitement:
${processingDescription}

Informations de l'entreprise:
- Secteur: ${companyInfo.sector || 'Non spécifié'}
- Taille: ${companyInfo.size || 'Non spécifiée'}

Identifiez:
1. Les menaces potentielles
2. Les impacts sur les droits et libertés
3. La vraisemblance de chaque risque
4. La gravité des conséquences
5. Les mesures techniques et organisationnelles recommandées

Format JSON:
{
  "risks": [
    {
      "threat": "string",
      "impact": "string", 
      "likelihood": "string (faible, modérée, élevée)",
      "severity": "string (négligeable, limitée, importante, maximale)"
    }
  ],
  "measures": [
    {
      "type": "string (technique/organisationnelle)",
      "description": "string",
      "effectiveness": "string"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // AI-assisted DPIA questionnaire responses
  async generateDpiaResponse(
    questionField: string, 
    companyInfo: any, 
    existingDpiaData: any, 
    processingRecords: any[], 
    ragDocuments: string[] = []
  ): Promise<{ response: string }> {
    // Context analysis from company data
    const companyContext = `
Profil de l'entreprise:
- Nom: ${companyInfo.name}
- Secteur: ${companyInfo.sector || 'Non spécifié'}  
- Taille: ${companyInfo.size || 'Non spécifiée'}

Traitements existants: ${processingRecords.length} traitement(s) identifié(s)
${processingRecords.map(r => `- ${r.name}: ${r.purpose}`).join('\n')}
`;

    // Knowledge base from RAG documents
    const knowledgeBase = ragDocuments.length > 0 ? 
      `\n\nDocuments de référence CNIL à prioriser:\n${ragDocuments.join('\n\n---\n\n')}` : '';

    let specificPrompt = '';
    
    switch (questionField) {
      case 'generalDescription':
        specificPrompt = `En tant qu'expert DPIA, rédigez une description générale pour le traitement en cours d'analyse.
        
Basez-vous sur le profil de l'entreprise et les traitements existants pour proposer une description cohérente.
Incluez: nature du projet, portée (qui est concerné, à quelle échelle), contexte général.

Exemple pour une entreprise de e-commerce: "Mise en place d'un système de recommandations personnalisées pour notre boutique en ligne. Ce traitement concerne l'ensemble de nos clients (environ 10 000 utilisateurs actifs) et vise à améliorer leur expérience d'achat en proposant des produits adaptés à leurs préférences."`;
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

      default:
        specificPrompt = `Fournissez une réponse adaptée au champ "${questionField}" dans le contexte d'une AIPD RGPD.`;
    }

    const fullPrompt = `${companyContext}${specificPrompt}${knowledgeBase}

Répondez de manière professionnelle, précise et directement applicable. Citez les articles RGPD pertinents quand approprié.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: fullPrompt }],
    });

    return { response: response.choices[0].message.content || "" };
  }

  // Generate risk assessment suggestions
  async generateRiskAssessment(
    processingDescription: string,
    dataCategories: any[],
    companyInfo: any,
    ragDocuments: string[] = []
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
    const knowledgeBase = ragDocuments.length > 0 ? 
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"risks": []}');
  }

  // Chatbot response
  async getChatbotResponse(message: string, context?: any): Promise<{ response: string }> {
    const systemPrompt = `Vous êtes un Délégué à la Protection des Données (DPO) expert en RGPD. 

Votre rôle:
- Fournir des conseils précis sur la protection des données
- Citer les sources juridiques pertinentes (RGPD, CNIL, EDPB)
- Adapter votre langage au niveau de l'utilisateur
- Rester professionnel et bienveillant
- Recommander de consulter un juriste pour des questions complexes

Répondez en français en tant que DPO expérimenté.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    if (context) {
      messages.splice(1, 0, { 
        role: "system", 
        content: `Contexte de l'entreprise: ${JSON.stringify(context)}` 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
    });

    return { response: response.choices[0].message.content || "" };
  }
}

export const openaiService = new OpenAIService();
