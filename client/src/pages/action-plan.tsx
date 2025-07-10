import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { actionsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CollaborativeActionModal } from "@/components/CollaborativeActionModal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Calendar, Clock, CheckCircle, Circle, ArrowRight, CalendarDays, Edit, Filter, Search, AlertTriangle, FileText, Shield, Users, MessageSquare, UserCheck, Activity, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
import { cn } from "@/lib/utils";

const statusLabels = {
  todo: "À faire",
  inprogress: "En cours",
  completed: "Terminé",
};

const priorityLabels = {
  urgent: "Urgent",
  important: "Important",
};

const priorityColors = {
  urgent: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  important: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
};

// Action categories for filtering - aligned with diagnostic categories
const actionCategories = {
  "gouvernance": {
    name: "Gouvernance et principes fondamentaux",
    icon: Shield,
    keywords: ["gouvernance", "responsabilité", "dpo", "délégué", "registre", "politique", "principes", "fondamentaux"]
  },
  "bases-legales": {
    name: "Bases légales et gestion du consentement", 
    icon: FileText,
    keywords: ["base légale", "consentement", "consentements", "légalité", "finalité", "collecte", "gestion"]
  },
  "droits": {
    name: "Information et droit des personnes concernées",
    icon: Users,
    keywords: ["droits", "accès", "rectification", "effacement", "portabilité", "opposition", "information", "personnes concernées"]
  },
  "securite": {
    name: "Sécurité",
    icon: Shield,
    keywords: ["sécurité", "chiffrement", "authentification", "sauvegarde", "technique", "protection", "mesures"]
  },
  "autres": {
    name: "Autres actions",
    icon: Circle,
    keywords: []
  }
};

function getActionCategory(action: any): string {
  const title = action.title?.toLowerCase() || "";
  const description = action.description?.toLowerCase() || "";
  const content = `${title} ${description}`;

  for (const [key, category] of Object.entries(actionCategories)) {
    if (key === "autres") continue;
    if (category.keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
      return key;
    }
  }
  return "autres";
}

export default function ActionPlan() {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isCollaborativeModalOpen, setIsCollaborativeModalOpen] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();



  // Get company users (collaborators)
  const { data: companyUsers = [] } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/users`],
    enabled: !!currentCompany?.id,
  });

  const { data: actions, isLoading } = useQuery({
    queryKey: ['/api/actions', currentCompany?.id],
    queryFn: () => currentCompany ? actionsApi.get(currentCompany.id).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  // Helper functions for collaborative features
  const getUserInitials = (userId: number) => {
    const user = companyUsers.find(u => u.id === userId);
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "U";
  };

  const openCollaborativeModal = (action: any) => {
    if (!hasPermission('actions.write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour le plan d'actions. Pour modifier les actions, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAction(action);
    setIsCollaborativeModalOpen(true);
  };

  // Get action assignments - dynamic data from API
  const getActionAssignments = (actionId: number) => {
    // Real implementation would fetch from API
    return [];
  };

  // Get action comments count - dynamic data from API
  const getActionCommentsCount = (actionId: number) => {
    // Real implementation would fetch from API
    return 0;
  };

  const updateActionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      actionsApi.update(id, updates),
    onSuccess: () => {
      if (currentCompany) {
        queryClient.invalidateQueries({ queryKey: ['/api/actions', currentCompany.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard', currentCompany.id] });
      }
      toast({
        title: "Action mise à jour",
        description: "Le statut de l'action a été modifié avec succès.",
      });
    },
    onError: (error: any) => {
      console.error('Update action error:', error);
      
      // Check if it's a permission error
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Droits insuffisants') || errorMessage.includes('actions.write')) {
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour le plan d'actions. Pour modifier les actions, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation pour obtenir les permissions nécessaires.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la mise à jour de l'action. Contactez l'administrateur si le problème persiste.",
          variant: "destructive",
        });
      }
    },
  });

  const handleStatusChange = (actionId: number, newStatus: string) => {
    if (!hasPermission('actions.write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour le plan d'actions. Pour modifier les statuts, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    const updates: any = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    
    updateActionMutation.mutate({ id: actionId, updates });
  };

  const openDateDialog = (action: any) => {
    if (!hasPermission('actions.write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour le plan d'actions. Pour modifier les échéances, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAction(action);
    setNewDueDate(action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "");
    setIsDateDialogOpen(true);
  };

  const handleDateUpdate = () => {
    if (selectedAction && newDueDate) {
      updateActionMutation.mutate({ 
        id: selectedAction.id, 
        updates: { dueDate: new Date(newDueDate).toISOString() } 
      });
      setIsDateDialogOpen(false);
      setSelectedAction(null);
      setNewDueDate("");
    }
  };

  // Check permissions first
  if (!hasPermission('actions.read')) {
    return (
      <AccessDenied
        module="Plan d'actions"
        requiredPermission="actions.read"
        description="Vous n'avez pas accès au module de gestion du plan d'actions. Ce module permet de suivre et organiser les actions de mise en conformité RGPD."
      />
    );
  }

  if (isLoading || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Chargement du plan d'actions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Vous devez être connecté et avoir une entreprise associée pour accéder au plan d'actions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Circle className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Aucun plan d'action</h3>
              <p className="text-muted-foreground">
                Commencez par effectuer un diagnostic RGPD pour générer votre plan d'action personnalisé.
              </p>
              <Button onClick={() => window.location.href = '/diagnostic'}>
                Faire le diagnostic
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter and organize actions
  const filterActions = (actions: any[], status?: string, category?: string, search?: string) => {
    return actions.filter((action: any) => {
      const matchesStatus = !status || status === 'all' || action.status === status;
      const matchesCategory = !category || category === 'all' || getActionCategory(action) === category;
      const matchesSearch = !search || 
        action.title?.toLowerCase().includes(search.toLowerCase()) ||
        action.description?.toLowerCase().includes(search.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesSearch;
    });
  };

  const completedActions = actions.filter((a: any) => a.status === 'completed');
  const inProgressActions = actions.filter((a: any) => a.status === 'inprogress');
  const todoActions = actions.filter((a: any) => a.status === 'todo');
  const progressPercentage = Math.round((completedActions.length / actions.length) * 100);

  // Get filtered actions based on current tab and filters
  const getFilteredActions = () => {
    const statusFilter = activeTab === 'all' ? undefined : activeTab;
    return filterActions(actions, statusFilter, selectedCategory, searchTerm);
  };

  const filteredActions = getFilteredActions();

  // Group actions by category for better organization
  const actionsByCategory = filteredActions.reduce((acc: any, action: any) => {
    const category = getActionCategory(action);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progression du plan d'action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedActions.length} actions terminées sur {actions.length}
          </p>
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-bold text-blue-600">{todoActions.length}</div>
              <div className="text-xs text-muted-foreground">À faire</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-bold text-orange-600">{inProgressActions.length}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-bold text-green-600">{completedActions.length}</div>
              <div className="text-xs text-muted-foreground">Terminées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {Object.entries(actionCategories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Display */}
      {viewMode === 'kanban' ? (
        <KanbanBoard companyId={currentCompany?.id} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Circle className="w-4 h-4" />
              Toutes ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="todo" className="flex items-center gap-2">
              <Circle className="w-4 h-4" />
              À faire ({todoActions.length})
            </TabsTrigger>
            <TabsTrigger value="inprogress" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En cours ({inProgressActions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Terminées ({completedActions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredActions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Circle className="w-16 h-16 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">Aucune action trouvée</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedCategory !== 'all' 
                        ? "Aucune action ne correspond aux filtres sélectionnés."
                        : "Aucune action disponible pour cette catégorie."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(actionsByCategory).map(([categoryKey, categoryActions]: [string, any]) => {
                  const category = actionCategories[categoryKey as keyof typeof actionCategories];
                  const IconComponent = category.icon;
                  
                  return (
                    <Card key={categoryKey}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <IconComponent className="w-5 h-5" />
                          {category.name} ({categoryActions.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {categoryActions.map((action: any) => (
                            <div
                              key={action.id}
                              className={cn(
                                "p-4 rounded-lg border",
                                action.priority === 'urgent' ? 'priority-urgent' : 'priority-important'
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-foreground whitespace-pre-wrap break-words">
                                      {action.title.replace(/^Action pour:\s*/, '')}
                                    </h3>
                                  </div>
                                  <Badge 
                                    variant="secondary"
                                    className={`${priorityColors[action.priority as keyof typeof priorityColors]} flex-shrink-0`}
                                  >
                                    {priorityLabels[action.priority as keyof typeof priorityLabels]}
                                  </Badge>
                                </div>
                                  
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                  {action.description}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium">Catégorie:</span>
                                    <span>{action.category}</span>
                                  </div>
                                  
                                  {action.dueDate && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span className="font-medium">Échéance: {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  )}
                                  {!action.dueDate && (
                                    <div className="flex items-center space-x-1 text-orange-600">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">Aucune échéance définie</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Collaborative indicators */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {/* Assigned users */}
                                    <div className="flex items-center gap-1">
                                      {getActionAssignments(action.id).slice(0, 3).map((assignment, index) => (
                                        <Avatar key={index} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                                          <AvatarFallback className="text-xs">
                                            {getUserInitials(assignment.userId)}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {getActionAssignments(action.id).length > 3 && (
                                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                                          +{getActionAssignments(action.id).length - 3}
                                        </div>
                                      )}
                                      {getActionAssignments(action.id).length > 0 && (
                                        <UserCheck className="h-4 w-4 text-green-600 ml-1" />
                                      )}
                                    </div>

                                    {/* Comments indicator */}
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm text-muted-foreground">
                                        {getActionCommentsCount(action.id)}
                                      </span>
                                    </div>

                                    {/* Activity indicator */}
                                    <div className="flex items-center gap-1">
                                      <Activity className="h-4 w-4 text-purple-600" />
                                      <span className="text-xs text-muted-foreground">
                                        récent
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDateDialog(action)}
                                      className="flex items-center space-x-1"
                                    >
                                      <CalendarDays className="w-4 h-4" />
                                      <span>Échéance</span>
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openCollaborativeModal(action)}
                                      className="flex items-center space-x-1"
                                    >
                                      <Users className="w-4 h-4" />
                                      <span>Collaborer</span>
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-end gap-3">
                                  <Select
                                    value={action.status}
                                    onValueChange={(value) => handleStatusChange(action.id, value)}
                                    disabled={updateActionMutation.isPending}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todo">À faire</SelectItem>
                                      <SelectItem value="inprogress">En cours</SelectItem>
                                      <SelectItem value="completed">Terminé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  {action.status === 'completed' && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                  {action.status === 'inprogress' && (
                                    <Clock className="w-5 h-5 text-orange-500" />
                                  )}
                                  {action.status === 'todo' && (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Date Picker Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Définir l'échéance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDateDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDateUpdate}
                disabled={!newDueDate}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborative Action Modal */}
      <CollaborativeActionModal
        action={selectedAction}
        isOpen={isCollaborativeModalOpen}
        onOpenChange={setIsCollaborativeModalOpen}
      />
    </div>
  );
}
