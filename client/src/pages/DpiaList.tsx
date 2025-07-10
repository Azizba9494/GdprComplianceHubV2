import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Eye, Edit, BookOpen, Users, Shield, Globe, Search, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

// Risk criteria for DPIA evaluation
const riskCriteria = [
  {
    id: "evaluation_notation",
    title: "Évaluation ou Notation",
    description: "Le traitement implique-t-il une évaluation ou une notation de personnes sur la base de leurs données, y compris le profilage ?",
    examples: "Exemples : score de crédit, évaluation de la performance d'un employé, profilage marketing pour prédire les préférences, diagnostic médical automatisé"
  },
  {
    id: "decision_automatisee",
    title: "Décision Automatisée",
    description: "Le traitement conduit-il à une prise de décision entièrement automatisée (sans intervention humaine) ayant un effet juridique ou vous affectant de manière significative ?",
    examples: "Exemples : refus automatisé d'un crédit en ligne, décision d'éligibilité à une prestation sociale, tri automatique de CV menant à un rejet sans examen humain"
  },
  {
    id: "surveillance_systematique",
    title: "Surveillance Systématique",
    description: "Le traitement implique-t-il une surveillance systématique et continue de personnes ?",
    examples: "Exemples : vidéosurveillance d'un lieu public ou d'employés, surveillance de l'activité réseau, géolocalisation continue de véhicules"
  },
  {
    id: "donnees_sensibles",
    title: "Données Sensibles ou Hautement Personnelles",
    description: "Le traitement porte-t-il sur des données dites \"sensibles\" (santé, opinions politiques/religieuses, orientation sexuelle) ou d'autres données à caractère hautement personnel ?",
    examples: "Exemples : dossiers médicaux, données biométriques, données de localisation précises, données financières détaillées"
  },
  {
    id: "grande_echelle",
    title: "Traitement à Grande Échelle",
    description: "Les données sont-elles traitées à \"grande échelle\" ? (Pensez en volume de données, nombre de personnes, zone géographique, durée)",
    examples: "Exemples : données des utilisateurs d'un réseau social national, données des patients d'une chaîne d'hôpitaux, données de géolocalisation collectées par une application populaire"
  },
  {
    id: "croisement_donnees",
    title: "Croisement de Données",
    description: "Le traitement consiste-t-il à croiser ou combiner des ensembles de données provenant de différentes sources ou collectées pour différents objectifs ?",
    examples: "Exemples : croiser les données de navigation d'un site web avec des informations d'achat en magasin ; enrichir une base de données clients avec des données achetées à des courtiers en données"
  },
  {
    id: "personnes_vulnerables",
    title: "Personnes Vulnérables",
    description: "Le traitement concerne-t-il des personnes considérées comme \"vulnérables\", qui ont des difficultés à consentir ou à s'opposer au traitement ?",
    examples: "Exemples : enfants, patients, personnes âgées, employés (en raison du lien de subordination), demandeurs d'asile"
  },
  {
    id: "technologie_innovante",
    title: "Technologie Innovante",
    description: "Le traitement fait-il appel à une technologie innovante ou à un usage nouveau d'une technologie existante, pouvant créer de nouveaux types de risques ?",
    examples: "Exemples : utilisation de l'Intelligence Artificielle pour l'analyse de personnalité, objets connectés (IoT), reconnaissance faciale, neuro-technologies"
  },
  {
    id: "obstacle_droit",
    title: "Obstacle à un Droit ou un Service",
    description: "Le traitement peut-il avoir pour conséquence d'empêcher une personne d'exercer un droit ou de bénéficier d'un service ou d'un contrat ?",
    examples: "Exemples : utiliser un score de crédit pour refuser un prêt ou un logement, utiliser un profil de risque pour refuser une assurance"
  }
];

// Component for processing selection and evaluation
function ProcessingSelectionForEvaluation({ records, dpiaEvaluations, companyId }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [riskAnswers, setRiskAnswers] = useState<Record<string, boolean>>({});
  const [estimatedPersons, setEstimatedPersons] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { hasPermission } = usePermissions();

  // Delete DPIA mutation
  const deleteDpiaMutation = useMutation({
    mutationFn: async (dpiaId: number) => {
      const response = await fetch(`/api/dpia/${dpiaId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'AIPD");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AIPD supprimée",
        description: "L'analyse d'impact a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dpia', companyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'AIPD",
        variant: "destructive",
      });
    },
  });

  // Create evaluation mutation
  const createEvaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/dpia-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'évaluation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Évaluation sauvegardée",
        description: "L'évaluation préliminaire a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dpia-evaluations', companyId] });
      setSelectedRecord(null);
      setRiskAnswers({});
      setEstimatedPersons("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'évaluation",
        variant: "destructive",
      });
    },
  });

  const filteredRecords = records?.filter((record: any) => {
    return record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleRiskAnswerChange = (criteriaId: string, value: boolean) => {
    setRiskAnswers(prev => ({
      ...prev,
      [criteriaId]: value
    }));
  };

  const calculateRiskScore = () => {
    const yesAnswers = Object.values(riskAnswers).filter(answer => answer === true).length;
    return yesAnswers;
  };

  const getAipdRecommendation = () => {
    const score = calculateRiskScore();
    const positiveAnswers = Object.entries(riskAnswers)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => riskCriteria.find(c => c.id === key)?.title)
      .filter(Boolean);
    
    if (score >= 2) {
      return {
        type: "obligatoire",
        title: "Réalisation d'une AIPD fortement recommandée / obligatoire",
        message: `Score de ${score}/9 - La présence de ${score} facteur(s) de risque justifie la réalisation d'une AIPD.`,
        color: "destructive",
        details: `Critères identifiés : ${positiveAnswers.join(', ')}`,
        justification: `Selon les critères CNIL/CEPD, votre traitement présente ${score} facteur(s) de risque élevé. Une AIPD est donc ${score >= 3 ? 'fortement' : ''} recommandée pour évaluer et mitiger ces risques.`
      };
    }
    
    if (score === 1) {
      return {
        type: "vigilance",
        title: "Vigilance requise",
        message: `Score de ${score}/9 - Une AIPD n'est pas strictement obligatoire mais vigilance requise.`,
        color: "warning",
        details: `Critère identifié : ${positiveAnswers.join(', ')}`,
        justification: `La présence d'un facteur de risque justifie une analyse plus approfondie pour confirmer l'absence de risque élevé. Nous recommandons de documenter cette analyse et de rester vigilant à toute évolution du traitement.`
      };
    }
    
    return {
      type: "non-requise",
      title: "Réalisation d'une AIPD non requise",
      message: `Score de ${score}/9 - Une AIPD n'est pas requise à première vue.`,
      color: "default",
      details: "Aucun critère de risque élevé identifié",
      justification: "Selon l'analyse des critères CNIL/CEPD, votre traitement ne présente pas de facteur de risque élevé nécessitant une AIPD. Il est toutefois nécessaire de documenter cette analyse et de rester vigilant à toute évolution du traitement."
    };
  };

  const saveEvaluation = () => {
    if (!selectedRecord) return;
    
    // Vérification des permissions avant de sauvegarder
    if (!hasPermission('dpia', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour les AIPD. Contactez l'administrateur pour obtenir des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    const score = calculateRiskScore();
    const recommendation = getAipdRecommendation();
    
    createEvaluationMutation.mutate({
      companyId,
      recordId: selectedRecord.id,
      score: score,
      recommendation: recommendation.title,
      justification: recommendation.justification,
      criteria: riskAnswers,
      estimatedPersons: estimatedPersons || null
    });
  };

  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Évaluation pour : {selectedRecord.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedRecord.purpose}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedRecord(null)}
          >
            Retour à la liste
          </Button>
        </div>

        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Information importante</AlertTitle>
          <AlertDescription>
            Selon l'article 35 du RGPD, une AIPD est obligatoire lorsque le traitement est susceptible d'engendrer un risque élevé pour les droits et libertés des personnes concernées.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Section 2 : Critères de risque
              </CardTitle>
              <CardDescription>
                Répondez par Oui ou Non à chacune des questions suivantes pour évaluer si une AIPD est nécessaire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {riskCriteria.map((criteria, index) => (
                  <div key={criteria.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm">
                          {index + 1}. {criteria.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {criteria.description}
                        </p>
                        <p className="text-xs text-blue-600 italic">
                          {criteria.examples}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={criteria.id}
                            value="true"
                            checked={riskAnswers[criteria.id] === true}
                            onChange={() => handleRiskAnswerChange(criteria.id, true)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Oui</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={criteria.id}
                            value="false"
                            checked={riskAnswers[criteria.id] === false}
                            onChange={() => handleRiskAnswerChange(criteria.id, false)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Non</span>
                        </label>
                      </div>
                    </div>
                    {criteria.id === "grande_echelle" && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <label className="text-sm font-medium">
                          Champ optionnel pour aider l'évaluation :
                        </label>
                        <Input
                          placeholder="Estimez le nombre de personnes concernées"
                          value={estimatedPersons}
                          onChange={(e) => setEstimatedPersons(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Résultat et Recommandation IA */}
          {Object.keys(riskAnswers).length > 0 && (
            <Card className={`border-2 ${getAipdRecommendation().type === 'obligatoire' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 
                                          getAipdRecommendation().type === 'vigilance' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' : 
                                          'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Analyse et Recommandation IA
                </CardTitle>
                <CardDescription>
                  Analyse automatique basée sur les critères CNIL/CEPD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-lg">{getAipdRecommendation().title}</span>
                      <Badge variant={getAipdRecommendation().type === 'obligatoire' ? 'destructive' : 
                                     getAipdRecommendation().type === 'vigilance' ? 'secondary' : 'default'}>
                        Score: {calculateRiskScore()}/9
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getAipdRecommendation().message}
                      </p>
                      
                      <p className="text-sm text-muted-foreground">
                        <strong>Détails :</strong> {getAipdRecommendation().details}
                      </p>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border-l-4 border-blue-500">
                        <p className="text-sm"><strong>Justification :</strong></p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {getAipdRecommendation().justification}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={saveEvaluation}
                      disabled={createEvaluationMutation.isPending || !hasPermission('dpia', 'write')}
                      className="flex-1"
                      title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour sauvegarder l'évaluation" : ""}
                    >
                      {createEvaluationMutation.isPending ? "Sauvegarde..." : 
                       !hasPermission('dpia', 'write') ? "🔒 Droits insuffisants" :
                       "Sauvegarder l'évaluation"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Sélectionnez un traitement pour évaluer s'il nécessite une analyse d'impact relative à la protection des données (AIPD).
        </AlertDescription>
      </Alert>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher un traitement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucun traitement trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? "Aucun traitement ne correspond à votre recherche." : "Aucun traitement disponible pour évaluation."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record: any) => {
            const existingEvaluation = dpiaEvaluations?.find((evaluation: any) => evaluation.recordId === record.id);
            
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{record.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {record.purpose}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {existingEvaluation ? (
                        <Badge variant={existingEvaluation.recommendation?.includes("obligatoire") ? "destructive" : existingEvaluation.recommendation?.includes("recommandée") ? "default" : "secondary"}>
                          {existingEvaluation.recommendation?.includes("obligatoire") ? "AIPD obligatoire" : 
                           existingEvaluation.recommendation?.includes("recommandée") ? "AIPD recommandée" : "Pas d'AIPD requise"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">À évaluer</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {existingEvaluation && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Dernière évaluation :
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {existingEvaluation.justification}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Score : {existingEvaluation.score}/13 points
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {existingEvaluation ? "Réévaluer ce traitement" : "Évaluer ce traitement"}
                    </div>
                    
                    <Button
                      onClick={() => {
                        // Vérification des permissions avant d'ouvrir l'évaluation
                        if (!hasPermission('dpia', 'write')) {
                          toast({
                            title: "🔒 Droits insuffisants",
                            description: "Vous ne disposez que des droits de lecture pour les AIPD. Contactez l'administrateur pour obtenir des droits d'écriture.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSelectedRecord(record);
                      }}
                      variant={existingEvaluation ? "outline" : "default"}
                      disabled={!hasPermission('dpia', 'write')}
                      title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour évaluer ce traitement" : ""}
                    >
                      {existingEvaluation ? "Réévaluer" : "Évaluer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DpiaList() {
  const [, setLocation] = useLocation();
  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const companyId = currentCompany?.id;
  
  const deleteDpiaMutation = useMutation({
    mutationFn: async (dpiaId: number) => {
      const response = await fetch(`/api/dpia/${dpiaId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'AIPD");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AIPD supprimée",
        description: "L'analyse d'impact a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dpia', companyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'AIPD",
        variant: "destructive",
      });
    },
  });

  // Get all DPIA assessments
  const { data: dpias = [], isLoading } = useQuery({
    queryKey: ['/api/dpia', companyId],
    queryFn: () => fetch(`/api/dpia/${companyId}`).then(res => res.json()),
    enabled: !!companyId,
  }) as { data: any[], isLoading: boolean };

  // Get processing records for reference
  const { data: processingRecords = [] } = useQuery({
    queryKey: ['/api/records', companyId],
    queryFn: () => fetch(`/api/records/${companyId}`).then(res => res.json()),
    enabled: !!companyId,
  }) as { data: any[] };

  // Get DPIA evaluations
  const { data: dpiaEvaluations = [] } = useQuery({
    queryKey: ['/api/dpia-evaluations', companyId],
    queryFn: () => fetch(`/api/dpia-evaluations/${companyId}`).then(res => res.json()),
    enabled: !!companyId,
  }) as { data: any[] };

  const getProcessingRecordName = (recordId: number) => {
    const record = processingRecords.find(r => r.id === recordId);
    return record?.name || "Traitement non trouvé";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Brouillon
        </Badge>;
      case "inprogress":
        return <Badge variant="default" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          En cours
        </Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Terminée
        </Badge>;
      case "validated":
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
          <CheckCircle className="h-3 w-3" />
          Validée
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCompletionPercentage = (dpia: any) => {
    let completedFields = 0;
    const totalFields = 12;

    if (dpia.generalDescription) completedFields++;
    if (dpia.processingPurposes) completedFields++;
    if (dpia.dataController) completedFields++;
    if (dpia.dataProcessors) completedFields++;
    if (dpia.personalDataProcessed) completedFields++;
    if (dpia.dataMinimization) completedFields++;
    if (dpia.retentionJustification) completedFields++;
    if (dpia.rightsInformation) completedFields++;
    if (dpia.securityMeasures?.length > 0) completedFields++;
    if (dpia.riskScenarios) completedFields++;
    if (dpia.actionPlan?.length > 0) completedFields++;
    if (dpia.dpoAdvice) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const inProgressDpias = dpias.filter(d => d.status === "draft" || d.status === "inprogress");
  const completedDpias = dpias.filter(d => d.status === "completed" || d.status === "validated");

  // Check permissions after hooks are initialized
  if (!hasPermission('dpia', 'read')) {
    return (
      <AccessDenied 
        module="Analyse d'impact (AIPD)" 
        requiredPermission="dpia.read"
        description="Vous n'avez pas accès au module d'analyse d'impact car vos droits ne le permettent pas."
      />
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <p>Veuillez vous connecter pour accéder aux AIPD.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement des AIPD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analyses d'Impact (AIPD)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos analyses d'impact relatives à la protection des données
          </p>
        </div>
        <Button 
          onClick={() => setLocation('/dpia/new')} 
          className="flex items-center gap-2"
          disabled={!hasPermission('dpia', 'write')}
          title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour créer une nouvelle AIPD" : ""}
        >
          <Plus className="h-4 w-4" />
          Nouvelle AIPD
        </Button>
      </div>

      <Tabs defaultValue="evaluation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="evaluation" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Évaluation préliminaire
          </TabsTrigger>
          <TabsTrigger value="inprogress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En cours ({inProgressDpias.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Terminées ({completedDpias.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Évaluation préliminaire AIPD
              </CardTitle>
              <CardDescription>
                Sélectionnez un traitement pour évaluer s'il nécessite une analyse d'impact relative à la protection des données (AIPD) selon les nouveaux critères CNIL/CEPD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingSelectionForEvaluation 
                records={processingRecords}
                dpiaEvaluations={dpiaEvaluations}
                companyId={companyId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inprogress">
          <Card>
            <CardHeader>
              <CardTitle>AIPD en cours de rédaction</CardTitle>
              <CardDescription>
                Reprendre le travail sur vos analyses d'impact en cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressDpias.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune AIPD en cours
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Commencez une nouvelle analyse d'impact pour vos traitements nécessitant une AIPD.
                  </p>
                  <Button 
                    onClick={() => setLocation('/dpia/new')}
                    disabled={!hasPermission('dpia', 'write')}
                    title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour créer une AIPD" : ""}
                  >
                    Créer une AIPD
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Traitement concerné</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Dernière modification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inProgressDpias.map((dpia) => (
                      <TableRow key={dpia.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{dpia.title || `AIPD #${dpia.id}`}</div>
                            <div className="text-sm text-gray-600">
                              {getProcessingRecordName(dpia.processingRecordId)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dpia.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${getCompletionPercentage(dpia)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {getCompletionPercentage(dpia)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dpia.updatedAt ? new Date(dpia.updatedAt).toLocaleDateString('fr-FR') : 'Non modifiée'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/dpia/${dpia.id}`)}
                              disabled={!hasPermission('dpia', 'write')}
                              title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour modifier cette AIPD" : ""}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Continuer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer cette AIPD ?')) {
                                  // Delete mutation to be implemented
                                  deleteDpiaMutation.mutate(dpia.id);
                                }
                              }}
                              disabled={!hasPermission('dpia', 'write')}
                              title={!hasPermission('dpia', 'write') ? "Droits insuffisants pour supprimer cette AIPD" : ""}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>AIPD terminées</CardTitle>
              <CardDescription>
                Consultez et gérez vos analyses d'impact finalisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedDpias.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune AIPD terminée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Les AIPD finalisées apparaîtront ici une fois complétées.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Traitement concerné</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de finalisation</TableHead>
                      <TableHead>Risque évalué</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedDpias.map((dpia) => (
                      <TableRow key={dpia.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{dpia.title || `AIPD #${dpia.id}`}</div>
                            <div className="text-sm text-gray-600">
                              {getProcessingRecordName(dpia.processingRecordId)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dpia.status)}
                        </TableCell>
                        <TableCell>
                          {dpia.completedAt ? new Date(dpia.completedAt).toLocaleDateString('fr-FR') : 
                           dpia.updatedAt ? new Date(dpia.updatedAt).toLocaleDateString('fr-FR') : 'Non datée'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            À évaluer
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/dpia/${dpia.id}`)}
                              disabled={!hasPermission('dpia', 'read')}
                              title={!hasPermission('dpia', 'read') ? "Droits insuffisants pour consulter cette AIPD" : ""}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Consulter
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}