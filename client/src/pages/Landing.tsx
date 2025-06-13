import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Plateforme RGPD
            <span className="text-blue-600 dark:text-blue-400"> Intelligente</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Simplifiez votre conformité RGPD avec notre solution IA dédiée aux VSE/PME françaises. 
            Diagnostics automatisés, plans d'action personnalisés et suivi en temps réel.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Commencer gratuitement
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Diagnostic IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Évaluation automatisée de votre conformité RGPD avec recommandations personnalisées
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Plans d'action</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Actions prioritaires générées automatiquement selon votre secteur d'activité
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Gestion des droits</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Traitement automatisé des demandes d'exercice des droits des personnes
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Alertes temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Notifications proactives pour maintenir votre conformité à jour
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Prêt à sécuriser votre conformité RGPD ?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Rejoignez des centaines d'entreprises qui font confiance à notre plateforme 
            pour leur mise en conformité RGPD.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => {
              // Use a proper redirect that maintains cookies
              window.location.assign('/api/login');
            }}
          >
            Créer mon compte
          </Button>
        </div>
      </div>
    </div>
  );
}