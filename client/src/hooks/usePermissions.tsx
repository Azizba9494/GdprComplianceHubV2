import { useAuth } from "./useAuth";

export function usePermissions() {
  const { currentCompany } = useAuth();

  const hasPermission = (module: string, action: string): boolean => {
    if (!currentCompany?.permissions) return false;
    
    // Owner with "all" permissions has access to everything
    if (currentCompany.permissions.includes("all")) return true;
    
    // Check specific permission
    const requiredPermission = `${module}.${action}`;
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