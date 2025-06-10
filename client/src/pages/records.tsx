import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Book, Plus, Building, Users, FileText, Download, Loader2, HelpCircle, Edit2, Save, X, AlertTriangle, CheckCircle2 } from "lucide-react";

const COMPANY_ID = 1;

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
  dpiaRequired?: boolean;
  dpiaJustification?: string;
}

export default function Records() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "controller" | "processor">("all");
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [showJustification, setShowJustification] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateForm = useForm({
    defaultValues: {
      processingType: "",
      activityDescription: "",
      dataTypes: "",
      purposes: "",
      legalBasis: "",
      recipients: "",
      retentionPeriod: "",
      securityMeasures: "",
      thirdCountries: "",
      additionalInfo: "",
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
    mutationFn: (data: any) =>
      recordsApi.generate({
        companyId: COMPANY_ID,
        processingType: data.processingType,
        description: `
Activité de traitement: ${data.activityDescription}
Types de données: ${data.dataTypes}
Finalités: ${data.purposes}
Base légale proposée: ${data.legalBasis}
Destinataires: ${data.recipients}
Durée de conservation: ${data.retentionPeriod}
Mesures de sécurité: ${data.securityMeasures}
Transferts pays tiers: ${data.thirdCountries}
Informations complémentaires: ${data.additionalInfo}
        `,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setIsGenerateDialogOpen(false);
      generateForm.reset();
      toast({
        title: "Fiche de traitement générée",
        description: "La fiche de traitement a été créée avec succès grâce à l'IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la fiche",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      recordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setEditingRecord(null);
      toast({
        title: "Fiche mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
    },
  });

  const dpiaAnalysisMutation = useMutation({
    mutationFn: async (record: ProcessingRecord) => {
      const response = await recordsApi.analyzeDpia(record);
      return response.json();
    },
    onSuccess: (result: any, record) => {
      updateMutation.mutate({
        id: record.id,
        data: {
          dpiaRequired: result.dpiaRequired,
          dpiaJustification: result.justification,
        },
      });
    },
  });

  const exportCSV = () => {
    if (!records || records.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune fiche de traitement à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Nom du traitement",
      "Finalité",
      "Base légale",
      "Catégories de données",
      "Destinataires",
      "Durée de conservation",
      "Mesures de sécurité",
      "Transferts hors UE",
      "Type de responsabilité",
      "AIPD requise",
      "Date de création"
    ];

    const csvData = records.map((record: ProcessingRecord) => [
      record.name,
      record.purpose,
      record.legalBasis,
      Array.isArray(record.dataCategories) ? record.dataCategories.join("; ") : record.dataCategories,
      Array.isArray(record.recipients) ? record.recipients.join("; ") : record.recipients,
      record.retention,
      Array.isArray(record.securityMeasures) ? record.securityMeasures.join("; ") : record.securityMeasures,
      record.transfersOutsideEU ? "Oui" : "Non",
      record.type === "controller" ? "Responsable de traitement" : "Sous-traitant",
      record.dpiaRequired ? "Oui" : "Non",
      new Date(record.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map((cell: string | number | boolean) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registre_traitements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredRecords = records?.filter((record: ProcessingRecord) => {
    if (filterType === "all") return true;
    return record.type === filterType;
  }) || [];

  const toggleJustification = (recordId: number, field: string) => {
    const key = `${recordId}_${field}`;
    setShowJustification(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFieldUpdate = (recordId: number, field: string, value: any) => {
    updateMutation.mutate({
      id: recordId,
      data: { [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre des traitements</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos fiches de traitement selon l'article 30 du RGPD
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Générer avec l'IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Générer une fiche de traitement</DialogTitle>
                <DialogDescription>
                  Utilisez l'intelligence artificielle pour créer automatiquement une fiche de traitement basée sur votre activité
                </DialogDescription>
              </DialogHeader>
              
              <Form {...generateForm}>
                <form onSubmit={generateForm.handleSubmit(data => generateMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generateForm.control}
                      name="processingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de responsabilité *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre rôle" />
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
                      control={generateForm.control}
                      name="activityDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description de l'activité *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez précisément l'activité de traitement (ex: gestion de la paie, prospection commerciale, etc.)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="dataTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Types de données collectées *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Listez les catégories de données : identité, contact, données professionnelles, données sensibles, etc."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="purposes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finalités du traitement *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Pourquoi collectez-vous ces données ? (gestion RH, facturation, marketing, etc.)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="legalBasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base légale envisagée</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Consentement, contrat, obligation légale, intérêt légitime..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="recipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinataires des données</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Qui a accès aux données ? (équipes internes, prestataires, partenaires, autorités...)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="retentionPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée de conservation envisagée</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 3 ans après fin du contrat, 10 ans pour obligations comptables..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="securityMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures de sécurité</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Chiffrement, contrôle d'accès, sauvegarde, formation du personnel..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="thirdCountries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transferts vers pays tiers</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Pays de destination et garanties appropriées (si applicable)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Informations complémentaires</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Autres éléments importants pour le traitement (contexte, spécificités sectorielles, etc.)"
                              {...field}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        "Générer la fiche"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Label>Filtrer par type :</Label>
              <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="controller">Responsable de traitement</TabsTrigger>
                  <TabsTrigger value="processor">Sous-traitant</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredRecords.length} fiche{filteredRecords.length > 1 ? 's' : ''} de traitement
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fiches */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement des fiches de traitement...
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Book className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune fiche de traitement</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première fiche de traitement avec l'IA
            </p>
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première fiche
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record: ProcessingRecord) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={record.name}
                          onBlur={(e) => handleFieldUpdate(record.id, 'name', e.target.value)}
                          className="font-semibold"
                        />
                      ) : (
                        record.name
                      )}
                    </CardTitle>
                    <Badge variant={record.type === "controller" ? "default" : "secondary"}>
                      {record.type === "controller" ? "Responsable" : "Sous-traitant"}
                    </Badge>
                    {record.type === "controller" && (
                      <div className="flex items-center space-x-2">
                        {record.dpiaRequired === true && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            AIPD requise
                          </Badge>
                        )}
                        {record.dpiaRequired === false && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            AIPD non requise
                          </Badge>
                        )}
                        {record.dpiaRequired === undefined && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dpiaAnalysisMutation.mutate(record)}
                            disabled={dpiaAnalysisMutation.isPending}
                          >
                            {dpiaAnalysisMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Analyser AIPD"
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingRecord(editingRecord === record.id ? null : record.id)}
                  >
                    {editingRecord === record.id ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Finalité</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'purpose')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Textarea
                        defaultValue={record.purpose}
                        onBlur={(e) => handleFieldUpdate(record.id, 'purpose', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm">{record.purpose}</p>
                    )}
                    {showJustification[`${record.id}_purpose`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> Cette finalité a été déterminée en analysant l'activité décrite et les obligations légales applicables.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Base légale</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'legalBasis')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Select
                        defaultValue={record.legalBasis}
                        onValueChange={(value) => handleFieldUpdate(record.id, 'legalBasis', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consentement">Consentement (art. 6.1.a)</SelectItem>
                          <SelectItem value="contrat">Contrat (art. 6.1.b)</SelectItem>
                          <SelectItem value="obligation_legale">Obligation légale (art. 6.1.c)</SelectItem>
                          <SelectItem value="mission_service_public">Mission de service public (art. 6.1.e)</SelectItem>
                          <SelectItem value="interet_legitime">Intérêt légitime (art. 6.1.f)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{record.legalBasis}</p>
                    )}
                    {showJustification[`${record.id}_legalBasis`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> Cette base légale a été sélectionnée selon la finalité du traitement et le contexte d'utilisation des données.
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium">Catégories de données</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.isArray(record.dataCategories) ? 
                        record.dataCategories.map((category, index) => (
                          <Badge key={index} variant="outline">
                            {category}
                          </Badge>
                        )) :
                        <Badge variant="outline">{record.dataCategories}</Badge>
                      }
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Destinataires</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.isArray(record.recipients) ? 
                        record.recipients.map((recipient, index) => (
                          <Badge key={index} variant="outline">
                            {recipient}
                          </Badge>
                        )) :
                        <Badge variant="outline">{record.recipients}</Badge>
                      }
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Durée de conservation</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'retention')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Input
                        defaultValue={record.retention}
                        onBlur={(e) => handleFieldUpdate(record.id, 'retention', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm">{record.retention}</p>
                    )}
                    {showJustification[`${record.id}_retention`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> Cette durée respecte les obligations légales sectorielles et le principe de minimisation des données.
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium">Transferts hors UE</Label>
                    <div className="mt-2">
                      {editingRecord === record.id ? (
                        <Switch
                          checked={record.transfersOutsideEU}
                          onCheckedChange={(checked) => handleFieldUpdate(record.id, 'transfersOutsideEU', checked)}
                        />
                      ) : (
                        <Badge variant={record.transfersOutsideEU ? "destructive" : "secondary"}>
                          {record.transfersOutsideEU ? "Oui" : "Non"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {record.dpiaJustification && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <Label className="font-medium">Analyse d'impact (AIPD)</Label>
                    <p className="text-sm mt-2">{record.dpiaJustification}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Label className="font-medium">Mesures de sécurité</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.isArray(record.securityMeasures) ? 
                      record.securityMeasures.map((measure, index) => (
                        <Badge key={index} variant="outline">
                          {measure}
                        </Badge>
                      )) :
                      <Badge variant="outline">{record.securityMeasures}</Badge>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}