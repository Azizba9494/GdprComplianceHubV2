import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Building2, Users, Shield, Globe, ExternalLink, FileText, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { SubprocessorRecord } from "@shared/schema";

// Security measures options (same as processing records)
const SECURITY_MEASURES = [
  "Chiffrement des données",
  "Contrôle d'accès",
  "Authentification forte",
  "Journalisation des accès",
  "Sauvegarde régulière",
  "Plan de continuité d'activité",
  "Formation du personnel",
  "Audit de sécurité",
  "Anonymisation/Pseudonymisation",
  "Contrôle des sous-traitants",
  "Destruction sécurisée des données",
  "Supervision et monitoring"
];

const subprocessorFormSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est requis"),
  clientAddress: z.string().min(1, "L'adresse du client est requise"),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  clientRepresentativeName: z.string().optional(),
  clientRepresentativeAddress: z.string().optional(),
  clientRepresentativePhone: z.string().optional(),
  clientRepresentativeEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  subprocessorName: z.string().optional(),
  subprocessorAddress: z.string().optional(),
  subprocessorPhone: z.string().optional(),
  subprocessorEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  processingCategories: z.string().min(1, "Les catégories de traitement sont requises"),
  hasInternationalTransfers: z.boolean().default(false),
  transferDetails: z.string().optional(),
  securityMeasures: z.array(z.string()).min(1, "Au moins une mesure de sécurité est requise"),
});

type SubprocessorFormData = z.infer<typeof subprocessorFormSchema>;

export default function SubprocessorRegistry() {
  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [customSecurityMeasure, setCustomSecurityMeasure] = useState("");

  const companyId = currentCompany?.id;

  // Get subprocessor records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["/api/subprocessor-records", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("No company ID");
      const response = await fetch(`/api/subprocessor-records/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch records");
      return response.json();
    },
    enabled: !!companyId,
  });

  const form = useForm<SubprocessorFormData>({
    resolver: zodResolver(subprocessorFormSchema),
    defaultValues: {
      clientName: "",
      clientAddress: "",
      clientPhone: "",
      clientEmail: "",
      clientRepresentativeName: "",
      clientRepresentativeAddress: "",
      clientRepresentativePhone: "",
      clientRepresentativeEmail: "",
      subprocessorName: "",
      subprocessorAddress: "",
      subprocessorPhone: "",
      subprocessorEmail: "",
      processingCategories: "",
      hasInternationalTransfers: false,
      transferDetails: "",
      securityMeasures: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubprocessorFormData) => {
      const response = await fetch("/api/subprocessor-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId: company?.id,
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la création");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subprocessor-records", company?.id] });
      setIsCreateDialogOpen(false);
      setCustomSecurityMeasure("");
      form.reset();
      toast({
        title: "Enregistrement créé",
        description: "L'enregistrement de sous-traitant a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SubprocessorFormData }) => {
      const response = await fetch(`/api/subprocessor-records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subprocessor-records", company?.id] });
      setEditingRecord(null);
      setCustomSecurityMeasure("");
      form.reset();
      toast({
        title: "Enregistrement mis à jour",
        description: "L'enregistrement de sous-traitant a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/subprocessor-records/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subprocessor-records", company?.id] });
      toast({
        title: "Enregistrement supprimé",
        description: "L'enregistrement de sous-traitant a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SubprocessorFormData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: SubprocessorRecord) => {
    form.reset({
      clientName: record.clientName,
      clientAddress: record.clientAddress,
      clientPhone: record.clientPhone || "",
      clientEmail: record.clientEmail || "",
      clientRepresentativeName: record.clientRepresentativeName || "",
      clientRepresentativeAddress: record.clientRepresentativeAddress || "",
      clientRepresentativePhone: record.clientRepresentativePhone || "",
      clientRepresentativeEmail: record.clientRepresentativeEmail || "",
      subprocessorName: record.subprocessorName || "",
      subprocessorAddress: record.subprocessorAddress || "",
      subprocessorPhone: record.subprocessorPhone || "",
      subprocessorEmail: record.subprocessorEmail || "",
      processingCategories: record.processingCategories,
      hasInternationalTransfers: record.hasInternationalTransfers,
      transferDetails: record.transferDetails || "",
      securityMeasures: record.securityMeasures || [],
    });
    setEditingRecord(record.id);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?")) {
      deleteMutation.mutate(id);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (records.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a aucun enregistrement à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Client (Responsable de traitement)",
      "Adresse du client",
      "Téléphone client",
      "Email client",
      "Représentant du client",
      "Sous-traitant",
      "Catégories de traitement",
      "Transferts internationaux",
      "Mesures de sécurité",
      "Date de création"
    ];

    const csvData = records.map(record => [
      record.clientName,
      record.clientAddress,
      record.clientPhone || "",
      record.clientEmail || "",
      record.clientRepresentativeName || "",
      record.subprocessorName || "",
      record.processingCategories,
      record.hasInternationalTransfers ? "Oui" : "Non",
      Array.isArray(record.securityMeasures) ? record.securityMeasures.join("; ") : record.securityMeasures,
      new Date(record.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registre-sous-traitant-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check permissions after all hooks
  if (!hasPermission('subprocessors', 'read')) {
    return (
      <AccessDenied 
        module="Registre du sous-traitant" 
        requiredPermission="subprocessors.read"
        description="Vous n'avez pas accès au module registre du sous-traitant car vos droits ne le permettent pas."
      />
    );
  }

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registre du sous-traitant</h1>
          <p className="text-muted-foreground">
            Gérez vos activités de traitement en tant que sous-traitant
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingRecord(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel enregistrement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Modifier l'enregistrement" : "Nouvel enregistrement de sous-traitant"}
                </DialogTitle>
                <DialogDescription>
                  Renseignez les informations relatives à votre activité de sous-traitant
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Informations du client (Responsable de traitement)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du client *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de l'entreprise cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email du client</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@client.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientAddress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse du client *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Adresse complète du client" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone du client</FormLabel>
                            <FormControl>
                              <Input placeholder="01 23 45 67 89" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />
                    
                    <h4 className="font-medium">Représentant du client (le cas échéant)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientRepresentativeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du représentant</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du représentant" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientRepresentativeEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email du représentant</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="representant@client.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientRepresentativeAddress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse du représentant</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Adresse du représentant" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientRepresentativePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone du représentant</FormLabel>
                            <FormControl>
                              <Input placeholder="01 23 45 67 89" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sub-subprocessor Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Sous-traitants auxquels vous faites appel</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subprocessorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du sous-traitant</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de l'entreprise sous-traitante" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subprocessorEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email du sous-traitant</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@soustraitant.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subprocessorAddress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse du sous-traitant</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Adresse complète du sous-traitant" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subprocessorPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone du sous-traitant</FormLabel>
                            <FormControl>
                              <Input placeholder="01 23 45 67 89" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Processing Categories */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Catégories de traitement</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="processingCategories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégories de traitements effectués *</FormLabel>
                          <FormDescription>
                            Décrivez les opérations effectivement réalisées pour le compte de votre client
                            (ex: collecte des adresses emails, envoi sécurisé des messages, gestion des désabonnements, etc.)
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Détaillez les catégories de traitement que vous effectuez pour ce client..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* International Transfers */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Transferts internationaux</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="hasInternationalTransfers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Transferts vers pays tiers</FormLabel>
                            <FormDescription>
                              Existence de transferts de données à caractère personnel vers un pays tiers ou une organisation internationale
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasInternationalTransfers") && (
                      <FormField
                        control={form.control}
                        name="transferDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Détails des transferts</FormLabel>
                            <FormDescription>
                              Précisez les pays ou organisations concernés et les garanties mises en place
                            </FormDescription>
                            <FormControl>
                              <Textarea 
                                placeholder="Décrivez les transferts internationaux et les garanties..."
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Security Measures */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Mesures de sécurité</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="securityMeasures"
                      render={() => (
                        <FormItem>
                          <FormLabel>Mesures de sécurité techniques et organisationnelles *</FormLabel>
                          <FormDescription>
                            Sélectionnez les mesures de sécurité que vous mettez en œuvre
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SECURITY_MEASURES.map((measure) => (
                              <FormField
                                key={measure}
                                control={form.control}
                                name="securityMeasures"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={measure}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(measure)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, measure])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== measure
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {measure}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Custom security measures input */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ajouter une mesure de sécurité personnalisée..."
                                value={customSecurityMeasure}
                                onChange={(e) => setCustomSecurityMeasure(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (customSecurityMeasure.trim()) {
                                      const currentMeasures = form.getValues('securityMeasures') || [];
                                      if (!currentMeasures.includes(customSecurityMeasure.trim())) {
                                        form.setValue('securityMeasures', [...currentMeasures, customSecurityMeasure.trim()]);
                                      }
                                      setCustomSecurityMeasure("");
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (customSecurityMeasure.trim()) {
                                    const currentMeasures = form.getValues('securityMeasures') || [];
                                    if (!currentMeasures.includes(customSecurityMeasure.trim())) {
                                      form.setValue('securityMeasures', [...currentMeasures, customSecurityMeasure.trim()]);
                                    }
                                    setCustomSecurityMeasure("");
                                  }
                                }}
                                disabled={!customSecurityMeasure.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Display custom added measures */}
                            {form.watch('securityMeasures')?.filter(measure => !SECURITY_MEASURES.includes(measure)).length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Mesures personnalisées ajoutées:</p>
                                <div className="flex flex-wrap gap-1">
                                  {form.watch('securityMeasures')
                                    ?.filter(measure => !SECURITY_MEASURES.includes(measure))
                                    .map((measure, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => {
                                          const currentMeasures = form.getValues('securityMeasures') || [];
                                          form.setValue('securityMeasures', currentMeasures.filter(m => m !== measure));
                                        }}
                                        title="Cliquer pour supprimer"
                                      >
                                        {measure} ×
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingRecord(null);
                        setCustomSecurityMeasure("");
                        form.reset();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingRecord ? "Mettre à jour" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun enregistrement</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore d'enregistrement de sous-traitant.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier enregistrement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {record.clientName}
                    </CardTitle>
                    <CardDescription>
                      Créé le {new Date(record.createdAt).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Client (Responsable de traitement)</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Adresse:</strong> {record.clientAddress}</p>
                      {record.clientPhone && <p><strong>Téléphone:</strong> {record.clientPhone}</p>}
                      {record.clientEmail && <p><strong>Email:</strong> {record.clientEmail}</p>}
                      {record.clientRepresentativeName && (
                        <p><strong>Représentant:</strong> {record.clientRepresentativeName}</p>
                      )}
                    </div>
                  </div>
                  
                  {record.subprocessorName && (
                    <div>
                      <h4 className="font-semibold mb-2">Sous-traitant</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Nom:</strong> {record.subprocessorName}</p>
                        {record.subprocessorAddress && <p><strong>Adresse:</strong> {record.subprocessorAddress}</p>}
                        {record.subprocessorPhone && <p><strong>Téléphone:</strong> {record.subprocessorPhone}</p>}
                        {record.subprocessorEmail && <p><strong>Email:</strong> {record.subprocessorEmail}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Catégories de traitement</h4>
                  <p className="text-sm text-muted-foreground">{record.processingCategories}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Transferts internationaux:</span>
                    <Badge variant={record.hasInternationalTransfers ? "destructive" : "secondary"}>
                      {record.hasInternationalTransfers ? "Oui" : "Non"}
                    </Badge>
                  </div>
                </div>

                {record.securityMeasures && record.securityMeasures.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Mesures de sécurité</h4>
                    <div className="flex flex-wrap gap-1">
                      {record.securityMeasures.map((measure, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {measure}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}