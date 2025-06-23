export type UserRole = 'user' | 'admin' | 'super_admin';

export interface PermissionCheck {
  role: UserRole;
  action: string;
  resource?: string;
}

// Définition des permissions par rôle
export const ROLE_PERMISSIONS = {
  user: [
    'view:dashboard',
    'view:diagnostic',
    'manage:actions',
    'manage:records',
    'manage:privacy-policy',
    'manage:breach-analysis',
    'manage:rights',
    'manage:dpia',
    'view:learning',
    'view:profile',
    'edit:profile'
  ],
  admin: [
    // Hérite de toutes les permissions utilisateur
    'view:dashboard',
    'view:diagnostic',
    'manage:actions',
    'manage:records',
    'manage:privacy-policy',
    'manage:breach-analysis',
    'manage:rights',
    'manage:dpia',
    'view:learning',
    'view:profile',
    'edit:profile',
    // Permissions administrateur
    'view:admin',
    'manage:company',
    'manage:users',
    'view:analytics',
    'manage:settings',
    'manage:prompts',
    'manage:documents'
  ],
  super_admin: [
    // Hérite de toutes les permissions admin
    'view:dashboard',
    'view:diagnostic',
    'manage:actions',
    'manage:records',
    'manage:privacy-policy',
    'manage:breach-analysis',
    'manage:rights',
    'manage:dpia',
    'view:learning',
    'view:profile',
    'edit:profile',
    'view:admin',
    'manage:company',
    'manage:users',
    'view:analytics',
    'manage:settings',
    'manage:prompts',
    'manage:documents',
    // Permissions super administrateur
    'manage:system',
    'manage:roles',
    'view:logs',
    'manage:security',
    'delete:any',
    'manage:permissions'
  ]
};

// Note: This is the fallback permission check based on role
// In production, use the effective permissions from the server
export function hasPermission(userRole: UserRole | undefined, permission: string): boolean {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(permission);
}

// Check effective permissions (should be used with server data)
export function hasEffectivePermission(effectivePermissions: string[] | undefined, permission: string): boolean {
  if (!effectivePermissions) return false;
  return effectivePermissions.includes(permission);
}

export function canAccessRoute(userRole: UserRole | undefined, route: string): boolean {
  if (!userRole) return false;

  const routePermissions: Record<string, string> = {
    '/admin': 'view:admin',
    '/analytics': 'view:analytics',
    '/system': 'manage:system',
    '/logs': 'view:logs'
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true; // Route publique

  return hasPermission(userRole, requiredPermission);
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    user: 'Utilisateur',
    admin: 'Administrateur',
    super_admin: 'Super Administrateur'
  };
  
  return roleNames[role] || 'Inconnu';
}

export function getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants = {
    user: 'secondary' as const,
    admin: 'default' as const,
    super_admin: 'destructive' as const
  };
  
  return variants[role] || 'outline';
}