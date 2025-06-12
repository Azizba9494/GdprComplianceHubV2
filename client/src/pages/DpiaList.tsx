import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Eye, Edit } from "lucide-react";

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

      <Tabs defaultValue="inprogress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inprogress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En cours ({inProgressDpias.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Terminées ({completedDpias.length})
          </TabsTrigger>
        </TabsList>

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