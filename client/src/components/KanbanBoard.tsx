import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CollaborativeActionModal } from "@/components/CollaborativeActionModal";
import { 
  Circle, 
  Clock, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  Users, 
  UserCheck,
  Activity,
  AlertTriangle,
  Plus,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface KanbanBoardProps {
  companyId: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  icon: React.ElementType;
  color: string;
  actions: any[];
}

export function KanbanBoard({ companyId }: KanbanBoardProps) {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedAction, setDraggedAction] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Mock company users for collaboration indicators
  const companyUsers = [
    { id: 1, firstName: "Jean", lastName: "Dupont", email: "jean@company.com" },
    { id: 2, firstName: "Marie", lastName: "Martin", email: "marie@company.com" },
    { id: 3, firstName: "Pierre", lastName: "Durand", email: "pierre@company.com" },
  ];

  // Get actions data
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['/api/actions', companyId],
    queryFn: () => fetch(`/api/actions/${companyId}`).then(res => res.json()),
    enabled: !!companyId,
  });

  // Update action status mutation
  const updateActionMutation = useMutation({
    mutationFn: async ({ actionId, status }: { actionId: number; status: string }) => {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update action');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions', companyId] });
      toast({ title: "Action mise à jour avec succès" });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  // Helper functions
  const getUserInitials = (userId: number) => {
    const user = companyUsers.find(u => u.id === userId);
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "U";
  };

  const getActionAssignments = (actionId: number) => {
    const mockAssignments = {
      167: [{ userId: 1, role: 'assignee' }, { userId: 2, role: 'reviewer' }],
      168: [{ userId: 3, role: 'assignee' }],
      164: [{ userId: 1, role: 'assignee' }],
    };
    return mockAssignments[actionId as keyof typeof mockAssignments] || [];
  };

  const getActionCommentsCount = (actionId: number) => {
    const mockComments = {
      167: 3,
      168: 1,
      164: 2,
    };
    return mockComments[actionId as keyof typeof mockComments] || 0;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'important':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'important':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return due > now && due <= threeDaysFromNow;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, action: any) => {
    if (!hasPermission('actions', 'write')) {
      e.preventDefault();
      toast({ 
        title: "Accès restreint", 
        description: "Vous devez avoir des permissions d'écriture pour déplacer les actions",
        variant: "destructive" 
      });
      return;
    }
    setDraggedAction(action);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!hasPermission('actions', 'write')) {
      toast({ 
        title: "Accès restreint", 
        description: "Vous devez avoir des permissions d'écriture pour modifier les actions",
        variant: "destructive" 
      });
      setDraggedAction(null);
      return;
    }
    
    if (draggedAction && draggedAction.status !== targetStatus) {
      updateActionMutation.mutate({
        actionId: draggedAction.id,
        status: targetStatus
      });
    }
    
    setDraggedAction(null);
  };

  const openActionModal = (action: any) => {
    // Vérification des permissions avant d'ouvrir le modal
    if (!hasPermission('actions', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour les actions. Contactez l'administrateur pour obtenir des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  // Organize actions into columns
  const columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'À faire',
      status: 'todo',
      icon: Circle,
      color: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
      actions: actions.filter((action: any) => action.status === 'todo')
    },
    {
      id: 'inprogress',
      title: 'En cours',
      status: 'inprogress',
      icon: Clock,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      actions: actions.filter((action: any) => action.status === 'inprogress')
    },
    {
      id: 'completed',
      title: 'Terminé',
      status: 'completed',
      icon: CheckCircle,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      actions: actions.filter((action: any) => action.status === 'completed')
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission notice */}
      {!hasPermission('actions', 'write') && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">
              <span className="font-medium">Accès en lecture seule</span> - Vous ne pouvez pas déplacer les actions entre les colonnes.
            </p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const IconComponent = column.icon;
          
          return (
            <div
              key={column.id}
              className="space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className={cn("p-4 rounded-lg border-2 border-dashed", column.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    <h3 className="font-semibold">{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {column.actions.length}
                  </Badge>
                </div>
              </div>

              {/* Action Cards */}
              <div className="space-y-3 min-h-[200px]">
                {column.actions.map((action: any) => {
                  const assignments = getActionAssignments(action.id);
                  const commentsCount = getActionCommentsCount(action.id);
                  
                  return (
                    <Card
                      key={action.id}
                      className={cn(
                        "transition-all duration-200 hover:shadow-md",
                        hasPermission('actions', 'write') ? "cursor-move" : "cursor-default",
                        getPriorityColor(action.priority),
                        draggedAction?.id === action.id && "opacity-50 transform rotate-2",
                        !hasPermission('actions', 'write') && "opacity-75"
                      )}
                      draggable={hasPermission('actions', 'write')}
                      onDragStart={(e) => handleDragStart(e, action)}
                      onClick={() => openActionModal(action)}
                      style={{ cursor: hasPermission('actions', 'write') ? 'pointer' : 'default' }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {action.title.replace(/^Action pour:\s*/, '')}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={cn("text-xs", getPriorityBadgeColor(action.priority))}>
                              {action.priority === 'urgent' ? 'Urgent' : 'Important'}
                            </Badge>
                            {isOverdue(action.dueDate) && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {isDueSoon(action.dueDate) && (
                              <Clock className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Description */}
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {action.description}
                          </p>

                          {/* Due Date */}
                          {action.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(action.dueDate), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </span>
                            </div>
                          )}

                          {/* Collaboration indicators */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Assigned users */}
                              {assignments.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="flex -space-x-1">
                                    {assignments.slice(0, 3).map((assignment, index) => (
                                      <Avatar key={index} className="h-5 w-5 border-2 border-white dark:border-gray-800">
                                        <AvatarFallback className="text-xs">
                                          {getUserInitials(assignment.userId)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {assignments.length > 3 && (
                                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                                        +{assignments.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <UserCheck className="h-3 w-3 text-green-600" />
                                </div>
                              )}

                              {/* Comments count */}
                              {commentsCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-muted-foreground">{commentsCount}</span>
                                </div>
                              )}
                            </div>

                            {/* Action menu */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openActionModal(action);
                              }}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Empty state */}
                {column.actions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconComponent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune action {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collaborative Action Modal */}
      <CollaborativeActionModal
        action={selectedAction}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}