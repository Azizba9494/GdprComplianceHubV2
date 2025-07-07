import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  Book, 
  Sparkles, 
  Mail, 
  ChevronRight,
  Shield,
  FileText,
  Users,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  icon: any;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
}

interface UpdateItem {
  id: string;
  date: string;
  version: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix';
}

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Articles explicatifs détaillés
  const helpArticles: HelpArticle[] = [
    {
      id: "diagnostic-rgpd",
      title: "Comment réaliser le diagnostic RGPD",
      category: "Gouvernance",
      icon: Shield,
      tags: ["diagnostic", "conformité", "évaluation"],
      content: `
        Le diagnostic RGPD est votre première étape vers la conformité. Voici comment procéder :

        **Étape 1 : Accéder au diagnostic**
        - Rendez-vous dans la section "Diagnostic" depuis le menu principal
        - Cliquez sur "Commencer le diagnostic" si c'est votre première fois

        **Étape 2 : Répondre aux questions**
        - Lisez attentivement chaque question
        - Répondez par "Oui" ou "Non" selon votre situation actuelle
        - N'hésitez pas à consulter vos documents internes si nécessaire

        **Étape 3 : Comprendre les résultats**
        - Chaque domaine reçoit un score de conformité en pourcentage
        - Les domaines en rouge nécessitent une attention urgente
        - Un plan d'action personnalisé est généré automatiquement

        **Étape 4 : Suivre vos progrès**
        - Retournez au diagnostic pour mettre à jour vos réponses
        - Observez l'évolution de vos scores au fil du temps
        - Utilisez le tableau de bord pour suivre votre progression globale

        **Conseils pratiques :**
        - Préparez vos documents avant de commencer (registres, politiques, contrats)
        - Impliquez votre équipe IT pour les questions techniques
        - Réalisez le diagnostic tous les 6 mois pour maintenir votre conformité

        **Erreurs courantes à éviter :**
        - Ne pas impliquer les bonnes personnes (RH, IT, direction)
        - Répondre "oui" par défaut sans vérification
        - Ignorer les recommandations de mise à jour
        - Ne pas documenter les changements effectués
      `
    },
    {
      id: "premiers-pas-rgpd",
      title: "Premiers pas : comprendre le RGPD pour les PME",
      category: "Gouvernance",
      icon: Shield,
      tags: ["RGPD", "bases", "premiers pas", "PME"],
      content: `
        **Le RGPD en quelques mots :**
        Le Règlement Général sur la Protection des Données (RGPD) protège la vie privée des citoyens européens. Même si vous êtes une PME, vous devez vous conformer si vous traitez des données personnelles.

        **Qu'est-ce qu'une donnée personnelle ?**
        Toute information permettant d'identifier une personne :
        - Nom, prénom, email, téléphone
        - Adresse IP, numéro client, photo
        - Données de géolocalisation
        - Données bancaires, RIB
        - Cookies de votre site web

        **Les 6 principes fondamentaux à retenir :**
        1. **Licéité** : Avoir une base légale pour traiter les données
        2. **Finalité** : Collecter pour un objectif précis et légitime
        3. **Minimisation** : Ne collecter que le strict nécessaire
        4. **Exactitude** : Maintenir les données à jour
        5. **Conservation** : Limiter la durée de stockage
        6. **Sécurité** : Protéger contre les fuites et piratages

        **Vos obligations principales :**
        - Tenir un registre des traitements
        - Informer les personnes sur l'usage de leurs données
        - Permettre l'exercice de leurs droits (accès, rectification, suppression)
        - Sécuriser les données personnelles
        - Notifier les violations à la CNIL sous 72h

        **Par où commencer ?**
        1. Faites le diagnostic RGPD pour évaluer votre situation
        2. Cartographiez vos traitements de données
        3. Vérifiez vos bases légales
        4. Mettez à jour vos mentions légales
        5. Sécurisez vos systèmes informatiques
        6. Formez vos équipes

        **Idées reçues à oublier :**
        ❌ "Le RGPD ne concerne que les grandes entreprises"
        ❌ "Il suffit d'ajouter un bandeau cookies"
        ❌ "C'est trop compliqué pour une PME"
        ❌ "On risque rien, personne ne contrôle"
        
        ✅ Le RGPD concerne TOUTES les entreprises traitant des données personnelles
        ✅ La conformité RGPD est un processus continu, pas un projet ponctuel
        ✅ Des outils existent pour simplifier la mise en conformité
        ✅ La CNIL peut contrôler et sanctionner même les PME
      `
    },
    {
      id: "plan-action",
      title: "Gérer et suivre votre plan d'action",
      category: "Actions",
      icon: CheckCircle2,
      tags: ["actions", "planification", "suivi"],
      content: `
        Le plan d'action vous guide vers la conformité RGPD step by step :

        **Comprendre les priorités :**
        - **Actions urgentes (rouge)** : À traiter immédiatement, risque légal élevé
        - **Actions importantes (orange)** : À planifier sous 3 mois
        - **Actions normales** : À intégrer dans votre roadmap annuel

        **Organiser vos actions :**
        - Utilisez les filtres par catégorie (Sécurité, Documentation, etc.)
        - Triez par priorité, échéance ou statut
        - Assignez des dates d'échéance réalistes

        **Suivre l'avancement :**
        - Marquez les actions comme "En cours" quand vous les démarrez
        - Passez-les à "Terminé" une fois complétées
        - Ajoutez des notes sur la mise en œuvre

        **Mises à jour automatiques :**
        - De nouvelles actions peuvent apparaître selon vos réponses au diagnostic
        - Les priorités s'ajustent en fonction de votre progression
        - Le système vous rappelle les échéances importantes

        **Bonnes pratiques :**
        - Traitez d'abord les actions urgentes
        - Groupez les actions similaires pour plus d'efficacité
        - Documentez vos mises en place pour les audits futurs
      `
    },
    {
      id: "registres-traitement",
      title: "Créer et maintenir vos registres de traitement",
      category: "Registres",
      icon: Database,
      tags: ["registres", "traitement", "documentation"],
      content: `
        Les registres de traitement sont obligatoires pour toute entreprise traitant des données personnelles :

        **Création d'un nouveau registre :**
        - Cliquez sur "Nouveau registre" dans la section Registres
        - Choisissez entre création manuelle ou assistée par IA
        - Remplissez les informations obligatoires : finalité, base légale, catégories de données

        **Informations essentielles à documenter :**
        - **Finalité** : Pourquoi collectez-vous ces données ?
        - **Base légale** : Consentement, intérêt légitime, obligation légale, etc.
        - **Catégories de personnes** : Clients, prospects, employés, etc.
        - **Catégories de données** : Identité, contact, données sensibles, etc.
        - **Destinataires** : Qui accède à ces données ?
        - **Durée de conservation** : Combien de temps gardez-vous les données ?

        **Assistant IA pour les registres :**
        - Décrivez votre activité en langage naturel
        - L'IA génère un registre complet et conforme
        - Vous pouvez ensuite modifier et affiner le contenu

        **Évaluation DPIA automatique :**
        - Le système évalue automatiquement si une DPIA est requise
        - 9 critères CNIL sont analysés pour chaque traitement
        - Des recommandations personnalisées sont fournies

        **Maintenance continue :**
        - Révisez vos registres tous les 6 mois
        - Mettez à jour lors de nouveaux traitements
        - Archivez les traitements obsolètes
      `
    },
    {
      id: "violations-donnees",
      title: "Signaler et analyser les violations de données",
      category: "Violations",
      icon: AlertTriangle,
      tags: ["violation", "incident", "signalement"],
      content: `
        La gestion des violations de données est cruciale pour votre conformité :

        **Détecter une violation :**
        - Perte de confidentialité (accès non autorisé)
        - Perte d'intégrité (modification non autorisée)
        - Perte de disponibilité (données inaccessibles)

        **Signalement immédiat :**
        - Documentez l'incident dans les 72h maximum
        - Utilisez notre formulaire conforme aux directives EDPB
        - L'IA analyse automatiquement la gravité

        **Formulaire de violation :**
        Le formulaire couvre 10 sections obligatoires :
        1. Nature de la violation
        2. Catégories et nombre de personnes concernées
        3. Description des faits
        4. Conséquences probables
        5. Mesures prises ou envisagées
        6. Notification aux personnes concernées
        7. Contact du DPO
        8. Évaluation des risques
        9. Justification du délai
        10. Mesures préventives futures

        **Analyse IA intelligente :**
        - Évaluation automatique de la gravité
        - Recommandations de notification CNIL
        - Suggestions de mesures correctives
        - Génération de rapports pour les autorités

        **Suivi et reporting :**
        - Tableau de bord des violations
        - Export CSV pour les audits
        - Historique complet des incidents
        - Statistiques de récurrence

        **Actions post-violation :**
        - Mise à jour des mesures de sécurité
        - Formation des équipes
        - Révision des processus
        - Communication transparente
      `
    },
    {
      id: "dpia-aipd",
      title: "Réaliser une DPIA (Analyse d'Impact)",
      category: "DPIA",
      icon: FileText,
      tags: ["dpia", "analyse", "impact", "risques"],
      content: `
        La DPIA (Data Protection Impact Assessment) est obligatoire pour les traitements à haut risque :

        **Quand réaliser une DPIA ?**
        Notre système évalue automatiquement 9 critères CNIL :
        - Évaluation/notation des personnes
        - Décision automatisée avec effet juridique
        - Surveillance systématique
        - Données sensibles ou hautement personnelles
        - Traitement à grande échelle
        - Croisement/combinaison de données
        - Personnes vulnérables
        - Usage innovant/nouvelles technologies
        - Empêchement de l'exercice des droits

        **Score d'évaluation :**
        - **Score ≥ 2** : DPIA obligatoire
        - **Score = 1** : Vigilance requise, DPIA recommandée
        - **Score = 0** : DPIA non requise

        **Processus de DPIA :**
        1. **Évaluation préliminaire** : Le système calcule automatiquement le score
        2. **Description du traitement** : Finalités, moyens, parties prenantes
        3. **Analyse des risques** : Identification et évaluation des risques
        4. **Mesures de sécurité** : Catalogue CNIL intégré
        5. **Consultation des parties prenantes** : DPO, équipes métier
        6. **Validation finale** : Révision et approbation

        **Assistant IA pour DPIA :**
        - Génération automatique des sections
        - Suggestions de mesures de sécurité
        - Analyse de proportionnalité
        - Recommandations personnalisées

        **Révision et mise à jour :**
        - La DPIA doit être révisée régulièrement
        - Mise à jour lors de modifications du traitement
        - Archivage des versions précédentes
        - Traçabilité des évolutions
      `
    },
    {
      id: "droits-personnes",
      title: "Gérer les demandes de droits des personnes",
      category: "Droits",
      icon: Users,
      tags: ["droits", "demandes", "personnes concernées"],
      content: `
        Les personnes concernées ont 8 droits fondamentaux que vous devez respecter :

        **Les 8 droits RGPD :**
        1. **Droit d'information** : Transparence sur l'utilisation des données
        2. **Droit d'accès** : Consultation des données personnelles
        3. **Droit de rectification** : Correction des données inexactes
        4. **Droit d'effacement** : Suppression des données ("droit à l'oubli")
        5. **Droit à la limitation** : Restriction du traitement
        6. **Droit à la portabilité** : Récupération des données dans un format structuré
        7. **Droit d'opposition** : Refus du traitement
        8. **Droits relatifs aux décisions automatisées** : Explication et contestation

        **Gestion des demandes :**
        - Enregistrement centralisé de toutes les demandes
        - Suivi des délais (1 mois maximum)
        - Templates de réponses conformes
        - Historique complet des échanges

        **Processus de traitement :**
        1. **Réception** : Enregistrement de la demande
        2. **Vérification d'identité** : Validation du demandeur
        3. **Analyse** : Vérification de la légitimité
        4. **Traitement** : Exécution de la demande
        5. **Réponse** : Communication à la personne concernée

        **Délais à respecter :**
        - **Accusé de réception** : Immédiat
        - **Réponse complète** : 1 mois maximum
        - **Prolongation possible** : 2 mois supplémentaires si complexe
        - **Information de prolongation** : Dans le mois initial

        **Documentation obligatoire :**
        - Registre des demandes reçues
        - Justification des refus éventuels
        - Mesures techniques mises en place
        - Suivi des délais de traitement

        **Bonnes pratiques :**
        - Formez vos équipes à la reconnaissance des demandes
        - Mettez en place des procédures claires
        - Utilisez les templates fournis
        - Documentez toutes vos actions

        **Cas particuliers et refus possibles :**
        - **Droit d'accès** : Peut être refusé si manifestement infondé ou excessif
        - **Droit à l'effacement** : Ne s'applique pas si les données sont nécessaires pour respecter une obligation légale
        - **Droit à la portabilité** : Limité aux traitements automatisés basés sur le consentement ou un contrat
        - **Droit d'opposition** : Possible pour l'intérêt légitime, mais vous devez prouver des motifs légitimes impérieux

        **Templates de réponses types :**
        Notre plateforme inclut des modèles pré-rédigés pour chaque type de demande, garantissant des réponses juridiquement conformes et dans les délais.
      `
    },
    {
      id: "securite-donnees",
      title: "Sécuriser vos données personnelles : guide pratique",
      category: "Sécurité",
      icon: Shield,
      tags: ["sécurité", "protection", "mesures techniques"],
      content: `
        La sécurité des données personnelles est une obligation RGPD fondamentale. Voici comment bien protéger vos données :

        **Mesures techniques de base :**
        - **Chiffrement** : Chiffrez les données sensibles en base et en transit
        - **Contrôle d'accès** : Limitez l'accès aux seules personnes habilitées
        - **Mots de passe robustes** : Politique de mots de passe complexes + 2FA
        - **Antivirus et firewall** : Protection contre les malwares
        - **Sauvegardes régulières** : Copies de sécurité testées et chiffrées

        **Mesures organisationnelles :**
        - **Formation du personnel** : Sensibilisation aux risques cyber
        - **Politique de sécurité** : Règles claires et procédures documentées
        - **Gestion des incidents** : Plan de réponse aux violations
        - **Contrôles réguliers** : Audits de sécurité périodiques
        - **Clean desk policy** : Bureau propre, écrans verrouillés

        **Sécurité des postes de travail :**
        - Mise à jour automatique des systèmes
        - Verrouillage automatique des sessions
        - Chiffrement des disques durs
        - Politique d'utilisation acceptable
        - Gestion des périphériques USB

        **Sécurité réseau :**
        - Segmentation du réseau
        - VPN pour l'accès distant
        - Monitoring des connexions
        - Filtrage web et email
        - Pare-feu nouvelle génération

        **Gestion des sous-traitants :**
        - Audit de sécurité des prestataires
        - Clauses contractuelles RGPD
        - Chiffrement des échanges
        - Accès limité et tracé
        - Certification ISO 27001 recommandée

        **Plan de réponse aux incidents :**
        1. **Détection** : Systèmes de monitoring H24
        2. **Analyse** : Évaluation de l'impact et des risques
        3. **Confinement** : Isolation des systèmes compromis
        4. **Éradication** : Suppression de la menace
        5. **Récupération** : Restauration des services
        6. **Notification** : CNIL et personnes concernées si nécessaire

        **Évaluation des risques :**
        - Cartographie des actifs informatiques
        - Analyse de vulnérabilités
        - Tests de pénétration annuels
        - Mise à jour du registre des risques
        - Plan de continuité d'activité

        **Checklist sécurité mensuelle :**
        ✅ Vérification des mises à jour système
        ✅ Contrôle des accès utilisateurs
        ✅ Test des sauvegardes
        ✅ Analyse des logs de sécurité
        ✅ Révision des incidents du mois
        ✅ Formation continue des équipes
      `
    },
    {
      id: "politique-confidentialite",
      title: "Rédiger une politique de confidentialité conforme",
      category: "Documentation",
      icon: FileText,
      tags: ["politique", "confidentialité", "transparence", "information"],
      content: `
        La politique de confidentialité est votre obligation de transparence envers les utilisateurs. Elle doit être claire, accessible et complète.

        **Informations obligatoires à inclure :**

        **1. Identité du responsable de traitement**
        - Nom et adresse de votre entreprise
        - Numéro de téléphone et email
        - Représentant légal
        - Contact du DPO si applicable

        **2. Finalités et bases légales**
        - Pourquoi collectez-vous ces données ?
        - Sur quelle base légale (consentement, contrat, intérêt légitime, etc.) ?
        - Caractère obligatoire ou facultatif
        - Conséquences en cas de non-fourniture

        **3. Catégories de données collectées**
        - Données d'identité (nom, prénom)
        - Données de contact (email, téléphone)
        - Données de connexion (IP, cookies)
        - Données sensibles le cas échéant

        **4. Destinataires des données**
        - Services internes concernés
        - Sous-traitants (hébergeur, analytics, etc.)
        - Partenaires commerciaux
        - Autorités publiques si applicable

        **5. Transferts hors UE**
        - Pays de destination
        - Garanties appropriées (décision d'adéquation, CCT)
        - Droit d'obtenir une copie des garanties

        **6. Durée de conservation**
        - Période de conservation active
        - Durée d'archivage intermédiaire
        - Critères de détermination des durées
        - Suppression automatique

        **7. Droits des personnes**
        - Description détaillée des 8 droits RGPD
        - Modalités d'exercice (email, courrier, formulaire)
        - Délais de réponse
        - Droit de réclamation auprès de la CNIL

        **8. Cookies et traceurs**
        - Types de cookies utilisés
        - Finalités de chaque cookie
        - Durée de conservation
        - Modalités de consentement et de retrait

        **9. Sécurité des données**
        - Mesures techniques et organisationnelles
        - Chiffrement et pseudonymisation
        - Contrôles d'accès
        - Plan de continuité

        **10. Modifications de la politique**
        - Information en cas de changement
        - Date de dernière mise à jour
        - Archivage des versions précédentes

        **Conseils de rédaction :**
        - Utilisez un langage simple et accessible
        - Évitez le jargon juridique
        - Structurez avec des titres clairs
        - Ajoutez des exemples concrets
        - Utilisez des puces et tableaux pour la lisibilité

        **Où placer la politique :**
        - Footer de votre site web
        - Lors de la collecte de données
        - Dans vos conditions générales
        - Formulaires de contact
        - Applications mobiles

        **Mise à jour obligatoire :**
        Révisez votre politique au minimum une fois par an et à chaque changement significatif de vos traitements.

        **Notre générateur automatique :**
        La plateforme génère automatiquement une politique conforme basée sur vos registres de traitement, garantissant cohérence et exhaustivité.
      `
    },
    {
      id: "formation-equipes",
      title: "Former et sensibiliser vos équipes au RGPD",
      category: "Formation",
      icon: Users,
      tags: ["formation", "sensibilisation", "équipes", "bonnes pratiques"],
      content: `
        La sensibilisation de vos équipes est cruciale pour maintenir votre conformité RGPD au quotidien.

        **Pourquoi former vos équipes ?**
        - 95% des violations de données sont dues à l'erreur humaine
        - Obligation légale de sensibilisation
        - Réduction des risques d'incidents
        - Amélioration de la culture sécurité
        - Responsabilisation de chacun

        **Qui former ?**
        - **Direction** : Gouvernance et responsabilités
        - **RH** : Gestion des données employés
        - **Commercial/Marketing** : Prospects et clients
        - **IT** : Sécurité technique
        - **Support client** : Gestion des demandes de droits
        - **Tous les employés** : Bonnes pratiques quotidiennes

        **Programme de formation type :**

        **Module 1 : Les bases du RGPD (1h)**
        - Qu'est-ce qu'une donnée personnelle ?
        - Les 6 principes fondamentaux
        - Obligations et sanctions
        - Droits des personnes concernées

        **Module 2 : Bonnes pratiques quotidiennes (1h)**
        - Collecte et traitement sécurisés
        - Gestion des mots de passe
        - Phishing et ingénierie sociale
        - Clean desk et écrans verrouillés
        - Télétravail sécurisé

        **Module 3 : Réagir aux demandes (30min)**
        - Reconnaître une demande de droit
        - Procédure d'escalade
        - Délais à respecter
        - Que faire en cas de doute

        **Module 4 : Gestion des incidents (30min)**
        - Détecter une violation de données
        - Alerter immédiatement
        - Préserver les preuves
        - Documentation de l'incident

        **Méthodes pédagogiques efficaces :**
        - **E-learning interactif** : Modules courts et ludiques
        - **Ateliers pratiques** : Cas concrets de votre secteur
        - **Serious games** : Simulation d'incidents
        - **Quiz réguliers** : Contrôle des connaissances
        - **Newsletter mensuelle** : Rappels et actualités

        **Indicateurs de suivi :**
        - Taux de participation aux formations
        - Scores aux quiz d'évaluation
        - Nombre d'incidents liés à l'humain
        - Temps de réaction aux demandes
        - Enquêtes de satisfaction

        **Formation continue :**
        - Session de rappel annuelle obligatoire
        - Formation des nouveaux entrants
        - Mise à jour en cas d'évolution réglementaire
        - Partage des retours d'expérience
        - Veille juridique partagée

        **Outils de sensibilisation :**
        - Affiches dans les bureaux
        - Écrans de veille informatiques
        - Guide de poche RGPD
        - Checklist des bonnes pratiques
        - Campagnes de phishing simulé

        **Personnalisation par métier :**
        - **RH** : Recrutement, dossier personnel, formation
        - **Commercial** : Prospection, CRM, consentement
        - **Marketing** : Newsletters, analytics, cookies
        - **Support** : Tickets, enregistrements, historique
        - **Comptabilité** : Factures, paiements, archivage

        **ROI de la formation :**
        Une équipe bien formée vous fait économiser :
        - Réduction de 70% des incidents humains
        - Gain de 50% sur le traitement des demandes
        - Évitement d'amendes CNIL potentielles
        - Amélioration de la confiance client
        - Avantage concurrentiel sur la protection des données
      `
    }
  ];

  // FAQ (Foire aux questions)
  const faqItems: FAQItem[] = [
    // Questions générales sur le RGPD
    {
      id: "rgpd-applicable",
      question: "Mon entreprise est-elle concernée par le RGPD ?",
      answer: "Oui, si vous traitez des données personnelles de résidents européens, peu importe votre localisation. Cela inclut : fichiers clients, employés, prospects, cookies sur votre site web, vidéosurveillance, etc. Même une micro-entreprise avec un simple formulaire de contact est concernée.",
      category: "Gouvernance"
    },
    {
      id: "donnees-personnelles",
      question: "Qu'est-ce qu'une donnée personnelle ?",
      answer: "Toute information permettant d'identifier directement ou indirectement une personne physique : nom, email, téléphone, adresse IP, numéro client, photo, empreinte digitale, données de géolocalisation, historique de navigation, etc. Même un pseudonyme peut être une donnée personnelle si on peut remonter à la personne.",
      category: "Gouvernance"
    },
    {
      id: "donnees-sensibles",
      question: "Quelles sont les données sensibles ?",
      answer: "Données révélant l'origine raciale/ethnique, opinions politiques, convictions religieuses, appartenance syndicale, données de santé, vie sexuelle, données biométriques/génétiques. Elles nécessitent des protections renforcées et souvent un consentement explicite.",
      category: "Gouvernance"
    },
    {
      id: "rgpd-vs-loi",
      question: "Quelle différence entre RGPD et loi informatique et libertés ?",
      answer: "Le RGPD est le règlement européen qui s'applique directement. La loi informatique et libertés a été modifiée pour s'adapter au RGPD. En cas de conflit, le RGPD prime. Les deux textes se complètent pour former le cadre juridique français.",
      category: "Gouvernance"
    },

    // Organisation et gouvernance
    {
      id: "dpo-obligatoire",
      question: "Dois-je nommer un DPO (Délégué à la Protection des Données) ?",
      answer: "C'est obligatoire si : vous êtes un organisme public, votre activité principale nécessite un suivi régulier et systématique des personnes, ou vous traitez des données sensibles à grande échelle. Sinon, c'est recommandé mais pas obligatoire. Un DPO peut être mutualisé ou externe.",
      category: "Gouvernance"
    },
    {
      id: "qui-responsable",
      question: "Qui est responsable de la conformité RGPD dans mon entreprise ?",
      answer: "Le dirigeant est le responsable légal final. Il peut déléguer opérationnellement à un DPO, un responsable informatique ou juridique, mais reste redevable devant les autorités. Toute l'entreprise doit être sensibilisée et impliquée.",
      category: "Gouvernance"
    },
    {
      id: "registre-obligatoire",
      question: "Le registre des traitements est-il obligatoire pour les PME ?",
      answer: "Oui, sauf exception pour les entreprises de moins de 250 salariés qui ne traitent que occasionnellement des données, sans risque pour les droits des personnes, et sans données sensibles. En pratique, quasiment toutes les entreprises doivent tenir un registre.",
      category: "Documentation"
    },
    {
      id: "comite-direction",
      question: "Dois-je impliquer ma direction dans le RGPD ?",
      answer: "Absolument. La direction doit porter la démarche, allouer les ressources nécessaires, valider les politiques et être formée aux enjeux. C'est un prérequis pour une conformité durable et crédible.",
      category: "Gouvernance"
    },

    // Mise en œuvre pratique
    {
      id: "duree-conformite",
      question: "Combien de temps pour être conforme ?",
      answer: "Cela dépend de votre situation de départ. Avec notre plateforme : diagnostic en 1h, plan d'action généré automatiquement, conformité de base en 3-6 mois, conformité complète en 6-12 mois. L'important est de commencer et de progresser étape par étape.",
      category: "Gouvernance"
    },
    {
      id: "cout-conformite",
      question: "Combien coûte la mise en conformité RGPD ?",
      answer: "Pour une PME : 5 000-20 000€ la première année (conseil, outils, formation), puis 2 000-5 000€/an en maintenance. Notre plateforme divise ces coûts par 3-5 en automatisant la documentation et les processus. ROI souvent positif dès la première année.",
      category: "Gouvernance"
    },
    {
      id: "par-ou-commencer",
      question: "Par où commencer ma mise en conformité ?",
      answer: "1) Faites notre diagnostic RGPD (30 min), 2) Cartographiez vos traitements principaux, 3) Vérifiez vos mentions légales et politique de confidentialité, 4) Sécurisez vos données critiques, 5) Formez vos équipes. Notre plateforme vous guide étape par étape.",
      category: "Gouvernance"
    },
    {
      id: "priorisation-actions",
      question: "Comment prioriser mes actions de conformité ?",
      answer: "Notre algorithme priorise automatiquement selon : 1) Risque juridique (sanctions), 2) Risque opérationnel (incidents), 3) Facilité de mise en œuvre, 4) Impact sur la conformité globale. Traitez d'abord les actions urgentes (rouges), puis importantes (orange).",
      category: "Gouvernance"
    },

    // Gestion des données
    {
      id: "conservation-donnees",
      question: "Combien de temps puis-je conserver les données ?",
      answer: "Durées légales courantes : clients actifs (pendant la relation + 3 ans), prospects (3 ans sans contact), employés (5 ans après départ), candidats non retenus (2 ans), vidéosurveillance (1 mois), logs techniques (1 an). À adapter selon votre secteur et obligations légales.",
      category: "Documentation"
    },
    {
      id: "suppression-donnees",
      question: "Comment supprimer définitivement des données ?",
      answer: "Suppression physique des fichiers + vidage des corbeilles + effacement des sauvegardes + nettoyage des caches. Pour les bases de données : suppression + réorganisation. Documentez le processus et gardez une trace de la suppression (sans garder les données supprimées).",
      category: "Documentation"
    },
    {
      id: "archivage-donnees",
      question: "Puis-je archiver les données au lieu de les supprimer ?",
      answer: "L'archivage intermédiaire est possible pour respecter des obligations légales (comptables, sociales). Les données archivées doivent être isolées, chiffrées, avec accès restreint et durée limitée. L'archivage définitif équivaut à une suppression avec obligation de conservation.",
      category: "Documentation"
    },

    // Bases légales et consentement
    {
      id: "base-legale-choisir",
      question: "Comment choisir la bonne base légale ?",
      answer: "Consentement : marketing, newsletters. Contrat : livraison, facturation. Obligation légale : comptabilité, paie. Intérêt légitime : prospection B2B, sécurité. Mission d'intérêt public : services publics. Intérêts vitaux : urgences médicales. Notre outil vous aide à choisir.",
      category: "Consentement"
    },
    {
      id: "consentement-valide",
      question: "Comment obtenir un consentement RGPD valide ?",
      answer: "Le consentement doit être libre (sans contrainte), spécifique (par finalité), éclairé (information claire), univoque (action positive). Évitez les cases pré-cochées, proposez des choix granulaires, permettez le retrait facile. Documentez la preuve du consentement.",
      category: "Consentement"
    },
    {
      id: "interet-legitime",
      question: "Puis-je utiliser l'intérêt légitime comme base légale ?",
      answer: "Oui, si votre intérêt est réel, nécessaire et équilibré par rapport aux droits de la personne. Exemples : prévention de la fraude, sécurité des biens, prospection de clients existants. Vous devez faire un test de proportionnalité et informer les personnes de leur droit d'opposition.",
      category: "Consentement"
    },

    // Droits des personnes
    {
      id: "demande-acces-repondre",
      question: "Comment répondre à une demande d'accès aux données ?",
      answer: "1) Vérifiez l'identité du demandeur, 2) Recherchez toutes ses données dans vos systèmes, 3) Fournissez les informations sous format accessible, 4) Joignez les informations sur les traitements (finalités, destinataires, durées). Délai : 1 mois. Notre plateforme automatise ce processus.",
      category: "Droits"
    },
    {
      id: "droit-effacement",
      question: "Dois-je toujours accepter une demande de suppression ?",
      answer: "Non. Vous pouvez refuser si : obligation légale de conservation, exercice de la liberté d'expression, intérêt public, recherche scientifique, constatation/exercice de droits en justice. Vous devez justifier votre refus et informer la personne de son droit de réclamation.",
      category: "Droits"
    },
    {
      id: "portabilite-donnees",
      question: "Que dois-je fournir pour une demande de portabilité ?",
      answer: "Les données que la personne a fournies, dans un format structuré, couramment utilisé et lisible par machine (CSV, JSON, XML). Uniquement pour les traitements automatisés basés sur le consentement ou un contrat. Vous pouvez facturer si la demande est manifestement excessive.",
      category: "Droits"
    },

    // Sous-traitance et partenaires
    {
      id: "sous-traitants",
      question: "Comment gérer mes sous-traitants ?",
      answer: "1) Identifiez tous vos sous-traitants, 2) Signez des contrats RGPD spécifiques (DPA - Data Processing Agreement), 3) Vérifiez leurs mesures de sécurité, 4) Auditez régulièrement, 5) Tenez un registre des sous-traitants. Ils doivent vous notifier toute violation sous 72h.",
      category: "Documentation"
    },
    {
      id: "contrat-sous-traitant",
      question: "Que doit contenir un contrat de sous-traitance RGPD ?",
      answer: "Objet, durée, nature et finalité du traitement, catégories de données, obligations du sous-traitant (sécurité, confidentialité, assistance), possibilité d'audit, retour/destruction des données, sous-traitance ultérieure autorisée, notification des violations, transferts hors UE.",
      category: "Documentation"
    },
    {
      id: "cloud-rgpd",
      question: "Puis-je utiliser des services cloud américains ?",
      answer: "Oui, mais avec précautions. Vérifiez que le fournisseur propose des clauses contractuelles types (CCT), évaluez les risques d'accès par les autorités étrangères, chiffrez vos données sensibles, choisissez la localisation UE quand c'est possible. Documentez votre analyse de risque.",
      category: "Sécurité"
    },

    // Sécurité et violations
    {
      id: "violation-detecter",
      question: "Comment détecter une violation de données ?",
      answer: "Surveillez : accès non autorisés, modifications suspectes, pertes d'équipements, piratages, erreurs humaines, pannes système. Mettez en place des logs, alertes automatiques, formations du personnel. Notre plateforme inclut une checklist de détection.",
      category: "Violations"
    },
    {
      id: "violation-notifier",
      question: "Dois-je toujours notifier une violation à la CNIL ?",
      answer: "Oui, sauf si la violation ne présente aucun risque pour les droits des personnes. Délai : 72h maximum. Décrivez les faits, les conséquences probables, les mesures prises. Si risque élevé, informez aussi les personnes concernées. Notre outil vous guide dans l'évaluation.",
      category: "Violations"
    },
    {
      id: "mesures-securite",
      question: "Quelles mesures de sécurité minimales dois-je mettre en place ?",
      answer: "Contrôle d'accès, chiffrement des données sensibles, mots de passe robustes + 2FA, antivirus, firewall, sauvegardes chiffrées, mise à jour des systèmes, formation du personnel, plan de réponse aux incidents. Adaptez selon vos risques et ressources.",
      category: "Sécurité"
    },

    // Digital et cookies
    {
      id: "cookies-conformite",
      question: "Mon site web est-il conforme pour les cookies ?",
      answer: "Vérifiez : bandeau de consentement granulaire, refus aussi facile que l'acceptation, information claire sur chaque cookie, pas de dépôt avant consentement (sauf cookies essentiels), possibilité de retirer le consentement. Auditez régulièrement avec des outils spécialisés.",
      category: "Consentement"
    },
    {
      id: "google-analytics",
      question: "Puis-je utiliser Google Analytics en conformité RGPD ?",
      answer: "Oui, avec précautions : configurez GA4 en mode consentement, anonymisez les IP, signez les CCT avec Google, informez dans votre politique de confidentialité, permettez l'opt-out. Alternative : solutions européennes comme Matomo ou AT Internet.",
      category: "Consentement"
    },
    {
      id: "newsletter-rgpd",
      question: "Comment envoyer des newsletters conformes RGPD ?",
      answer: "Base légale : consentement explicite (double opt-in recommandé). Informez sur : finalité, fréquence, type de contenu, droit de désinscription. Facilitez l'opt-out (lien dans chaque email), tenez un registre des consentements, nettoyez régulièrement vos listes.",
      category: "Consentement"
    },

    // Sanctions et contrôles
    {
      id: "sanctions-rgpd",
      question: "Quels risques si je ne suis pas conforme ?",
      answer: "Amendes jusqu'à 4% du CA annuel ou 20M€, sanctions pénales possibles, interdiction de traitement, atteinte à la réputation, perte de confiance client. La CNIL privilégie l'accompagnement pour les TPE/PME de bonne foi. L'important est de démontrer vos efforts de conformité.",
      category: "Violations"
    },
    {
      id: "controle-cnil",
      question: "Comment se déroule un contrôle CNIL ?",
      answer: "Contrôle sur place, en ligne ou sur convocation. La CNIL vérifie vos registres, politiques, mesures de sécurité, gestion des droits. Préparez : documentation à jour, désignation d'un interlocuteur, accès aux systèmes. Coopérez pleinement et montrez votre bonne foi.",
      category: "Gouvernance"
    },
    {
      id: "recours-cnil",
      question: "Puis-je contester une sanction CNIL ?",
      answer: "Oui, recours devant le Conseil d'État dans les 2 mois. Vous pouvez aussi demander un référé-suspension si la sanction cause un préjudice grave. Faites-vous accompagner par un avocat spécialisé. La jurisprudence évolue en faveur d'une approche proportionnée.",
      category: "Violations"
    },

    // Transferts internationaux
    {
      id: "transferts-hors-ue",
      question: "Puis-je transférer des données hors UE ?",
      answer: "Oui, avec garanties : pays avec décision d'adéquation (UK, Suisse, Canada...), clauses contractuelles types (CCT), règles d'entreprise contraignantes (BCR), certification approuvée, ou dérogations spécifiques (consentement, contrat, intérêt public).",
      category: "Documentation"
    },
    {
      id: "privacy-shield",
      question: "Le Privacy Shield existe-t-il encore ?",
      answer: "Non, invalidé en juillet 2020. Pour les USA : utilisez les nouvelles clauses contractuelles types (CCT), évaluez les risques d'accès gouvernemental, implémentez des mesures supplémentaires (chiffrement, pseudonymisation). Le Data Privacy Framework est en cours de négociation.",
      category: "Documentation"
    },

    // Secteurs spécifiques
    {
      id: "rgpd-sante",
      question: "Quelles spécificités RGPD dans le secteur santé ?",
      answer: "Données de santé = données sensibles, besoin d'une base légale renforcée (consentement explicite ou intérêt public), sécurité renforcée, secret médical, hébergement de données de santé (HDS), durées de conservation spécifiques. Impliquez votre DPO et juriste santé.",
      category: "Sécurité"
    },
    {
      id: "rgpd-rh",
      question: "Comment appliquer le RGPD aux ressources humaines ?",
      answer: "Licéité : contrat de travail principalement. Informez les candidats et employés, limitez la collecte au nécessaire, sécurisez les dossiers, respectez les durées de conservation (5 ans post-départ), gérez les droits d'accès/rectification. Attention aux données sensibles (santé, syndicats).",
      category: "Formation"
    },
    {
      id: "rgpd-ecommerce",
      question: "Spécificités RGPD pour un site e-commerce ?",
      answer: "Gestion complexe : clients, prospects, cookies, paiements, livraisons, avis. Bases légales multiples (contrat, consentement, intérêt légitime). Sécurisez les paiements, gérez les comptes clients, cookies de panier, analytics, remarketing. Politiques claires et consentement granulaire.",
      category: "Consentement"
    }
  ];

  // Glossaire des termes techniques
  const glossaryTerms: GlossaryTerm[] = [
    {
      term: "RGPD",
      definition: "Règlement Général sur la Protection des Données. Règlement européen 2016/679 qui encadre le traitement des données personnelles sur le territoire de l'Union européenne depuis le 25 mai 2018.",
      relatedTerms: ["CNIL", "DPO", "Données personnelles"]
    },
    {
      term: "CNIL",
      definition: "Commission Nationale de l'Informatique et des Libertés. Autorité française de contrôle en matière de protection des données personnelles.",
      relatedTerms: ["RGPD", "Sanctions", "Déclaration"]
    },
    {
      term: "DPO",
      definition: "Délégué à la Protection des Données (Data Protection Officer). Personne chargée de veiller au respect du RGPD au sein de l'organisation.",
      relatedTerms: ["RGPD", "Conformité", "Formation"]
    },
    {
      term: "DPIA",
      definition: "Data Protection Impact Assessment ou Analyse d'Impact relative à la Protection des Données (AIPD). Étude obligatoire pour les traitements présentant des risques élevés pour les droits et libertés des personnes.",
      relatedTerms: ["Risques", "Évaluation", "Traitement"]
    },
    {
      term: "Base légale",
      definition: "Fondement juridique qui autorise le traitement des données personnelles : consentement, contrat, obligation légale, sauvegarde des intérêts vitaux, mission d'intérêt public, intérêt légitime.",
      relatedTerms: ["Consentement", "Intérêt légitime", "Licéité"]
    },
    {
      term: "Consentement",
      definition: "Manifestation de volonté libre, spécifique, éclairée et univoque par laquelle la personne accepte le traitement de ses données personnelles.",
      relatedTerms: ["Base légale", "Retrait", "Granularité"]
    },
    {
      term: "Responsable de traitement",
      definition: "Personne physique ou morale qui détermine les finalités et les moyens du traitement des données personnelles.",
      relatedTerms: ["Sous-traitant", "Co-responsables", "Accountability"]
    },
    {
      term: "Sous-traitant",
      definition: "Personne physique ou morale qui traite des données personnelles pour le compte du responsable de traitement.",
      relatedTerms: ["Responsable de traitement", "Contrat", "Instructions"]
    },
    {
      term: "Données sensibles",
      definition: "Données révélant l'origine raciale/ethnique, opinions politiques, convictions religieuses, appartenance syndicale, données de santé, vie sexuelle, données biométriques/génétiques.",
      relatedTerms: ["Protection renforcée", "Exceptions", "Consentement explicite"]
    },
    {
      term: "Pseudonymisation",
      definition: "Traitement des données personnelles de telle façon qu'elles ne puissent plus être attribuées à une personne concernée sans information supplémentaire conservée séparément.",
      relatedTerms: ["Anonymisation", "Chiffrement", "Sécurité"]
    },
    {
      term: "Violation de données",
      definition: "Incident de sécurité entraînant la destruction, la perte, l'altération, la divulgation non autorisée ou l'accès non autorisé à des données personnelles.",
      relatedTerms: ["Notification", "72 heures", "CNIL"]
    },
    {
      term: "Privacy by design",
      definition: "Principe selon lequel la protection des données doit être intégrée dès la conception des traitements et par défaut.",
      relatedTerms: ["Privacy by default", "Conception", "Minimisation"]
    }
  ];

  // Mises à jour et nouveautés
  const updates: UpdateItem[] = [
    {
      id: "update-1",
      date: "2025-01-05",
      version: "2.3.0",
      title: "Nouvelle interface de gestion des violations",
      description: "Interface repensée avec 10 sections conformes aux directives EDPB, analyse IA intégrée et export CSV.",
      type: "feature"
    },
    {
      id: "update-2",
      date: "2025-01-02",
      version: "2.2.5",
      title: "Amélioration du système de notifications",
      description: "Notifications en temps réel pour les actions urgentes et les échéances importantes.",
      type: "improvement"
    },
    {
      id: "update-3",
      date: "2024-12-20",
      version: "2.2.0",
      title: "Assistant IA pour les registres de traitement",
      description: "Génération automatique de registres conformes à partir d'une description en langage naturel.",
      type: "feature"
    },
    {
      id: "update-4",
      date: "2024-12-15",
      version: "2.1.8",
      title: "Correction du calcul des scores DPIA",
      description: "Correction d'un bug dans l'évaluation automatique des critères DPIA selon les standards CNIL.",
      type: "bugfix"
    },
    {
      id: "update-5",
      date: "2024-12-10",
      version: "2.1.0",
      title: "Système de multi-tenant renforcé",
      description: "Isolation complète des données entre entreprises et gestion avancée des permissions utilisateurs.",
      type: "feature"
    }
  ];

  // Filtrage des articles et FAQ
  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = searchTerm === "" || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredGlossary = glossaryTerms.filter(term => {
    const matchesSearch = searchTerm === "" || 
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Catégories uniques pour le filtre
  const categories = ["all", ...Array.from(new Set(helpArticles.map(article => article.category)))];

  const getUpdateTypeIcon = (type: UpdateItem['type']) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-4 h-4 text-blue-500" />;
      case 'improvement': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'bugfix': return <Settings className="w-4 h-4 text-orange-500" />;
    }
  };

  const getUpdateTypeBadge = (type: UpdateItem['type']) => {
    switch (type) {
      case 'feature': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Nouveauté</Badge>;
      case 'improvement': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Amélioration</Badge>;
      case 'bugfix': return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">Correction</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Centre d'aide</h1>
        <p className="text-muted-foreground">
          Tout ce que vous devez savoir pour maîtriser votre conformité RGPD
        </p>
      </div>

      {/* Barre de recherche */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher dans l'aide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="all">Toutes les catégories</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            <span className="hidden sm:inline">Glossaire</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveautés</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        {/* Articles explicatifs détaillés */}
        <TabsContent value="articles" className="space-y-6">
          <div className="grid gap-6">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Aucun article trouvé pour votre recherche.</p>
                </CardContent>
              </Card>
            ) : (
              filteredArticles.map((article) => {
                const IconComponent = article.icon;
                const isExpanded = expandedArticle === article.id;
                return (
                  <Card key={article.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {article.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {article.category}
                              </Badge>
                              {article.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                          className="shrink-0"
                        >
                          {isExpanded ? "Réduire" : "Lire plus"}
                          <ChevronRight className={cn(
                            "w-4 h-4 ml-1 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                          {isExpanded 
                            ? article.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
                            : `${article.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').substring(0, 300)}...`
                          }
                        </div>
                      </div>
                      {!isExpanded && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedArticle(article.id)}
                            className="w-full"
                          >
                            Lire l'article complet
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Questions fréquemment posées</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trouvez rapidement des réponses aux questions les plus courantes sur le RGPD
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucune question trouvée pour votre recherche.</p>
                  </div>
                ) : (
                  filteredFAQ.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.category}
                          </Badge>
                          <span>{item.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glossaire */}
        <TabsContent value="glossary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Glossaire RGPD</CardTitle>
              <p className="text-sm text-muted-foreground">
                Définitions des termes techniques et juridiques liés à la protection des données
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGlossary.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun terme trouvé pour votre recherche.</p>
                  </div>
                ) : (
                  filteredGlossary.map((term) => (
                    <div key={term.term} className="border-b border-border pb-4 last:border-b-0">
                      <h3 className="font-semibold text-foreground mb-2">{term.term}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {term.definition}
                      </p>
                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-2">Voir aussi :</span>
                          {term.relatedTerms.map((relatedTerm) => (
                            <Badge key={relatedTerm} variant="outline" className="text-xs">
                              {relatedTerm}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mises à jour et nouveautés */}
        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mises à jour et nouveautés</CardTitle>
              <p className="text-sm text-muted-foreground">
                Découvrez les dernières améliorations et nouvelles fonctionnalités de la plateforme
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getUpdateTypeIcon(update.type)}
                        <div>
                          <h3 className="font-semibold text-foreground">{update.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.date).toLocaleDateString('fr-FR')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              v{update.version}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {getUpdateTypeBadge(update.type)}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {update.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact support */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Support technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour toute question technique ou problème d'utilisation de la plateforme.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>support@gdpr-platform.fr</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Délai de réponse : 24h en moyenne</span>
                  </div>
                </div>
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacter le support
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Conseil juridique RGPD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour des questions spécifiques sur la conformité RGPD et l'interprétation légale.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>juridique@gdpr-platform.fr</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Délai de réponse : 48h en moyenne</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Conseil juridique
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ressources utiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-semibold">Site officiel CNIL</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Documentation officielle et guides pratiques
                  </span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-semibold">Texte du RGPD</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Règlement européen complet
                  </span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-semibold">Modèles CNIL</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Templates et exemples pratiques
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}