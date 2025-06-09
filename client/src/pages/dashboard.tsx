import { useQuery } from "@tanstack/react-query";
import { dashboardApi, actionsApi, breachApi, recordsApi, requestsApi } from "@/lib/api";
import ComplianceOverview from "@/components/dashboard/compliance-overview";
import PriorityActions from "@/components/dashboard/priority-actions";
import QuickActions from "@/components/dashboard/quick-actions";
import { RiskHeatMap } from "@/components/dashboard/risk-heatmap";
import { RiskTrends } from "@/components/dashboard/risk-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileDown, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock company ID - in a real app, this would come from authentication
const COMPANY_ID = 1;

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', COMPANY_ID],
    queryFn: () => dashboardApi.getStats(COMPANY_ID).then(res => res.json()),
  });

  // Fetch additional data for heat map
  const { data: actions } = useQuery({
    queryKey: ['/api/actions', COMPANY_ID],
    queryFn: () => actionsApi.get(COMPANY_ID).then((res: any) => res.json()),
  });

  const { data: breaches } = useQuery({
    queryKey: ['/api/breaches', COMPANY_ID],
    queryFn: () => breachApi.get(COMPANY_ID).then((res: any) => res.json()),
  });

  const { data: records } = useQuery({
    queryKey: ['/api/records', COMPANY_ID],
    queryFn: () => recordsApi.get(COMPANY_ID).then((res: any) => res.json()),
  });

  const { data: requests } = useQuery({
    queryKey: ['/api/requests', COMPANY_ID],
    queryFn: () => requestsApi.get(COMPANY_ID).then((res: any) => res.json()),
  });

  const heatMapData = {
    actions: actions || [],
    breaches: breaches || [],
    records: records || [],
    requests: requests || [],
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Erreur lors du chargement du tableau de bord
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune donnée disponible
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ComplianceOverview stats={stats} />

      {/* Risk Heat Map */}
      <RiskHeatMap companyId={COMPANY_ID} data={heatMapData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriorityActions actions={stats.priorityActions || []} />
        </div>
        <div className="space-y-6">
          <QuickActions stats={stats} />
          <RiskTrends data={{ actions: actions || [], breaches: breaches || [], requests: requests || [] }} />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Politique de confidentialité générée</span>
                  {" "}pour votre site web
                </p>
                <p className="text-xs text-muted-foreground mt-1">Il y a 2 heures</p>
              </div>
              <Button variant="ghost" size="sm">
                Voir
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Demande d'accès traitée</span>
                  {" "}de client@example.com
                </p>
                <p className="text-xs text-muted-foreground mt-1">Il y a 1 jour</p>
              </div>
              <Button variant="ghost" size="sm">
                Voir
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Registre des traitements mis à jour</span>
                  {" "}- Nouveau traitement ajouté
                </p>
                <p className="text-xs text-muted-foreground mt-1">Il y a 3 jours</p>
              </div>
              <Button variant="ghost" size="sm">
                Voir
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
