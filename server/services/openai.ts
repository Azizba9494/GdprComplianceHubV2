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
