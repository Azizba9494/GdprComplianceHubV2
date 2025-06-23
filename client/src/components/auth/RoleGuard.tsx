import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, canAccessRoute, type UserRole } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole[];
  requiredPermission?: string;
  route?: string;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission, 
  route, 
  fallback 
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour accéder à cette section.
        </AlertDescription>
      </Alert>
    );
  }

  // Check role requirements
  if (requiredRole && !requiredRole.includes(user.role as UserRole)) {
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Votre rôle ({user.role}) ne vous permet pas d'accéder à cette section.
        </AlertDescription>
      </Alert>
    );
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(user.role as UserRole, requiredPermission)) {
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Vous n'avez pas les permissions nécessaires pour cette action.
        </AlertDescription>
      </Alert>
    );
  }

  // Check route access
  if (route && !canAccessRoute(user.role as UserRole, route)) {
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Accès non autorisé à cette page.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}