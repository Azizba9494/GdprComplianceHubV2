import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Loader2, Search, Download, AlertTriangle, Shield, CheckCircle, Info, Lightbulb, FileText, Users, FileSearch, ArrowLeft } from "lucide-react";
import { dpiaApi, recordsApi } from "@/lib/api";

const COMPANY_ID = 1;

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

export default function DPIA() {
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showFullDpia, setShowFullDpia] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [evaluationResults, setEvaluationResults] = useState<Record<number, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulaires
  const evaluationForm = useForm({
    defaultValues: {
      scoring: false,
      automatedDecision: false,
      systematicMonitoring: false,
      sensitiveData: false,
      largeScale: false,
      largeScaleEstimate: "",
      dataCombination: false,
      vulnerablePersons: false,
      innovativeTechnology: false,
      obstacleToRight: false
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
    queryKey: ['/api/records', COMPANY_ID],
    queryFn: () => recordsApi.get(COMPANY_ID).then(res => res.json()),
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/dpia', COMPANY_ID],
    queryFn: () => dpiaApi.get(COMPANY_ID).then(res => res.json()),
  });

  // Filtrer les traitements de responsable uniquement
  const controllerRecords = records?.filter((record: ProcessingRecord) => record.type === 'controller') || [];

  // Mutations
  const evaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      const answers = {
        scoring: data.scoring,
        automatedDecision: data.automatedDecision,
        systematicMonitoring: data.systematicMonitoring,
        sensitiveData: data.sensitiveData,
        largeScale: data.largeScale,
        dataCombination: data.dataCombination,
        vulnerablePersons: data.vulnerablePersons,
        innovativeTechnology: data.innovativeTechnology,
        obstacleToRight: data.obstacleToRight
      };

      const score = Object.values(answers).filter(Boolean).length;
      
      let recommendation = "";
      let justification = "";
      
      if (score >= 2) {
        recommendation = "AIPD fortement recommandée / obligatoire";
        justification = `Notre analyse préliminaire indique que ce traitement est susceptible d'engendrer un risque élevé. La réalisation d'une AIPD est nécessaire car le projet remplit ${score} des 9 critères de risque identifiés par les autorités de protection des données.`;
      } else if (score === 1) {
        recommendation = "Vigilance requise";
        justification = `Une AIPD n'est pas strictement obligatoire sur la seule base de ces critères, mais la présence d'un facteur de risque justifie une analyse plus approfondie pour confirmer l'absence de risque élevé.`;
      } else {
        recommendation = "AIPD non requise à première vue";
        justification = `Il est tout de même nécessaire de documenter cette analyse et de rester vigilant à toute évolution du traitement.`;
      }

      const result = {
        score,
        recommendation,
        justification,
        criteriaAnswers: answers
      };

      setEvaluationResults(prev => ({
        ...prev,
        [selectedRecord!.id]: result
      }));

      return result;
    },
    onSuccess: () => {
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

  const dpiaAssessmentMutation = useMutation({
    mutationFn: (data: { processingName: string; processingDescription: string }) =>
      dpiaApi.assess({
        companyId: COMPANY_ID,
        processingName: data.processingName,
        processingDescription: data.processingDescription,
      }),
    onSuccess: (data) => {
      setCurrentAssessment(data);
      queryClient.invalidateQueries({ queryKey: ['/api/dpia'] });
      toast({
        title: "Analyse terminée",
        description: "L'analyse d'impact a été réalisée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réaliser l'analyse d'impact",
        variant: "destructive",
      });
    },
  });

  const startEvaluation = (record: ProcessingRecord) => {
    setSelectedRecord(record);
    setShowEvaluation(true);
    evaluationForm.reset();
  };

  const startFullDpia = (record: ProcessingRecord) => {
    setSelectedRecord(record);
    dpiaForm.setValue("processingName", record.name);
    dpiaForm.setValue("processingDescription", `
Finalité: ${record.purpose}
Base légale: ${record.legalBasis}
Catégories de données: ${Array.isArray(record.dataCategories) ? record.dataCategories.join(', ') : record.dataCategories || 'Non spécifié'}
Destinataires: ${Array.isArray(record.recipients) ? record.recipients.join(', ') : record.recipients || 'Non spécifié'}
Durée de conservation: ${record.retention || 'Non spécifié'}
Mesures de sécurité: ${Array.isArray(record.securityMeasures) ? record.securityMeasures.join(', ') : record.securityMeasures || 'Non spécifié'}
Transferts hors UE: ${record.transfersOutsideEU ? 'Oui' : 'Non'}
    `.trim());
    setShowFullDpia(true);
  };

  const onEvaluationSubmit = (data: any) => {
    evaluationMutation.mutate(data);
  };

  const onDpiaSubmit = (data: { processingName: string; processingDescription: string }) => {
    dpiaAssessmentMutation.mutate(data);
  };

  if (recordsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface d'évaluation DPIA
  if (showEvaluation && selectedRecord) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowEvaluation(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-xl font-bold">Évaluation AIPD</h2>
            <p className="text-muted-foreground">Traitement: {selectedRecord.name}</p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ce questionnaire a pour but de nous aider à évaluer si le traitement de données que vous envisagez est susceptible d'engendrer un risque élevé pour les droits et libertés des personnes, et par conséquent, s'il nécessite une Analyse d'Impact relative à la Protection des Données (AIPD).
          </AlertDescription>
        </Alert>

        <Form {...evaluationForm}>
          <form onSubmit={evaluationForm.handleSubmit(onEvaluationSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 1 : Identification du traitement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom du traitement envisagé</label>
                  <Input value={selectedRecord.name} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Brève description de sa finalité</label>
                  <Textarea value={selectedRecord.purpose} disabled className="mt-1" rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 2 : Critères de risque</CardTitle>
                <p className="text-sm text-muted-foreground">Répondez par Oui ou Non à chaque critère</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {DPIA_CRITERIA.map((criterion, index) => (
                  <FormField
                    key={criterion.id}
                    control={evaluationForm.control}
                    name={criterion.id as any}
                    render={({ field }) => (
                      <FormItem className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start space-x-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="flex-1 space-y-2">
                            <FormLabel className="text-sm font-medium leading-relaxed">
                              {index + 1}. {criterion.question}
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              {criterion.examples}
                            </p>
                            {criterion.id === 'largeScale' && field.value && (
                              <FormField
                                control={evaluationForm.control}
                                name="largeScaleEstimate"
                                render={({ field: estimateField }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Estimez le nombre de personnes concernées (optionnel)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Ex: 10 000 personnes"
                                        {...estimateField}
                                        className="text-sm"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEvaluation(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={evaluationMutation.isPending}>
                {evaluationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  "Analyser"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Interface DPIA complète
  if (showFullDpia && selectedRecord) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowFullDpia(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-xl font-bold">Analyse d'Impact RGPD</h2>
            <p className="text-muted-foreground">Traitement: {selectedRecord.name}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse d'impact complète</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...dpiaForm}>
                <form onSubmit={dpiaForm.handleSubmit(onDpiaSubmit)} className="space-y-4">
                  <FormField
                    control={dpiaForm.control}
                    name="processingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du traitement</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dpiaForm.control}
                    name="processingDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description détaillée</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={12} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={dpiaAssessmentMutation.isPending}
                  >
                    {dpiaAssessmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      "Réaliser l'analyse d'impact complète"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {currentAssessment && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats de l'analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Risques identifiés</h4>
                  <div className="space-y-2">
                    {currentAssessment.risks?.map((risk: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg text-sm">
                        <p className="font-medium">{risk.threat}</p>
                        <p className="text-muted-foreground">{risk.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Mesures recommandées</h4>
                  <div className="space-y-2">
                    {currentAssessment.measures?.map((measure: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg text-sm">
                        <Badge variant="outline" className="mb-2">{measure.type}</Badge>
                        <p className="text-muted-foreground">{measure.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Interface principale - Liste des traitements
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyse d'Impact (AIPD)</h2>
          <p className="text-muted-foreground">
            Évaluez la nécessité d'une AIPD pour vos traitements de données
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Nouvelle approche :</strong> Évaluez chaque traitement individuellement grâce à notre questionnaire conforme aux recommandations CNIL/CEPD.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Traitements nécessitant une évaluation AIPD</span>
            </CardTitle>
            <Badge variant="outline">
              {controllerRecords.length} traitement{controllerRecords.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {controllerRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun traitement de responsable</h3>
              <p className="text-muted-foreground">
                Créez d'abord des fiches de traitement en tant que responsable de traitement pour pouvoir réaliser des évaluations AIPD.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {controllerRecords.map((record: ProcessingRecord) => {
                const evaluation = evaluationResults[record.id];
                
                return (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">{record.name}</h4>
                          {evaluation && (
                            <Badge variant={
                              evaluation.recommendation.includes('obligatoire') ? 'destructive' :
                              evaluation.recommendation.includes('Vigilance') ? 'default' : 'secondary'
                            }>
                              {evaluation.recommendation}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.purpose}
                        </p>

                        {evaluation && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs font-medium mb-1">Résultat de l'évaluation :</p>
                            <p className="text-xs text-muted-foreground mb-2">{evaluation.justification}</p>
                            <p className="text-xs text-muted-foreground">
                              Score de risque : {evaluation.score}/9
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>Créé le {new Date(record.createdAt).toLocaleDateString('fr-FR')}</span>
                          <span>•</span>
                          <span>Base légale: {record.legalBasis}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {!evaluation ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEvaluation(record)}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Évaluer la nécessité
                          </Button>
                        ) : evaluation.recommendation.includes('obligatoire') ? (
                          <Button 
                            size="sm"
                            onClick={() => startFullDpia(record)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Réaliser l'AIPD
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEvaluation(record)}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Réévaluer
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

      {assessments && assessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analyses d'impact réalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessments.map((assessment: any) => (
                <div key={assessment.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{assessment.processingName}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {assessment.processingDescription}
                      </p>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge variant="default">
                          {assessment.riskAssessment?.risks?.length || 0} risques identifiés
                        </Badge>
                        <Badge variant="outline">
                          {assessment.riskAssessment?.measures?.length || 0} mesures proposées
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(assessment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}