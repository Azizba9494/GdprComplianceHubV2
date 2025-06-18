import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityFeedProps {
  companyId: number;
}

export function ActivityFeed({ companyId }: ActivityFeedProps) {
  const { data: activities = [] } = useQuery({
    queryKey: [`/api/activity-feed/${companyId}`],
    enabled: !!companyId,
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'action_completed': return 'bg-green-500';
      case 'request_received': return 'bg-blue-500';
      case 'record_created': return 'bg-purple-500';
      case 'policy_generated': return 'bg-orange-500';
      case 'dpia_created': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!activities.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Aucune activité récente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}