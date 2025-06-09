import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Book, Plus, Building, Users, FileText, Download, Loader2 } from "lucide-react";

const COMPANY_ID = 1; // Mock company ID

interface ProcessingRecord {
  id: number;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  recipients: string[];
  retention: string;
  securityMeasures: string[];
  transfersOutsideEU: boolean;
  type: string;
  createdAt: string;
}

export default function Records() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      processingType: "",
      description: "",
    },
  });

  const manualForm = useForm({
    defaultValues: {
      name: "",
      purpose: "",
      legalBasis: "",
      dataCategories: "",
      recipients: "",
      retention: "",
      securityMeasures: "",
      type: "controller",
      transfersOutsideEU: false,
    },
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['/api/records', COMPANY_ID],
    queryFn: () => recordsApi.get(COMPANY_ID).then(res => res.json()),
  });

  const generateMutation = useMutation({
    mutationFn: (data: { processingType: string; description: string }) =>
      recordsApi.generate({
        companyId: COMPANY_ID,
        processingType: data.processingType,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setIsGenerateDialogOpen(false);
      form.reset();
      toast({
        title: "Registre généré !",
        description: "Le registre de traitement a été créé avec succès grâce à l'IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le registre",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const formattedData = {
        ...data,
        companyId: COMPANY_ID,
        dataCategories: data.dataCategories.split(',').map((s: string) => s.trim()).filter(Boolean),
        recipients: data.recipients.split(',').map((s: string) => s.trim()).filter(Boolean),
        securityMeasures: data.securityMeasures.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      return recordsApi.create(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setIsCreateDialogOpen(false);
      manualForm.reset();
      toast({
        title: "Registre créé !",
        description: "Le registre de traitement a été créé manuellement.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le registre",
        variant: "destructive",
      });
    },
  });

  const onGenerateSubmit = (data: { processingType: string; description: string }) => {
    generateMutation.mutate(data);
  };

  const onManualSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement des registres...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registre des traitements</h2>
          <p className="text-muted-foreground">
            Documentez vos activités de traitement conformément au RGPD
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Générer avec IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Générer un registre avec l'IA</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onGenerateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="processingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de traitement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="controller">Responsable de traitement</SelectItem>
                            <SelectItem value="processor">Sous-traitant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description du traitement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez brièvement l'activité de traitement..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        "Générer"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Créer manuellement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un registre manuellement</DialogTitle>
              </DialogHeader>
              <Form {...manualForm}>
                <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={manualForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du traitement</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gestion des clients" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="controller">Responsable de traitement</SelectItem>
                              <SelectItem value="processor">Sous-traitant</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={manualForm.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finalité du traitement</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Décrivez la finalité..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={manualForm.control}
                    name="legalBasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base légale</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Consentement, intérêt légitime..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={manualForm.control}
                    name="dataCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégories de données (séparées par des virgules)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: nom, email, téléphone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={manualForm.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destinataires (séparés par des virgules)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: service commercial, prestataires" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={manualForm.control}
                      name="retention"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée de conservation</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 3 ans" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="securityMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures de sécurité (séparées par des virgules)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: chiffrement, accès restreint" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Records List */}
      {!records || records.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Book className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Aucun registre de traitement</h3>
              <p className="text-muted-foreground">
                Commencez par créer votre premier registre de traitement des données.
              </p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Générer avec IA
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                  Créer manuellement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {records.map((record: ProcessingRecord) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{record.name}</span>
                      <Badge variant={record.type === 'controller' ? 'default' : 'secondary'}>
                        {record.type === 'controller' ? (
                          <>
                            <Building className="w-3 h-3 mr-1" />
                            Responsable
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 mr-1" />
                            Sous-traitant
                          </>
                        )}
                      </Badge>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">{record.purpose}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Base légale</Label>
                      <p className="text-sm text-muted-foreground mt-1">{record.legalBasis}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Catégories de données</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.dataCategories?.map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Durée de conservation</Label>
                      <p className="text-sm text-muted-foreground mt-1">{record.retention}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Destinataires</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.recipients?.map((recipient, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {recipient}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Mesures de sécurité</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.securityMeasures?.map((measure, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {measure}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Transferts hors UE</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.transfersOutsideEU ? "Oui" : "Non"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Créé le {new Date(record.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>Conforme au modèle CNIL</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
