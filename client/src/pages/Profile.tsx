import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, Building2, MapPin, FileText, Download, Eye } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional()
});

const companySchema = z.object({
  name: z.string().min(2, "Le nom de la société est requis"),
  siren: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  sector: z.string().optional(),
  size: z.string().optional()
});

type ProfileForm = z.infer<typeof profileSchema>;
type CompanyForm = z.infer<typeof companySchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"]
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"]
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.user?.firstName || "",
      lastName: profileData?.user?.lastName || "",
      phone: profileData?.user?.phone || ""
    }
  });

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: profileData?.company?.name || "",
      siren: profileData?.company?.siren || "",
      address: profileData?.company?.address || "",
      phone: profileData?.company?.phone || "",
      email: profileData?.company?.email || "",
      sector: profileData?.company?.sector || "",
      size: profileData?.company?.size || ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest("/api/profile", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations personnelles ont été sauvegardées.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyForm) => {
      const method = profileData?.company ? "PUT" : "POST";
      return apiRequest("/api/profile/company", method as "POST" | "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Société mise à jour",
        description: "Les informations de votre société ont été sauvegardées.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la société",
        variant: "destructive",
      });
    }
  });

  const onSubmitProfile = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitCompany = (data: CompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  const formatAmount = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'failed': return 'Échec';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre société</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Compte</TabsTrigger>
          <TabsTrigger value="company">Société</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Modifiez vos informations de compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Email</Label>
                      <Input value={profileData?.user?.email} disabled className="bg-muted" />
                      <p className="text-sm text-muted-foreground mt-1">
                        L'adresse email ne peut pas être modifiée
                      </p>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de la société
              </CardTitle>
              <CardDescription>
                Renseignez les informations de votre société pour une conformité optimale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la société</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="siren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIREN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 456 789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de la société</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secteur d'activité</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille de l'entreprise</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="VSE, PME..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={updateCompanyMutation.isPending}>
                    {updateCompanyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes factures
              </CardTitle>
              <CardDescription>
                Consultez l'historique de vos factures et abonnements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : invoices?.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">
                            Facture #{invoice.invoiceNumber || invoice.id}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {invoice.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune facture</h3>
                  <p className="text-muted-foreground">
                    Vos factures d'abonnement apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}