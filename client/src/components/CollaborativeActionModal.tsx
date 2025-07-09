import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Clock, 
  Paperclip, 
  Send, 
  Edit2, 
  Trash2, 
  Plus,
  User,
  Activity,
  CheckCircle,
  Circle,
  Calendar,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CollaborativeActionModalProps {
  action: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollaborativeActionModal({ action, isOpen, onOpenChange }: CollaborativeActionModalProps) {
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newAssigneeRole, setNewAssigneeRole] = useState("assignee");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Mock users data - in a real app, this would come from company members API
  const companyUsers = [
    { id: 1, firstName: "Jean", lastName: "Dupont", email: "jean@company.com" },
    { id: 2, firstName: "Marie", lastName: "Martin", email: "marie@company.com" },
    { id: 3, firstName: "Pierre", lastName: "Durand", email: "pierre@company.com" },
  ];

  // Get action assignments
  const { data: assignments = [] } = useQuery({
    queryKey: [`/api/actions/${action?.id}/assignments`],
    queryFn: () => action ? fetch(`/api/actions/${action.id}/assignments`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!action && isOpen,
  });

  // Get action comments
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/actions/${action?.id}/comments`],
    queryFn: () => action ? fetch(`/api/actions/${action.id}/comments`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!action && isOpen,
  });

  // Get action activity
  const { data: activity = [] } = useQuery({
    queryKey: [`/api/actions/${action?.id}/activity`],
    queryFn: () => action ? fetch(`/api/actions/${action.id}/activity`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!action && isOpen,
  });

  // Get action attachments
  const { data: attachments = [] } = useQuery({
    queryKey: [`/api/actions/${action?.id}/attachments`],
    queryFn: () => action ? fetch(`/api/actions/${action.id}/attachments`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!action && isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/actions/${action.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      setNewComment("");
      toast({ title: "Commentaire ajouté avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'ajout du commentaire", variant: "destructive" });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return apiRequest(`/api/actions/${action.id}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      setEditingComment(null);
      setEditedContent("");
      toast({ title: "Commentaire modifié avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/actions/${action.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      toast({ title: "Commentaire supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Add assignment mutation
  const addAssignmentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/actions/${action.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ 
          userId: parseInt(newAssigneeId), 
          role: newAssigneeRole 
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/assignments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      setNewAssigneeId("");
      setNewAssigneeRole("assignee");
      toast({ title: "Assignation ajoutée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'assignation", variant: "destructive" });
    },
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest(`/api/actions/${action.id}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/assignments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      toast({ title: "Assignation supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Update action status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest(`/api/actions/${action.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: newStatus,
          previousStatus: action.status,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/actions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/actions/${action.id}/activity`] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleEditComment = (commentId: number, content: string) => {
    setEditingComment(commentId);
    setEditedContent(content);
  };

  const handleSaveEdit = () => {
    if (editingComment && editedContent.trim()) {
      editCommentMutation.mutate({
        commentId: editingComment,
        content: editedContent.trim()
      });
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleAddAssignment = () => {
    if (newAssigneeId) {
      addAssignmentMutation.mutate();
    }
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette assignation ?")) {
      removeAssignmentMutation.mutate(assignmentId);
    }
  };

  const getUserName = (userId: number) => {
    const user = companyUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `Utilisateur ${userId}`;
  };

  const getUserInitials = (userId: number) => {
    const user = companyUsers.find(u => u.id === userId);
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "U";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'inprogress':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'inprogress':
        return 'En cours';
      default:
        return 'À faire';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'assignee':
        return 'Responsable';
      case 'reviewer':
        return 'Réviseur';
      case 'observer':
        return 'Observateur';
      default:
        return role;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'status_changed':
        return CheckCircle;
      case 'assigned':
      case 'unassigned':
        return User;
      case 'commented':
      case 'comment_edited':
      case 'comment_deleted':
        return MessageSquare;
      case 'attachment_added':
      case 'attachment_deleted':
        return Paperclip;
      default:
        return Activity;
    }
  };

  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{action.title}</span>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(action.status)}>
                {getStatusLabel(action.status)}
              </Badge>
              <Select value={action.status} onValueChange={updateStatusMutation.mutate}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="inprogress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="comments" className="relative">
              Discussion
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments">Équipe</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto flex-1">
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {action.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Catégorie</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{action.category}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priorité</Label>
                    <div className="mt-1">
                      <Badge variant={action.priority === 'urgent' ? 'destructive' : 'default'}>
                        {action.priority === 'urgent' ? 'Urgent' : 'Important'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {action.dueDate && (
                  <div>
                    <Label className="text-sm font-medium">Échéance</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                )}

                {action.completedAt && (
                  <div>
                    <Label className="text-sm font-medium">Terminé le</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{new Date(action.completedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(comment.userId)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {getUserName(comment.userId)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </span>
                            </div>
                            {comment.userId === user?.id && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id, comment.content)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingComment === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  Sauvegarder
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingComment(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-sm">{comment.content}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Personnes assignées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(assignment.userId)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {getUserName(assignment.userId)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(assignment.role)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="border-t pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une personne" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyUsers
                              .filter(user => !assignments.find((a: any) => a.userId === user.id))
                              .map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Select value={newAssigneeRole} onValueChange={setNewAssigneeRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assignee">Responsable</SelectItem>
                            <SelectItem value="reviewer">Réviseur</SelectItem>
                            <SelectItem value="observer">Observateur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddAssignment}
                        disabled={!newAssigneeId || addAssignmentMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assigner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-3">
                {activity.map((item: any) => {
                  const Icon = getActivityIcon(item.activityType);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getUserName(item.userId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}