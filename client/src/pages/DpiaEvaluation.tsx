import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ExpandableText } from "@/components/ui/expandable-text";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  HelpCircle, 
  FileText,
  Shield,
  ArrowRight,
  Search,
  Download,
  Lightbulb,
  Users,
  FileSearch,
  Trash2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

const CNIL_MANDATORY_TREATMENTS = [
  "Traitements d'évaluation, y compris de profilage, et de prédiction relatifs aux aspects concernant les performances au travail, la situation économique, la santé, les préférences ou centres d'intérêt personnels, la fiabilité ou le comportement, la localisation ou les déplacements de la personne concernée",
  "Traitements ayant pour effet d'exclure des personnes du bénéfice d'un droit, d'un service ou d'un contrat en l'absence de motif légitime",
  "Traitements portant sur des données sensibles ou des données à caractère hautement personnel",
  "Traitements de données personnelles à grande échelle",
  "Traitements de croisement, combinaison ou appariement de données",
  "Traitements de données concernant des personnes vulnérables",
  "Traitements impliquant l'utilisation de nouvelles technologies",
  "Traitements qui empêchent les personnes d'exercer un droit ou de bénéficier d'un service",
];

export default function DpiaEvaluation() {
  const [, setLocation] = useLocation();
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showFullDpia, setShowFullDpia] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [evaluationResults, setEvaluationResults] = useState<Record<number, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's company information
  const { data: userCompany } = useQuery({
    queryKey: ['/api/companies/user', user?.id],
    queryFn: () => user ? fetch(`/api/companies/user/${user.id}`).then(res => res.json()) : Promise.resolve(null),
    enabled: !!user,
  });

  // Get processing records
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/records', userCompany?.id],
    queryFn: () => userCompany ? fetch(`/api/records/${userCompany.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!userCompany,
  });

  // Get stored evaluations
  const { data: storedEvaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['/api/dpia-evaluations', userCompany?.id],
    queryFn: () => userCompany ? fetch(`/api/dpia-evaluations/${userCompany.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!userCompany,
  });

  // Filter controller records only
  const controllerRecords = records?.filter((record: ProcessingRecord) => record.type === 'controller') || [];

  const form = useForm({
    defaultValues: {
      recordId: "",
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

  const checkCnilMandatoryList = (record: ProcessingRecord): string | null => {
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

      const score = Object.values(answers).filter(Boolean).length;
      
      // Check CNIL mandatory list
      const cnilMatch = checkCnilMandatoryList(selectedRecord!);
      
      let recommendation = "";
      let justification = "";
      let requiresDpia = false;
      
      if (cnilMatch) {
        recommendation = "AIPD obligatoire (Liste CNIL)";
        justification = `Ce traitement figure dans la liste des types d'opérations de traitement pour lesquelles une AIPD est requise : "${cnilMatch}". Une AIPD est donc obligatoire selon l'article 35.4 du RGPD.`;
        requiresDpia = true;
      } else if (score >= 2) {
        recommendation = "AIPD fortement recommandée / obligatoire";
        justification = `Notre analyse préliminaire indique que ce traitement est susceptible d'engendrer un risque élevé. La réalisation d'une AIPD est nécessaire car le projet remplit ${score} des 9 critères de risque identifiés par les autorités de protection des données.`;
        requiresDpia = true;
      } else if (score === 1) {
        recommendation = "Vigilance requise";
        justification = `Une AIPD n'est pas strictement obligatoire sur la seule base de ces critères, mais la présence d'un facteur de risque justifie une analyse plus approfondie pour confirmer l'absence de risque élevé.`;
        requiresDpia = false;
      } else {
        recommendation = "AIPD non requise à première vue";
        justification = `Il est tout de même nécessaire de documenter cette analyse et de rester vigilant à toute évolution du traitement.`;
        requiresDpia = false;
      }

      return {
        score,
        recommendation,
        justification,
        requiresDpia,
        cnilMatch,
        answers,
        recordId: selectedRecord!.id,
        recordName: selectedRecord!.name
      };
    },
    onSuccess: (result) => {
      setEvaluationResult(result);
      setShowResults(true);
      toast({
        title: "Évaluation terminée",
        description: "L'évaluation préliminaire AIPD a été réalisée avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réaliser l'évaluation",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    if (!selectedRecord) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un traitement",
        variant: "destructive"
      });
      return;
    }
    evaluationMutation.mutate(data);
  };

  const handleRecordSelect = (recordId: string) => {
    const record = controllerRecords.find((r: ProcessingRecord) => r.id.toString() === recordId);
    setSelectedRecord(record || null);
    form.setValue("recordId", recordId);
  };

  const createDpiaFromEvaluation = () => {
    if (evaluationResult) {
      setLocation(`/dpia/new?recordId=${evaluationResult.recordId}&evaluation=true`);
    }
  };

  if (showResults && evaluationResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowResults(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'évaluation
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Résultat de l'évaluation AIPD
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Traitement : {evaluationResult.recordName}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {evaluationResult.requiresDpia ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {evaluationResult.recommendation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {evaluationResult.justification}
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Score d'évaluation : {evaluationResult.score}/9</h4>
              <div className="space-y-2">
                {DPIA_CRITERIA.map((criterion) => {
                  const answer = evaluationResult.answers[criterion.id];
                  return (
                    <div key={criterion.id} className="flex items-center gap-2 text-sm">
                      {answer ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                      <span className={answer ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                        {criterion.question.substring(0, 50)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {evaluationResult.cnilMatch && (
              <Alert className="mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Liste CNIL :</strong> {evaluationResult.cnilMatch}
                </AlertDescription>
              </Alert>
            )}

            {evaluationResult.requiresDpia && (
              <div className="flex gap-3">
                <Button onClick={createDpiaFromEvaluation} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Créer l'AIPD complète
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setLocation('/dpia')}>
                  Retour à la liste
                </Button>
              </div>
            )}

            {!evaluationResult.requiresDpia && (
              <Button variant="outline" onClick={() => setLocation('/dpia')}>
                Retour à la liste AIPD
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
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
          Déterminez si votre traitement nécessite une Analyse d'Impact sur la Protection des Données
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Cette évaluation vous aide à déterminer si une AIPD est obligatoire pour votre traitement selon les critères du RGPD et de la CNIL.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Sélection du traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="recordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traitement à évaluer</FormLabel>
                    <Select onValueChange={handleRecordSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un traitement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {controllerRecords.map((record: ProcessingRecord) => (
                          <SelectItem key={record.id} value={record.id.toString()}>
                            {record.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedRecord && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedRecord.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecord.purpose}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedRecord && (
            <Card>
              <CardHeader>
                <CardTitle>2. Critères d'évaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {DPIA_CRITERIA.map((criterion, index) => (
                  <FormField
                    key={criterion.id}
                    control={form.control}
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
                ))}

                <FormField
                  control={form.control}
                  name="largeScaleEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Estimation du nombre de personnes concernées (si traitement à grande échelle)
                      </FormLabel>
                      <FormControl>
                        <Textarea
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
          )}

          {selectedRecord && (
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={evaluationMutation.isPending}
                className="flex items-center gap-2"
              >
                {evaluationMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Évaluation en cours...
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-4 w-4" />
                    Évaluer le besoin d'AIPD
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}