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
import { useToast } from "@/hooks/use-toast";

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
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const pageInfo = pageLabels[location] || { title: "GDPR Suite", subtitle: "Plateforme de conformité RGPD" };

  const handleProfileClick = () => {
    setLocation("/user-back-office");
  };

  const handleSettingsClick = () => {
    toast({
      title: "Paramètres",
      description: "Cette fonctionnalité sera bientôt disponible.",
    });
  };

  const handleHelpClick = () => {
    toast({
      title: "Aide",
      description: "Consultez notre documentation ou contactez le support.",
    });
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{pageInfo.title}</h1>
          <p className="text-muted-foreground mt-1">{pageInfo.subtitle}</p>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 text-sm font-medium border-b">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem 
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setLocation('/actions')}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Action urgente requise</p>
                    <p className="text-xs text-gray-500 mt-1">Certaines actions de conformité nécessitent votre attention immédiate</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 2 heures</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setLocation('/rights')}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouvelle demande d'accès</p>
                    <p className="text-xs text-gray-500 mt-1">Francine Lebon a soumis une demande d'accès aux données</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 5 heures</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setLocation('/diagnostic')}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rappel diagnostic RGPD</p>
                    <p className="text-xs text-gray-500 mt-1">Il est recommandé de compléter votre diagnostic RGPD</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 1 jour</p>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600 dark:text-blue-400">
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem onClick={() => setLocation("/user-back-office")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleHelpClick}>
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