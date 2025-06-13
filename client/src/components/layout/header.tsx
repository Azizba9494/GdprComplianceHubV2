import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Play, User, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

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
  const [location] = useLocation();
  const { user } = useAuth();
  const pageInfo = pageLabels[location] || { title: "GDPR Suite", subtitle: "Plateforme de conformité RGPD" };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

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
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                  <AvatarFallback>
                    {getUserInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mon profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/api/logout" className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
