import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, Home, ClipboardList, Book, FileText, 
  AlertTriangle, ShieldX, BarChart3, Settings, GraduationCap, User, Crown 
} from "lucide-react";

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: "Tableau de bord", href: "/", icon: Home, roles: ["user", "admin", "super_admin"] },
    { name: "Diagnostic initial", href: "/diagnostic", icon: ClipboardList, roles: ["user", "admin", "super_admin"] },
    { name: "Plan d'actions", href: "/actions", icon: BarChart3, roles: ["user", "admin", "super_admin"] },
    { name: "Registre des traitements", href: "/records", icon: Book, roles: ["user", "admin", "super_admin"] },
    { name: "Politique de confidentialité", href: "/privacy-policy", icon: FileText, roles: ["user", "admin", "super_admin"] },
    { name: "Analyse de violations", href: "/breach-analysis", icon: AlertTriangle, roles: ["user", "admin", "super_admin"] },
    { name: "Demandes des personnes", href: "/rights", icon: ShieldX, roles: ["user", "admin", "super_admin"] },
    { name: "Analyse d'impact (AIPD)", href: "/dpia", icon: BarChart3, roles: ["user", "admin", "super_admin"] },
    { name: "Centre d'apprentissage", href: "/learning", icon: GraduationCap, roles: ["user", "admin", "super_admin"] },
    { name: "👤 Mon Compte", href: "/user-back-office", icon: User, roles: ["user", "admin", "super_admin"] },
    { name: "🧪 Test Rôles", href: "/role-test", icon: Shield, roles: ["user", "admin", "super_admin"] },
    { name: "⚙️ Administration", href: "/admin", icon: Settings, roles: ["admin", "super_admin"] },
  ];

  return baseNavigation.filter(item => item.roles.includes(userRole));
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const navigation = getNavigation(user?.role || "user");

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col fixed h-full z-30">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">GDPR Suite</h1>
            <p className="text-xs text-sidebar-foreground/60">Conformité RGPD</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
              <span className="text-sidebar-accent-foreground text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-sidebar-foreground/60">
                  {user.role === 'super_admin' ? 'Super Admin' : 
                   user.role === 'admin' ? 'Administrateur' : 
                   'Utilisateur'}
                </p>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
