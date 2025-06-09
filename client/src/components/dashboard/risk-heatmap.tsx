import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Users, 
  Eye, 
  Settings,
  TrendingUp,
  Clock,
  Filter
} from "lucide-react";

interface RiskArea {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  icon: any;
  lastAssessed: string;
  actionCount: number;
  completedActions: number;
}

interface HeatMapProps {
  companyId: number;
  data?: {
    actions: any[];
    breaches: any[];
    records: any[];
    requests: any[];
  };
  diagnosticData?: {
    compliance: {
      categoryScores?: Record<string, { score: number; total: number; answered: number }>;
    };
    riskMapping?: {
      riskAreas: Array<{ category: string; score: number; severity: string }>;
    };
  };
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-500 hover:bg-red-600';
    case 'high': return 'bg-orange-500 hover:bg-orange-600';
    case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'low': return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'outline';
    case 'low': return 'secondary';
    default: return 'secondary';
  }
};

export function RiskHeatMap({ companyId, data, diagnosticData }: HeatMapProps) {
  const [selectedArea, setSelectedArea] = useState<RiskArea | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const categoryScores = diagnosticData?.compliance?.categoryScores || {};
  const actions = data?.actions || [];

  // If no diagnostic data, show empty state
  if (Object.keys(categoryScores).length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Cartographie des risques RGPD</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune donnée de diagnostic</h3>
            <p className="text-muted-foreground mb-4">
              Complétez le diagnostic RGPD pour afficher la cartographie des risques
            </p>
            <Button onClick={() => window.location.href = '/diagnostic'}>
              Commencer le diagnostic
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create risk areas based on diagnostic category scores
  const allRiskAreas = useMemo(() => {
    return Object.entries(categoryScores).map(([category, data]) => {
      const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
        if (score >= 80) return 'low';
        if (score >= 60) return 'medium';
        if (score >= 40) return 'high';
        return 'critical';
      };

      const getIcon = (category: string) => {
        switch (category.toLowerCase()) {
          case 'sécurité': return Shield;
          case 'documentation': return FileText;
          case 'consentement': return Users;
          case 'droits': return Eye;
          case 'gouvernance': return Settings;
          case 'formation': return Users;
          case 'violations': return AlertTriangle;
          default: return Settings;
        }
      };

      return {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        category: category,
        riskLevel: getRiskLevel(data.score),
        score: data.score,
        description: `Conformité ${category.toLowerCase()} - ${data.answered}/${data.total} questions répondues`,
        icon: getIcon(category),
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter((a: any) => a.category?.toLowerCase() === category.toLowerCase()).length,
        completedActions: actions.filter((a: any) => a.category?.toLowerCase() === category.toLowerCase() && a.status === 'completed').length,
      };
    });
  }, [categoryScores, actions]);

  // Filter areas based on selected risk level
  const filteredRiskAreas = useMemo(() => {
    if (riskFilter === 'all') return allRiskAreas;
    return allRiskAreas.filter(area => area.riskLevel === riskFilter);
  }, [allRiskAreas, riskFilter]);

  const overallRiskScore = useMemo(() => {
    if (allRiskAreas.length === 0) return 0;
    return Math.round(allRiskAreas.reduce((acc, area) => acc + area.score, 0) / allRiskAreas.length);
  }, [allRiskAreas]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Cartographie des risques RGPD</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les risques</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Score de risque global</span>
            <span>{overallRiskScore}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                overallRiskScore >= 80 ? 'bg-green-500' :
                overallRiskScore >= 60 ? 'bg-yellow-500' :
                overallRiskScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallRiskScore}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRiskAreas.map((area) => {
            const Icon = area.icon;
            return (
              <Card 
                key={area.id} 
                className={`cursor-pointer transition-all hover:shadow-md border ${
                  area.riskLevel === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800' :
                  area.riskLevel === 'high' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800' :
                  area.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800' :
                  'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                }`}
                onClick={() => setSelectedArea(area)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`w-6 h-6 ${
                      area.riskLevel === 'critical' ? 'text-red-600' :
                      area.riskLevel === 'high' ? 'text-orange-600' :
                      area.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <Badge variant={getRiskBadgeVariant(area.riskLevel)}>
                      {area.riskLevel === 'critical' ? 'Critique' :
                       area.riskLevel === 'high' ? 'Élevé' :
                       area.riskLevel === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-sm mb-2">{area.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{area.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Score de conformité</span>
                      <span className="font-medium">{area.score}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full ${
                          area.score >= 80 ? 'bg-green-500' :
                          area.score >= 60 ? 'bg-yellow-500' :
                          area.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${area.score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Actions: {area.completedActions}/{area.actionCount}</span>
                      <Clock className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredRiskAreas.length === 0 && (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun risque trouvé</h3>
            <p className="text-muted-foreground">
              Aucun risque ne correspond aux critères de filtrage sélectionnés.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}