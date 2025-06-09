import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Shield, Home, ClipboardList, Book, FileText, 
  AlertTriangle, ShieldX, BarChart3, Settings 
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: Home },
  { name: "Diagnostic initial", href: "/diagnostic", icon: ClipboardList },
  { name: "Plan d'actions", href: "/actions", icon: BarChart3 },
  { name: "Registre des traitements", href: "/records", icon: Book },
  { name: "Politique de confidentialité", href: "/privacy-policy", icon: FileText },
  { name: "Analyse de violations", href: "/breach-analysis", icon: AlertTriangle },
  { name: "Demandes des personnes", href: "/rights", icon: ShieldX },
  { name: "Analyse d'impact (AIPD)", href: "/dpia", icon: BarChart3 },
];

const adminNavigation = [
  { name: "Administration", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

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
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-sidebar-border mt-4">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="text-sidebar-accent-foreground text-sm font-medium">MD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Marie Dupont</p>
            <p className="text-xs text-sidebar-foreground/60">Administrateur</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
