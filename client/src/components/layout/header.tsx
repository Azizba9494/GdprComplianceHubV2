import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, Play, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Tableau de bord de conformité",
    subtitle: "Suivez votre progression RGPD en temps réel"
  },
  "/diagnostic": {
    title: "Diagnostic RGPD",
    subtitle: "Évaluez votre niveau de conformité"
  },
  "/actions": {
    title: "Plan d'actions",
    subtitle: "Gérez vos actions de conformité"
  },
  "/records": {
    title: "Registre des traitements",
    subtitle: "Documentez vos activités de traitement"
  },
  "/privacy-policy": {
    title: "Politique de confidentialité",
    subtitle: "Générez votre politique personnalisée"
  },
  "/breach-analysis": {
    title: "Analyse de violations",
    subtitle: "Évaluez les violations de données"
  },
  "/rights": {
    title: "Demandes des personnes",
    subtitle: "Gérez les droits des personnes concernées"
  },
  "/dpia": {
    title: "Analyse d'impact (AIPD)",
    subtitle: "Réalisez vos analyses d'impact"
  },
  "/admin": {
    title: "Administration",
    subtitle: "Gérez la plateforme et les paramètres IA"
  }
};

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const pageInfo = pageLabels[location] || { title: "GDPR Suite", subtitle: "Plateforme de conformité RGPD" };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{pageInfo.title}</h1>
          <p className="text-muted-foreground mt-1">{pageInfo.subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {location === "/" && (
            <Button className="btn-primary">
              <Play className="w-4 h-4 mr-2" />
              Nouveau diagnostic
            </Button>
          )}
          
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Utilisateur'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </div>
              <div className="px-2 py-1.5 text-xs text-gray-500">{user?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Aide</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
