import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ExpandableText } from "@/components/ui/expandable-text";
import { 
  ShieldX, Plus, Calendar, Clock, CheckCircle, AlertCircle, 
  User, Mail, FileText, Loader2, Filter, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMPANY_ID = 1; // Mock company ID

interface DataSubjectRequest {
  id: number;
  requesterId: string;
  requesterEmail: string;
  requestType: string;
  status: string;
  description: string;
  identityVerified: boolean;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
}

const requestTypes = {
  access: "Droit d'accès",
  rectification: "Droit de rectification",
  erasure: "Droit à l'effacement",
  portability: "Droit à la portabilité",
  objection: "Droit d'opposition",
};

const statusLabels = {
  new: "Nouvelle",
  inprogress: "En cours",
  verification: "Vérification",
  closed: "Terminée",
};

const statusColors = {
  new: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  inprogress: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
  verification: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
  closed: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300",
};

export default function RightsManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      requesterId: "",
      requesterEmail: "",
      requestType: "",
      description: "",
    },
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['/api/requests', COMPANY_ID],
    queryFn: () => requestsApi.get(COMPANY_ID).then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const requestData = {
        ...data,
        companyId: COMPANY_ID,
        status: "new",
        identityVerified: false,
      };
      return requestsApi.create(requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Demande créée !",
        description: "La demande d'exercice de droits a été enregistrée.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la demande",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      requestsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Demande mise à jour",
        description: "Le statut de la demande a été modifié.",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleStatusChange = (requestId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'closed') {
      updates.completedAt = new Date().toISOString();
    }
    updateMutation.mutate({ id: requestId, updates });
  };

  const handleIdentityVerification = (requestId: number, verified: boolean) => {
    updateMutation.mutate({ 
      id: requestId, 
      updates: { identityVerified: verified } 
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "text-red-600 dark:text-red-400";
    if (daysUntilDue <= 5) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
  };

  // Filter requests
  const filteredRequests = requests?.filter((request: DataSubjectRequest) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      request.requesterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requesterId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement des demandes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests?.filter((r: DataSubjectRequest) => r.status !== 'closed') || [];
  const overdueRequests = pendingRequests.filter((r: DataSubjectRequest) => 
    getDaysUntilDue(r.dueDate) < 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des droits des personnes</h2>
          <p className="text-muted-foreground">
            Gérez les demandes d'exercice de droits selon le RGPD
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer une nouvelle demande</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle demande d'exercice de droits RGPD reçue d'une personne concernée.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="requesterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant du demandeur</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ID client, nom..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requesterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email du demandeur</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de demande</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(requestTypes).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Détails supplémentaires sur la demande..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total traitées</p>
                <p className="text-2xl font-bold">
                  {requests?.filter((r: DataSubjectRequest) => r.status === 'closed').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes d'exercice de droits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="new">Nouvelles</SelectItem>
                  <SelectItem value="inprogress">En cours</SelectItem>
                  <SelectItem value="verification">Vérification</SelectItem>
                  <SelectItem value="closed">Terminées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Rechercher par email ou identifiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <ShieldX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                {requests?.length === 0 ? "Aucune demande" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground">
                {requests?.length === 0 
                  ? "Les demandes d'exercice de droits apparaîtront ici."
                  : "Aucune demande ne correspond à vos critères de recherche."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: DataSubjectRequest) => {
                const daysUntilDue = getDaysUntilDue(request.dueDate);
                const isOverdue = daysUntilDue < 0;
                
                return (
                  <div
                    key={request.id}
                    className={cn(
                      "p-4 border rounded-lg",
                      isOverdue && request.status !== 'closed' && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/10"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{request.requesterId}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span>{request.requesterEmail}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {requestTypes[request.requestType as keyof typeof requestTypes]}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className={statusColors[request.status as keyof typeof statusColors]}
                          >
                            {statusLabels[request.status as keyof typeof statusLabels]}
                          </Badge>
                          {request.identityVerified && (
                            <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Identité vérifiée
                            </Badge>
                          )}
                        </div>

                        {request.description && (
                          <ExpandableText
                            text={request.description}
                            maxLength={100}
                            className="text-sm text-muted-foreground"
                            previewMode="characters"
                          />
                        )}

                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Créée le {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className={cn("flex items-center space-x-1", getUrgencyColor(daysUntilDue))}>
                            <Clock className="w-4 h-4" />
                            <span>
                              {isOverdue 
                                ? `En retard de ${Math.abs(daysUntilDue)} jour(s)`
                                : `${daysUntilDue} jour(s) restant(s)`
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                          disabled={updateMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nouvelle</SelectItem>
                            <SelectItem value="inprogress">En cours</SelectItem>
                            <SelectItem value="verification">Vérification</SelectItem>
                            <SelectItem value="closed">Terminée</SelectItem>
                          </SelectContent>
                        </Select>

                        {!request.identityVerified && request.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIdentityVerification(request.id, true)}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Vérifier
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

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Délais légaux et bonnes pratiques</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Délais de réponse</h4>
                <p className="text-sm text-muted-foreground">
                  Vous disposez d'<strong>un mois</strong> pour répondre à une demande d'exercice de droits, 
                  à compter de sa réception.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Vérification d'identité</h4>
                <p className="text-sm text-muted-foreground">
                  Il est recommandé de vérifier l'identité du demandeur avant de traiter la demande, 
                  surtout pour les demandes d'accès ou de portabilité.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Conservez une trace de toutes les demandes et des actions entreprises pour répondre 
                  aux obligations de responsabilité du RGPD.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Prolongation possible</h4>
                <p className="text-sm text-muted-foreground">
                  En cas de demandes complexes ou nombreuses, le délai peut être prolongé de 2 mois 
                  avec justification auprès du demandeur.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
