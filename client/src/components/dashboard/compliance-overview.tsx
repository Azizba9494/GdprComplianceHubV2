import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Clock, CheckCircle, Watch } from "lucide-react";

interface ComplianceOverviewProps {
  stats: {
    compliance: { 
      score: number;
      categoryScores?: Record<string, { score: number; total: number; answered: number }>;
      diagnosticProgress?: number;
    };
    actions: {
      total: number;
      completed: number;
      inProgress: number;
      urgent: number;
    };
    requests: {
      pending: number;
      overdue: number;
    };
    riskMapping?: {
      riskAreas: Array<{ category: string; score: number; severity: string }>;
      totalCategories: number;
      completedCategories: number;
    };
  };
}

export default function ComplianceOverview({ stats }: ComplianceOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score de conformité</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.compliance.score}%</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={stats.compliance.score} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actions en cours</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.actions.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <span className="text-orange-600 dark:text-orange-400 font-medium">{stats.actions.urgent} urgentes</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actions complétées</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.actions.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-3 font-medium">
            {Math.round((stats.actions.completed / Math.max(stats.actions.total, 1)) * 100)}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Demandes en attente</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.requests.pending}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Watch className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          {stats.requests.overdue > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">
              {stats.requests.overdue} en retard
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
