import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { ExpandableText } from "@/components/ui/expandable-text";
import { 
  BarChart3, 
  Loader2, 
  Search, 
  Download, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  FileText, 
  Users, 
  FileSearch, 
  ArrowLeft, 
  Trash2, 
  HelpCircle 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CNIL_MANDATORY_TREATMENTS = [
  "Traitements d'évaluation, y compris de profilage, et de prédiction relatifs aux aspects concernant les performances au travail, la situation économique, la santé, les préférences ou centres d'intérêt personnels, la fiabilité ou le comportement, la localisation ou les déplacements de la personne concernée",
  "Traitements ayant pour effet d'exclure des personnes du bénéfice d'un droit, d'un service ou d'un contrat en l'absence de motif légitime",
  "Traitements portant sur des données sensibles ou des données à caractère hautement personnel (données de santé, biométriques, de géolocalisation, etc.)",
  "Traitements de données personnelles à grande échelle",
  "Traitements de croisement, combinaison ou appariement de données",
  "Traitements de données concernant des personnes vulnérables (mineurs, personnes âgées, patients, etc.)",
  "Traitements impliquant l'utilisation de nouvelles technologies ou d'usages nouveaux de technologies existantes",
  "Traitements qui empêchent les personnes d'exercer un droit ou de bénéficier d'un service ou d'un contrat",
  "Traitements de données de santé mis en œuvre par les établissements de santé ou les établissements médico-sociaux pour la prise en charge des personnes",
  "Traitements portant sur des données génétiques de personnes dites « vulnérables » (patients, employés, enfants, etc.)",
  "Traitements établissant des profils de personnes physiques à des fins de gestion des ressources humaines",
  "Traitements ayant pour finalité de surveiller de manière constante l'activité des employés concernés",
  "Traitements ayant pour finalité la gestion des alertes et des signalements en matière sociale et sanitaire",
  "Traitements ayant pour finalité la gestion des alertes et des signalements en matière professionnelle",
  "Traitements des données de santé nécessaires à la constitution d'un entrepôt de données ou d'un registre",
  "Traitements impliquant le profilage des personnes pouvant aboutir à leur exclusion du bénéfice d'un contrat ou à la suspension voire à la rupture de celui-ci",
  "Traitements mutualisés de manquements contractuels constatés, susceptibles d'aboutir à une décision d'exclusion ou de suspension du bénéfice d'un contrat",
  "Traitements de profilage faisant appel à des données provenant de sources externes",
  "Traitements de données biométriques aux fins de reconnaissance des personnes parmi lesquelles figurent des personnes dites « vulnérables » (élèves, personnes âgées, patients, demandeurs d'asile, etc.)",
  "Instruction des demandes et gestion des logements sociaux",
  "Traitements ayant pour finalité l'accompagnement social ou médico-social des personnes",
  "Traitements de données de localisation à large échelle"
];

interface ProcessingRecord {
  id: number;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  recipients: string[];
  retention: string;
  securityMeasures: string[];
  transfersOutsideEU: boolean;
  type: string;
  createdAt: string;
}

const DPIA_CRITERIA = [
  {
    id: 'scoring',
    question: 'Le traitement implique-t-il une évaluation ou une notation de personnes sur la base de leurs données, y compris le profilage ?',
    examples: 'Exemples : score de crédit, évaluation de la performance d\'un employé, profilage marketing pour prédire les préférences, diagnostic médical automatisé'
  },
  {
    id: 'automatedDecision',
    question: 'Le traitement conduit-il à une prise de décision entièrement automatisée (sans intervention humaine) ayant un effet juridique ou vous affectant de manière significative ?',
    examples: 'Exemples : refus automatisé d\'un crédit en ligne, décision d\'éligibilité à une prestation sociale, tri automatique de CV menant à un rejet sans examen humain'
  },
  {
    id: 'systematicMonitoring',
    question: 'Le traitement implique-t-il une surveillance systématique et continue de personnes ?',
    examples: 'Exemples : vidéosurveillance d\'un lieu public ou d\'employés, surveillance de l\'activité réseau, géolocalisation continue de véhicules'
  },
  {
    id: 'sensitiveData',
    question: 'Le traitement porte-t-il sur des données dites "sensibles" (santé, opinions politiques/religieuses, orientation sexuelle) ou d\'autres données à caractère hautement personnel ?',
    examples: 'Exemples : dossiers médicaux, données biométriques, données de localisation précises, données financières détaillées'
  },
  {
    id: 'largeScale',
    question: 'Les données sont-elles traitées à "grande échelle" ? (Pensez en volume de données, nombre de personnes, zone géographique, durée)',
    examples: 'Exemples : données des utilisateurs d\'un réseau social national, données des patients d\'une chaîne d\'hôpitaux, données de géolocalisation collectées par une application populaire'
  },
  {
    id: 'dataCombination',
    question: 'Le traitement consiste-t-il à croiser ou combiner des ensembles de données provenant de différentes sources ou collectées pour différents objectifs ?',
    examples: 'Exemples : croiser les données de navigation d\'un site web avec des informations d\'achat en magasin ; enrichir une base de données clients avec des données achetées à des courtiers en données'
  },
  {
    id: 'vulnerablePersons',
    question: 'Le traitement concerne-t-il des personnes considérées comme "vulnérables", qui ont des difficultés à consentir ou à s\'opposer au traitement ?',
    examples: 'Exemples : enfants, patients, personnes âgées, employés (en raison du lien de subordination), demandeurs d\'asile'
  },
  {
    id: 'innovativeTechnology',
    question: 'Le traitement fait-il appel à une technologie innovante ou à un usage nouveau d\'une technologie existante, pouvant créer de nouveaux types de risques ?',
    examples: 'Exemples : utilisation de l\'Intelligence Artificielle pour l\'analyse de personnalité, objets connectés (IoT), reconnaissance faciale, neuro-technologies'
  },
  {
    id: 'obstacleToRight',
    question: 'Le traitement peut-il avoir pour conséquence d\'empêcher une personne d\'exercer un droit ou de bénéficier d\'un service ou d\'un contrat ?',
    examples: 'Exemples : utiliser un score de crédit pour refuser un prêt ou un logement, utiliser un profil de risque pour refuser une assurance'
  }
];

export default function DpiaEvaluationOriginal() {
  const [, setLocation] = useLocation();
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showFullDpia, setShowFullDpia] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [evaluationResults, setEvaluationResults] = useState<Record<number, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();

  // Formulaires
  const evaluationForm = useForm({
    defaultValues: {
      scoring: "",
      automatedDecision: "",
      systematicMonitoring: "",
      sensitiveData: "",
      largeScale: "",
      largeScaleEstimate: "",
      dataCombination: "",
      vulnerablePersons: "",
      innovativeTechnology: "",
      obstacleToRight: ""
    }
  });

  const dpiaForm = useForm({
    defaultValues: {
      processingName: "",
      processingDescription: "",
    },
  });

  // Requêtes de données
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/records', currentCompany?.id],
    queryFn: () => currentCompany ? fetch(`/api/records/${currentCompany.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/dpia', currentCompany?.id],
    queryFn: () => currentCompany ? fetch(`/api/dpia/${currentCompany.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: storedEvaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['/api/dpia-evaluations', currentCompany?.id],
    queryFn: () => currentCompany ? fetch(`/api/dpia-evaluations/${currentCompany.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  // Filtrer les traitements de responsable uniquement
  const controllerRecords = records?.filter((record: ProcessingRecord) => record.type === 'controller') || [];

  // Charger les évaluations stockées au démarrage
  useEffect(() => {
    if (storedEvaluations && storedEvaluations.length > 0) {
      const results: Record<number, any> = {};
      storedEvaluations.forEach((evaluation: any) => {
        results[evaluation.recordId] = {
          ...evaluation,
          criteriaAnswers: evaluation.criteriaAnswers ? JSON.parse(evaluation.criteriaAnswers) : {}
        };
      });
      setEvaluationResults(results);
    }
  }, [storedEvaluations]);

  // Fonctions utilitaires
  const checkCnilMandatoryList = async (record: ProcessingRecord): Promise<string | null> => {
    // Vérifier si le traitement correspond à la liste CNIL
    const cnilTypes = [
      "Traitements d'évaluation ou de notation des personnes",
      "Prise de décision entièrement automatisée",
      "Surveillance systématique à grande échelle",
      "Données sensibles ou hautement personnelles à grande échelle",
      "Données relatives aux condamnations pénales et aux infractions",
      "Biométrie pour identifier de manière unique une personne",
      "Données génétiques",
      "Données de localisation à grande échelle",
      "Données d'enfants à grande échelle",
      "Données relatives à la santé"
    ];

    // Simulation de vérification (à remplacer par IA si disponible)
    const keywords = [record.name, record.purpose, ...(record.dataCategories || [])].join(' ').toLowerCase();
    
    if (keywords.includes('biométr') || keywords.includes('reconnaissance')) {
      return "Biométrie pour identifier de manière unique une personne";
    }
    if (keywords.includes('santé') || keywords.includes('médical')) {
      return "Données relatives à la santé";
    }
    if (keywords.includes('enfant') || keywords.includes('mineur')) {
      return "Données d'enfants à grande échelle";
    }
    if (keywords.includes('géolocalisation') || keywords.includes('localisation')) {
      return "Données de localisation à grande échelle";
    }
    
    return null;
  };

  // Mutations
  const evaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      const answers = {
        scoring: data.scoring === "oui",
        automatedDecision: data.automatedDecision === "oui",
        systematicMonitoring: data.systematicMonitoring === "oui",
        sensitiveData: data.sensitiveData === "oui",
        largeScale: data.largeScale === "oui",
        dataCombination: data.dataCombination === "oui",
        vulnerablePersons: data.vulnerablePersons === "oui",
        innovativeTechnology: data.innovativeTechnology === "oui",
        obstacleToRight: data.obstacleToRight === "oui"
      };

      // Calcul du score avec pondération pour "incertain"
      const uncertainAnswers = {
        scoring: data.scoring === "incertain",
        automatedDecision: data.automatedDecision === "incertain",
        systematicMonitoring: data.systematicMonitoring === "incertain",
        sensitiveData: data.sensitiveData === "incertain",
        largeScale: data.largeScale === "incertain",
        dataCombination: data.dataCombination === "incertain",
        vulnerablePersons: data.vulnerablePersons === "incertain",
        innovativeTechnology: data.innovativeTechnology === "incertain",
        obstacleToRight: data.obstacleToRight === "incertain"
      };

      const yesCount = Object.values(answers).filter(Boolean).length;
      const uncertainCount = Object.values(uncertainAnswers).filter(Boolean).length;
      
      // Score total : oui = 1 point, incertain = 0.5 point
      const score = yesCount + (uncertainCount * 0.5);
      
      // Vérifier la liste CNIL
      const cnilMatch = await checkCnilMandatoryList(selectedRecord!);
      
      let recommendation = "";
      let justification = "";
      
      if (cnilMatch) {
        recommendation = "AIPD obligatoire (Liste CNIL)";
        justification = `Ce traitement figure dans la liste des types d'opérations de traitement pour lesquelles une AIPD est requise : "${cnilMatch}". Une AIPD est donc obligatoire selon l'article 35.4 du RGPD.`;
      } else if (score >= 2) {
        recommendation = "AIPD fortement recommandée / obligatoire";
        justification = `Notre analyse préliminaire indique que ce traitement est susceptible d'engendrer un risque élevé. La réalisation d'une AIPD est nécessaire avec un score de ${score.toFixed(1)}/9 (réponses "Oui" = 1 point, "Incertain" = 0.5 point).`;
      } else if (score >= 1) {
        recommendation = "Vigilance requise";
        justification = `Une AIPD n'est pas strictement obligatoire sur la seule base de ces critères (score: ${score.toFixed(1)}/9), mais la présence de facteurs de risque justifie une analyse plus approfondie pour confirmer l'absence de risque élevé.`;
      } else {
        recommendation = "AIPD non requise à première vue";
        justification = `Aucun critère de risque majeur identifié (score: ${score.toFixed(1)}/9). Il est tout de même nécessaire de documenter cette analyse et de rester vigilant à toute évolution du traitement.`;
      }

      // Sauvegarder en base de données
      const evaluationData = {
        companyId: currentCompany?.id,
        recordId: selectedRecord!.id,
        score,
        recommendation,
        justification,
        criteriaAnswers: JSON.stringify(answers),
        cnilListMatch: cnilMatch,
        largeScaleEstimate: data.largeScaleEstimate || null
      };

      // Vérifier si une évaluation existe déjà
      const existingEvaluation = storedEvaluations?.find((evaluation: any) => evaluation.recordId === selectedRecord!.id);
      
      let savedEvaluation;
      if (existingEvaluation) {
        const response = await fetch(`/api/dpia-evaluations/${existingEvaluation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evaluationData)
        });
        savedEvaluation = await response.json();
      } else {
        const response = await fetch('/api/dpia-evaluations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evaluationData)
        });
        savedEvaluation = await response.json();
      }

      const result = {
        ...savedEvaluation,
        criteriaAnswers: answers
      };

      setEvaluationResults(prev => ({
        ...prev,
        [selectedRecord!.id]: result
      }));

      return result;
    },
    onSuccess: () => {
      if (currentCompany) {
        queryClient.invalidateQueries({ queryKey: ['/api/dpia-evaluations', currentCompany.id] });
      }
      toast({
        title: "Évaluation terminée",
        description: "L'évaluation AIPD a été enregistrée avec succès."
      });
      setShowEvaluation(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation",
        variant: "destructive"
      });
    }
  });

  const handleRecordSelect = (record: ProcessingRecord) => {
    // Vérifier les permissions avant de permettre l'évaluation
    if (!hasPermission('dpia', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour les analyses d'impact. Pour procéder à une évaluation DPIA, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedRecord(record);
    setShowEvaluation(true);
    
    // Pré-remplir le formulaire si une évaluation existe
    const existingEvaluation = evaluationResults[record.id];
    if (existingEvaluation?.criteriaAnswers) {
      const answers = existingEvaluation.criteriaAnswers;
      evaluationForm.reset({
        scoring: answers.scoring ? "oui" : "non",
        automatedDecision: answers.automatedDecision ? "oui" : "non",
        systematicMonitoring: answers.systematicMonitoring ? "oui" : "non",
        sensitiveData: answers.sensitiveData ? "oui" : "non",
        largeScale: answers.largeScale ? "oui" : "non",
        dataCombination: answers.dataCombination ? "oui" : "non",
        vulnerablePersons: answers.vulnerablePersons ? "oui" : "non",
        innovativeTechnology: answers.innovativeTechnology ? "oui" : "non",
        obstacleToRight: answers.obstacleToRight ? "oui" : "non",
        largeScaleEstimate: existingEvaluation.largeScaleEstimate || ""
      });
    } else {
      evaluationForm.reset({
        scoring: "",
        automatedDecision: "",
        systematicMonitoring: "",
        sensitiveData: "",
        largeScale: "",
        largeScaleEstimate: "",
        dataCombination: "",
        vulnerablePersons: "",
        innovativeTechnology: "",
        obstacleToRight: ""
      });
    }
  };

  const deleteEvaluation = async (recordId: number) => {
    // Vérifier les permissions avant de permettre la suppression
    if (!hasPermission('dpia', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour les analyses d'impact. Pour supprimer une évaluation DPIA, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    const evaluation = evaluationResults[recordId];
    if (!evaluation) return;

    try {
      await fetch(`/api/dpia-evaluations/${evaluation.id}`, {
        method: 'DELETE'
      });
      
      setEvaluationResults(prev => {
        const newResults = { ...prev };
        delete newResults[recordId];
        return newResults;
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/dpia-evaluations'] });
      toast({
        title: "Évaluation supprimée",
        description: "L'évaluation a été supprimée avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'évaluation",
        variant: "destructive"
      });
    }
  };

  if (recordsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement des traitements...</span>
        </div>
      </div>
    );
  }

  if (showEvaluation && selectedRecord) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowEvaluation(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Évaluation AIPD
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Traitement : {selectedRecord.name}
          </p>
        </div>

        <Form {...evaluationForm}>
          <form onSubmit={evaluationForm.handleSubmit((data) => evaluationMutation.mutate(data))} className="space-y-8">
            {/* Informations du traitement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations du traitement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Nom du traitement</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedRecord.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Finalité</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedRecord.purpose}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Base légale</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedRecord.legalBasis}</p>
                  </div>
                  {selectedRecord.dataCategories && selectedRecord.dataCategories.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Catégories de données</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedRecord.dataCategories.map((category, index) => (
                          <Badge key={index} variant="outline">{category}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critères d'évaluation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Critères d'évaluation AIPD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Répondez à chaque critère en vous basant sur les caractéristiques de votre traitement.</p>
                      <p><strong>Système de notation :</strong></p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li><strong>Oui</strong> = 1 point (critère clairement présent)</li>
                        <li><strong>Incertain</strong> = 0.5 point (critère possiblement présent, nécessite clarification)</li>
                        <li><strong>Non</strong> = 0 point (critère absent)</li>
                      </ul>
                      <p>Si le score total atteint 2 points ou plus, une AIPD sera probablement obligatoire.</p>
                    </div>
                  </AlertDescription>
                </Alert>

                {DPIA_CRITERIA.map((criterion, index) => (
                  <div key={criterion.id} className="space-y-4">
                    <FormField
                      control={evaluationForm.control}
                      name={criterion.id as any}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-medium">
                            {index + 1}. {criterion.question}
                          </FormLabel>
                          <ExpandableText 
                            text={criterion.examples} 
                            maxLength={100}
                            className="text-sm text-gray-600 dark:text-gray-400"
                          />
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-row gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="oui" id={`${criterion.id}-oui`} />
                                <label htmlFor={`${criterion.id}-oui`}>Oui</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="non" id={`${criterion.id}-non`} />
                                <label htmlFor={`${criterion.id}-non`}>Non</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="incertain" id={`${criterion.id}-incertain`} />
                                <label htmlFor={`${criterion.id}-incertain`}>Incertain</label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {index < DPIA_CRITERIA.length - 1 && <Separator />}
                  </div>
                ))}

                <FormField
                  control={evaluationForm.control}
                  name="largeScaleEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Estimation du nombre de personnes concernées (si traitement à grande échelle)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Environ 10,000 clients, 500 employés..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEvaluation(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={evaluationMutation.isPending}
                className="flex items-center gap-2"
              >
                {evaluationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Évaluation...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Évaluer le besoin d'AIPD
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dpia')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste AIPD
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Évaluation préliminaire AIPD
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Déterminez si vos traitements nécessitent une Analyse d'Impact sur la Protection des Données
        </p>
      </div>

      {/* Informations générales */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Qu'est-ce qu'une AIPD ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              L'Analyse d'Impact sur la Protection des Données (AIPD) est une procédure permettant d'évaluer 
              les risques d'un traitement sur la protection des données personnelles et de déterminer les mesures 
              nécessaires pour les traiter.
            </p>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Obligation légale :</strong> Une AIPD est obligatoire lorsque le traitement est 
                susceptible d'engendrer un risque élevé pour les droits et libertés des personnes concernées.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Liste des traitements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Vos traitements (responsable de traitement)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {controllerRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun traitement trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vous devez d'abord enregistrer vos traitements pour pouvoir les évaluer.
              </p>
              <Button onClick={() => setLocation('/records')}>
                <FileText className="h-4 w-4 mr-2" />
                Gérer les traitements
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {controllerRecords.map((record: ProcessingRecord) => {
                const evaluation = evaluationResults[record.id];
                return (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{record.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{record.purpose}</p>
                        
                        {evaluation && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {evaluation.recommendation?.includes('obligatoire') ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {evaluation.recommendation}
                                </Badge>
                              ) : evaluation.recommendation?.includes('Vigilance') ? (
                                <Badge variant="secondary">
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  {evaluation.recommendation}
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {evaluation.recommendation}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Score: {evaluation.score}/9
                              </span>
                            </div>
                            <ExpandableText 
                              text={evaluation.justification}
                              maxLength={150}
                              className="text-sm text-gray-700 dark:text-gray-300"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {evaluation && hasPermission('dpia', 'write') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvaluation(record.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('dpia', 'write') ? (
                          <Button
                            onClick={() => handleRecordSelect(record)}
                            variant={evaluation ? "outline" : "default"}
                          >
                            {evaluation ? "Modifier l'évaluation" : "Évaluer"}
                          </Button>
                        ) : evaluation ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              // Show evaluation details in read-only mode
                              setSelectedRecord(record);
                              setShowEvaluation(true);
                            }}
                          >
                            Voir l'évaluation
                          </Button>
                        ) : null}
                        {evaluation && evaluation.recommendation?.includes('obligatoire') && hasPermission('dpia', 'write') && (
                          <Button
                            onClick={() => setLocation(`/dpia/new?recordId=${record.id}`)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Créer l'AIPD
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste CNIL des traitements obligatoires */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Liste CNIL des traitements nécessitant obligatoirement une AIPD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Si votre traitement correspond à l'un des types ci-dessous, une AIPD est obligatoire 
              selon l'article 35.4 du RGPD et la délibération de la CNIL.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            {CNIL_MANDATORY_TREATMENTS.map((treatment, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <Shield className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-sm">{treatment}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}