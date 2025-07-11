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
import { useQuery } from "@tanstack/react-query";
import CompanySwitcher from "@/components/CompanySwitcher";

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
  },
  "/help": {
    title: "Centre d'aide",
    subtitle: "Documentation et support pour votre conformité RGPD"
  }
};

export default function Header() {
  const { user, logout, currentCompany } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const pageInfo = pageLabels[location] || { title: "GDPR Suite", subtitle: "Plateforme de conformité RGPD" };

  // Use current company from context - this is the key fix for multi-company switching
  const companyId = currentCompany?.id;
  
  // Debug logging - only when company is null/undefined to reduce noise
  if (!currentCompany || !companyId) {
    console.log('Header - Current company:', currentCompany);
    console.log('Header - Company ID being used for queries:', companyId);
  }

  // Get recent activity for notifications - only when current company is set
  // Handle permission errors gracefully with proper validation
  const { data: recentRequests = [] } = useQuery({
    queryKey: ['/api/requests', companyId],
    queryFn: async () => {
      // Double check companyId is valid before making request
      if (!companyId || typeof companyId !== 'number') {
        return [];
      }
      try {
        const res = await fetch(`/api/requests/${companyId}`);
        if (!res.ok) {
          console.log('Requests access denied - user lacks permissions');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.log('Error fetching requests:', error);
        return [];
      }
    },
    enabled: !!companyId && !!currentCompany,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fresh data when switching companies
    retry: false, // Don't retry on permission errors
  });

  const { data: recentActions = [] } = useQuery({
    queryKey: ['/api/actions', companyId],
    queryFn: async () => {
      // Double check companyId is valid before making request
      if (!companyId || typeof companyId !== 'number') {
        return [];
      }
      try {
        const res = await fetch(`/api/actions/${companyId}`);
        if (!res.ok) {
          console.log('Actions access denied - user lacks permissions');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.log('Error fetching actions:', error);
        return [];
      }
    },
    enabled: !!companyId && !!currentCompany,
    refetchInterval: 30000,
    staleTime: 0,
    retry: false, // Don't retry on permission errors
  });

  const { data: recentBreaches = [] } = useQuery({
    queryKey: ['/api/breaches', companyId],
    queryFn: async () => {
      // Double check companyId is valid before making request
      if (!companyId || typeof companyId !== 'number') {
        return [];
      }
      try {
        const res = await fetch(`/api/breaches/${companyId}`);
        if (!res.ok) {
          console.log('Breaches access denied - user lacks permissions');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.log('Error fetching breaches:', error);
        return [];
      }
    },
    enabled: !!companyId && !!currentCompany,
    refetchInterval: 30000,
    staleTime: 0,
    retry: false, // Don't retry on permission errors
  });

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
    setLocation("/help");
  };

  // Generate dynamic notifications from real data
  const generateNotifications = () => {
    const notifications: any[] = [];
    const now = new Date();

    // Recent requests (within last 7 days) - handle array safety
    const recentNewRequests = Array.isArray(recentRequests) ? recentRequests
      .filter((req: any) => req.status === 'new' && new Date(req.createdAt) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) : [];

    recentNewRequests.forEach((req: any) => {
      const typeLabel = req.requestType === 'access' ? 'accès' : req.requestType === 'portability' ? 'portabilité' : req.requestType === 'deletion' ? 'suppression' : req.requestType;
      notifications.push({
        id: `request-${req.id}`,
        type: 'request',
        title: `Nouvelle demande de ${typeLabel}`,
        description: `${req.requesterId} a soumis une demande`,
        timestamp: new Date(req.createdAt),
        route: '/rights'
      });
    });

    // Urgent actions (due within next 3 days)
    const urgentActions = Array.isArray(recentActions) ? recentActions
      .filter((action: any) => action.status !== 'completed' && action.dueDate && new Date(action.dueDate) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000))
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2) : [];

    urgentActions.forEach((action: any) => {
      notifications.push({
        id: `action-${action.id}`,
        type: 'action',
        title: 'Action urgente requise',
        description: action.title,
        timestamp: new Date(action.dueDate),
        route: '/actions'
      });
    });

    // Recent breaches (within last 30 days) - handle array safety
    const recentNewBreaches = Array.isArray(recentBreaches) ? recentBreaches
      .filter((breach: any) => new Date(breach.createdAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2) : [];

    recentNewBreaches.forEach((breach: any) => {
      notifications.push({
        id: `breach-${breach.id}`,
        type: 'breach',
        title: 'Nouvelle violation détectée',
        description: breach.description.substring(0, 60) + '...',
        timestamp: new Date(breach.createdAt),
        route: '/breach-analysis'
      });
    });

    // Sort by timestamp and return most recent
    return notifications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  };

  const notifications = generateNotifications();

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{pageInfo.title}</h1>
          <p className="text-muted-foreground mt-1">{pageInfo.subtitle}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="mr-2">
            <CompanySwitcher />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 text-sm font-medium border-b">
                Notifications {notifications.length > 0 && `(${notifications.length})`}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">Aucune notification récente</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setLocation(notification.route)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.timestamp)}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm text-blue-600 dark:text-blue-400">
                    Voir toutes les notifications
                  </DropdownMenuItem>
                </>
              )}
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