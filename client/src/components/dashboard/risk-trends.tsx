import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

interface RiskTrend {
  period: string;
  score: number;
  change: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskTrendsProps {
  data: {
    actions: any[];
    breaches: any[];
    requests: any[];
  };
}

export function RiskTrends({ data }: RiskTrendsProps) {
  const calculateTrends = (): RiskTrend[] => {
    const now = new Date();
    const periods = [];
    
    // Generate last 6 months of trend data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      // Simulate risk score calculation based on actions completed that month
      const completedActions = data.actions.filter(action => {
        if (!action.completedAt) return false;
        const completedDate = new Date(action.completedAt);
        return completedDate.getMonth() === date.getMonth() && 
               completedDate.getFullYear() === date.getFullYear();
      }).length;
      
      const totalActions = data.actions.length;
      const baseScore = 60; // Base risk score
      const completionBonus = completedActions * 10;
      const penaltyForPending = data.actions.filter(a => a.status === 'pending').length * 5;
      
      const score = Math.min(100, Math.max(0, baseScore + completionBonus - penaltyForPending + Math.random() * 20));
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (score >= 80) riskLevel = 'low';
      else if (score >= 60) riskLevel = 'medium';
      else if (score >= 40) riskLevel = 'high';
      else riskLevel = 'critical';
      
      periods.push({
        period: monthName,
        score: Math.round(score),
        change: i === 5 ? 0 : Math.round((Math.random() - 0.5) * 20),
        riskLevel
      });
    }
    
    // Calculate actual changes between periods
    for (let i = 1; i < periods.length; i++) {
      periods[i].change = periods[i].score - periods[i - 1].score;
    }
    
    return periods;
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
              <div className="text-2xl font-bold">{currentTrend.score}%</div>
              <div className="text-sm text-muted-foreground">Score actuel</div>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(currentTrend.change)}
              <span className={`text-sm font-medium ${getTrendColor(currentTrend.change)}`}>
                {currentTrend.change > 0 ? '+' : ''}{currentTrend.change}%
              </span>
            </div>
          </div>

          {/* Trends Chart */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Évolution sur 6 mois</h4>
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

          {/* Key Insights */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Insights clés</h4>
            <div className="space-y-2">
              {data.actions.filter(a => a.status === 'completed').length > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span>
                    {data.actions.filter(a => a.status === 'completed').length} actions complétées ce mois
                  </span>
                </div>
              )}
              {data.actions.filter(a => a.status === 'pending' && a.priority === 'urgent').length > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                  <span>
                    {data.actions.filter(a => a.status === 'pending' && a.priority === 'urgent').length} actions urgentes en attente
                  </span>
                </div>
              )}
              {data.requests.filter(r => r.status !== 'completed').length > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <span>
                    {data.requests.filter(r => r.status !== 'completed').length} demandes en cours de traitement
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}