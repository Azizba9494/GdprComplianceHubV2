import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, TrendingUp, FileText, Users, AlertTriangle, LogOut } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const userData = user as User;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RGPD Manager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={userData?.profileImageUrl || ""} />
              <AvatarFallback>
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userData?.firstName} {userData?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userData?.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue, {userData?.firstName}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Tableau de bord de conformité RGPD pour votre entreprise
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/diagnostic">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
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

          <Link href="/requests">
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

        {/* Dashboard Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Compliance Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Score de Conformité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">--</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complétez le diagnostic pour voir votre score
              </p>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune activité récente
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune alerte active
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}