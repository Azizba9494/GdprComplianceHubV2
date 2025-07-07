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

  // Articles explicatifs détaillés
  const helpArticles: HelpArticle[] = [
    {
      id: "diagnostic-rgpd",
      title: "Comment réaliser le diagnostic RGPD",
      category: "Diagnostic",
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
      `
    }
  ];

  // FAQ (Foire aux questions)
  const faqItems: FAQItem[] = [
    {
      id: "rgpd-applicable",
      question: "Mon entreprise est-elle concernée par le RGPD ?",
      answer: "Oui, si vous traitez des données personnelles de résidents européens, peu importe votre localisation. Cela inclut : fichiers clients, employés, prospects, cookies sur votre site web, vidéosurveillance, etc.",
      category: "Général"
    },
    {
      id: "donnees-personnelles",
      question: "Qu'est-ce qu'une donnée personnelle ?",
      answer: "Toute information permettant d'identifier directement ou indirectement une personne physique : nom, email, téléphone, adresse IP, numéro client, photo, empreinte digitale, etc.",
      category: "Général"
    },
    {
      id: "dpo-obligatoire",
      question: "Dois-je nommer un DPO (Délégué à la Protection des Données) ?",
      answer: "C'est obligatoire si : vous êtes un organisme public, votre activité principale nécessite un suivi régulier et systématique des personnes, ou vous traitez des données sensibles à grande échelle. Sinon, c'est recommandé.",
      category: "Organisation"
    },
    {
      id: "sanctions-rgpd",
      question: "Quels risques si je ne suis pas conforme ?",
      answer: "Amendes jusqu'à 4% du CA annuel ou 20M€, sanctions pénales possibles, interdiction de traitement, atteinte à la réputation. La CNIL privilégie l'accompagnement pour les TPE/PME en cas de bonne foi.",
      category: "Sanctions"
    },
    {
      id: "duree-conformite",
      question: "Combien de temps pour être conforme ?",
      answer: "Cela dépend de votre situation actuelle. Notre diagnostic évalue votre niveau et génère un plan d'action personnalisé. Comptez 3-6 mois pour une conformité de base, 6-12 mois pour une conformité complète.",
      category: "Mise en œuvre"
    },
    {
      id: "cout-conformite",
      question: "Combien coûte la mise en conformité RGPD ?",
      answer: "Les coûts varient selon votre taille et complexité. Notre plateforme vous aide à optimiser les coûts en priorisant les actions et en automatisant la documentation. Investissez progressivement selon vos priorités.",
      category: "Budget"
    },
    {
      id: "sous-traitants",
      question: "Comment gérer mes sous-traitants ?",
      answer: "Vous devez : identifier tous vos sous-traitants, signer des contrats RGPD spécifiques, vérifier leurs mesures de sécurité, et maintenir un registre de vos sous-traitants.",
      category: "Sous-traitance"
    },
    {
      id: "cookies-conformite",
      question: "Mon site web est-il conforme pour les cookies ?",
      answer: "Vous devez : obtenir le consentement pour les cookies non essentiels, permettre le refus aussi facilement que l'acceptation, informer clairement sur l'usage des cookies, et permettre le retrait du consentement.",
      category: "Digital"
    },
    {
      id: "conservation-donnees",
      question: "Combien de temps puis-je conserver les données ?",
      answer: "La durée dépend de la finalité du traitement et des obligations légales. En général : données clients (3 ans après fin de relation), CV non retenus (2 ans), données de vidéosurveillance (1 mois).",
      category: "Conservation"
    },
    {
      id: "transferts-hors-ue",
      question: "Puis-je transférer des données hors UE ?",
      answer: "Oui, mais sous conditions : pays avec décision d'adéquation, clauses contractuelles types (CCT), règles d'entreprise contraignantes (BCR), ou dérogations spécifiques.",
      category: "Transferts"
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
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                          {article.content.substring(0, 300)}...
                        </div>
                      </div>
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