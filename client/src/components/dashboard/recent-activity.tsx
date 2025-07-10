import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, UserCheck, Building, Calendar, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";

interface ActivityItem {
  id: string;
  type: 'action' | 'request' | 'record' | 'policy';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  color: string;
  icon: React.ReactNode;
}

interface RecentActivityProps {
  companyId: number;
  actions?: any[];
  requests?: any[];
  records?: any[];
}

function RecentActivity({ companyId, actions = [], requests = [], records = [] }: RecentActivityProps) {
  const [, setLocation] = useLocation();
  const { hasPermission } = usePermissions();
  // Generate dynamic activity based on actual data and permissions
  const generateActivity = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Recent completed actions - only if user has actions.read permission
    if (hasPermission('actions.read')) {
      const recentActions = actions
        .filter(action => action.status === 'completed')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 2);

      recentActions.forEach(action => {
        activities.push({
          id: `action-${action.id}`,
          type: 'action',
          title: 'Action de conformité complétée',
          description: action.title,
          timestamp: new Date(action.updatedAt || action.createdAt),
          status: action.status,
          color: 'green',
          icon: <FileText className="w-4 h-4" />
        });
      });
    }

    // Recent requests - only if user has requests.read permission
    if (hasPermission('requests.read')) {
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);

      recentRequests.forEach(request => {
        const isCompleted = request.status === 'completed';
        activities.push({
          id: `request-${request.id}`,
          type: 'request',
          title: isCompleted ? 'Demande traitée' : 'Nouvelle demande reçue',
          description: `${request.type} de ${request.requesterId}`,
          timestamp: new Date(request.createdAt),
          status: request.status,
          color: isCompleted ? 'blue' : 'orange',
          icon: <UserCheck className="w-4 h-4" />
        });
      });
    }

    // Recent records - only if user has records.read permission
    if (hasPermission('records.read')) {
      const recentRecords = records
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 1);

      recentRecords.forEach(record => {
        activities.push({
          id: `record-${record.id}`,
          type: 'record',
          title: 'Registre mis à jour',
          description: `Nouveau traitement: ${record.name}`,
          timestamp: new Date(record.createdAt),
          color: 'purple',
          icon: <Building className="w-4 h-4" />
        });
      });
    }

    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 4);
  };

  const activities = generateActivity();

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleViewClick = (activity: ActivityItem) => {
    const requiredPermissions = {
      'action': 'actions.read',
      'request': 'requests.read',
      'record': 'records.read',
      'policy': 'policies.read'
    };

    const permission = requiredPermissions[activity.type as keyof typeof requiredPermissions];
    if (permission && !hasPermission(permission)) {
      return; // Don't navigate if user doesn't have permission
    }

    switch (activity.type) {
      case 'action':
        setLocation('/actions');
        break;
      case 'request':
        setLocation('/rights');
        break;
      case 'record':
        setLocation('/records');
        break;
      case 'policy':
        setLocation('/privacy-policy');
        break;
      default:
        setLocation('/');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className={`w-2 h-2 ${getColorClass(activity.color)} rounded-full flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.title}</span>
                    {activity.description && ` - ${activity.description}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewClick(activity)}
                >
                  Voir
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;