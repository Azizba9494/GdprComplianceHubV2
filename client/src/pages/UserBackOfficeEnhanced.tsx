import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Building, 
  CreditCard, 
  Users, 
  Mail,
  Phone,
  MapPin,
  Settings,
  Crown,
  UserPlus,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Edit,
  Save,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function UserBackOfficeEnhanced() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  // Fetch user subscription
  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user companies access
  const { data: companyAccess } = useQuery({
    queryKey: ['/api/user/company-access'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user invoices
  const { data: invoices } = useQuery({
    queryKey: ['/api/user/invoices'],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: "",
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setEditingProfile(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phoneNumber,
    });
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: "",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Chargement du profil utilisateur...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Compte</h1>
          <p className="text-muted-foreground">
            Gérez votre profil et vos préférences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="companies">Entreprises</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations de profil et vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        <User className="w-3 h-3 mr-1" />
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </Badge>
                      {subscription?.planName && (
                        <Badge variant="outline">
                          <Crown className="w-3 h-3 mr-1" />
                          {subscription.planName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingProfile ? (
                    <>
                      <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingProfile(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!editingProfile}
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!editingProfile}
                    />
                  </div>
                </div>

                <div>
                  <Label>Nom d'utilisateur</Label>
                  <Input
                    value={user.username}
                    disabled={true}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Le nom d'utilisateur ne peut pas être modifié.
                  </p>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    value={user.email}
                    disabled={true}
                    type="email"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Pour modifier votre email, contactez le support.
                  </p>
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                    disabled={!editingProfile}
                    type="tel"
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Mes Entreprises</CardTitle>
              <CardDescription>
                Entreprises auxquelles vous avez accès
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyAccess && companyAccess.length > 0 ? (
                <div className="space-y-4">
                  {companyAccess.map((access: any) => (
                    <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{access.company?.name}</h4>
                          <p className="text-sm text-gray-600">{access.company?.sector}</p>
                          <Badge variant="outline" className="mt-1">
                            {access.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={access.status === 'active' ? 'default' : 'secondary'}>
                          {access.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Building className="w-4 h-4" />
                  <AlertDescription>
                    Aucune entreprise associée à votre compte.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Détails de votre abonnement actuel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-8 h-8 text-yellow-600" />
                      <div>
                        <h4 className="font-medium">{subscription.planName}</h4>
                        <p className="text-sm text-gray-600">
                          {subscription.maxCompanies} entreprise(s) maximum
                        </p>
                        <p className="text-sm text-gray-600">
                          {subscription.maxUsers} utilisateur(s) par entreprise
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Expire le: {new Date(subscription.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <CreditCard className="w-4 h-4" />
                  <AlertDescription>
                    Aucun abonnement actif.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Facturation</CardTitle>
              <CardDescription>
                Historique de vos factures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div>
                          <h4 className="font-medium">Facture #{invoice.invoiceNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.amount}€</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <DollarSign className="w-4 h-4" />
                  <AlertDescription>
                    Aucune facture disponible.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}