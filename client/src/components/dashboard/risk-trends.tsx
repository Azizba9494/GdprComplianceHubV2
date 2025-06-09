import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ComplianceSnapshot {
  id: number;
  companyId: number;
  overallScore: number;
  categoryScores: Record<string, { score: number; total: number; answered: number }>;
  totalQuestions: number;
  answeredQuestions: number;
  createdAt: string;
}

interface RiskTrend {
  period: string;
  score: number;
  change: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  date: Date;
}

interface RiskTrendsProps {
  companyId: number;
  data: {
    actions: any[];
    breaches: any[];
    requests: any[];
  };
}

export function RiskTrends({ companyId, data }: RiskTrendsProps) {
  const { data: snapshots, isLoading } = useQuery<ComplianceSnapshot[]>({
    queryKey: ['/api/compliance-snapshots', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/compliance-snapshots/${companyId}?limit=12`);
      if (!response.ok) throw new Error('Failed to fetch snapshots');
      return response.json();
    }
  });

  const calculateTrends = (): RiskTrend[] => {
    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    // Group snapshots by month to avoid daily fluctuations
    const monthlySnapshots = new Map<string, ComplianceSnapshot>();
    
    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      // Keep the latest snapshot for each month
      if (!monthlySnapshots.has(monthKey) || 
          new Date(snapshot.createdAt) > new Date(monthlySnapshots.get(monthKey)!.createdAt)) {
        monthlySnapshots.set(monthKey, snapshot);
      }
    });

    const trends: RiskTrend[] = Array.from(monthlySnapshots.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-6) // Last 6 months
      .map((snapshot, index, array) => {
        const date = new Date(snapshot.createdAt);
        const period = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        let change = 0;
        if (index > 0) {
          change = snapshot.overallScore - array[index - 1].overallScore;
        }

        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        if (snapshot.overallScore >= 80) riskLevel = 'low';
        else if (snapshot.overallScore >= 60) riskLevel = 'medium';
        else if (snapshot.overallScore >= 40) riskLevel = 'high';
        else riskLevel = 'critical';

        return {
          period,
          score: snapshot.overallScore,
          change,
          riskLevel,
          date
        };
      });

    return trends;
  };

  const trends = calculateTrends();
  const currentTrend = trends[trends.length - 1];
  const previousTrend = trends[trends.length - 2];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateActionInsights = () => {
    const completedThisMonth = data.actions.filter(a => {
      if (!a.completedAt) return false;
      const completedDate = new Date(a.completedAt);
      const now = new Date();
      return completedDate.getMonth() === now.getMonth() && 
             completedDate.getFullYear() === now.getFullYear();
    }).length;

    const urgentPending = data.actions.filter(a => 
      a.status === 'pending' && a.priority === 'urgent'
    ).length;

    const requestsPending = data.requests.filter(r => r.status !== 'completed').length;

    return { completedThisMonth, urgentPending, requestsPending };
  };

  const insights = calculateActionInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Évolution des risques</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-8 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Évolution des risques</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun historique disponible</h3>
            <p className="text-muted-foreground">
              L'évolution des risques apparaîtra après avoir complété plusieurs diagnostics au fil du temps.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Évolution des risques</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-2xl font-bold">{currentTrend?.score || 0}%</div>
              <div className="text-sm text-muted-foreground">Score actuel</div>
            </div>
            <div className="flex items-center space-x-2">
              {currentTrend && getTrendIcon(currentTrend.change)}
              <span className={`text-sm font-medium ${currentTrend ? getTrendColor(currentTrend.change) : 'text-gray-600'}`}>
                {currentTrend && currentTrend.change !== 0 ? (currentTrend.change > 0 ? '+' : '') + currentTrend.change + '%' : 'Nouveau'}
              </span>
            </div>
          </div>

          {/* Trends Chart */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Évolution historique</h4>
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={trend.period} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-muted-foreground w-20">
                      {trend.period.split(' ')[0]}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          trend.riskLevel === 'low' ? 'bg-green-500' :
                          trend.riskLevel === 'medium' ? 'bg-yellow-500' :
                          trend.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${trend.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{trend.score}%</span>
                    {index > 0 && (
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(trend.change)}
                        <span className={`text-xs ${getTrendColor(trend.change)}`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Insights based on actual data */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Activité récente</h4>
            <div className="space-y-2">
              {insights.completedThisMonth > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span>
                    {insights.completedThisMonth} action{insights.completedThisMonth > 1 ? 's' : ''} complétée{insights.completedThisMonth > 1 ? 's' : ''} ce mois
                  </span>
                </div>
              )}
              {insights.urgentPending > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                  <span>
                    {insights.urgentPending} action{insights.urgentPending > 1 ? 's' : ''} urgente{insights.urgentPending > 1 ? 's' : ''} en attente
                  </span>
                </div>
              )}
              {insights.requestsPending > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <span>
                    {insights.requestsPending} demande{insights.requestsPending > 1 ? 's' : ''} en cours de traitement
                  </span>
                </div>
              )}
              {insights.completedThisMonth === 0 && insights.urgentPending === 0 && insights.requestsPending === 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <span>Aucune activité récente détectée</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}