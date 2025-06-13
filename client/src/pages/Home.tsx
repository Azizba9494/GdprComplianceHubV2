import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Play,
  Plus,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  complianceScore: number;
  totalRecords: number;
  pendingRequests: number;
  activeActions: number;
  recentActivity: Array<{
    id: number;
    type: string;
    title: string;
    date: string;
    status: string;
  }>;
}

export default function Home() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const complianceScore = stats?.complianceScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Moyen";
    return "À améliorer";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre conformité RGPD
          </p>
        </div>
        <Button className="btn-primary">
          <Play className="w-4 h-4 mr-2" />
          Nouveau diagnostic
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Conformité</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getScoreLevel(complianceScore)}
            </p>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traitements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registre des activités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes en cours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              À traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeActions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Plan d'actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/diagnostic">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Play className="w-5 h-5 mr-2 text-blue-600" />
                Diagnostic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Évaluez votre conformité RGPD
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/records">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Registre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gérez vos traitements de données
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rights">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Demandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Traitez les demandes des personnes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/actions">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Suivez votre plan d'actions
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status === 'completed' ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune activité récente
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/diagnostic" className="flex items-center space-x-4 hover:bg-muted p-2 rounded-md cursor-pointer transition-colors">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Complétez le diagnostic</p>
                  <p className="text-xs text-muted-foreground">
                    Obtenez votre score de conformité
                  </p>
                </div>
              </Link>
              
              <Link href="/records" className="flex items-center space-x-4 hover:bg-muted p-2 rounded-md cursor-pointer transition-colors">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mise à jour du registre</p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez vos traitements de données
                  </p>
                </div>
              </Link>
              
              <Link href="/privacy-policy" className="flex items-center space-x-4 hover:bg-muted p-2 rounded-md cursor-pointer transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Politique de confidentialité</p>
                  <p className="text-xs text-muted-foreground">
                    Générez votre politique
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}