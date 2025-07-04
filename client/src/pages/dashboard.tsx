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
import { ArrowRight, FileDown, User, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RecentActivity from "@/components/dashboard/recent-activity";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Dashboard() {
  // Always call hooks at the top level
  const { company, isLoading: isAuthLoading } = useAuth();
  const COMPANY_ID = company?.id;

  // Don't render if not authenticated or company not loaded
  if (isAuthLoading || !COMPANY_ID) {
    return <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

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
      <RiskHeatMap companyId={COMPANY_ID} data={heatMapData} diagnosticData={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriorityActions actions={stats.priorityActions || []} diagnosticData={stats} />
        </div>
        <div className="space-y-6">
          <QuickActions stats={stats} />
          <RiskTrends companyId={COMPANY_ID} data={{ actions: actions || [], breaches: breaches || [], requests: requests || [] }} />
        </div>
      </div>

      {/* Recent Activity - Dynamic */}
      <RecentActivity companyId={COMPANY_ID} actions={actions} requests={requests} records={records} />
    </div>
  );
}
