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
import React from "react";

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
  { id: 'all', label: 'Accès complet (Administrateur)' },
  { id: 'records', label: 'Registre des traitements', actions: ['read', 'write', 'delete'] },
  { id: 'dpia', label: 'Analyses d\'impact (AIPD)', actions: ['read', 'write', 'delete'] },
  { id: 'policies', label: 'Politiques de confidentialité', actions: ['read', 'write', 'delete'] },
  { id: 'breaches', label: 'Gestion des violations', actions: ['read', 'write', 'delete'] },
  { id: 'requests', label: 'Demandes d\'exercice de droits', actions: ['read', 'write', 'delete'] },
  { id: 'actions', label: 'Plan d\'actions', actions: ['read', 'write', 'delete'] },
  { id: 'diagnostic', label: 'Diagnostic de conformité', actions: ['read', 'write'] },
  { id: 'invite', label: 'Inviter des collaborateurs', actions: ['write'] },
  { id: 'billing', label: 'Facturation et abonnements', actions: ['read'] },
];

const ROLE_PERMISSIONS = {
  'owner': ['all'],
  'admin': ['records', 'dpia', 'policies', 'breaches', 'requests', 'actions', 'diagnostic', 'invite'],
  'collaborator': ['records', 'dpia', 'policies', 'requests', 'actions']
};

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

  // Fetch collaborators for the user's company
  const { data: collaborators } = useQuery({
    queryKey: ['/api/user/collaborators', userAccess?.[0]?.companyId],
    enabled: !!userAccess?.[0]?.companyId,
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ['/api/user/invoices'],
  });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

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
      companyId: selectedCompanyId || 0,
    },
  });

  // Update company ID when user access loads
  React.useEffect(() => {
    if (userAccess?.[0]?.companyId) {
      inviteForm.setValue('companyId', userAccess[0].companyId);
    }
  }, [userAccess, inviteForm]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiRequest('/api/user/profile', 'PATCH', data),
    onSuccess: () => {
      toast({ title: "Profil mis à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
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
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la création", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    },
  });

  const inviteCollaboratorMutation = useMutation({
    mutationFn: (data: InviteForm) => apiRequest('/api/user/invite', 'POST', data),
    onSuccess: () => {
      toast({ title: "Invitation envoyée avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/collaborators', userAccess?.[0]?.companyId] });
      inviteForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de l'invitation", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (accessId: number) => apiRequest(`/api/user/access/${accessId}`, 'DELETE'),
    onSuccess: () => {
      toast({ title: "Accès révoqué avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/user/collaborators', userAccess?.[0]?.companyId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la révocation", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    },
  });

  const currentCompany = userAccess?.[0]; // Single company model

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Espace Utilisateur</h1>
        {currentCompany && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Société actuelle</p>
            <p className="font-medium">{currentCompany.company.name}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Mon Compte
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Ma Société
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
                    {updateProfileMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
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
                    {updatePasswordMutation.isPending ? "Modification..." : "Changer le mot de passe"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <h2 className="text-2xl font-semibold">Informations de la Société</h2>

          {/* Fetch current company data */}
          {userAccess && userAccess.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Modifier les informations de votre société</CardTitle>
                <CardDescription>Mettez à jour les détails de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Dénomination sociale *</Label>
                    <Input 
                      id="companyName" 
                      {...companyForm.register("name")} 
                      placeholder="Ex: Ma Société SARL"
                      defaultValue={userAccess[0]?.company?.name || ""}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="rcsNumber">Numéro RCS</Label>
                      <Input 
                        id="rcsNumber" 
                        {...companyForm.register("rcsNumber")} 
                        placeholder="Ex: 123 456 789 R.C.S. Paris"
                        defaultValue={userAccess[0]?.company?.rcsNumber || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector">Secteur d'activité</Label>
                      <Input 
                        id="sector" 
                        {...companyForm.register("sector")} 
                        placeholder="Ex: Services informatiques"
                        defaultValue={userAccess[0]?.company?.sector || ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse du siège social</Label>
                    <Input 
                      id="address" 
                      {...companyForm.register("address")} 
                      placeholder="Ex: 123 rue de la République, 75001 Paris"
                      defaultValue={userAccess[0]?.company?.address || ""}
                    />
                  </div>
                  <Button type="submit" disabled={createCompanyMutation.isPending} className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    {createCompanyMutation.isPending ? "Mise à jour..." : "Mettre à jour la société"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Créer votre société</CardTitle>
                <CardDescription>Configurez les informations de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Dénomination sociale *</Label>
                    <Input id="companyName" {...companyForm.register("name")} placeholder="Ex: Ma Société SARL" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="rcsNumber">Numéro RCS</Label>
                      <Input id="rcsNumber" {...companyForm.register("rcsNumber")} placeholder="Ex: 123 456 789 R.C.S. Paris" />
                    </div>
                    <div>
                      <Label htmlFor="sector">Secteur d'activité</Label>
                      <Input id="sector" {...companyForm.register("sector")} placeholder="Ex: Services informatiques" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse du siège social</Label>
                    <Input id="address" {...companyForm.register("address")} placeholder="Ex: 123 rue de la République, 75001 Paris" />
                  </div>
                  <Button type="submit" disabled={createCompanyMutation.isPending} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {createCompanyMutation.isPending ? "Création en cours..." : "Créer la société"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="space-y-6">
          <h2 className="text-2xl font-semibold">Gestion des Collaborateurs</h2>

          {userAccess && userAccess.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Inviter un Collaborateur</CardTitle>
                  <CardDescription>Envoyez une invitation par email à un nouveau collaborateur</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={inviteForm.handleSubmit((data) => inviteCollaboratorMutation.mutate(data))} className="space-y-4">
                    <div>
                      <Label htmlFor="inviteEmail">Email du collaborateur</Label>
                      <Input id="inviteEmail" type="email" {...inviteForm.register("email")} />
                    </div>
                    <div>
                      <Label>Rôle et Permissions</Label>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label htmlFor="role">Rôle</Label>
                          <Select onValueChange={(value) => {
                            const defaultPermissions = ROLE_PERMISSIONS[value as keyof typeof ROLE_PERMISSIONS] || [];
                            inviteForm.setValue('permissions', defaultPermissions);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrateur</SelectItem>
                              <SelectItem value="collaborator">Collaborateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Permissions détaillées</Label>
                          <div className="grid gap-3 mt-2 max-h-48 overflow-y-auto border rounded p-3">
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                              <div key={permission.id} className="space-y-2">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    value={permission.id}
                                    {...inviteForm.register("permissions")}
                                    className="rounded"
                                  />
                                  <span className="font-medium text-sm">{permission.label}</span>
                                </label>
                                {permission.actions && (
                                  <div className="ml-6 space-y-1">
                                    {permission.actions.map((action) => (
                                      <label key={`${permission.id}_${action}`} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          value={`${permission.id}_${action}`}
                                          {...inviteForm.register("permissions")}
                                          className="rounded text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground capitalize">{action}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={inviteCollaboratorMutation.isPending} className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      {inviteCollaboratorMutation.isPending ? "Envoi en cours..." : "Envoyer l'invitation"}
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
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{collaborator.user.firstName} {collaborator.user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{collaborator.user.email}</p>
                              </div>
                              <Badge variant={collaborator.role === 'admin' ? 'default' : 'secondary'}>
                                {collaborator.role}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground">Permissions:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {collaborator.permissions?.map((perm) => (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Invité le {new Date(collaborator.invitedAt || '').toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => revokeAccessMutation.mutate(collaborator.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun collaborateur pour votre société</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                Veuillez d'abord configurer votre société dans l'onglet "Ma Société" pour pouvoir inviter des collaborateurs.
              </AlertDescription>
            </Alert>
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