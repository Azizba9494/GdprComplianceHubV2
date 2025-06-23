import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { hasPermission, canAccessRoute } from "@/lib/permissions";
import { Crown, Shield, User, CheckCircle, XCircle, Lock } from "lucide-react";

export default function RoleTestPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Veuillez vous connecter pour voir cette page de test.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const permissions = [
    'view:dashboard',
    'view:admin',
    'manage:users',
    'manage:system',
    'view:logs',
    'delete:any'
  ];

  const routes = [
    '/',
    '/admin',
    '/analytics',
    '/system',
    '/logs'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test des Rôles et Permissions</h1>
          <p className="text-muted-foreground">
            Vérifiez vos permissions et accès selon votre rôle
          </p>
        </div>
      </div>

      {/* Informations utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Votre Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">Username: {user.username}</p>
            </div>
            <RoleBadge role={user.role as any} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Test des permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissions
          </CardTitle>
          <CardDescription>
            Permissions accordées à votre rôle actuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((permission) => {
              const hasAccess = hasPermission(user.role as any, permission);
              return (
                <div
                  key={permission}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    hasAccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span className="font-mono text-sm">{permission}</span>
                  {hasAccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test d'accès aux routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Accès aux Routes
          </CardTitle>
          <CardDescription>
            Routes accessibles selon votre rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => {
              const hasAccess = canAccessRoute(user.role as any, route);
              return (
                <div
                  key={route}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    hasAccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span className="font-mono text-sm">{route}</span>
                  {hasAccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sections protégées par rôle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Administrateur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Section Administrateur</CardTitle>
            <CardDescription>
              Accessible aux administrateurs uniquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleGuard requiredRole={['admin', 'super_admin']}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Accès autorisé !</span>
                </div>
                <p className="text-sm text-gray-600">
                  Vous pouvez gérer les utilisateurs, configurer le système et accéder aux paramètres avancés.
                </p>
                <Button variant="outline" size="sm">
                  Gérer les utilisateurs
                </Button>
              </div>
            </RoleGuard>
          </CardContent>
        </Card>

        {/* Section Super Administrateur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Section Super Administrateur</CardTitle>
            <CardDescription>
              Accessible aux super administrateurs uniquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleGuard requiredRole={['super_admin']}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Accès super admin autorisé !</span>
                </div>
                <p className="text-sm text-gray-600">
                  Vous avez un accès complet au système, logs et sécurité.
                </p>
                <Button variant="destructive" size="sm">
                  Accès système critique
                </Button>
              </div>
            </RoleGuard>
          </CardContent>
        </Card>
      </div>

      {/* Test de permissions spécifiques */}
      <Card>
        <CardHeader>
          <CardTitle>Test de Permissions Spécifiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleGuard requiredPermission="manage:users">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Vous avez la permission "manage:users" - vous pouvez gérer les utilisateurs.
              </AlertDescription>
            </Alert>
          </RoleGuard>

          <RoleGuard requiredPermission="view:logs">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Vous avez la permission "view:logs" - vous pouvez consulter les logs système.
              </AlertDescription>
            </Alert>
          </RoleGuard>

          <RoleGuard requiredPermission="delete:any">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Vous avez la permission "delete:any" - attention, pouvoir de suppression étendu !
              </AlertDescription>
            </Alert>
          </RoleGuard>
        </CardContent>
      </Card>
    </div>
  );
}