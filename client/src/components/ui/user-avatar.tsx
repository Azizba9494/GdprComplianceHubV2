import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, User, Shield } from "lucide-react";
import { type UserRole } from "@/lib/permissions";

interface UserAvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  showEmail?: boolean;
}

export function UserAvatar({ user, size = 'md', showRole = false, showEmail = false }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getInitials = () => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'super_admin':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'super_admin':
        return 'border-yellow-500 bg-yellow-50';
      case 'admin':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} ${getRoleColor()}`}>
          <AvatarImage src="" />
          <AvatarFallback className={textSizes[size]}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        {(user.role === 'admin' || user.role === 'super_admin') && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border">
            {getRoleIcon()}
          </div>
        )}
      </div>
      
      {(showRole || showEmail) && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-gray-900 truncate ${textSizes[size]}`}>
              {user.firstName} {user.lastName}
            </p>
            {showRole && (
              <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
                {user.role === 'super_admin' ? 'Super Admin' : 
                 user.role === 'admin' ? 'Admin' : 
                 'User'}
              </Badge>
            )}
          </div>
          {showEmail && (
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          )}
        </div>
      )}
    </div>
  );
}