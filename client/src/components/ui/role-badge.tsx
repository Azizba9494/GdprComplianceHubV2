import { Badge } from "@/components/ui/badge";
import { Crown, User, Shield } from "lucide-react";
import { getRoleDisplayName, getRoleBadgeVariant, type UserRole } from "@/lib/permissions";

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, showIcon = true, size = 'md' }: RoleBadgeProps) {
  const getIcon = () => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-3 h-3 mr-1" />;
      case 'admin':
        return <Shield className="w-3 h-3 mr-1" />;
      default:
        return <User className="w-3 h-3 mr-1" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  return (
    <Badge variant={getRoleBadgeVariant(role)} className={sizeClasses[size]}>
      {showIcon && getIcon()}
      {getRoleDisplayName(role)}
    </Badge>
  );
}