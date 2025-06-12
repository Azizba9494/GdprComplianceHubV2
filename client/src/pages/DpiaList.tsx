import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  FileText, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2,
  Edit,
  Shield
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DpiaList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Get user company
  const userId = parseInt(localStorage.getItem("userId") || "1");
  const { data: company } = useQuery({
    queryKey: [`/api/companies/${userId}`],
  });

  // Get DPIA assessments
  const { data: dpiaList = [], isLoading } = useQuery({
    queryKey: [`/api/dpia/${company?.id}`],
    enabled: !!company?.id,
  });

  // Delete DPIA mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/dpia/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AIPD supprimée",
        description: "L'analyse d'impact a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dpia/${company?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression.",
        variant: "destructive",
      });
    },
  });

  const filteredDpia = dpiaList.filter((dpia: any) =>
    dpia.generalDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dpia.dataController?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case "inprogress":
        return <Badge variant="default"><AlertTriangle className="h-3 w-3 mr-1" />En cours</Badge>;
      case "completed":
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Complétée</Badge>;
      case "validated":
        return <Badge variant="default" className="bg-green-600"><Shield className="h-3 w-3 mr-1" />Validée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCompletionPercentage = (dpia: any) => {
    let completed = 0;
    const total = 15;

    if (dpia.generalDescription) completed++;
    if (dpia.processingPurposes) completed++;
    if (dpia.dataController) completed++;
    if (dpia.dataProcessors) completed++;
    if (dpia.personalDataCategories?.length > 0) completed++;
    if (dpia.dataMinimization) completed++;
    if (dpia.retentionJustification) completed++;
    if (dpia.rightsInformation) completed++;
    if (dpia.rightsConsent) completed++;
    if (dpia.rightsAccess) completed++;
    if (dpia.rightsRectification) completed++;
    if (dpia.rightsOpposition) completed++;
    if (dpia.securityMeasures) completed++;
    if (dpia.riskAssessment?.length > 0) completed++;
    if (dpia.actionPlan?.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analyses d'Impact RGPD (AIPD)</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos analyses d'impact sur la protection des données avec assistance IA
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setLocation('/dpia/evaluation')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Évaluation préliminaire
          </Button>
          <Button onClick={() => setLocation("/dpia/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle AIPD
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Processus AIPD en deux étapes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">1. Évaluation préliminaire</h4>
              <p className="text-sm text-muted-foreground">
                Déterminez si votre traitement nécessite une AIPD selon les critères RGPD et la liste CNIL
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">2. AIPD complète avec IA</h4>
              <p className="text-sm text-muted-foreground">
                Réalisez votre AIPD avec l'assistance de l'IA selon la méthodologie CNIL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher une AIPD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* DPIA List */}
      <div className="space-y-4">
        {filteredDpia.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune AIPD trouvée</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? "Aucune analyse d'impact ne correspond à votre recherche."
                  : "Commencez par créer votre première analyse d'impact RGPD."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setLocation("/dpia/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première AIPD
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDpia.map((dpia: any) => (
            <Card key={dpia.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {dpia.generalDescription?.substring(0, 80) || "AIPD sans titre"}{dpia.generalDescription?.length > 80 && "..."}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {dpia.dataController && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Responsable:</span>
                          {dpia.dataController}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(dpia.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Progression:</span>
                          <span className="font-medium">{getCompletionPercentage(dpia)}%</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(dpia.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dpia.processingPurposes && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Finalités:</span>
                      <p className="text-sm mt-1">
                        {dpia.processingPurposes.substring(0, 150)}
                        {dpia.processingPurposes.length > 150 && "..."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {dpia.riskAssessment?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          {dpia.riskAssessment.length} risque(s) évalué(s)
                        </div>
                      )}
                      {dpia.actionPlan?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {dpia.actionPlan.length} action(s) planifiée(s)
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/dpia/${dpia.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette AIPD ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'analyse d'impact et toutes ses données 
                              seront définitivement supprimées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(dpia.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5" />
            À propos des AIPD
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p className="mb-2">
            L'Analyse d'Impact sur la Protection des Données (AIPD) est obligatoire pour les traitements 
            présentant un risque élevé pour les droits et libertés des personnes.
          </p>
          <p>
            Notre outil vous guide à travers la méthodologie CNIL avec assistance IA pour :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Décrire le contexte de votre traitement</li>
            <li>Vérifier le respect des principes fondamentaux</li>
            <li>Évaluer les risques pour la vie privée</li>
            <li>Planifier les actions correctives</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}