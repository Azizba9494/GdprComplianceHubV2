interface ComplianceData {
  actions: any[];
  breaches: any[];
  records: any[];
  requests: any[];
}

interface RiskFactors {
  securityScore: number;
  processingScore: number;
  consentScore: number;
  rightsScore: number;
  documentationScore: number;
  vendorScore: number;
}

interface RiskAssessment {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactors;
  recommendations: string[];
  criticalIssues: string[];
}

export class RiskCalculator {
  private data: ComplianceData;

  constructor(data: ComplianceData) {
    this.data = data;
  }

  calculateRiskAssessment(): RiskAssessment {
    const factors = this.calculateRiskFactors();
    const overallScore = this.calculateOverallScore(factors);
    const riskLevel = this.determineRiskLevel(overallScore);
    const recommendations = this.generateRecommendations(factors);
    const criticalIssues = this.identifyCriticalIssues();

    return {
      overallScore,
      riskLevel,
      factors,
      recommendations,
      criticalIssues
    };
  }

  private calculateRiskFactors(): RiskFactors {
    return {
      securityScore: this.calculateSecurityScore(),
      processingScore: this.calculateProcessingScore(),
      consentScore: this.calculateConsentScore(),
      rightsScore: this.calculateRightsScore(),
      documentationScore: this.calculateDocumentationScore(),
      vendorScore: this.calculateVendorScore()
    };
  }

  private calculateSecurityScore(): number {
    const securityActions = this.data.actions.filter(a => a.category === 'security');
    const totalSecurityActions = Math.max(securityActions.length, 1);
    const completedSecurity = securityActions.filter(a => a.status === 'completed').length;
    const urgentPending = securityActions.filter(a => a.status === 'pending' && a.priority === 'urgent').length;
    
    // Base score from completion rate
    let score = (completedSecurity / totalSecurityActions) * 100;
    
    // Penalty for data breaches
    score -= this.data.breaches.length * 40;
    
    // Penalty for urgent pending security actions
    score -= urgentPending * 25;
    
    // Bonus for having security documentation
    const hasSecurityDocs = this.data.actions.some(a => 
      a.category === 'security' && a.status === 'completed' && 
      a.title.toLowerCase().includes('documentation')
    );
    if (hasSecurityDocs) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateProcessingScore(): number {
    const recordsCount = this.data.records.length;
    const processingActions = this.data.actions.filter(a => a.category === 'processing');
    const completedProcessing = processingActions.filter(a => a.status === 'completed').length;
    
    // Base score from having processing records
    let score = Math.min(100, recordsCount * 25);
    
    // Bonus for completed processing actions
    score += completedProcessing * 15;
    
    // Penalty if no records exist
    if (recordsCount === 0) score = 0;
    
    // Penalty for incomplete processing setup
    const pendingProcessing = processingActions.filter(a => a.status === 'pending').length;
    score -= pendingProcessing * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateConsentScore(): number {
    const consentActions = this.data.actions.filter(a => a.category === 'consent');
    const totalConsentActions = Math.max(consentActions.length, 1);
    const completedConsent = consentActions.filter(a => a.status === 'completed').length;
    
    let score = (completedConsent / totalConsentActions) * 100;
    
    // Penalty for pending consent management issues
    const pendingConsent = consentActions.filter(a => a.status === 'pending').length;
    score -= pendingConsent * 20;
    
    // Bonus for having consent mechanisms in place
    const hasConsentMechanism = this.data.records.some(r => 
      r.legalBasis && r.legalBasis.toLowerCase().includes('consent')
    );
    if (hasConsentMechanism) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRightsScore(): number {
    const totalRequests = this.data.requests.length;
    const completedRequests = this.data.requests.filter(r => r.status === 'completed').length;
    const overdueRequests = this.data.requests.filter(r => {
      if (r.status === 'completed') return false;
      const dueDate = new Date(r.dueDate);
      return dueDate < new Date();
    }).length;
    
    let score = 80; // Base score for rights management
    
    if (totalRequests > 0) {
      // Score based on completion rate
      score = (completedRequests / totalRequests) * 100;
      
      // Severe penalty for overdue requests
      score -= overdueRequests * 30;
    }
    
    // Bonus for having procedures in place
    const hasRightsProcedure = this.data.actions.some(a => 
      a.category === 'rights' && a.status === 'completed'
    );
    if (hasRightsProcedure) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateDocumentationScore(): number {
    const docActions = this.data.actions.filter(a => a.category === 'documentation');
    const completedDocs = docActions.filter(a => a.status === 'completed').length;
    const totalDocs = Math.max(docActions.length, 1);
    
    let score = (completedDocs / totalDocs) * 100;
    
    // Penalty for missing critical documentation
    const pendingDocs = docActions.filter(a => a.status === 'pending' && a.priority === 'urgent').length;
    score -= pendingDocs * 25;
    
    // Bonus for comprehensive documentation
    if (completedDocs >= 3) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateVendorScore(): number {
    const vendorActions = this.data.actions.filter(a => a.category === 'vendor');
    const completedVendor = vendorActions.filter(a => a.status === 'completed').length;
    const totalVendor = Math.max(vendorActions.length, 1);
    
    let score = (completedVendor / totalVendor) * 100;
    
    // If no vendor actions, assume basic compliance
    if (vendorActions.length === 0) score = 70;
    
    // Penalty for pending vendor compliance issues
    const pendingVendor = vendorActions.filter(a => a.status === 'pending').length;
    score -= pendingVendor * 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallScore(factors: RiskFactors): number {
    // Weighted average of all factors
    const weights = {
      security: 0.25,
      processing: 0.20,
      consent: 0.15,
      rights: 0.15,
      documentation: 0.15,
      vendor: 0.10
    };

    return Math.round(
      factors.securityScore * weights.security +
      factors.processingScore * weights.processing +
      factors.consentScore * weights.consent +
      factors.rightsScore * weights.rights +
      factors.documentationScore * weights.documentation +
      factors.vendorScore * weights.vendor
    );
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private generateRecommendations(factors: RiskFactors): string[] {
    const recommendations: string[] = [];

    if (factors.securityScore < 60) {
      recommendations.push("Renforcer immédiatement les mesures de sécurité des données");
    }
    if (factors.processingScore < 70) {
      recommendations.push("Compléter le registre des activités de traitement");
    }
    if (factors.consentScore < 60) {
      recommendations.push("Améliorer les mécanismes de collecte du consentement");
    }
    if (factors.rightsScore < 70) {
      recommendations.push("Accélérer le traitement des demandes d'exercice des droits");
    }
    if (factors.documentationScore < 60) {
      recommendations.push("Mettre à jour la documentation de conformité");
    }
    if (factors.vendorScore < 70) {
      recommendations.push("Réviser les contrats avec les sous-traitants");
    }

    if (recommendations.length === 0) {
      recommendations.push("Maintenir le niveau de conformité actuel");
      recommendations.push("Effectuer des audits réguliers");
    }

    return recommendations;
  }

  private identifyCriticalIssues(): string[] {
    const issues: string[] = [];

    if (this.data.breaches.length > 0) {
      issues.push(`${this.data.breaches.length} violation(s) de données détectée(s)`);
    }

    const overdueRequests = this.data.requests.filter(r => {
      if (r.status === 'completed') return false;
      const dueDate = new Date(r.dueDate);
      return dueDate < new Date();
    }).length;

    if (overdueRequests > 0) {
      issues.push(`${overdueRequests} demande(s) en retard de traitement`);
    }

    const urgentActions = this.data.actions.filter(a => 
      a.status === 'pending' && a.priority === 'urgent'
    ).length;

    if (urgentActions > 0) {
      issues.push(`${urgentActions} action(s) urgente(s) en attente`);
    }

    if (this.data.records.length === 0) {
      issues.push("Aucun registre de traitement documenté");
    }

    return issues;
  }
}

export function calculateRiskAssessment(data: ComplianceData): RiskAssessment {
  const calculator = new RiskCalculator(data);
  return calculator.calculateRiskAssessment();
}