import { storage } from '../storage';
import type { Company, ProcessingRecord, DpiaAssessment } from '@shared/schema';

export interface AIContext {
  company: {
    name: string;
    sector: string;
    size: string;
    totalProcessingRecords: number;
    complianceScore?: number;
  };
  currentProcessing?: {
    id: number;
    name: string;
    purpose: string;
    dataCategories: string[];
    recipients: string[];
    legalBasis: string;
    retentionPeriod: string;
    transfersOutsideEU: boolean;
    securityMeasures: string[];
    riskLevel?: string;
  };
  relatedProcessingRecords: Array<{
    name: string;
    purpose: string;
    dataCategories: string[];
    recipients: string[];
    similarity: number;
  }>;
  existingDpiaData: any;
  field: string;
  privacyPolicyContent?: string;
  companyContext: {
    hasDataBreaches: boolean;
    hasActiveActions: number;
    hasSubjectRequests: number;
    privacyPolicyExists: boolean;
  };
  industryContext?: {
    commonRisks: string[];
    recommendedMeasures: string[];
    specificRequirements: string[];
  };
  technicalMeasures: string[];
  organizationalMeasures: string[];
}

export class ContextExtractor {
  
  /**
   * Extract comprehensive context for AI prompt generation
   */
  async extractContext(
    companyId: number, 
    questionField: string, 
    existingDpiaData: any,
    processingRecordId?: number
  ): Promise<AIContext> {
    
    // Get company information
    const company = await storage.getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Get processing record if available - prioritize provided processingRecordId
    let processingRecord = null;
    const recordId = processingRecordId || existingDpiaData?.processingRecordId;
    if (recordId) {
      processingRecord = await storage.getProcessingRecord(recordId);
    }

    // Get all processing records for context
    const allProcessingRecords = await storage.getProcessingRecords(companyId);

    // Get company compliance context
    const companyContext = await this.getCompanyContext(companyId);

    // Get privacy policy for information measures
    let privacyPolicyContent = undefined;
    if (questionField === 'rightsInformation') {
      const privacyPolicies = await storage.getPrivacyPolicies(companyId);
      const activePolicy = privacyPolicies.find(p => p.isActive);
      if (activePolicy) {
        privacyPolicyContent = activePolicy.content;
      }
    }

    // Get related processing records based on similarity
    const relatedRecords = processingRecord 
      ? this.findRelatedProcessingRecords(processingRecord, allProcessingRecords)
      : [];

    // Get industry-specific context
    const industryContext = this.getIndustryContext(company.sector);

    // Calculate compliance score if available
    const complianceScore = await this.getComplianceScore(companyId);

    // Extract security measures from DPIA data instead of processing record
    const dpiaSecurityMeasures = this.extractDpiaSecurityMeasures(existingDpiaData);
    
    // Extract technical and organizational measures separately
    const { technical, organizational } = this.extractTechnicalAndOrganizationalMeasures(existingDpiaData);

    return {
      company: {
        name: company.name,
        sector: company.sector || 'Non spécifié',
        size: company.size || 'Non spécifiée',
        totalProcessingRecords: allProcessingRecords.length,
        complianceScore
      },
      currentProcessing: processingRecord ? {
        id: processingRecord.id,
        name: processingRecord.name,
        purpose: processingRecord.purpose,
        dataCategories: Array.isArray(processingRecord.dataCategories) ? processingRecord.dataCategories : [],
        recipients: Array.isArray(processingRecord.recipients) ? processingRecord.recipients : [],
        legalBasis: processingRecord.legalBasis || '',
        retentionPeriod: processingRecord.retention || '',
        transfersOutsideEU: processingRecord.transfersOutsideEU || false,
        securityMeasures: dpiaSecurityMeasures, // Use DPIA security measures instead
        riskLevel: this.assessProcessingRisk(processingRecord)
      } : undefined,
      relatedProcessingRecords: relatedRecords.slice(0, 3), // Limit to top 3 for relevance
      existingDpiaData,
      field: questionField,
      companyContext,
      industryContext,
      privacyPolicyContent,
      technicalMeasures: technical,
      organizationalMeasures: organizational
    };
  }

  /**
   * Get company compliance context
   */
  private async getCompanyContext(companyId: number) {
    try {
      const [breaches, actions, requests, policies] = await Promise.all([
        storage.getDataBreaches(companyId),
        storage.getComplianceActions(companyId),
        storage.getDataSubjectRequests(companyId),
        storage.getPrivacyPolicies(companyId)
      ]);

      return {
        hasDataBreaches: breaches.length > 0,
        hasActiveActions: actions.filter(a => a.status !== 'completed').length,
        hasSubjectRequests: requests.length,
        privacyPolicyExists: policies.some(p => p.isActive)
      };
    } catch (error) {
      console.error('Error getting company context:', error);
      return {
        hasDataBreaches: false,
        hasActiveActions: 0,
        hasSubjectRequests: 0,
        privacyPolicyExists: false
      };
    }
  }

  /**
   * Get compliance score if available
   */
  private async getComplianceScore(companyId: number): Promise<number | undefined> {
    try {
      const snapshots = await storage.getComplianceSnapshots(companyId);
      return snapshots.length > 0 ? snapshots[0].overallScore : undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Find processing records similar to the current one
   */
  private findRelatedProcessingRecords(
    currentRecord: ProcessingRecord, 
    allRecords: ProcessingRecord[]
  ) {
    return allRecords
      .filter(record => record.id !== currentRecord.id)
      .map(record => ({
        name: record.name,
        purpose: record.purpose,
        dataCategories: Array.isArray(record.dataCategories) ? record.dataCategories : [],
        recipients: Array.isArray(record.recipients) ? record.recipients : [],
        similarity: this.calculateSimilarity(currentRecord, record)
      }))
      .filter(record => record.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // Top 3 most similar
  }

  /**
   * Calculate similarity between two processing records
   */
  private calculateSimilarity(record1: ProcessingRecord, record2: ProcessingRecord): number {
    let score = 0;
    let factors = 0;

    // Purpose similarity
    if (record1.purpose && record2.purpose) {
      const purpose1 = String(record1.purpose).toLowerCase();
      const purpose2 = String(record2.purpose).toLowerCase();
      const commonWords = this.getCommonWords(purpose1, purpose2);
      score += commonWords * 0.4;
      factors += 0.4;
    }

    // Data categories similarity - handle arrays
    if (Array.isArray(record1.dataCategories) && Array.isArray(record2.dataCategories)) {
      const data1 = record1.dataCategories.join(' ').toLowerCase();
      const data2 = record2.dataCategories.join(' ').toLowerCase();
      const commonWords = this.getCommonWords(data1, data2);
      score += commonWords * 0.3;
      factors += 0.3;
    }

    // Recipients similarity - handle arrays
    if (Array.isArray(record1.recipients) && Array.isArray(record2.recipients)) {
      const recipients1 = record1.recipients.join(' ').toLowerCase();
      const recipients2 = record2.recipients.join(' ').toLowerCase();
      const commonWords = this.getCommonWords(recipients1, recipients2);
      score += commonWords * 0.2;
      factors += 0.2;
    }

    // Legal basis similarity - handle null values
    if (record1.legalBasis && record2.legalBasis && 
        typeof record1.legalBasis === 'string' && typeof record2.legalBasis === 'string') {
      score += record1.legalBasis === record2.legalBasis ? 0.1 : 0;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get common words ratio between two texts
   */
  private getCommonWords(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Assess risk level of a processing record
   */
  private assessProcessingRisk(record: ProcessingRecord): string {
    let riskScore = 0;

    // High-risk data categories - handle null values
    const highRiskData = ['santé', 'biométrie', 'judiciaire', 'sensible', 'mineur'];
    const dataCategories = (record.dataCategories && typeof record.dataCategories === 'string' ? record.dataCategories : '').toLowerCase();
    if (highRiskData.some(risk => dataCategories.includes(risk))) {
      riskScore += 3;
    }

    // International transfers
    if (record.isInternational) {
      riskScore += 2;
    }

    // Large scale processing (based on data categories complexity)
    if (dataCategories.length > 100) {
      riskScore += 1;
    }

    // No legal basis specified
    if (!record.legalBasis || typeof record.legalBasis !== 'string') {
      riskScore += 1;
    }

    if (riskScore >= 4) return 'Élevé';
    if (riskScore >= 2) return 'Modéré';
    return 'Faible';
  }

  /**
   * Extract security measures from DPIA data
   */
  private extractDpiaSecurityMeasures(dpiaData: any): string[] {
    const measures: string[] = [];

    // Extract from securityMeasures (predefined CNIL measures)
    if (Array.isArray(dpiaData?.securityMeasures)) {
      dpiaData.securityMeasures.forEach((measure: any) => {
        if (measure.name) {
          const status = measure.implemented ? 'mise en œuvre' : 'prévue';
          measures.push(`${measure.name}: ${measure.description || `Mesure ${status}`} (${status})`);
        }
      });
    }

    // Extract from customSecurityMeasures (user-defined measures)
    if (Array.isArray(dpiaData?.customSecurityMeasures)) {
      dpiaData.customSecurityMeasures.forEach((measure: any) => {
        if (measure.name) {
          const status = measure.implemented ? 'mise en œuvre' : 'prévue';
          measures.push(`${measure.name}: ${measure.description || `Mesure personnalisée ${status}`} (${status})`);
        }
      });
    }

    // If no DPIA measures found, fall back to processing record measures
    if (measures.length === 0 && Array.isArray(dpiaData?.processingRecord?.securityMeasures)) {
      return dpiaData.processingRecord.securityMeasures;
    }

    return measures;
  }

  /**
   * Get industry-specific context and recommendations
   */
  private getIndustryContext(sector?: string) {
    if (!sector) return undefined;

    const sectorLower = sector.toLowerCase();
    
    // E-commerce / Marketing
    if (sectorLower.includes('commerce') || sectorLower.includes('marketing') || sectorLower.includes('vente')) {
      return {
        commonRisks: [
          'Profilage marketing automatisé',
          'Cookies et traceurs publicitaires',
          'Transferts vers partenaires commerciaux',
          'Conservation excessive des données clients'
        ],
        recommendedMeasures: [
          'Consentement explicite pour le profilage',
          'Gestion transparente des cookies',
          'Limitation des transferts de données',
          'Politique de conservation claire'
        ],
        specificRequirements: [
          'Droit à la portabilité des données',
          'Information sur le profilage',
          'Opt-out facile du marketing direct'
        ]
      };
    }

    // Health / Medical
    if (sectorLower.includes('santé') || sectorLower.includes('médical') || sectorLower.includes('hôpital')) {
      return {
        commonRisks: [
          'Données de santé sensibles',
          'Accès non autorisé aux dossiers médicaux',
          'Partage avec professionnels de santé',
          'Conservation longue durée'
        ],
        recommendedMeasures: [
          'Chiffrement renforcé',
          'Contrôle d\'accès strict',
          'Journalisation des accès',
          'Formation du personnel médical'
        ],
        specificRequirements: [
          'Base légale adaptée (soins, recherche)',
          'Consentement explicite si requis',
          'Droits spécifiques des patients'
        ]
      };
    }

    // Financial services
    if (sectorLower.includes('banque') || sectorLower.includes('finance') || sectorLower.includes('assurance')) {
      return {
        commonRisks: [
          'Données financières sensibles',
          'Profilage de solvabilité',
          'Lutte anti-blanchiment',
          'Transferts internationaux'
        ],
        recommendedMeasures: [
          'Chiffrement de bout en bout',
          'Authentification forte',
          'Surveillance des transactions',
          'Encadrement des scores de crédit'
        ],
        specificRequirements: [
          'Réglementation bancaire (DSP2)',
          'Obligations de conservation légales',
          'Déclarations obligatoires'
        ]
      };
    }

    // Default for other sectors
    return {
      commonRisks: [
        'Accès non autorisé aux données',
        'Modification non contrôlée',
        'Perte ou destruction de données'
      ],
      recommendedMeasures: [
        'Contrôle d\'accès approprié',
        'Sauvegarde régulière',
        'Formation à la sécurité'
      ],
      specificRequirements: [
        'Respect des principes RGPD',
        'Information transparente',
        'Respect des droits des personnes'
      ]
    };
  }

  /**
   * Extract technical and organizational measures separately
   */
  extractTechnicalAndOrganizationalMeasures(dpiaData: any): { technical: string[], organizational: string[] } {
    const technical: string[] = [];
    const organizational: string[] = [];

    // Extract from securityMeasures (predefined CNIL measures)
    if (Array.isArray(dpiaData?.securityMeasures)) {
      dpiaData.securityMeasures.forEach((measure: any) => {
        if (measure.name) {
          const status = measure.implemented ? 'mise en œuvre' : 'prévue';
          const measureText = `${measure.name}: ${measure.description || `Mesure ${status}`} (${status})`;
          
          // Categorize based on measure category
          if (measure.category && 
              (measure.category.toLowerCase().includes('technique') || 
               measure.category.toLowerCase().includes('chiffrement') ||
               measure.category.toLowerCase().includes('authentification') ||
               measure.category.toLowerCase().includes('accès'))) {
            technical.push(measureText);
          } else {
            organizational.push(measureText);
          }
        }
      });
    }

    // Extract from customSecurityMeasures (user-defined measures)
    if (Array.isArray(dpiaData?.customSecurityMeasures)) {
      dpiaData.customSecurityMeasures.forEach((measure: any) => {
        if (measure.name) {
          const status = measure.implemented ? 'mise en œuvre' : 'prévue';
          const measureText = `${measure.name}: ${measure.description || `Mesure personnalisée ${status}`} (${status})`;
          
          // Categorize based on measure category
          if (measure.category && 
              (measure.category.toLowerCase().includes('technique') || 
               measure.category.toLowerCase().includes('chiffrement') ||
               measure.category.toLowerCase().includes('authentification') ||
               measure.category.toLowerCase().includes('accès'))) {
            technical.push(measureText);
          } else {
            organizational.push(measureText);
          }
        }
      });
    }

    return { technical, organizational };
  }

  /**
   * Format context for AI prompt
   */
  formatContextForAI(context: AIContext): string {
    const sections = [];

    // Company information
    sections.push(`INFORMATIONS DE L'ENTREPRISE:
- Nom: ${context.company.name}
- Secteur d'activité: ${context.company.sector}
- Taille: ${context.company.size}
- Nombre total de traitements: ${context.company.totalProcessingRecords}
${context.company.complianceScore ? `- Score de conformité actuel: ${context.company.complianceScore}%` : ''}`);

    // Current processing being analyzed
    if (context.currentProcessing) {
      const dataCategories = Array.isArray(context.currentProcessing.dataCategories) 
        ? context.currentProcessing.dataCategories.join(', ') 
        : context.currentProcessing.dataCategories || 'Non spécifiées';
      
      const recipients = Array.isArray(context.currentProcessing.recipients) 
        ? context.currentProcessing.recipients.join(', ') 
        : context.currentProcessing.recipients || 'Non spécifiés';
      
      const securityMeasures = Array.isArray(context.currentProcessing.securityMeasures) 
        ? context.currentProcessing.securityMeasures.join('; ') 
        : context.currentProcessing.securityMeasures || 'Non spécifiées';

      sections.push(`TRAITEMENT ANALYSÉ DANS CETTE AIPD:
- Nom du traitement: ${context.currentProcessing.name}
- Finalité: ${context.currentProcessing.purpose}
- Catégories de données: ${dataCategories}
- Destinataires: ${recipients}
- Base légale: ${context.currentProcessing.legalBasis || 'Non spécifiée'}
- Durée de conservation: ${context.currentProcessing.retentionPeriod || 'Non spécifiée'}
- Transferts hors UE: ${context.currentProcessing.transfersOutsideEU ? 'Oui' : 'Non'}
- Mesures de sécurité identifiées dans l'AIPD: ${securityMeasures}
- Niveau de risque estimé: ${context.currentProcessing.riskLevel}`);
    }

    // Related processing records
    if (context.relatedProcessingRecords.length > 0) {
      sections.push(`TRAITEMENTS SIMILAIRES DANS L'ENTREPRISE:
${context.relatedProcessingRecords.map(record => {
  const dataCategories = Array.isArray(record.dataCategories) 
    ? record.dataCategories.join(', ') 
    : 'Non spécifiées';
  const recipients = Array.isArray(record.recipients) 
    ? record.recipients.join(', ') 
    : 'Non spécifiés';
  
  return `- ${record.name}: ${record.purpose}
  Catégories de données: ${dataCategories}
  Destinataires: ${recipients}
  (similarité: ${Math.round(record.similarity * 100)}%)`;
}).join('\n')}`);
    }

    // Company compliance context
    sections.push(`CONTEXTE DE CONFORMITÉ:
- Violations de données déclarées: ${context.companyContext.hasDataBreaches ? 'Oui' : 'Non'}
- Actions de conformité en cours: ${context.companyContext.hasActiveActions}
- Demandes d'exercice de droits: ${context.companyContext.hasSubjectRequests}
- Politique de confidentialité active: ${context.companyContext.privacyPolicyExists ? 'Oui' : 'Non'}`);

    // Industry-specific context
    if (context.industryContext) {
      sections.push(`CONTEXTE SECTORIEL (${context.company.sector}):
Risques communs:
${context.industryContext.commonRisks.map(risk => `- ${risk}`).join('\n')}

Mesures recommandées:
${context.industryContext.recommendedMeasures.map(measure => `- ${measure}`).join('\n')}

Exigences spécifiques:
${context.industryContext.specificRequirements.map(req => `- ${req}`).join('\n')}`);
    }

    // Privacy policy content for information measures
    if (context.privacyPolicyContent) {
      const cleanedContent = context.privacyPolicyContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      sections.push(`POLITIQUE DE CONFIDENTIALITÉ ACTIVE:
${cleanedContent.substring(0, 2000)}${cleanedContent.length > 2000 ? '...' : ''}`);
    }

    // Extract technical and organizational measures separately
    const { technical, organizational } = this.extractTechnicalAndOrganizationalMeasures(context.existingDpiaData);
    
    if (technical.length > 0 || organizational.length > 0) {
      sections.push(`MESURES DE SÉCURITÉ DÉTAILLÉES:
Mesures techniques:
${technical.length > 0 ? technical.map(m => `- ${m}`).join('\n') : '- Aucune mesure technique spécifiée'}

Mesures organisationnelles:
${organizational.length > 0 ? organizational.map(m => `- ${m}`).join('\n') : '- Aucune mesure organisationnelle spécifiée'}`);
    }

    // Existing DPIA data
    const existingFields = Object.entries(context.existingDpiaData || {})
      .filter(([key, value]) => value && value !== '' && value !== null && key !== 'processingRecordId')
      .map(([key, value]) => `- ${key}: ${typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : JSON.stringify(value)}`);
    
    if (existingFields.length > 0) {
      sections.push(`DONNÉES DÉJÀ SAISIES DANS L'AIPD:
${existingFields.join('\n')}`);
    }

    return sections.join('\n\n');
  }
}

export const contextExtractor = new ContextExtractor();