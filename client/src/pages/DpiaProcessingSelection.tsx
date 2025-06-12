import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  Shield,
  Plus
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DpiaProcessingSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Get user company
  const userId = parseInt(localStorage.getItem("userId") || "1");
  const { data: company } = useQuery({
    queryKey: [`/api/companies/${userId}`],
  }) as { data: any };

  // Get processing records
  const { data: records = [], isLoading } = useQuery({
    queryKey: [`/api/records/${(company as any)?.id}`],
    enabled: !!(company as any)?.id,
  }) as { data: any[], isLoading: boolean };

  // Get existing DPIA evaluations to check which treatments require DPIA
  const { data: dpiaEvaluations = [] } = useQuery({
    queryKey: [`/api/dpia-evaluations/${(company as any)?.id}`],
    enabled: !!(company as any)?.id,
  }) as { data: any[] };

  // Create new DPIA mutation
  const createDpiaMutation = useMutation({
    mutationFn: async (recordId: number) => {
      const record = records.find((r: any) => r.id === recordId);
      const response = await fetch("/api/dpia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          processingRecordId: recordId,
          title: `AIPD - ${record?.name || 'Nouveau traitement'}`,
          status: "draft"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'AIPD");
      }
      
      return response.json();
    },
    onSuccess: (newDpia) => {
      toast({
        title: "AIPD créée avec succès",
        description: "Vous pouvez maintenant commencer l'analyse d'impact.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dpia/${company?.id}`] });
      setLocation(`/dpia/assessment/${newDpia.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'AIPD",
        variant: "destructive",
      });
    },
  });

  // Filter records based on search and DPIA requirements
  const filteredRecords = records.filter((record: any) => {
    const matchesSearch = record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if this record has a preliminary evaluation suggesting DPIA is needed
    const evaluation = dpiaEvaluations.find((evaluation: any) => evaluation.recordId === record.id);
    const needsDpia = evaluation && (
      evaluation.recommendation?.includes("obligatoire") ||
      evaluation.recommendation?.includes("recommandée")
    );
    
    return matchesSearch && needsDpia;
  });

  const getStatusBadge = (record: any) => {
    const evaluation = dpiaEvaluations.find((evaluation: any) => evaluation.recordId === record.id);
    
    if (!evaluation) {
      return <Badge variant="secondary">Évaluation requise</Badge>;
    }
    
    if (evaluation.recommendation?.includes("obligatoire")) {
      return <Badge variant="destructive">AIPD obligatoire</Badge>;
    }
    
    if (evaluation.recommendation?.includes("recommandée")) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">AIPD recommandée</Badge>;
    }
    
    return <Badge variant="secondary">À évaluer</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement des traitements...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dpia')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sélection du traitement pour l'AIPD
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choisissez le traitement pour lequel vous souhaitez réaliser une analyse d'impact
          </p>
        </div>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Rappel :</strong> Une AIPD est obligatoire pour les traitements susceptibles d'engendrer un risque élevé pour les droits et libertés des personnes.</p>
            <p>Seuls les traitements ayant fait l'objet d'une évaluation préliminaire positive apparaissent ci-dessous.</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher un traitement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucun traitement nécessitant une AIPD
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? "Aucun traitement ne correspond à votre recherche."
                : "Aucun traitement nécessitant une AIPD n'a été identifié. Effectuez d'abord une évaluation préliminaire."
              }
            </p>
            <Button onClick={() => setLocation('/dpia/evaluation')} variant="outline">
              Faire une évaluation préliminaire
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record: any) => {
            const evaluation = (dpiaEvaluations as any[]).find((evaluation: any) => evaluation.recordId === record.id);
            
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
                      {getStatusBadge(record)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {evaluation && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Résultat de l'évaluation préliminaire :
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {evaluation.justification}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Score : {evaluation.score}/9 points
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Catégories de données :</strong> {record.dataCategories?.join(", ") || "Non spécifiées"}</p>
                      <p><strong>Durée de conservation :</strong> {record.retentionPeriod || "Non spécifiée"}</p>
                    </div>
                    
                    <Button
                      onClick={() => createDpiaMutation.mutate(record.id)}
                      disabled={createDpiaMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {createDpiaMutation.isPending ? "Création..." : "Créer l'AIPD"}
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