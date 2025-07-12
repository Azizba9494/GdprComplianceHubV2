import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  Building,
  Download,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContractualAnnex {
  id: number;
  companyId: number;
  contractorName: string;
  contractType: string;
  uploadDate: string;
  status: 'draft' | 'completed' | 'reviewed';
  documentCount: number;
  lastModified: string;
}

export default function ContractualAnnexes() {
  const { currentCompany, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Safe data fetching with proper error handling
  const { data: annexes = [], isLoading, error } = useQuery({
    queryKey: [`/api/annexes/${currentCompany?.id}`],
    enabled: !!currentCompany?.id,
    staleTime: 5 * 60 * 1000
  });

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Aucune entreprise sélectionnée
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement des annexes contractuelles
        </div>
      </div>
    );
  }

  const canWrite = hasPermission('annexes.write');

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "Brouillon" },
      completed: { variant: "default" as const, label: "Terminé" },
      reviewed: { variant: "destructive" as const, label: "À réviser" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAnnexes = annexes.filter((annex: ContractualAnnex) => {
    const matchesSearch = annex.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         annex.contractType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || annex.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Annexes contractuelles</h1>
          <p className="text-muted-foreground mt-1">
            Générez des DPA et CCT à partir de vos contrats existants
          </p>
        </div>
        
        {canWrite && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par co-contractant ou type de contrat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="completed">Terminé</option>
            <option value="reviewed">À réviser</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAnnexes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" 
                ? "Aucun résultat trouvé" 
                : "Aucune annexe contractuelle"
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Essayez de modifier vos critères de recherche."
                : "Commencez par créer votre première annexe contractuelle."
              }
            </p>
            {canWrite && !searchTerm && statusFilter === "all" && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Créer une annexe
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnexes.map((annex: ContractualAnnex) => (
            <Card key={annex.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {annex.contractorName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {annex.contractType}
                    </p>
                  </div>
                  {getStatusBadge(annex.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Créé le {format(new Date(annex.uploadDate), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {annex.documentCount} document{annex.documentCount > 1 ? 's' : ''} généré{annex.documentCount > 1 ? 's' : ''}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    Modifié le {format(new Date(annex.lastModified), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  
                  {canWrite && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {canWrite && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}