import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { actionsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COMPANY_ID = 1; // Mock company ID

const statusLabels = {
  todo: "À faire",
  inprogress: "En cours",
  completed: "Terminé",
};

const priorityLabels = {
  urgent: "Urgent",
  important: "Important", 
  normal: "Normal",
};

const priorityColors = {
  urgent: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  important: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
  normal: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
};

export default function ActionPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ['/api/actions', COMPANY_ID],
    queryFn: () => actionsApi.get(COMPANY_ID).then(res => res.json()),
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      actionsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Action mise à jour",
        description: "Le statut de l'action a été modifié avec succès.",
      });
    },
  });

  const handleStatusChange = (actionId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    
    updateActionMutation.mutate({ id: actionId, updates });
  };

  if (isLoading) {
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

  const completedActions = actions.filter((a: any) => a.status === 'completed');
  const progressPercentage = Math.round((completedActions.length / actions.length) * 100);

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
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de conformité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actions.map((action: any) => (
              <div
                key={action.id}
                className={cn(
                  "p-4 rounded-lg border",
                  action.priority === 'urgent' ? 'priority-urgent' :
                  action.priority === 'important' ? 'priority-important' : 'priority-normal'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-foreground">{action.title}</h3>
                      <Badge 
                        variant="secondary"
                        className={priorityColors[action.priority as keyof typeof priorityColors]}
                      >
                        {priorityLabels[action.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Catégorie:</span>
                        <span>{action.category}</span>
                      </div>
                      
                      {action.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Échéance: {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
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
    </div>
  );
}
