import { useAuth } from "./useAuth";

export function usePermissions() {
  const { currentCompany } = useAuth();

  const hasPermission = (moduleOrPermission: string, action?: string): boolean => {
    if (!currentCompany?.permissions) return false;
    
    // Owner with "all" permissions has access to everything
    if (currentCompany.permissions.includes("all")) return true;
    
    // Support both signatures: hasPermission('module', 'action') and hasPermission('module.action')
    let requiredPermission: string;
    if (action) {
      // Two parameter version: hasPermission('module', 'action')
      requiredPermission = `${moduleOrPermission}.${action}`;
    } else {
      // Single parameter version: hasPermission('module.action')
      requiredPermission = moduleOrPermission;
    }
    
    return currentCompany.permissions.includes(requiredPermission);
  };

  const checkModuleAccess = (module: string): { canRead: boolean; canWrite: boolean } => {
    return {
      canRead: hasPermission(module, 'read'),
      canWrite: hasPermission(module, 'write')
    };
  };

  return {
    hasPermission,
    checkModuleAccess,
    permissions: currentCompany?.permissions || [],
    role: currentCompany?.role || 'collaborator'
  };
}