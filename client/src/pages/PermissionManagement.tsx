import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleBadge } from "@/components/ui/role-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield,
  Users,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  User,
  Settings,
  Home,
  FileText,
  Server,
  Eye,
  EyeOff
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
}

interface UserWithPermissions {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  effectivePermissions: string[];
}

interface PermissionCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

const ALL_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: 'view:dashboard', name: 'Voir tableau de bord', description: 'Accès au tableau de bord principal', category: 'Dashboard', categoryColor: '#3B82F6', categoryIcon: 'Home' },
  { id: 'view:diagnostic', name: 'Voir diagnostic', description: 'Accès au diagnostic RGPD', category: 'Dashboard', categoryColor: '#3B82F6', categoryIcon: 'Home' },
  
  // Content Management
  { id: 'manage:actions', name: 'Gérer actions', description: 'Créer et modifier les actions', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  { id: 'manage:records', name: 'Gérer registres', description: 'Gérer les registres de traitement', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  { id: 'manage:privacy-policy', name: 'Gérer politique', description: 'Gérer la politique de confidentialité', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  { id: 'manage:breach-analysis', name: 'Gérer violations', description: 'Analyser les violations de données', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  { id: 'manage:rights', name: 'Gérer droits', description: 'Gérer les demandes de droits', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  { id: 'manage:dpia', name: 'Gérer AIPD', description: 'Gérer les analyses d\'impact', category: 'Content Management', categoryColor: '#10B981', categoryIcon: 'FileText' },
  
  // User Management
  { id: 'view:profile', name: 'Voir profil', description: 'Voir son propre profil', category: 'User Management', categoryColor: '#F59E0B', categoryIcon: 'Users' },
  { id: 'edit:profile', name: 'Modifier profil', description: 'Modifier son propre profil', category: 'User Management', categoryColor: '#F59E0B', categoryIcon: 'Users' },
  { id: 'manage:users', name: 'Gérer utilisateurs', description: 'Créer, modifier et supprimer des utilisateurs', category: 'User Management', categoryColor: '#F59E0B', categoryIcon: 'Users' },
  { id: 'view:learning', name: 'Voir apprentissage', description: 'Accès au centre d\'apprentissage', category: 'User Management', categoryColor: '#F59E0B', categoryIcon: 'Users' },
  
  // Administration
  { id: 'view:admin', name: 'Voir administration', description: 'Accès au panneau d\'administration', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  { id: 'manage:company', name: 'Gérer entreprise', description: 'Gérer les informations d\'entreprise', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  { id: 'view:analytics', name: 'Voir analytics', description: 'Accès aux analytics et rapports', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  { id: 'manage:settings', name: 'Gérer paramètres', description: 'Modifier les paramètres système', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  { id: 'manage:prompts', name: 'Gérer prompts', description: 'Gérer les prompts IA', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  { id: 'manage:documents', name: 'Gérer documents', description: 'Gérer les documents système', category: 'Administration', categoryColor: '#EF4444', categoryIcon: 'Settings' },
  
  // Security
  { id: 'manage:roles', name: 'Gérer rôles', description: 'Modifier les rôles utilisateur', category: 'Security', categoryColor: '#8B5CF6', categoryIcon: 'Shield' },
  { id: 'manage:permissions', name: 'Gérer permissions', description: 'Modifier les permissions utilisateur', category: 'Security', categoryColor: '#8B5CF6', categoryIcon: 'Shield' },
  { id: 'manage:security', name: 'Gérer sécurité', description: 'Paramètres de sécurité avancés', category: 'Security', categoryColor: '#8B5CF6', categoryIcon: 'Shield' },
  
  // System
  { id: 'manage:system', name: 'Gérer système', description: 'Administration système complète', category: 'System', categoryColor: '#DC2626', categoryIcon: 'Server' },
  { id: 'view:logs', name: 'Voir logs', description: 'Accès aux logs système', category: 'System', categoryColor: '#DC2626', categoryIcon: 'Server' },
  { id: 'delete:any', name: 'Supprimer données', description: 'Suppression de toutes données', category: 'System', categoryColor: '#DC2626', categoryIcon: 'Server' },
];

export default function PermissionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyCustom, setShowOnlyCustom] = useState(false);

  // Fetch all users with their permissions
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users-permissions'],
    staleTime: 2 * 60 * 1000,
  });

  // Fetch role permissions
  const { data: rolePermissions } = useQuery({
    queryKey: ['/api/admin/role-permissions', selectedRole],
    staleTime: 2 * 60 * 1000,
  });

  // Fetch permission categories
  const { data: categories } = useQuery({
    queryKey: ['/api/admin/permission-categories'],
    staleTime: 5 * 60 * 1000,
  });

  // Grant/revoke user permission
  const userPermissionMutation = useMutation({
    mutationFn: async ({ userId, permission, granted, reason }: {
      userId: number;
      permission: string;
      granted: boolean;
      reason?: string;
    }) => {
      return apiRequest('POST', '/api/admin/user-permissions', {
        userId,
        permission,
        granted,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-permissions'] });
      toast({
        title: 'Permission mise à jour',
        description: 'Les permissions de l\'utilisateur ont été modifiées.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier les permissions.',
        variant: 'destructive',
      });
    },
  });

  // Update role permission
  const rolePermissionMutation = useMutation({
    mutationFn: async ({ role, permission, granted }: {
      role: string;
      permission: string;
      granted: boolean;
    }) => {
      return apiRequest('POST', '/api/admin/role-permissions', {
        role,
        permission,
        granted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
      toast({
        title: 'Rôle mis à jour',
        description: 'Les permissions du rôle ont été modifiées.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier les permissions du rôle.',
        variant: 'destructive',
      });
    },
  });

  const filteredUsers = users?.filter((user: UserWithPermissions) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPermissions = ALL_PERMISSIONS.filter(permission => {
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getUserPermissionStatus = (user: UserWithPermissions, permission: string) => {
    const hasRolePermission = rolePermissions?.some((rp: any) => rp.permission === permission) || false;
    const hasUserPermission = user.permissions.includes(permission);
    const isEffective = user.effectivePermissions.includes(permission);
    
    if (hasUserPermission) {
      return isEffective ? 'granted' : 'revoked';
    }
    return hasRolePermission ? 'inherited' : 'none';
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'revoked': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'inherited': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleUserPermissionToggle = (user: UserWithPermissions, permission: string) => {
    const status = getUserPermissionStatus(user, permission);
    const shouldGrant = status === 'none' || status === 'revoked';
    
    userPermissionMutation.mutate({
      userId: user.id,
      permission,
      granted: shouldGrant,
      reason: shouldGrant ? 'Permission accordée manuellement' : 'Permission révoquée manuellement'
    });
  };

  const handleRolePermissionToggle = (permission: string) => {
    const hasPermission = rolePermissions?.some((rp: any) => rp.permission === permission) || false;
    
    rolePermissionMutation.mutate({
      role: selectedRole,
      permission,
      granted: !hasPermission
    });
  };

  return (
    <RoleGuard requiredPermission="manage:permissions">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Permissions</h1>
            <p className="text-muted-foreground">
              Contrôle granulaire des permissions utilisateur et rôles
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Permissions Utilisateur
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions Rôle
            </TabsTrigger>
          </TabsList>

          {/* User Permissions Tab */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez un utilisateur pour gérer ses permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user: UserWithPermissions) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUser?.id === user.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <RoleBadge role={user.role as any} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Permissions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Permissions Utilisateur
                  </CardTitle>
                  {selectedUser && (
                    <CardDescription>
                      Gérer les permissions de {selectedUser.firstName} {selectedUser.lastName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedUser ? (
                    <div className="space-y-6">
                      {/* User Info */}
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <UserAvatar user={selectedUser} size="lg" showRole showEmail />
                      </div>

                      {/* Category Filter */}
                      <div className="flex items-center gap-4">
                        <Label>Catégorie:</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            {categories?.map((cat: PermissionCategory) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="custom-only"
                            checked={showOnlyCustom}
                            onCheckedChange={setShowOnlyCustom}
                          />
                          <Label htmlFor="custom-only">Permissions personnalisées uniquement</Label>
                        </div>
                      </div>

                      {/* Permissions List */}
                      <div className="space-y-4">
                        {Object.entries(
                          filteredPermissions.reduce((acc, perm) => {
                            if (!acc[perm.category]) acc[perm.category] = [];
                            acc[perm.category].push(perm);
                            return acc;
                          }, {} as Record<string, Permission[]>)
                        ).map(([category, perms]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="font-medium text-lg flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: perms[0]?.categoryColor }}
                              />
                              {category}
                            </h4>
                            <div className="grid gap-2">
                              {perms.map((permission) => {
                                const status = getUserPermissionStatus(selectedUser, permission.id);
                                const shouldShow = !showOnlyCustom || (status === 'granted' || status === 'revoked');
                                
                                if (!shouldShow) return null;

                                return (
                                  <div
                                    key={permission.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{permission.name}</span>
                                        {getPermissionIcon(status)}
                                        {status === 'inherited' && (
                                          <Badge variant="outline" className="text-xs">
                                            Hérité du rôle
                                          </Badge>
                                        )}
                                        {status === 'granted' && (
                                          <Badge variant="default" className="text-xs">
                                            Accordé
                                          </Badge>
                                        )}
                                        {status === 'revoked' && (
                                          <Badge variant="destructive" className="text-xs">
                                            Révoqué
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">{permission.description}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={status === 'granted' ? 'destructive' : 'default'}
                                      onClick={() => handleUserPermissionToggle(selectedUser, permission.id)}
                                      disabled={userPermissionMutation.isPending}
                                    >
                                      {status === 'granted' ? 'Révoquer' : 'Accorder'}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Sélectionnez un utilisateur pour voir ses permissions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Role Permissions Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions des Rôles
                </CardTitle>
                <CardDescription>
                  Définir les permissions par défaut pour chaque rôle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role Selection */}
                <div className="flex items-center gap-4">
                  <Label>Rôle:</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="super_admin">Super Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <RoleBadge role={selectedRole as any} />
                </div>

                {/* Role Permissions */}
                <div className="space-y-4">
                  {Object.entries(
                    ALL_PERMISSIONS.reduce((acc, perm) => {
                      if (!acc[perm.category]) acc[perm.category] = [];
                      acc[perm.category].push(perm);
                      return acc;
                    }, {} as Record<string, Permission[]>)
                  ).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-lg flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: perms[0]?.categoryColor }}
                        />
                        {category}
                      </h4>
                      <div className="grid gap-2">
                        {perms.map((permission) => {
                          const hasPermission = rolePermissions?.some((rp: any) => rp.permission === permission.id) || false;

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{permission.name}</span>
                                  {hasPermission && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </div>
                                <p className="text-sm text-gray-600">{permission.description}</p>
                              </div>
                              <Switch
                                checked={hasPermission}
                                onCheckedChange={() => handleRolePermissionToggle(permission.id)}
                                disabled={rolePermissionMutation.isPending}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}