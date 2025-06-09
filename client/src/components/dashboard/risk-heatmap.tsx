import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Users, 
  Database, 
  Lock, 
  Eye, 
  Settings,
  TrendingUp,
  Clock
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
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-500 hover:bg-red-600';
    case 'high': return 'bg-orange-500 hover:bg-orange-600';
    case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'low': return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-400 hover:bg-gray-500';
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

export function RiskHeatMap({ companyId, data }: HeatMapProps) {
  const [selectedArea, setSelectedArea] = useState<RiskArea | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate risk areas based on actual data
  const calculateRiskAreas = (): RiskArea[] => {
    const actions = data?.actions || [];
    const breaches = data?.breaches || [];
    const records = data?.records || [];
    const requests = data?.requests || [];

    const areas: RiskArea[] = [
      {
        id: 'data-protection',
        name: 'Protection des données',
        category: 'Sécurité',
        riskLevel: breaches.length > 0 ? 'critical' : actions.filter(a => a.category === 'security' && a.status !== 'completed').length > 2 ? 'high' : 'medium',
        score: Math.max(0, 100 - (breaches.length * 30) - (actions.filter(a => a.category === 'security' && a.status !== 'completed').length * 10)),
        description: 'Mesures de sécurité et protection contre les violations',
        icon: Shield,
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter(a => a.category === 'security').length,
        completedActions: actions.filter(a => a.category === 'security' && a.status === 'completed').length,
      },
      {
        id: 'data-processing',
        name: 'Traitement des données',
        category: 'Opérations',
        riskLevel: records.length === 0 ? 'high' : records.length < 3 ? 'medium' : 'low',
        score: Math.min(100, records.length * 25),
        description: 'Registres et documentation des traitements',
        icon: Database,
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter(a => a.category === 'processing').length,
        completedActions: actions.filter(a => a.category === 'processing' && a.status === 'completed').length,
      },
      {
        id: 'consent-management',
        name: 'Gestion du consentement',
        category: 'Légal',
        riskLevel: actions.filter(a => a.category === 'consent' && a.status !== 'completed').length > 1 ? 'high' : 'medium',
        score: Math.max(0, 100 - (actions.filter(a => a.category === 'consent' && a.status !== 'completed').length * 20)),
        description: 'Collecte et gestion des consentements',
        icon: Users,
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter(a => a.category === 'consent').length,
        completedActions: actions.filter(a => a.category === 'consent' && a.status === 'completed').length,
      },
      {
        id: 'rights-management',
        name: 'Droits des personnes',
        category: 'Légal',
        riskLevel: requests.filter(r => r.status !== 'closed').length > 5 ? 'critical' : requests.filter(r => r.status !== 'closed').length > 2 ? 'high' : 'low',
        score: Math.max(0, 100 - (requests.filter(r => r.status !== 'closed').length * 15)),
        description: 'Gestion des demandes et droits des personnes concernées',
        icon: Eye,
        lastAssessed: new Date().toISOString(),
        actionCount: requests.length,
        completedActions: requests.filter(r => r.status === 'closed').length,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        category: 'Gouvernance',
        riskLevel: actions.filter(a => a.category === 'documentation' && a.status !== 'completed').length > 2 ? 'high' : 'low',
        score: Math.max(0, 100 - (actions.filter(a => a.category === 'documentation' && a.status !== 'completed').length * 15)),
        description: 'Politiques de confidentialité et documentation',
        icon: FileText,
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter(a => a.category === 'documentation').length,
        completedActions: actions.filter(a => a.category === 'documentation' && a.status === 'completed').length,
      },
      {
        id: 'vendor-management',
        name: 'Gestion des sous-traitants',
        category: 'Gouvernance',
        riskLevel: actions.filter(a => a.category === 'vendor' && a.status !== 'completed').length > 1 ? 'medium' : 'low',
        score: Math.max(0, 100 - (actions.filter(a => a.category === 'vendor' && a.status !== 'completed').length * 20)),
        description: 'Contrats et supervision des sous-traitants',
        icon: Settings,
        lastAssessed: new Date().toISOString(),
        actionCount: actions.filter(a => a.category === 'vendor').length,
        completedActions: actions.filter(a => a.category === 'vendor' && a.status === 'completed').length,
      },
    ];

    return areas;
  };

  const riskAreas = calculateRiskAreas();
  const overallRiskScore = Math.round(riskAreas.reduce((sum, area) => sum + area.score, 0) / riskAreas.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Cartographie des risques RGPD</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Visualisation interactive des niveaux de risque par domaine de conformité
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{overallRiskScore}%</div>
                <div className="text-xs text-muted-foreground">Score global</div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grille
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  Liste
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riskAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <TooltipProvider key={area.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            relative p-4 rounded-lg cursor-pointer transition-all duration-200 text-white
                            ${getRiskColor(area.riskLevel)}
                            ${selectedArea?.id === area.id ? 'ring-2 ring-white ring-offset-2' : ''}
                          `}
                          onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Icon className="w-6 h-6" />
                            <Badge variant="secondary" className="text-xs">
                              {area.category}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm mb-2">{area.name}</h3>
                          <div className="flex items-center justify-between text-xs">
                            <span>{area.score}% conforme</span>
                            <span className="capitalize">{area.riskLevel}</span>
                          </div>
                          <div className="mt-2 bg-white/20 rounded-full h-1">
                            <div 
                              className="bg-white rounded-full h-1 transition-all duration-300"
                              style={{ width: `${area.score}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2 max-w-xs">
                          <p className="font-medium">{area.name}</p>
                          <p className="text-sm text-muted-foreground">{area.description}</p>
                          <div className="mt-2 text-xs">
                            <div>Actions: {area.completedActions}/{area.actionCount}</div>
                            <div>Dernière évaluation: {new Date(area.lastAssessed).toLocaleDateString('fr-FR')}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {riskAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <div
                    key={area.id}
                    className={`
                      flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedArea?.id === area.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                    `}
                    onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getRiskColor(area.riskLevel)}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{area.name}</h3>
                        <p className="text-sm text-muted-foreground">{area.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{area.score}%</div>
                        <div className="text-xs text-muted-foreground">
                          {area.completedActions}/{area.actionCount} actions
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(area.riskLevel) as any}>
                        {area.riskLevel}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk Legend */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Légende des niveaux de risque</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { level: 'low', label: 'Faible', color: 'bg-green-500' },
                { level: 'medium', label: 'Moyen', color: 'bg-yellow-500' },
                { level: 'high', label: 'Élevé', color: 'bg-orange-500' },
                { level: 'critical', label: 'Critique', color: 'bg-red-500' },
              ].map(({ level, label, color }) => (
                <div key={level} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Area Details */}
      {selectedArea && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <selectedArea.icon className="w-5 h-5" />
              <span>{selectedArea.name}</span>
              <Badge variant={getRiskBadgeVariant(selectedArea.riskLevel) as any}>
                {selectedArea.riskLevel}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Détails du risque</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedArea.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Score de conformité:</span>
                    <span className="font-medium">{selectedArea.score}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Actions complétées:</span>
                    <span className="font-medium">
                      {selectedArea.completedActions}/{selectedArea.actionCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dernière évaluation:</span>
                    <span className="font-medium">
                      {new Date(selectedArea.lastAssessed).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recommandations</h4>
                <div className="space-y-2">
                  {selectedArea.riskLevel === 'critical' && (
                    <div className="flex items-start space-x-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      <span>Action immédiate requise - risque élevé de non-conformité</span>
                    </div>
                  )}
                  {selectedArea.riskLevel === 'high' && (
                    <div className="flex items-start space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                      <span>Planifier des actions correctives dans les 30 jours</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span>Documenter les mesures prises et les contrôles mis en place</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Actions rapides</h4>
                <div className="space-y-2">
                  <Button size="sm" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir les actions
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Générer un rapport
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurer les alertes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}