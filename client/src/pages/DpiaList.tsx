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
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Eye, Edit, BookOpen, Users, Shield, Globe, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

// Component for processing selection and evaluation
function ProcessingSelectionForEvaluation({ records, dpiaEvaluations, companyId }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
      queryClient.invalidateQueries({ queryKey: [`/api/dpia-evaluations/${companyId}`] });
      setSelectedRecord(null);
      setEvaluationCriteria({});
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

  const handleCriteriaChange = (criteriaId: string, checked: boolean) => {
    setEvaluationCriteria(prev => ({
      ...prev,
      [criteriaId]: checked
    }));
  };

  const calculateScore = () => {
    const mandatoryCriteria = ['profiling', 'automated-decision', 'systematic-monitoring', 'sensitive-data', 'public-area', 'vulnerable-persons', 'innovative-use', 'data-blocking'];
    const additionalCriteria = ['cross-border', 'multiple-sources', 'biometric-data', 'genetic-data', 'large-scale'];
    
    let mandatoryScore = 0;
    let additionalScore = 0;
    
    mandatoryCriteria.forEach(criteria => {
      if (evaluationCriteria[criteria]) mandatoryScore++;
    });
    
    additionalCriteria.forEach(criteria => {
      if (evaluationCriteria[criteria]) additionalScore++;
    });
    
    return { mandatoryScore, additionalScore, total: mandatoryScore + additionalScore };
  };

  const getRecommendation = () => {
    const scores = calculateScore();
    
    if (scores.mandatoryScore > 0) {
      return {
        type: "obligatoire",
        message: "Une AIPD est obligatoire car au moins un critère obligatoire CNIL est rempli.",
        color: "destructive"
      };
    }
    
    if (scores.additionalScore >= 2) {
      return {
        type: "recommandée",
        message: "Une AIPD est fortement recommandée en raison du nombre de critères de risque identifiés.",
        color: "warning"
      };
    }
    
    return {
      type: "non-requise",
      message: "Une AIPD n'est pas requise pour ce traitement selon les critères analysés.",
      color: "secondary"
    };
  };

  const saveEvaluation = () => {
    if (!selectedRecord) return;
    
    const scores = calculateScore();
    const recommendation = getRecommendation();
    
    createEvaluationMutation.mutate({
      companyId,
      recordId: selectedRecord.id,
      score: scores.total,
      recommendation: recommendation.message,
      justification: `Critères obligatoires: ${scores.mandatoryScore}/8, Critères additionnels: ${scores.additionalScore}/5`,
      criteria: evaluationCriteria
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

        <div className="grid gap-6">
          {/* Critères obligatoires */}
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Critères obligatoires selon la CNIL
              </CardTitle>
              <CardDescription>
                Si votre traitement correspond à l'un de ces critères, une AIPD est obligatoire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'profiling', label: 'Évaluation/scoring (y compris le profilage)', desc: 'Traitement automatisé pour évaluer des aspects personnels ou prédire des comportements' },
                  { id: 'automated-decision', label: 'Prise de décision automatisée avec effet légal ou similaire', desc: 'Décisions automatisées produisant des effets juridiques ou affectant significativement les personnes' },
                  { id: 'systematic-monitoring', label: 'Surveillance systématique', desc: 'Observation, surveillance ou contrôle systématique y compris données collectées dans des réseaux' },
                  { id: 'sensitive-data', label: 'Données sensibles à grande échelle', desc: 'Traitement à grande échelle de données sensibles ou de données relatives à des condamnations' },
                  { id: 'public-area', label: 'Données collectées dans un espace public à grande échelle', desc: 'Collecte systématique de données dans des lieux accessibles au public (vidéosurveillance, etc.)' },
                  { id: 'vulnerable-persons', label: 'Données de personnes vulnérables', desc: 'Traitement à grande échelle de données concernant des enfants, employés, personnes vulnérables' },
                  { id: 'innovative-use', label: 'Usage innovant ou application de nouvelles solutions technologiques', desc: 'Utilisation d\'une technologie nouvelle ou application d\'une technologie de manière nouvelle' },
                  { id: 'data-blocking', label: 'Exclusion du bénéfice d\'un droit, service ou contrat', desc: 'Traitement visant à empêcher les personnes d\'exercer un droit, de bénéficier d\'un service ou d\'un contrat' }
                ].map((criteria) => (
                  <div key={criteria.id} className="flex items-start space-x-3">
                    <Checkbox 
                      id={criteria.id}
                      checked={evaluationCriteria[criteria.id] || false}
                      onCheckedChange={(checked) => handleCriteriaChange(criteria.id, !!checked)}
                    />
                    <div className="space-y-1">
                      <label htmlFor={criteria.id} className="text-sm font-medium leading-none cursor-pointer">
                        {criteria.label}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {criteria.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critères additionnels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Critères de risque supplémentaires
              </CardTitle>
              <CardDescription>
                Ces critères, bien que non obligatoires, peuvent indiquer la nécessité d'une AIPD selon le contexte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'cross-border', label: 'Transferts transfrontaliers', desc: 'Transfert de données vers des pays tiers ou organisations internationales' },
                  { id: 'multiple-sources', label: 'Croisement de données de sources multiples', desc: 'Combinaison de données provenant de différentes sources ou traitements' },
                  { id: 'biometric-data', label: 'Données biométriques', desc: 'Traitement de données biométriques aux fins d\'identifier une personne de manière unique' },
                  { id: 'genetic-data', label: 'Données génétiques', desc: 'Traitement de données génétiques à des fins autres que médicales' },
                  { id: 'large-scale', label: 'Traitement à grande échelle', desc: 'Volume important de données ou nombre élevé de personnes concernées' }
                ].map((criteria) => (
                  <div key={criteria.id} className="flex items-start space-x-3">
                    <Checkbox 
                      id={criteria.id}
                      checked={evaluationCriteria[criteria.id] || false}
                      onCheckedChange={(checked) => handleCriteriaChange(criteria.id, !!checked)}
                    />
                    <div className="space-y-1">
                      <label htmlFor={criteria.id} className="text-sm font-medium leading-none cursor-pointer">
                        {criteria.label}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {criteria.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Résultat */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Résultat de l'évaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="mb-2">
                    <Badge variant={getRecommendation().color as any}>
                      {getRecommendation().type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm">{getRecommendation().message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Score: {calculateScore().total}/13 critères ({calculateScore().mandatoryScore} obligatoires, {calculateScore().additionalScore} additionnels)
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={saveEvaluation}
                    disabled={createEvaluationMutation.isPending}
                    className="flex-1"
                  >
                    {createEvaluationMutation.isPending ? "Sauvegarde..." : "Sauvegarder l'évaluation"}
                  </Button>
                  {getRecommendation().type !== "non-requise" && (
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/dpia/processing-selection')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer l'AIPD
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
                      onClick={() => setSelectedRecord(record)}
                      variant={existingEvaluation ? "outline" : "default"}
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

  // Get company information
  const userId = 1; // This should come from auth context
  const { data: company } = useQuery({
    queryKey: [`/api/companies/${userId}`],
  }) as { data: any };

  // Get all DPIA assessments
  const { data: dpias = [], isLoading } = useQuery({
    queryKey: [`/api/dpia/${company?.id}`],
    enabled: !!company?.id,
  }) as { data: any[], isLoading: boolean };

  // Get processing records for reference
  const { data: processingRecords = [] } = useQuery({
    queryKey: [`/api/records/${company?.id}`],
    enabled: !!company?.id,
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
        <Button onClick={() => setLocation('/dpia/new')} className="flex items-center gap-2">
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
                Sélectionnez un traitement pour déterminer s'il nécessite une analyse d'impact relative à la protection des données (AIPD).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingSelectionForEvaluation 
                records={records}
                dpiaEvaluations={dpiaEvaluations}
                companyId={company?.id}
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
                  <Button onClick={() => setLocation('/dpia/new')}>
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
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Continuer
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