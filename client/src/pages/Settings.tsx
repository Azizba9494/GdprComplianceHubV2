import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  CreditCard,
  User,
  Lock
} from "lucide-react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

export default function Settings() {
  const { user } = useSimpleAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <SettingsIcon className="w-8 h-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informations du compte</span>
                </CardTitle>
                <CardDescription>
                  Vos informations de compte principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nom complet</Label>
                    <p className="text-sm text-muted-foreground">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Abonnement</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={user?.subscriptionTier === 'free' ? 'secondary' : 'default'}>
                      {user?.subscriptionTier === 'free' ? 'Gratuit' : 
                       user?.subscriptionTier === 'premium' ? 'Premium' : 'Entreprise'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Préférences d'affichage</span>
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Mode sombre</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer le thème sombre
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Langue</Label>
                    <p className="text-sm text-muted-foreground">
                      Français (France)
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications importantes par email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Rappels d'échéances</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les actions à échéance proche
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notifications de sécurité</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes en cas de violation de données détectée
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Sécurité du compte</span>
                </CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Mot de passe</Label>
                    <p className="text-sm text-muted-foreground">
                      Dernière modification il y a plus de 90 jours
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Ajouter une couche de sécurité supplémentaire
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Sessions actives</span>
                </CardTitle>
                <CardDescription>
                  Gérez vos sessions de connexion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Session actuelle</p>
                      <p className="text-sm text-muted-foreground">
                        Navigateur Web • {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">Actuelle</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Abonnement actuel</span>
                </CardTitle>
                <CardDescription>
                  Gérez votre abonnement et facturation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Plan Gratuit</p>
                    <p className="text-sm text-muted-foreground">
                      Fonctionnalités de base incluses
                    </p>
                  </div>
                  <Button>Mettre à niveau</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fonctionnalités incluses :</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Diagnostic de conformité de base</li>
                    <li>• Registre des traitements (jusqu'à 5 traitements)</li>
                    <li>• Génération de politique de confidentialité</li>
                    <li>• Support par email</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique de facturation</CardTitle>
                <CardDescription>
                  Consultez vos factures précédentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aucune facture disponible pour le plan gratuit.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}