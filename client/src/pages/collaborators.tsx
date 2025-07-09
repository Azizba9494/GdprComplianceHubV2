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
  Calendar
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

const PERMISSIONS = [
  { id: 'diagnostic', label: 'Diagnostic RGPD' },
  { id: 'actions', label: 'Plan d\'action' },
  { id: 'records', label: 'Registre des traitements' },
  { id: 'breaches', label: 'Violations de données' },
  { id: 'dpia', label: 'Analyses d\'impact (AIPD)' },
  { id: 'requests', label: 'Demandes des personnes' },
  { id: 'policies', label: 'Politique de confidentialité' },
  { id: 'subprocessors', label: 'Sous-traitants' },
  { id: 'learning', label: 'Formation' },
  { id: 'admin', label: 'Administration' }
];

const ROLES = [
  { value: 'collaborator', label: 'Collaborateur' },
  { value: 'manager', label: 'Responsable' },
  { value: 'admin', label: 'Administrateur' }
];

export default function Collaborators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("collaborator");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Get user's company
  const { data: company } = useQuery({
    queryKey: [`/api/companies/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const companyId = company?.id;

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
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Inviter un collaborateur
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

              <div>
                <Label>Permissions d'accès</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <Label htmlFor={permission.id} className="text-sm">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
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
      </div>

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
                collaborators.map((collaborator: Collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {collaborator.user.firstName} {collaborator.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{collaborator.user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          {ROLES.find(r => r.value === collaborator.role)?.label || collaborator.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {collaborator.permissions.length} modules
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaboratorMutation.mutate(collaborator.id)}
                      disabled={removeCollaboratorMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
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