import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, CreditCard, User, Plus, Mail, Trash2, Settings } from "lucide-react";

// Form schemas
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const companySchema = z.object({
  name: z.string().min(1, "Dénomination sociale requise"),
  rcsNumber: z.string().optional(),
  address: z.string().optional(),
  sector: z.string().optional(),
});

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  companyId: z.number(),
  permissions: z.array(z.string()),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type CompanyForm = z.infer<typeof companySchema>;
type InviteForm = z.infer<typeof inviteSchema>;

const AVAILABLE_PERMISSIONS = [
  { id: 'records', label: 'Registre des traitements' },
  { id: 'dpia', label: 'Analyses d\'impact (AIPD)' },
  { id: 'policies', label: 'Politiques de confidentialité' },
  { id: 'breaches', label: 'Gestion des violations' },
  { id: 'requests', label: 'Demandes d\'exercice de droits' },
  { id: 'actions', label: 'Plan d\'actions' },
  { id: 'invite', label: 'Inviter des collaborateurs' },
];

export default function UserBackOffice() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  // Fetch user's companies and access
  const { data: userAccess } = useQuery({
    queryKey: ['/api/user/company-access'],
  });

  // Fetch subscription info
  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription'],
  });

  // Fetch collaborators for selected company
  const { data: collaborators } = useQuery({
    queryKey: ['/api/company/collaborators', selectedCompanyId],
    enabled: !!selectedCompanyId,
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ['/api/user/invoices'],
  });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Company form
  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  });

  // Invite form
  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      permissions: [],
    },
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiRequest('/api/user/profile', 'PATCH', data),
    onSuccess: () => {
      toast({ title: "Profil mis à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => apiRequest('/api/user/password', 'PATCH', data),
    onSuccess: () => {
      toast({ title: "Mot de passe modifié avec succès" });
      passwordForm.reset();
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyForm) => apiRequest('/api/user/companies', 'POST', data),
    onSuccess: () => {
      toast({ title: "Société ajoutée avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/company-access'] });
      companyForm.reset();
    },
  });

  const inviteCollaboratorMutation = useMutation({
    mutationFn: (data: InviteForm) => apiRequest('/api/company/invite', 'POST', data),
    onSuccess: () => {
      toast({ title: "Invitation envoyée avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/company/collaborators', selectedCompanyId] });
      inviteForm.reset();
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (accessId: number) => apiRequest(`/api/company/access/${accessId}`, 'DELETE'),
    onSuccess: () => {
      toast({ title: "Accès révoqué avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/company/collaborators', selectedCompanyId] });
    },
  });

  const ownedCompanies = userAccess?.filter(access => access.role === 'owner') || [];
  const collaboratingCompanies = userAccess?.filter(access => access.role !== 'owner') || [];
  const canAddCompany = subscription && ownedCompanies.length < subscription.maxCompanies;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Espace Utilisateur</h1>
        {userAccess && userAccess.length > 1 && (
          <Select value={selectedCompanyId?.toString()} onValueChange={(value) => setSelectedCompanyId(Number(value))}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une société" />
            </SelectTrigger>
            <SelectContent>
              {userAccess.map((access) => (
                <SelectItem key={access.companyId} value={access.companyId.toString()}>
                  {access.company.name} ({access.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Mon Compte
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Sociétés
          </TabsTrigger>
          <TabsTrigger value="collaborators" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaborateurs
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Abonnement
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Gérez vos informations de profil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" {...profileForm.register("firstName")} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" {...profileForm.register("lastName")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Téléphone</Label>
                    <Input id="phoneNumber" {...profileForm.register("phoneNumber")} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...profileForm.register("email")} />
                  </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    Mettre à jour
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sécurité du Compte</CardTitle>
                <CardDescription>Modifier votre mot de passe</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} />
                  </div>
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    Changer le mot de passe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Gestion des Sociétés</h2>
            {subscription && (
              <Badge variant="outline">
                {ownedCompanies.length} / {subscription.maxCompanies} sociétés
              </Badge>
            )}
          </div>

          {canAddCompany && (
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une Société</CardTitle>
                <CardDescription>Créez une nouvelle société dans votre compte</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Dénomination sociale *</Label>
                    <Input id="companyName" {...companyForm.register("name")} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="rcsNumber">Numéro RCS</Label>
                      <Input id="rcsNumber" {...companyForm.register("rcsNumber")} />
                    </div>
                    <div>
                      <Label htmlFor="sector">Secteur d'activité</Label>
                      <Input id="sector" {...companyForm.register("sector")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse du siège social</Label>
                    <Input id="address" {...companyForm.register("address")} />
                  </div>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter la société
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Mes Sociétés</h3>
            {ownedCompanies.map((access) => (
              <Card key={access.companyId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{access.company.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {access.company.sector} • {access.company.size}
                      </p>
                    </div>
                    <Badge>Propriétaire</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {collaboratingCompanies.length > 0 && (
              <>
                <Separator />
                <h3 className="text-lg font-medium">Sociétés Collaboratives</h3>
                {collaboratingCompanies.map((access) => (
                  <Card key={access.companyId}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{access.company.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Rôle: {access.role} • Permissions: {access.permissions?.join(', ')}
                          </p>
                        </div>
                        <Badge variant="secondary">Collaborateur</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Gestion des Collaborateurs</h2>
            <Select value={selectedCompanyId?.toString()} onValueChange={(value) => setSelectedCompanyId(Number(value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Sélectionner une société" />
              </SelectTrigger>
              <SelectContent>
                {ownedCompanies.map((access) => (
                  <SelectItem key={access.companyId} value={access.companyId.toString()}>
                    {access.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Inviter un Collaborateur</CardTitle>
                  <CardDescription>Envoyez une invitation par email</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={inviteForm.handleSubmit((data) => inviteCollaboratorMutation.mutate(data))} className="space-y-4">
                    <div>
                      <Label htmlFor="inviteEmail">Email du collaborateur</Label>
                      <Input id="inviteEmail" type="email" {...inviteForm.register("email")} />
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid gap-2 mt-2">
                        {AVAILABLE_PERMISSIONS.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={permission.id}
                              {...inviteForm.register("permissions")}
                            />
                            <span className="text-sm">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" disabled={inviteCollaboratorMutation.isPending}>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer l'invitation
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collaborateurs Actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  {collaborators?.length ? (
                    <div className="space-y-4">
                      {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{collaborator.user.firstName} {collaborator.user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{collaborator.user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Permissions: {collaborator.permissions?.join(', ')}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeAccessMutation.mutate(collaborator.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun collaborateur pour cette société</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mon Abonnement</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Formule</span>
                      <Badge>{subscription.planName}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Prix mensuel</span>
                      <span className="font-medium">{subscription.monthlyPrice}€</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sociétés autorisées</span>
                      <span className="font-medium">{subscription.maxCompanies}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Statut</span>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Gérer l'abonnement
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun abonnement trouvé</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mes Factures</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices?.length ? (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">#{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.issuedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{invoice.amount}€</p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune facture</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}