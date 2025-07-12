import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Upload, 
  MessageSquare, 
  Edit3, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  FileType
} from "lucide-react";
import type { ContractualAnnex, InsertContractualAnnex } from "@shared/schema";

// Form validation schema
const createAnnexSchema = z.object({
  projectName: z.string().min(1, "Le nom du projet est requis"),
  contractorName: z.string().min(1, "Le nom du co-contractant est requis"),
  documentTypes: z.array(z.enum(["DPA", "CCT"])).min(1, "Sélectionnez au moins un type de document"),
});

type CreateAnnexFormData = z.infer<typeof createAnnexSchema>;

export default function ContractualAnnexes() {
  const { currentCompany, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Fetch annexes
  const { data: annexes = [], isLoading, error } = useQuery({
    queryKey: [`/api/annexes/${currentCompany?.id}`],
    enabled: !!currentCompany,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Create form
  const form = useForm<CreateAnnexFormData>({
    resolver: zodResolver(createAnnexSchema),
    defaultValues: {
      projectName: "",
      contractorName: "",
      documentTypes: [],
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAnnexFormData) => {
      return apiRequest(`/api/annexes`, {
        method: 'POST',
        body: {
          projectName: data.projectName,
          contractorName: data.contractorName,
          documentTypes: data.documentTypes,
          companyId: currentCompany?.id,
          status: 'draft',
        },
      });
    },
    onSuccess: () => {
      if (currentCompany) {
        queryClient.invalidateQueries({ queryKey: ['/api/annexes', currentCompany.id] });
      }
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Annexe créée",
        description: "Le projet d'annexe contractuelle a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'annexe",
        variant: "destructive",
      });
    },
  });

  // Calculate derived values
  const canWrite = hasPermission('annexes.write');

  // NOW WE CAN HAVE CONDITIONAL RETURNS AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Aucune entreprise sélectionnée</h2>
          <p className="text-gray-600">Veuillez sélectionner une entreprise pour accéder aux annexes contractuelles.</p>
        </div>
      </div>
    );
  }

  const onSubmit = (data: CreateAnnexFormData) => {
    if (!canWrite) {
      toast({
        title: "Permissions insuffisantes",
        description: "Vous n'avez pas les droits pour créer des annexes contractuelles.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  // Filter annexes safely
  const filteredAnnexes = (annexes || []).filter((annex: ContractualAnnex) => {
    if (!annex) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (annex.projectName && annex.projectName.toLowerCase().includes(searchLower)) ||
      (annex.contractorName && annex.contractorName.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === "all" || annex.status === statusFilter;
    
    const matchesType = typeFilter === "all" || 
      (annex.documentTypes && Array.isArray(annex.documentTypes) && 
       annex.documentTypes.includes(typeFilter as 'DPA' | 'CCT'));
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "secondary" as const },
      analyzing: { label: "Analyse en cours", variant: "default" as const },
      ready: { label: "Prêt", variant: "outline" as const },
      completed: { label: "Terminé", variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // Handle error state
  if (error) {
    console.error('Annexes query error:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Annexes contractuelles</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Erreur lors du chargement des annexes contractuelles.</p>
          <p className="text-sm text-red-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Annexes contractuelles</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Annexes contractuelles</h1>
          <p className="text-muted-foreground mt-1">
            Générez des DPA et CCT à partir de vos contrats existants
          </p>
        </div>
        
        {currentCompany && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canWrite}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet d'annexe</DialogTitle>
              <DialogDescription>
                Commencez par définir les informations de base de votre projet.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du projet</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: DPA Client ABC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contractorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-contractant</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documentTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Types de documents à générer</FormLabel>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dpa"
                            checked={field.value.includes("DPA")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, "DPA"]);
                              } else {
                                field.onChange(field.value.filter(type => type !== "DPA"));
                              }
                            }}
                          />
                          <label htmlFor="dpa" className="text-sm font-medium">
                            DPA (Data Processing Agreement)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="cct"
                            checked={field.value.includes("CCT")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, "CCT"]);
                              } else {
                                field.onChange(field.value.filter(type => type !== "CCT"));
                              }
                            }}
                          />
                          <label htmlFor="cct" className="text-sm font-medium">
                            CCT (Clauses Contractuelles Types)
                          </label>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Création..." : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom de projet ou co-contractant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="analyzing">En analyse</SelectItem>
                <SelectItem value="ready">Prêt</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="DPA">DPA</SelectItem>
                <SelectItem value="CCT">CCT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Annexes List */}
      <div className="grid gap-4">
        {filteredAnnexes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {annexes.length === 0 ? "Aucune annexe contractuelle" : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 mb-4">
                {annexes.length === 0 
                  ? "Commencez par créer votre premier projet d'annexe contractuelle."
                  : "Essayez de modifier vos critères de recherche."
                }
              </p>
              {annexes.length === 0 && canWrite && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer la première annexe
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAnnexes.map((annex: ContractualAnnex) => (
            <Card key={annex.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(annex.status)}
                      <h3 className="text-lg font-semibold truncate">
                        {annex.projectName}
                      </h3>
                      {getStatusBadge(annex.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {annex.contractorName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(annex.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileType className="h-4 w-4" />
                        {annex.documentTypes.join(', ')}
                      </div>
                    </div>
                    
                    {annex.originalContractName && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                        <Upload className="h-4 w-4" />
                        Contrat uploadé: {annex.originalContractName}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {annex.status === 'ready' && (
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat IA
                      </Button>
                    )}
                    
                    {annex.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Éditer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}