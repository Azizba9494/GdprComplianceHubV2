import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Mail, 
  Users, 
  Settings, 
  Trash2, 
  Send,
  Shield,
  Calendar,
  Edit,
  Eye,
  Zap
} from "lucide-react";

interface Collaborator {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Invitation {
  id: number;
  email: string;
  companyId: number;
  permissions: string[];
  status: string;
  createdAt: string;
  expiresAt: string;
}

// Enhanced permissions with granular access levels
const MODULE_PERMISSIONS = [
  { 
    id: 'diagnostic', 
    label: 'Diagnostic RGPD',
    description: 'Questionnaire et évaluation de conformité',
    levels: ['read', 'write'] 
  },
  { 
    id: 'actions', 
    label: 'Plan d\'actions', 
    description: 'Gestion des actions de conformité',
    levels: ['read', 'write', 'assign'] 
  },
  { 
    id: 'records', 
    label: 'Registre des traitements', 
    description: 'Fiches de traitement des données',
    levels: ['read', 'write', 'generate'] 
  },
  { 
    id: 'breaches', 
    label: 'Violations de données', 
    description: 'Analyse et gestion des incidents',
    levels: ['read', 'write', 'analyze'] 
  },
  { 
    id: 'dpia', 
    label: 'Analyses d\'impact (AIPD)', 
    description: 'Évaluations d\'impact sur la vie privée',
    levels: ['read', 'write', 'evaluate'] 
  },
  { 
    id: 'requests', 
    label: 'Demandes des personnes', 
    description: 'Gestion des droits des personnes concernées',
    levels: ['read', 'write', 'process'] 
  },
  { 
    id: 'policies', 
    label: 'Politique de confidentialité', 
    description: 'Génération et gestion des politiques',
    levels: ['read', 'write', 'generate'] 
  },
  { 
    id: 'subprocessors', 
    label: 'Sous-traitants', 
    description: 'Registre du sous-traitant',
    levels: ['read', 'write'] 
  },
  { 
    id: 'team', 
    label: 'LA Team Jean Michel', 
    description: 'Assistants IA spécialisés',
    levels: ['read', 'chat'] 
  },
  { 
    id: 'learning', 
    label: 'Formation', 
    description: 'Modules d\'apprentissage gamifiés',
    levels: ['read', 'participate'] 
  },
  { 
    id: 'admin', 
    label: 'Administration', 
    description: 'Configuration et gestion avancée',
    levels: ['read', 'write', 'manage'] 
  }
];

const PERMISSION_LEVEL_LABELS = {
  read: 'Lecture',
  write: 'Écriture',
  assign: 'Assignation',
  generate: 'Génération IA',
  analyze: 'Analyse IA',
  evaluate: 'Évaluation',
  process: 'Traitement',
  chat: 'Discussion IA',
  participate: 'Participation',
  manage: 'Gestion complète'
};

// Legacy permissions for backward compatibility
const PERMISSIONS = MODULE_PERMISSIONS.map(module => ({ 
  id: module.id, 
  label: module.label 
}));

const ROLES = [
  { value: 'collaborator', label: 'Collaborateur' },
  { value: 'manager', label: 'Responsable' },
  { value: 'admin', label: 'Administrateur' }
];

export default function Collaborators() {
  const { user, currentCompany } = useAuth();
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("collaborator");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPermissionsForExisting, setSelectedPermissionsForExisting] = useState<string[]>([]);

  const companyId = currentCompany?.id;

  // Get collaborators
  const { data: collaborators = [], isLoading: loadingCollaborators } = useQuery({
    queryKey: [`/api/companies/${companyId}/collaborators`],
    enabled: !!companyId
  });

  // Get invitations
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: [`/api/companies/${companyId}/invitations`],
    enabled: !!companyId
  });

  // Invite collaborator mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; permissions: string[] }) => {
      const response = await fetch(`/api/companies/${companyId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/invitations`] });
      setIsInviteOpen(false);
      setInviteEmail("");
      setSelectedPermissions([]);
      toast({ title: "Invitation envoyée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'envoi de l'invitation", variant: "destructive" });
    }
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (accessId: number) => {
      const response = await fetch(`/api/companies/${companyId}/collaborators/${accessId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove collaborator');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/collaborators`] });
      toast({ title: "Collaborateur supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/companies/${companyId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete invitation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/invitations`] });
      toast({ title: "Invitation supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  });

  // Update collaborator permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { collaboratorId: number; permissions: string[] }) => {
      const response = await fetch(`/api/companies/${companyId}/collaborators/${data.collaboratorId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: data.permissions }),
      });
      if (!response.ok) throw new Error('Failed to update permissions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/collaborators`] });
      setEditingCollaborator(null);
      setEditPermissions([]);
      toast({ title: "Permissions mises à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour des permissions", variant: "destructive" });
    }
  });

  // Search users mutation
  const searchUsersMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: () => {
      toast({ title: "Erreur lors de la recherche d'utilisateurs", variant: "destructive" });
    }
  });

  // Add existing user mutation
  const addExistingUserMutation = useMutation({
    mutationFn: async (data: { userId: number; permissions: string[]; role: string }) => {
      const response = await fetch(`/api/companies/${companyId}/collaborators/add-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/collaborators`] });
      setIsAddExistingOpen(false);
      setSearchEmail("");
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedPermissionsForExisting([]);
      toast({ title: "Collaborateur ajouté avec succès" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible d'ajouter le collaborateur",
        variant: "destructive" 
      });
    }
  });

  const handleInvite = () => {
    if (!inviteEmail || selectedPermissions.length === 0) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
      permissions: selectedPermissions
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permissionId));
    }
  };

  // Enhanced permission management for granular access
  const handleGranularPermissionChange = (moduleId: string, level: string, checked: boolean) => {
    const permissionKey = `${moduleId}.${level}`;
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionKey]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permissionKey));
    }
  };

  // Helper to check if a specific permission level is selected
  const hasPermission = (moduleId: string, level: string) => {
    return selectedPermissions.includes(`${moduleId}.${level}`);
  };

  // Preset permission templates for quick setup
  const applyPermissionTemplate = (template: string) => {
    let newPermissions: string[] = [];
    
    switch (template) {
      case 'viewer':
        newPermissions = MODULE_PERMISSIONS.map(module => `${module.id}.read`);
        break;
      case 'contributor':
        newPermissions = MODULE_PERMISSIONS.flatMap(module => 
          module.levels.includes('write') 
            ? [`${module.id}.read`, `${module.id}.write`]
            : [`${module.id}.read`]
        );
        break;
      case 'manager':
        newPermissions = MODULE_PERMISSIONS.flatMap(module => 
          module.levels.map(level => `${module.id}.${level}`)
        );
        break;
      default:
        newPermissions = [];
    }
    
    setSelectedPermissions(newPermissions);
  };

  // Edit collaborator permissions handlers
  const startEditingPermissions = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setEditPermissions(collaborator.permissions);
  };

  const handleEditPermissionChange = (moduleId: string, level: string, checked: boolean) => {
    const permissionKey = `${moduleId}.${level}`;
    if (checked) {
      setEditPermissions([...editPermissions, permissionKey]);
    } else {
      setEditPermissions(editPermissions.filter(p => p !== permissionKey));
    }
  };

  const applyEditPermissionTemplate = (template: string) => {
    let newPermissions: string[] = [];
    
    switch (template) {
      case 'viewer':
        newPermissions = MODULE_PERMISSIONS.map(module => `${module.id}.read`);
        break;
      case 'contributor':
        newPermissions = MODULE_PERMISSIONS.flatMap(module => 
          module.levels.includes('write') 
            ? [`${module.id}.read`, `${module.id}.write`]
            : [`${module.id}.read`]
        );
        break;
      case 'manager':
        newPermissions = MODULE_PERMISSIONS.flatMap(module => 
          module.levels.map(level => `${module.id}.${level}`)
        );
        break;
      default:
        newPermissions = [];
    }
    
    setEditPermissions(newPermissions);
  };

  const savePermissions = () => {
    if (editingCollaborator) {
      updatePermissionsMutation.mutate({
        collaboratorId: editingCollaborator.id,
        permissions: editPermissions
      });
    }
  };

  // Helper to get permission summary
  const getPermissionSummary = (permissions: string[]) => {
    const moduleCount = new Set(permissions.map(p => p.split('.')[0])).size;
    const hasAdvanced = permissions.some(p => 
      p.includes('.generate') || p.includes('.analyze') || p.includes('.manage')
    );
    
    return {
      moduleCount,
      level: hasAdvanced ? 'Avancé' : permissions.some(p => p.includes('.write')) ? 'Standard' : 'Lecture'
    };
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  if (!companyId) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des collaborateurs</h1>
          <p className="text-gray-600 mt-2">
            Gérez l'équipe de votre entreprise et leurs permissions d'accès
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Inviter par email
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Inviter un collaborateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@exemple.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Modèles de permissions</Label>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => applyPermissionTemplate('viewer')}
                    >
                      Lecteur
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => applyPermissionTemplate('contributor')}
                    >
                      Contributeur
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => applyPermissionTemplate('manager')}
                    >
                      Gestionnaire
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Permissions détaillées par module</Label>
                  <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
                    {MODULE_PERMISSIONS.map((module) => (
                      <Card key={module.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{module.label}</h5>
                            <p className="text-xs text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {module.levels.map((level) => {
                            const permissionKey = `${module.id}.${level}`;
                            return (
                              <div key={level} className="flex items-center space-x-1">
                                <Checkbox
                                  id={permissionKey}
                                  checked={selectedPermissions.includes(permissionKey)}
                                  onCheckedChange={(checked) => 
                                    handleGranularPermissionChange(module.id, level, checked as boolean)
                                  }
                                />
                                <Label htmlFor={permissionKey} className="text-xs">
                                  {PERMISSION_LEVEL_LABELS[level as keyof typeof PERMISSION_LEVEL_LABELS]}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleInvite} 
                disabled={inviteMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {inviteMutation.isPending ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddExistingOpen} onOpenChange={setIsAddExistingOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ajouter utilisateur existant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur existant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-email">Rechercher par email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search-email"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="utilisateur@exemple.com"
                  />
                  <Button 
                    onClick={() => searchUsersMutation.mutate(searchEmail)}
                    disabled={!searchEmail || searchUsersMutation.isPending}
                  >
                    Rechercher
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Utilisateurs trouvés</Label>
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        {selectedUser?.id === user.id && (
                          <div className="text-blue-600">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label>Permissions pour {selectedUser.firstName} {selectedUser.lastName}</Label>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPermissionsForExisting(['diagnostic.read', 'actions.read', 'records.read'])}
                      >
                        Lecteur
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPermissionsForExisting(['diagnostic.read', 'diagnostic.write', 'actions.read', 'actions.write', 'records.read', 'records.write'])}
                      >
                        Contributeur
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPermissionsForExisting(MODULE_PERMISSIONS.flatMap(m => m.levels.map(l => `${m.id}.${l}`)))}
                      >
                        Gestionnaire
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {MODULE_PERMISSIONS.map((module) => (
                      <Card key={module.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{module.label}</h5>
                            <p className="text-xs text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {module.levels.map((level) => {
                            const permissionKey = `${module.id}.${level}`;
                            return (
                              <div key={level} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`existing-${permissionKey}`}
                                  checked={selectedPermissionsForExisting.includes(permissionKey)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPermissionsForExisting(prev => [...prev, permissionKey]);
                                    } else {
                                      setSelectedPermissionsForExisting(prev => prev.filter(p => p !== permissionKey));
                                    }
                                  }}
                                />
                                <Label htmlFor={`existing-${permissionKey}`} className="text-xs">
                                  {PERMISSION_LEVEL_LABELS[level as keyof typeof PERMISSION_LEVEL_LABELS]}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    onClick={() => addExistingUserMutation.mutate({
                      userId: selectedUser.id,
                      permissions: selectedPermissionsForExisting,
                      role: 'collaborator'
                    })}
                    disabled={addExistingUserMutation.isPending || selectedPermissionsForExisting.length === 0}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {addExistingUserMutation.isPending ? "Ajout..." : "Ajouter à l'entreprise"}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingCollaborator} onOpenChange={() => setEditingCollaborator(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier les permissions - {editingCollaborator?.user.firstName} {editingCollaborator?.user.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label>Modèles de permissions</Label>
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => applyEditPermissionTemplate('viewer')}
                >
                  Lecteur
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => applyEditPermissionTemplate('contributor')}
                >
                  Contributeur
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => applyEditPermissionTemplate('manager')}
                >
                  Gestionnaire
                </Button>
              </div>
            </div>

            <div>
              <Label>Permissions par module</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {MODULE_PERMISSIONS.map((module) => (
                  <Card key={module.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{module.label}</h5>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {module.levels.map((level) => {
                        const permissionKey = `${module.id}.${level}`;
                        return (
                          <div key={level} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permissionKey}`}
                              checked={editPermissions.includes(permissionKey)}
                              onCheckedChange={(checked) => 
                                handleEditPermissionChange(module.id, level, checked as boolean)
                              }
                            />
                            <Label htmlFor={`edit-${permissionKey}`} className="text-sm">
                              {PERMISSION_LEVEL_LABELS[level as keyof typeof PERMISSION_LEVEL_LABELS]}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={savePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="flex-1"
              >
                {updatePermissionsMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setEditingCollaborator(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Collaborators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborateurs actifs ({collaborators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingCollaborators ? (
                <div>Chargement...</div>
              ) : collaborators.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun collaborateur pour le moment
                </p>
              ) : (
                collaborators.map((collaborator: Collaborator) => {
                  const permSummary = getPermissionSummary(collaborator.permissions);
                  return (
                    <div key={collaborator.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {collaborator.user.firstName} {collaborator.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{collaborator.user.email}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              {ROLES.find(r => r.value === collaborator.role)?.label || collaborator.role}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {permSummary.moduleCount} modules • {permSummary.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPermissions(collaborator)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCollaboratorMutation.mutate(collaborator.id)}
                            disabled={removeCollaboratorMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Permission preview */}
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(collaborator.permissions.map(p => p.split('.')[0]))).map(moduleId => {
                          const module = MODULE_PERMISSIONS.find(m => m.id === moduleId);
                          const userModulePerms = collaborator.permissions.filter(p => p.startsWith(moduleId + '.'));
                          const hasWrite = userModulePerms.some(p => p.includes('.write'));
                          const hasAdvanced = userModulePerms.some(p => 
                            p.includes('.generate') || p.includes('.analyze') || p.includes('.manage')
                          );
                          
                          return (
                            <Badge key={moduleId} variant="outline" className="text-xs">
                              {module?.label}
                              {hasAdvanced && <Zap className="h-3 w-3 ml-1" />}
                              {hasWrite && !hasAdvanced && <Edit className="h-3 w-3 ml-1" />}
                              {!hasWrite && !hasAdvanced && <Eye className="h-3 w-3 ml-1" />}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitations en attente ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingInvitations ? (
                <div>Chargement...</div>
              ) : invitations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucune invitation en attente
                </p>
              ) : (
                invitations.map((invitation: Invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        Expire le {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {invitation.permissions.length} modules
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                      disabled={deleteInvitationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            À propos des permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Collaborateur</h4>
              <p className="text-gray-600">
                Accès aux modules assignés en lecture et écriture limitée
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Responsable</h4>
              <p className="text-gray-600">
                Peut assigner des tâches et gérer les données des modules autorisés
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Administrateur</h4>
              <p className="text-gray-600">
                Accès complet aux modules assignés, peut inviter d'autres utilisateurs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}