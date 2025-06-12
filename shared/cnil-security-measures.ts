// Mesures de sécurité basées sur la base de connaissances CNIL PIA-3
export interface SecurityMeasure {
  id: string;
  name: string;
  category: string;
  description: string;
  examples?: string[];
}

export const CNIL_SECURITY_MEASURES: SecurityMeasure[] = [
  // Mesures techniques d'authentification
  {
    id: "auth_001",
    name: "Authentification par mot de passe",
    category: "Authentification",
    description: "Mise en place de mots de passe robustes avec politique de complexité",
    examples: ["Longueur minimale 12 caractères", "Majuscules, minuscules, chiffres et symboles", "Changement périodique"]
  },
  {
    id: "auth_002",
    name: "Authentification à deux facteurs (2FA)",
    category: "Authentification",
    description: "Authentification renforcée par un second facteur",
    examples: ["SMS", "Application mobile", "Token physique", "Biométrie"]
  },
  {
    id: "auth_003",
    name: "Authentification forte",
    category: "Authentification",
    description: "Certificats numériques ou cartes à puce",
    examples: ["Certificats X.509", "Cartes à puce", "Clés USB cryptographiques"]
  },

  // Mesures de chiffrement
  {
    id: "crypto_001",
    name: "Chiffrement des données en transit",
    category: "Chiffrement",
    description: "Protection des données lors de leur transmission",
    examples: ["TLS/SSL", "VPN", "HTTPS", "SFTP"]
  },
  {
    id: "crypto_002",
    name: "Chiffrement des données au repos",
    category: "Chiffrement",
    description: "Protection des données stockées",
    examples: ["AES-256", "Chiffrement des disques", "Bases de données chiffrées"]
  },
  {
    id: "crypto_003",
    name: "Chiffrement des sauvegardes",
    category: "Chiffrement",
    description: "Protection des copies de sauvegarde",
    examples: ["Sauvegardes chiffrées", "Clés de chiffrement séparées"]
  },

  // Contrôle d'accès
  {
    id: "access_001",
    name: "Gestion des habilitations",
    category: "Contrôle d'accès",
    description: "Attribution et révision des droits d'accès",
    examples: ["Principe du moindre privilège", "Révision périodique", "Séparation des fonctions"]
  },
  {
    id: "access_002",
    name: "Journalisation des accès",
    category: "Contrôle d'accès",
    description: "Enregistrement et surveillance des accès",
    examples: ["Logs d'authentification", "Traçabilité des actions", "Alertes en temps réel"]
  },
  {
    id: "access_003",
    name: "Verrouillage automatique",
    category: "Contrôle d'accès",
    description: "Verrouillage après inactivité ou tentatives d'intrusion",
    examples: ["Timeout de session", "Verrouillage après échecs", "Écrans de veille"]
  },

  // Sécurité réseau
  {
    id: "network_001",
    name: "Pare-feu (Firewall)",
    category: "Sécurité réseau",
    description: "Filtrage du trafic réseau entrant et sortant",
    examples: ["Règles de filtrage", "DMZ", "Inspection des paquets"]
  },
  {
    id: "network_002",
    name: "Segmentation réseau",
    category: "Sécurité réseau",
    description: "Isolation des systèmes critiques",
    examples: ["VLAN", "Zones de sécurité", "Micro-segmentation"]
  },
  {
    id: "network_003",
    name: "Protection anti-malware",
    category: "Sécurité réseau",
    description: "Détection et prévention des logiciels malveillants",
    examples: ["Antivirus", "Anti-spam", "Sandboxing", "EDR"]
  },

  // Surveillance et détection
  {
    id: "monitor_001",
    name: "Surveillance continue",
    category: "Surveillance",
    description: "Monitoring 24/7 des systèmes et réseaux",
    examples: ["SOC", "SIEM", "Alertes automatiques"]
  },
  {
    id: "monitor_002",
    name: "Détection d'intrusion",
    category: "Surveillance",
    description: "Identification des tentatives d'accès non autorisé",
    examples: ["IDS/IPS", "Analyse comportementale", "Honeypots"]
  },
  {
    id: "monitor_003",
    name: "Tests de pénétration",
    category: "Surveillance",
    description: "Évaluation de la sécurité par simulation d'attaques",
    examples: ["Pentest externe", "Audit interne", "Bug bounty"]
  },

  // Sauvegarde et continuité
  {
    id: "backup_001",
    name: "Sauvegarde régulière",
    category: "Sauvegarde",
    description: "Copies de sécurité automatisées et testées",
    examples: ["Sauvegarde quotidienne", "Rule 3-2-1", "Test de restauration"]
  },
  {
    id: "backup_002",
    name: "Plan de continuité d'activité",
    category: "Sauvegarde",
    description: "Procédures de reprise après incident",
    examples: ["RTO/RPO définis", "Site de secours", "Procédures documentées"]
  },
  {
    id: "backup_003",
    name: "Archivage sécurisé",
    category: "Sauvegarde",
    description: "Conservation à long terme des données",
    examples: ["Support physique sécurisé", "Cloud sécurisé", "Intégrité vérifiée"]
  },

  // Mesures organisationnelles
  {
    id: "org_001",
    name: "Formation du personnel",
    category: "Organisationnel",
    description: "Sensibilisation à la sécurité et protection des données",
    examples: ["Formation RGPD", "Phishing simulation", "Mise à jour régulière"]
  },
  {
    id: "org_002",
    name: "Procédures de sécurité",
    category: "Organisationnel",
    description: "Documentation et application des règles de sécurité",
    examples: ["PSSI", "Procédures d'incident", "Clean desk policy"]
  },
  {
    id: "org_003",
    name: "Gestion des incidents",
    category: "Organisationnel",
    description: "Processus de détection, réponse et récupération",
    examples: ["Équipe CERT", "Procédure d'escalade", "Communication de crise"]
  },

  // Sécurité physique
  {
    id: "physical_001",
    name: "Contrôle d'accès physique",
    category: "Sécurité physique",
    description: "Protection des locaux et équipements",
    examples: ["Badges d'accès", "Biométrie", "Sas de sécurité", "Vidéosurveillance"]
  },
  {
    id: "physical_002",
    name: "Sécurisation des postes de travail",
    category: "Sécurité physique",
    description: "Protection contre le vol et l'accès non autorisé",
    examples: ["Verrouillage Kensington", "Armoires sécurisées", "Écrans de confidentialité"]
  },
  {
    id: "physical_003",
    name: "Destruction sécurisée",
    category: "Sécurité physique",
    description: "Élimination sécurisée des supports et documents",
    examples: ["Broyage sécurisé", "Démagnetisation", "Incinération", "Effacement cryptographique"]
  },

  // Mise à jour et maintenance
  {
    id: "update_001",
    name: "Gestion des correctifs",
    category: "Maintenance",
    description: "Application régulière des mises à jour de sécurité",
    examples: ["Patch management", "Tests en pré-production", "Fenêtre de maintenance"]
  },
  {
    id: "update_002",
    name: "Maintenance préventive",
    category: "Maintenance",
    description: "Entretien régulier des systèmes et équipements",
    examples: ["Monitoring proactif", "Remplacement préventif", "Nettoyage système"]
  },
  {
    id: "update_003",
    name: "Veille sécurité",
    category: "Maintenance",
    description: "Surveillance des nouvelles menaces et vulnérabilités",
    examples: ["Flux de renseignement", "CVE monitoring", "Threat intelligence"]
  }
];

export const SECURITY_CATEGORIES = [
  "Authentification",
  "Chiffrement", 
  "Contrôle d'accès",
  "Sécurité réseau",
  "Surveillance",
  "Sauvegarde",
  "Organisationnel",
  "Sécurité physique",
  "Maintenance"
];