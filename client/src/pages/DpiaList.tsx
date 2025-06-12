import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Eye, Edit, BookOpen, Users, Shield, Globe } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
                Déterminez si votre traitement de données nécessite une analyse d'impact relative à la protection des données (AIPD) selon les critères CNIL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertTitle>Information importante</AlertTitle>
                  <AlertDescription>
                    Selon l'article 35 du RGPD, une AIPD est obligatoire lorsque le traitement est susceptible d'engendrer un risque élevé pour les droits et libertés des personnes concernées.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6">
                  {/* Critères obligatoires CNIL */}
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
                        <div className="flex items-start space-x-3">
                          <Checkbox id="profiling" />
                          <div className="space-y-1">
                            <label htmlFor="profiling" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Évaluation/scoring (y compris le profilage)
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement automatisé pour évaluer des aspects personnels ou prédire des comportements
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="automated-decision" />
                          <div className="space-y-1">
                            <label htmlFor="automated-decision" className="text-sm font-medium leading-none">
                              Prise de décision automatisée avec effet légal ou similaire
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Décisions automatisées produisant des effets juridiques ou affectant significativement les personnes
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="systematic-monitoring" />
                          <div className="space-y-1">
                            <label htmlFor="systematic-monitoring" className="text-sm font-medium leading-none">
                              Surveillance systématique
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Observation, surveillance ou contrôle systématique y compris données collectées dans des réseaux
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="sensitive-data" />
                          <div className="space-y-1">
                            <label htmlFor="sensitive-data" className="text-sm font-medium leading-none">
                              Données sensibles à grande échelle
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement à grande échelle de données sensibles ou de données relatives à des condamnations
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="public-area" />
                          <div className="space-y-1">
                            <label htmlFor="public-area" className="text-sm font-medium leading-none">
                              Données collectées dans un espace public à grande échelle
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Collecte systématique de données dans des lieux accessibles au public (vidéosurveillance, etc.)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="vulnerable-persons" />
                          <div className="space-y-1">
                            <label htmlFor="vulnerable-persons" className="text-sm font-medium leading-none">
                              Données de personnes vulnérables
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement à grande échelle de données concernant des enfants, employés, personnes vulnérables
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="innovative-use" />
                          <div className="space-y-1">
                            <label htmlFor="innovative-use" className="text-sm font-medium leading-none">
                              Usage innovant ou application de nouvelles solutions technologiques
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Utilisation d'une technologie nouvelle ou application d'une technologie de manière nouvelle
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="data-blocking" />
                          <div className="space-y-1">
                            <label htmlFor="data-blocking" className="text-sm font-medium leading-none">
                              Exclusion du bénéfice d'un droit, service ou contrat
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement visant à empêcher les personnes d'exercer un droit, de bénéficier d'un service ou d'un contrat
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Critères de risque supplémentaires */}
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
                        <div className="flex items-start space-x-3">
                          <Checkbox id="cross-border" />
                          <div className="space-y-1">
                            <label htmlFor="cross-border" className="text-sm font-medium leading-none">
                              Transferts transfrontaliers
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Transfert de données vers des pays tiers ou organisations internationales
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="multiple-sources" />
                          <div className="space-y-1">
                            <label htmlFor="multiple-sources" className="text-sm font-medium leading-none">
                              Croisement de données de sources multiples
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Combinaison de données provenant de différentes sources ou traitements
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="biometric-data" />
                          <div className="space-y-1">
                            <label htmlFor="biometric-data" className="text-sm font-medium leading-none">
                              Données biométriques
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement de données biométriques aux fins d'identifier une personne de manière unique
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="genetic-data" />
                          <div className="space-y-1">
                            <label htmlFor="genetic-data" className="text-sm font-medium leading-none">
                              Données génétiques
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Traitement de données génétiques à des fins autres que médicales
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox id="large-scale" />
                          <div className="space-y-1">
                            <label htmlFor="large-scale" className="text-sm font-medium leading-none">
                              Traitement à grande échelle
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Volume important de données ou nombre élevé de personnes concernées
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Résultat de l'évaluation */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Résultat de l'évaluation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Recommandation</AlertTitle>
                          <AlertDescription>
                            Si vous avez coché au moins un critère obligatoire, une AIPD est requise.
                            Si vous avez coché plusieurs critères de risque supplémentaires, une AIPD est fortement recommandée.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-4">
                          <Button 
                            className="flex-1"
                            onClick={() => setLocation('/dpia/processing-selection')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Créer une nouvelle AIPD
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open('https://www.cnil.fr/fr/RGPD-analyse-impact-protection-donnees-aipd', '_blank')}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Guide CNIL complet
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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