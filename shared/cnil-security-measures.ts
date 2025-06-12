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

  // Anonymisation
  {
    id: "anon_001",
    name: "Anonymisation",
    category: "Anonymisation",
    description: "Suppression de tout élément d'identification directe ou indirecte",
    examples: ["Suppression d'identifiants", "Généralisation des données", "Ajout de bruit statistique"]
  },

  // Cloisonnement des données
  {
    id: "compartment_001",
    name: "Cloisonnement des données",
    category: "Cloisonnement",
    description: "Isolation des données par rapport au reste du système d'information",
    examples: ["Bases de données séparées", "Réseaux isolés", "Environnements dédiés"]
  },

  // Contrôle des accès logiques
  {
    id: "logical_access_001",
    name: "Contrôle des accès logiques",
    category: "Contrôle d'accès logique",
    description: "Gestion fine des droits d'accès aux systèmes et applications",
    examples: ["RBAC", "ABAC", "Single Sign-On", "Fédération d'identités"]
  },

  // Traçabilité (journalisation)
  {
    id: "traceability_001",
    name: "Traçabilité (journalisation)",
    category: "Traçabilité",
    description: "Enregistrement détaillé de toutes les opérations sur les données",
    examples: ["Logs d'audit", "Horodatage", "Signature électronique", "Chaîne de custody"]
  },

  // Contrôle d'intégrité
  {
    id: "integrity_001",
    name: "Contrôle d'intégrité",
    category: "Intégrité",
    description: "Vérification de l'intégrité et de l'authenticité des données",
    examples: ["Hash cryptographiques", "Signatures numériques", "Checksums", "Blockchain"]
  },

  // Archivage
  {
    id: "archive_001",
    name: "Archivage",
    category: "Archivage",
    description: "Conservation sécurisée à long terme des données",
    examples: ["Coffres-forts numériques", "Supports optiques", "Tiers archiveur", "Horodatage qualifié"]
  },

  // Sécurité des documents papier
  {
    id: "paper_security_001",
    name: "Sécurité des documents papier",
    category: "Sécurité documentaire",
    description: "Protection des documents physiques contenant des données personnelles",
    examples: ["Armoires verrouillées", "Destruction sécurisée", "Accès contrôlé", "Watermarking"]
  },

  // Sécurité de l'exploitation
  {
    id: "operations_security_001",
    name: "Sécurité de l'exploitation",
    category: "Sécurité opérationnelle",
    description: "Sécurisation des processus d'exploitation informatique",
    examples: ["Procédures sécurisées", "Séparation des environnements", "Contrôle des changements"]
  },

  // Lutte contre les logiciels malveillants
  {
    id: "malware_protection_001",
    name: "Lutte contre les logiciels malveillants",
    category: "Protection anti-malware",
    description: "Protection contre virus, ransomware et autres logiciels malveillants",
    examples: ["Antivirus avancé", "EDR/XDR", "Analyse comportementale", "Sandboxing"]
  },

  // Gestion des postes de travail
  {
    id: "workstation_management_001",
    name: "Gestion des postes de travail",
    category: "Gestion des postes",
    description: "Sécurisation et gestion centralisée des postes utilisateurs",
    examples: ["MDM", "Chiffrement des disques", "Politique de sécurité", "Mise à jour automatique"]
  },

  // Sécurité des sites web
  {
    id: "web_security_001",
    name: "Sécurité des sites web",
    category: "Sécurité web",
    description: "Protection des applications et sites web contre les attaques",
    examples: ["WAF", "Protection CSRF/XSS", "HTTPS obligatoire", "Content Security Policy"]
  },

  // Sécurité des canaux informatiques (réseaux)
  {
    id: "network_channels_001",
    name: "Sécurité des canaux informatiques",
    category: "Sécurité des canaux",
    description: "Protection des communications et transmissions réseau",
    examples: ["VPN", "Tunneling sécurisé", "Chiffrement des flux", "Inspection du trafic"]
  },

  // Sécurité des matériels
  {
    id: "hardware_security_001",
    name: "Sécurité des matériels",
    category: "Sécurité matérielle",
    description: "Protection physique et logique des équipements informatiques",
    examples: ["HSM", "TPM", "Secure Boot", "Protection anti-tamper"]
  },

  // Éloignement des sources de risques
  {
    id: "risk_distancing_001",
    name: "Éloignement des sources de risques",
    category: "Gestion des risques",
    description: "Mise à distance des éléments présentant des risques",
    examples: ["Sites de secours distants", "Séparation géographique", "Isolation des zones à risque"]
  },

  // Protection contre les sources de risques non humaines
  {
    id: "non_human_risks_001",
    name: "Protection contre les sources de risques non humaines",
    category: "Protection environnementale",
    description: "Protection contre les risques naturels et environnementaux",
    examples: ["Protection incendie", "Alimentation de secours", "Climatisation", "Protection sismique"]
  },

  // Organisation
  {
    id: "organization_001",
    name: "Organisation",
    category: "Organisation",
    description: "Structure organisationnelle de la sécurité",
    examples: ["RSSI", "Comité sécurité", "Définition des rôles", "Gouvernance"]
  },

  // Politique (gestion des règles)
  {
    id: "policy_001",
    name: "Politique (gestion des règles)",
    category: "Politique de sécurité",
    description: "Définition et application des règles de sécurité",
    examples: ["PSSI", "Chartes utilisateurs", "Procédures", "Standards de sécurité"]
  },

  // Gestion des projets
  {
    id: "project_management_001",
    name: "Gestion des projets",
    category: "Gestion de projet",
    description: "Intégration de la sécurité dans les projets",
    examples: ["Security by design", "AIPD projets", "Tests sécurité", "Validation sécurité"]
  },

  // Gestion des incidents et des violations de données
  {
    id: "incident_management_001",
    name: "Gestion des incidents et violations",
    category: "Gestion d'incidents",
    description: "Processus de traitement des incidents de sécurité",
    examples: ["CERT", "Plan de réponse", "Notification CNIL", "Communication de crise"]
  },

  // Gestion des personnels
  {
    id: "personnel_management_001",
    name: "Gestion des personnels",
    category: "Gestion RH",
    description: "Sécurisation du cycle de vie des employés",
    examples: ["Background check", "Formation sécurité", "Contrats de confidentialité", "Départ sécurisé"]
  },

  // Relations avec les tiers
  {
    id: "third_party_001",
    name: "Relations avec les tiers",
    category: "Gestion des tiers",
    description: "Sécurisation des relations avec les partenaires externes",
    examples: ["Contrats DPA", "Audits fournisseurs", "Certification tiers", "Clauses de sécurité"]
  },

  // Supervision
  {
    id: "supervision_001",
    name: "Supervision",
    category: "Supervision",
    description: "Surveillance et pilotage de la sécurité",
    examples: ["Tableaux de bord", "Métriques sécurité", "Reporting", "Revues périodiques"]
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
  "Maintenance",
  "Anonymisation",
  "Cloisonnement",
  "Contrôle d'accès logique",
  "Traçabilité",
  "Intégrité",
  "Archivage",
  "Sécurité documentaire",
  "Sécurité opérationnelle",
  "Protection anti-malware",
  "Gestion des postes",
  "Sécurité web",
  "Sécurité des canaux",
  "Sécurité matérielle",
  "Gestion des risques",
  "Protection environnementale",
  "Organisation",
  "Politique de sécurité",
  "Gestion de projet",
  "Gestion d'incidents",
  "Gestion RH",
  "Gestion des tiers",
  "Supervision"
];