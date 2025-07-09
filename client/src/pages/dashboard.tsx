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
import RecentActivity from "@/components/dashboard/recent-activity";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, currentCompany, forceUseOwnedCompany } = useAuth();

  // Use current company from auth context instead of fetching
  const companyId = currentCompany?.id;

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', companyId],
    queryFn: () => {
      console.log('Dashboard - Fetching stats for company:', companyId);
      return dashboardApi.getStats(companyId).then(res => {
        console.log('Dashboard - API response for company', companyId, ':', res);
        return res.json();
      });
    },
    enabled: !!companyId,
  });

  // Fetch additional data for heat map
  const { data: actions } = useQuery({
    queryKey: ['/api/actions', companyId],
    queryFn: () => {
      console.log('Dashboard - Fetching actions for company:', companyId);
      return actionsApi.get(companyId).then((res: any) => {
        const data = res.json();
        console.log('Dashboard - Actions received for company', companyId, ':', data);
        return data;
      });
    },
    enabled: !!companyId,
  });

  const { data: breaches } = useQuery({
    queryKey: ['/api/breaches', companyId],
    queryFn: () => breachApi.get(companyId).then((res: any) => res.json()),
    enabled: !!companyId,
  });

  const { data: records } = useQuery({
    queryKey: ['/api/records', companyId],
    queryFn: () => recordsApi.get(companyId).then((res: any) => res.json()),
    enabled: !!companyId,
  });

  const { data: requests } = useQuery({
    queryKey: ['/api/requests', companyId],
    queryFn: () => requestsApi.get(companyId).then((res: any) => res.json()),
    enabled: !!companyId,
  });

  const heatMapData = {
    actions: actions || [],
    breaches: breaches || [],
    records: records || [],
    requests: requests || [],
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p>Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !companyId) {
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
      {/* Bouton d'urgence temporaire pour forcer l'entreprise propriétaire */}
      {currentCompany?.role === 'collaborator' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                Changement d'entreprise
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Vous consultez actuellement "{currentCompany?.name}" en tant que collaborateur. 
                Voulez-vous basculer vers votre entreprise propriétaire ?
              </p>
            </div>
            <Button
              onClick={forceUseOwnedCompany}
              variant="outline"
              className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900/40"
            >
              Utiliser mon entreprise
            </Button>
          </div>
        </div>
      )}
      
      <ComplianceOverview stats={stats} />

      {/* Risk Heat Map */}
      <RiskHeatMap companyId={companyId} data={heatMapData} diagnosticData={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriorityActions actions={stats.priorityActions || []} />
        </div>
        <div className="space-y-6">
          <QuickActions stats={stats} />
          <RiskTrends companyId={companyId} data={{ actions: actions || [], breaches: breaches || [], requests: requests || [] }} />
        </div>
      </div>

      {/* Recent Activity - Dynamic */}
      <RecentActivity companyId={companyId} actions={actions} requests={requests} records={records} />
    </div>
  );
}
