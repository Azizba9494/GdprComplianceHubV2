import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Brain, Save, FileText, Shield, AlertTriangle, CheckCircle, Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Import constants directly in the file since the shared import is causing issues
const SECURITY_CATEGORIES = [
  "Authentification",
  "Chiffrement", 
  "Contrôle d'accès",
  "Sécurité réseau",
  "Surveillance",
  "Sauvegarde",
  "Organisationnel",
  "Sécurité physique",
  "Maintenance"
];

const CNIL_SECURITY_MEASURES = [
  {
    id: "auth_001",
    name: "Authentification par mot de passe",
    category: "Authentification",
    description: "Mise en place de mots de passe robustes avec politique de complexité",
  },
  {
    id: "auth_002",
    name: "Authentification à deux facteurs (2FA)",
    category: "Authentification",
    description: "Authentification renforcée par un second facteur",
  },
  {
    id: "crypto_001",
    name: "Chiffrement des données en transit",
    category: "Chiffrement",
    description: "Protection des données lors de leur transmission",
  },
  {
    id: "crypto_002",
    name: "Chiffrement des données au repos",
    category: "Chiffrement",
    description: "Protection des données stockées",
  },
  {
    id: "access_001",
    name: "Gestion des habilitations",
    category: "Contrôle d'accès",
    description: "Attribution et révision des droits d'accès",
  },
  {
    id: "network_001",
    name: "Pare-feu (Firewall)",
    category: "Sécurité réseau",
    description: "Filtrage du trafic réseau entrant et sortant",
  },
  {
    id: "monitor_001",
    name: "Surveillance continue",
    category: "Surveillance",
    description: "Monitoring 24/7 des systèmes et réseaux",
  },
  {
    id: "backup_001",
    name: "Sauvegarde régulière",
    category: "Sauvegarde",
    description: "Copies de sécurité automatisées et testées",
  },
  {
    id: "org_001",
    name: "Formation du personnel",
    category: "Organisationnel",
    description: "Sensibilisation à la sécurité et protection des données",
  },
  {
    id: "physical_001",
    name: "Contrôle d'accès physique",
    category: "Sécurité physique",
    description: "Protection des locaux et équipements",
  },
  {
    id: "update_001",
    name: "Gestion des correctifs",
    category: "Maintenance",
    description: "Application régulière des mises à jour de sécurité",
  }
];

// Enhanced schema with new sections
const dpiaFormSchema = z.object({
  companyId: z.number(),
  processingRecordId: z.number(),
  
  // Part 1: Context Description - Enhanced
  generalDescription: z.string().optional(),
  processingPurposes: z.string().optional(),
  dataController: z.string().optional(), // Responsable du traitement
  dataProcessors: z.string().optional(), // Sous-traitants
  applicableReferentials: z.string().optional(), // 1.1.5 - New field
  personalDataProcessed: z.string().optional(), // 1.2.1 - Enhanced field
  personalDataCategories: z.array(z.object({
    category: z.string(),
    examples: z.string(),
    recipients: z.string(),
    retentionPeriod: z.string(),
  })).optional(), // Processus, supports, destinataires et durées
  
  // Part 2.1: Proportionality and necessity measures - New sections
  finalitiesJustification: z.string().optional(), // 2.1.3
  dataMinimization: z.string().optional(), // Minimisation des données
  retentionJustification: z.string().optional(), // Durées de conservation
  legalBasisType: z.enum(["consent", "contract", "legal_obligation", "public_task", "vital_interests", "legitimate_interests"]).optional(),
  legalBasisJustification: z.string().optional(), // 2.1.4
  dataQualityJustification: z.string().optional(), // 2.1.5
  proportionalityEvaluation: z.object({
    finalities: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    legalBasis: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    dataMinimization: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    dataQuality: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    retentionPeriods: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() })
  }).optional(), // 2.1.6
  
  // Part 2.2: Rights protection measures - Enhanced sections
  rightsInformation: z.string().optional(), // Mesures pour l'information des personnes
  rightsConsent: z.string().optional(), // Mesures pour le recueil du consentement
  rightsAccess: z.string().optional(), // Mesures pour les droits d'accès et à la portabilité
  rightsRectification: z.string().optional(), // Mesures pour les droits de rectification et d'effacement
  rightsOpposition: z.string().optional(), // Mesures pour les droits de limitation et d'opposition
  subcontractingMeasures: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    scope: z.string(),
    contractReference: z.string(),
    gdprCompliance: z.string()
  })).optional(), // 2.2.6 - New
  internationalTransfersMeasures: z.array(z.object({
    dataType: z.string(),
    france: z.boolean(),
    eu: z.boolean(),
    adequateCountry: z.boolean(),
    otherCountry: z.boolean(),
    justification: z.string()
  })).optional(), // 2.2.7 - New
  rightsProtectionEvaluation: z.object({
    information: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    consent: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    accessPortability: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    rectificationErasure: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    limitationOpposition: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    subcontracting: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    internationalTransfers: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() })
  }).optional(), // 2.2.8 - New
  
  // Part 3: Security measures - Enhanced with CNIL measures
  securityMeasures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    implemented: z.boolean()
  })).optional(),
  
  // Status
  status: z.enum(["draft", "inprogress", "completed", "validated"]).default("draft")
});

type DpiaFormData = z.infer<typeof dpiaFormSchema>;

export default function DpiaAssessmentEnhanced() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get user company
  const userId = parseInt(localStorage.getItem("userId") || "1");
  const { data: company } = useQuery({
    queryKey: [`/api/companies/${userId}`],
  }) as { data: any };

  // Get DPIA data
  const { data: dpia, isLoading } = useQuery({
    queryKey: [`/api/dpia/assessment/${id}`],
    enabled: !!id && id !== "new",
  }) as { data: any, isLoading: boolean };

  // Get processing record for AI assistance
  const { data: processingRecord } = useQuery({
    queryKey: [`/api/records/${company?.id}`],
    enabled: !!company?.id && !!dpia?.processingRecordId,
    select: (records: any[]) => records.find(r => r.id === dpia?.processingRecordId)
  }) as { data: any };

  const form = useForm<DpiaFormData>({
    resolver: zodResolver(dpiaFormSchema),
    defaultValues: {
      companyId: company?.id || 1,
      processingRecordId: dpia?.processingRecordId || 0,
      status: "draft",
      securityMeasures: [],
      subcontractingMeasures: [],
      internationalTransfersMeasures: []
    }
  });

  // Load form data when DPIA is fetched
  useEffect(() => {
    if (dpia) {
      form.reset({
        ...dpia,
        companyId: dpia.companyId || company?.id,
        securityMeasures: dpia.securityMeasures || [],
        subcontractingMeasures: dpia.subcontractingMeasures || [],
        internationalTransfersMeasures: dpia.internationalTransfersMeasures || [],
        proportionalityEvaluation: dpia.proportionalityEvaluation || {
          finalities: { status: "acceptable", measures: "" },
          legalBasis: { status: "acceptable", measures: "" },
          dataMinimization: { status: "acceptable", measures: "" },
          dataQuality: { status: "acceptable", measures: "" },
          retentionPeriods: { status: "acceptable", measures: "" }
        },
        rightsProtectionEvaluation: dpia.rightsProtectionEvaluation || {
          information: { status: "acceptable", measures: "" },
          consent: { status: "acceptable", measures: "" },
          accessPortability: { status: "acceptable", measures: "" },
          rectificationErasure: { status: "acceptable", measures: "" },
          limitationOpposition: { status: "acceptable", measures: "" },
          subcontracting: { status: "acceptable", measures: "" },
          internationalTransfers: { status: "acceptable", measures: "" }
        }
      });
    }
  }, [dpia, company, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DpiaFormData) => {
      const url = id && id !== "new" ? `/api/dpia/assessment/${id}` : `/api/dpia`;
      const method = id && id !== "new" ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }
      
      return response.json();
    },
    onSuccess: (savedDpia) => {
      toast({
        title: "AIPD sauvegardée",
        description: "Vos modifications ont été enregistrées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dpia/assessment/${savedDpia.id}`] });
      if (id === "new") {
        setLocation(`/dpia/${savedDpia.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'AIPD",
        variant: "destructive",
      });
    },
  });

  // AI generation mutation
  const generateWithAI = useMutation({
    mutationFn: async ({ field, context }: { field: string, context?: any }) => {
      setIsGenerating(true);
      const response = await fetch("/api/ai/generate-dpia-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          context: {
            processingRecord,
            existingData: form.getValues(),
            ...context
          }
        })
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la génération AI");
      }
      
      return response.json();
    },
    onSuccess: (result, variables) => {
      form.setValue(variables.field as any, result.content);
      toast({
        title: "Contenu généré",
        description: "Le contenu a été généré avec succès par l'IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le contenu",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  const onSubmit = (data: DpiaFormData) => {
    saveMutation.mutate(data);
  };

  const addSecurityMeasure = (measure: any) => {
    const currentMeasures = form.getValues("securityMeasures") || [];
    const newMeasure = {
      ...measure,
      implemented: false
    };
    form.setValue("securityMeasures", [...currentMeasures, newMeasure]);
  };

  const removeSecurityMeasure = (index: number) => {
    const currentMeasures = form.getValues("securityMeasures") || [];
    form.setValue("securityMeasures", currentMeasures.filter((_, i) => i !== index));
  };

  const addSubcontractor = () => {
    const current = form.getValues("subcontractingMeasures") || [];
    form.setValue("subcontractingMeasures", [...current, {
      name: "",
      purpose: "",
      scope: "",
      contractReference: "",
      gdprCompliance: ""
    }]);
  };

  const removeSubcontractor = (index: number) => {
    const current = form.getValues("subcontractingMeasures") || [];
    form.setValue("subcontractingMeasures", current.filter((_, i) => i !== index));
  };

  const addTransfer = () => {
    const current = form.getValues("internationalTransfersMeasures") || [];
    form.setValue("internationalTransfersMeasures", [...current, {
      dataType: "",
      france: false,
      eu: false,
      adequateCountry: false,
      otherCountry: false,
      justification: ""
    }]);
  };

  const removeTransfer = (index: number) => {
    const current = form.getValues("internationalTransfersMeasures") || [];
    form.setValue("internationalTransfersMeasures", current.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'AIPD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dpia')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dpia?.title || "Nouvelle AIPD"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse d'Impact relative à la Protection des Données
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={dpia?.status === "completed" ? "default" : "secondary"}>
            {dpia?.status || "draft"}
          </Badge>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="proportionality">Proportionnalité</TabsTrigger>
              <TabsTrigger value="rights">Droits</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            {/* Tab 1: Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description générale du traitement</CardTitle>
                  <CardDescription>
                    Décrivez de manière claire et précise le traitement de données personnelles concerné par cette AIPD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="generalDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description générale</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez le contexte, les objectifs et le fonctionnement général du traitement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "generalDescription" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            {isGenerating ? "Génération..." : "Générer avec l'IA"}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processingPurposes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finalités du traitement</FormLabel>
                        <FormDescription>
                          Listez les objectifs précis et légitimes poursuivis par ce traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Gestion de la relation client, suivi des commandes, support technique..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "processingPurposes" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer avec l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 1.1.5 - New field: Applicable referentials */}
                  <FormField
                    control={form.control}
                    name="dataController"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable du traitement</FormLabel>
                        <FormDescription>
                          Identifiez l'organisme qui détermine les finalités et les moyens du traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Nom de l'entreprise, adresse, représentant légal..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "dataController" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer avec l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataProcessors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sous-traitants</FormLabel>
                        <FormDescription>
                          Listez les organismes qui traitent des données personnelles pour le compte du responsable de traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Prestataires informatiques, hébergeurs, services de maintenance..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "dataProcessors" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer avec l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicableReferentials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référentiels applicables</FormLabel>
                        <FormDescription>
                          Recensez les référentiels applicables au traitement, utiles ou à respecter et certifications en matière de protection des données (art. 42 du RGPD), notamment les codes de conduite approuvés (art. 40 du RGPD).
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: ISO 27001, certification HDS, code de conduite sectoriel, référentiel CNIL..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "applicableReferentials" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 1.2 Personal data processed - Enhanced */}
              <Card>
                <CardHeader>
                  <CardTitle>Données personnelles traitées</CardTitle>
                  <CardDescription>
                    Identifiez précisément les catégories de données personnelles concernées par le traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 1.2.2 Personal data categories, processes, supports, recipients and retention */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Processus, supports, destinataires et durées de conservation</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const current = form.getValues("personalDataCategories") || [];
                          form.setValue("personalDataCategories", [...current, {
                            category: "",
                            examples: "",
                            recipients: "",
                            retentionPeriod: ""
                          }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une catégorie
                      </Button>
                    </div>

                    {form.watch("personalDataCategories")?.map((_, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Catégorie {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = form.getValues("personalDataCategories") || [];
                              form.setValue("personalDataCategories", current.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`personalDataCategories.${index}.category`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Catégorie de données</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Données d'identification" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`personalDataCategories.${index}.examples`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exemples et processus</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Ex: Nom, prénom, email - collecte via formulaire web, traitement automatisé, stockage base de données"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`personalDataCategories.${index}.recipients`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Destinataires</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Service commercial, partenaires" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`personalDataCategories.${index}.retentionPeriod`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durée de conservation</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: 3 ans après fin de relation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateWithAI.mutate({ field: "personalDataCategories" })}
                        disabled={isGenerating}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Générer avec l'IA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Proportionality and necessity measures */}
            <TabsContent value="proportionality" className="space-y-6">
              {/* 2.1.3 - Finalities justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification des finalités</CardTitle>
                  <CardDescription>
                    Vous avez déjà listé vos objectifs (finalités) dans la partie 1. Il s'agit maintenant de justifier en quoi ils sont légitimes, c'est-à-dire conformes à la loi et clairement définis. Une finalité ne doit pas être vague ou "fourre-tout".
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Vos objectifs sont-ils précis et compréhensibles ?</li>
                        <li>Sont-ils en accord avec l'activité légale de votre organisme ?</li>
                        <li>Chaque finalité est-elle nécessaire et proportionnée ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="finalitiesJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification des finalités</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez pourquoi chaque finalité est légitime, nécessaire et proportionnée à votre activité..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "finalitiesJustification" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.3.1 - Data minimization justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification de la minimisation des données</CardTitle>
                  <CardDescription>
                    Les données collectées doivent être adéquates, pertinentes et limitées à ce qui est nécessaire au regard des finalités pour lesquelles elles sont traitées.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous vérifié que toutes les données collectées sont strictement nécessaires ?</li>
                        <li>Pouvez-vous atteindre vos objectifs avec moins de données ?</li>
                        <li>Avez-vous mis en place des processus pour éviter la collecte excessive ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="dataMinimization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification de la minimisation des données</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez comment vous limitez la collecte aux données strictement nécessaires et les mesures mises en place..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "dataMinimization" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.3.2 - Retention periods justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification des durées de conservation</CardTitle>
                  <CardDescription>
                    Les données ne doivent pas être conservées plus longtemps que nécessaire pour atteindre les finalités du traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous défini des durées de conservation précises pour chaque catégorie de données ?</li>
                        <li>Ces durées sont-elles justifiées par vos besoins métier ou des obligations légales ?</li>
                        <li>Avez-vous mis en place un processus de suppression automatique ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="retentionJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification des durées de conservation</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Justifiez les durées de conservation définies pour chaque catégorie de données et les processus de suppression..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "retentionJustification" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.4 - Legal basis justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification du fondement (Base légale)</CardTitle>
                  <CardDescription>
                    Tout traitement de données personnelles doit reposer sur une des six bases légales prévues par le RGPD. Vous devez choisir celle qui correspond à votre situation et justifier ce choix. Il n'est généralement pas possible de changer de base légale en cours de traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="legalBasisType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base légale du traitement</FormLabel>
                        <FormDescription>
                          Cochez la base légale de votre traitement et expliquez pourquoi :
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="consent" id="consent" className="mt-1" />
                              <div>
                                <Label htmlFor="consent" className="font-medium">Le consentement</Label>
                                <p className="text-sm text-gray-600">La personne a-t-elle donné son accord explicite, libre et éclairé ? (ex: inscription à une newsletter)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="contract" id="contract" className="mt-1" />
                              <div>
                                <Label htmlFor="contract" className="font-medium">Le contrat</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il indispensable à l'exécution d'un contrat avec la personne ? (ex: traitement d'une adresse pour livrer un colis)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="legal_obligation" id="legal_obligation" className="mt-1" />
                              <div>
                                <Label htmlFor="legal_obligation" className="font-medium">L'obligation légale</Label>
                                <p className="text-sm text-gray-600">Une loi vous oblige-t-elle à traiter ces données ? (ex: déclarations sociales pour les salariés)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="public_task" id="public_task" className="mt-1" />
                              <div>
                                <Label htmlFor="public_task" className="font-medium">La mission d'intérêt public</Label>
                                <p className="text-sm text-gray-600">Êtes-vous un organisme public qui traite des données dans le cadre de ses missions ?</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="vital_interests" id="vital_interests" className="mt-1" />
                              <div>
                                <Label htmlFor="vital_interests" className="font-medium">La sauvegarde des intérêts vitaux</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il nécessaire pour protéger la vie d'une personne ? (cas très rare)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="legitimate_interests" id="legitimate_interests" className="mt-1" />
                              <div>
                                <Label htmlFor="legitimate_interests" className="font-medium">L'intérêt légitime</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il nécessaire à la poursuite des intérêts de votre organisme, sans porter une atteinte excessive aux droits et libertés des personnes ? (ex: lutte contre la fraude)</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalBasisJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification de la base légale choisie</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez en détail pourquoi cette base légale est appropriée pour votre traitement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "legalBasisJustification" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.5 - Data quality justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification de la qualité des données</CardTitle>
                  <CardDescription>
                    Les données que vous traitez doivent être "exactes et, si nécessaire, tenues à jour". Des décisions basées sur des données erronées peuvent avoir des conséquences négatives pour les personnes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous mis en place des processus pour vérifier l'exactitude des données lors de leur collecte ?</li>
                        <li>Comment les personnes peuvent-elles corriger leurs données si elles sont inexactes ? (voir aussi la section sur les droits)</li>
                        <li>Comment mettez-vous à jour les informations qui peuvent devenir obsolètes ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="dataQualityJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures de qualité des données</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez vos processus de vérification, mise à jour et correction des données personnelles..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "dataQualityJustification" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Rights protection measures */}
            <TabsContent value="rights" className="space-y-6">
              {/* 2.2.1 - Information measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour l'information des personnes</CardTitle>
                  <CardDescription>
                    Les personnes concernées doivent être informées de manière claire et transparente du traitement de leurs données personnelles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures d'information</FormLabel>
                        <FormDescription>
                          Décrivez comment vous informez les personnes concernées : mentions légales, politique de confidentialité, notices d'information, etc.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Politique de confidentialité accessible sur le site, mentions dans les formulaires de collecte, information lors de la création de compte..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "rightsInformation" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.2 - Consent measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour le recueil du consentement</CardTitle>
                  <CardDescription>
                    Si votre base légale est le consentement, décrivez comment vous le recueillez de manière libre, spécifique, éclairée et univoque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsConsent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour le consentement</FormLabel>
                        <FormDescription>
                          Détaillez vos mécanismes de recueil et de gestion du consentement (cases à cocher, double opt-in, etc.).
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Cases à cocher non pré-cochées, double opt-in pour la newsletter, possibilité de retrait facile du consentement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "rightsConsent" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.3 - Access and portability rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits d'accès et à la portabilité</CardTitle>
                  <CardDescription>
                    Les personnes ont le droit d'accéder à leurs données et de les récupérer dans un format structuré et couramment utilisé.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsAccess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour l'accès et la portabilité</FormLabel>
                        <FormDescription>
                          Décrivez comment les personnes peuvent exercer leurs droits d'accès et de portabilité des données.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Formulaire en ligne dédié, adresse email de contact DPO, export des données en format JSON/CSV, délai de réponse 1 mois..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "rightsAccess" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.4 - Rectification and erasure rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits de rectification et d'effacement</CardTitle>
                  <CardDescription>
                    Les personnes peuvent demander la rectification de leurs données inexactes ou leur effacement dans certaines conditions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsRectification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour la rectification et l'effacement</FormLabel>
                        <FormDescription>
                          Expliquez vos procédures pour traiter les demandes de rectification et d'effacement des données.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Interface utilisateur pour modifier les données, procédure de vérification d'identité, suppression définitive après demande, information des sous-traitants..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "rightsRectification" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.5 - Limitation and opposition rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits de limitation du traitement et d'opposition</CardTitle>
                  <CardDescription>
                    Les personnes peuvent demander la limitation du traitement de leurs données ou s'opposer au traitement dans certaines situations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsOpposition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour la limitation et l'opposition</FormLabel>
                        <FormDescription>
                          Décrivez comment vous gérez les demandes de limitation du traitement et d'opposition.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Marquage des données limitées, arrêt du traitement marketing, procédure d'opposition pour prospection, gestion des listes d'opposition..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateWithAI.mutate({ field: "rightsOpposition" })}
                            disabled={isGenerating}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Générer une proposition par l'IA
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* 2.2.6 - Subcontracting measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour la sous-traitance</CardTitle>
                  <CardDescription>
                    Lorsque vous faites appel à un prestataire (sous-traitant) qui traite des données pour vous, vous devez signer un contrat spécifique et détaillé. Ce contrat doit garantir que le sous-traitant présente des garanties suffisantes en matière de protection des données et qu'il ne traitera les données que sur vos instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous listé tous vos sous-traitants pour ce traitement ?</li>
                        <li>Pour chacun d'entre eux, disposez-vous d'un contrat écrit qui respecte les exigences de l'article 28 du RGPD ?</li>
                        <li>Ce contrat précise-t-il bien la nature, la finalité, la durée du traitement, ainsi que les obligations du sous-traitant en matière de sécurité, de confidentialité et d'aide à l'exercice des droits ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Sous-traitants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubcontractor}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un sous-traitant
                      </Button>
                    </div>

                    {form.watch("subcontractingMeasures")?.map((_, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Sous-traitant {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubcontractor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du sous-traitant</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Google Cloud Platform" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.purpose`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Finalité de la sous-traitance</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Hébergement des données" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.scope`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Périmètre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Données clients européennes" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.contractReference`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Référence du contrat</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: DPA-2024-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`subcontractingMeasures.${index}.gdprCompliance`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Conformité (Art. 28 RGPD)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Décrivez comment le contrat respecte les exigences de l'article 28 du RGPD..."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateWithAI.mutate({ field: "subcontractingMeasures" })}
                        disabled={isGenerating}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Générer une proposition par l'IA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2.2.7 - International transfers measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour le transfert de données hors de l'Union européenne</CardTitle>
                  <CardDescription>
                    Le transfert de données personnelles hors de l'UE est interdit par principe, sauf si le pays de destination offre un niveau de protection adéquat ou si des garanties spécifiques sont mises en place (ex: Clauses Contractuelles Types, BCR). Cela s'applique aussi si les données sont simplement accessibles depuis un pays tiers (ex: pour de la maintenance informatique).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Les données sont-elles stockées ou accessibles en dehors de l'Union européenne (y compris par un de vos sous-traitants) ?</li>
                        <li>Si oui, dans quel(s) pays ?</li>
                        <li>Quel outil juridique utilisez-vous pour encadrer ce transfert ? (ex: décision d'adéquation de la Commission européenne, signature de Clauses Contractuelles Types, etc.)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Transferts internationaux</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTransfer}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un transfert
                      </Button>
                    </div>

                    {form.watch("internationalTransfersMeasures")?.map((_, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Transfert {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransfer(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`internationalTransfersMeasures.${index}.dataType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de données</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Données clients, logs de connexion" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`internationalTransfersMeasures.${index}.france`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>France</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`internationalTransfersMeasures.${index}.eu`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>UE</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`internationalTransfersMeasures.${index}.adequateCountry`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Pays reconnu adéquat par l'UE</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`internationalTransfersMeasures.${index}.otherCountry`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Autre pays</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`internationalTransfersMeasures.${index}.justification`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Justification et encadrement juridique</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Décrivez l'outil juridique utilisé pour encadrer ce transfert (CCT, BCR, décision d'adéquation, etc.)..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateWithAI.mutate({ field: "internationalTransfersMeasures" })}
                        disabled={isGenerating}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Générer une proposition par l'IA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Security measures - Enhanced */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mesures de sécurité</CardTitle>
                  <CardDescription>
                    Sélectionnez et décrivez les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Security measures selection */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Mesures de sécurité disponibles
                      </Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Cliquez sur les mesures que vous souhaitez ajouter à votre AIPD. Vous pourrez ensuite les décrire en détail.
                      </p>
                      
                      {SECURITY_CATEGORIES.map(category => (
                        <div key={category} className="mb-6">
                          <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {CNIL_SECURITY_MEASURES
                              .filter(measure => measure.category === category)
                              .map(measure => (
                                <Button
                                  key={measure.id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSecurityMeasure(measure)}
                                  className="justify-start h-auto p-3 text-left"
                                  disabled={form.watch("securityMeasures")?.some(m => m.id === measure.id)}
                                >
                                  <div>
                                    <div className="font-medium text-sm">{measure.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {measure.description}
                                    </div>
                                  </div>
                                </Button>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Selected security measures */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Mesures sélectionnées ({form.watch("securityMeasures")?.length || 0})
                      </Label>
                      
                      {form.watch("securityMeasures")?.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Aucune mesure sélectionnée. Utilisez les boutons ci-dessus pour ajouter des mesures.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {form.watch("securityMeasures")?.map((measure, index) => (
                            <Card key={measure.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium">{measure.name}</h4>
                                  <p className="text-sm text-gray-600">{measure.description}</p>
                                  <Badge variant="outline" className="mt-1">
                                    {measure.category}
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSecurityMeasure(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`securityMeasures.${index}.implemented`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel>
                                        Cette mesure est mise en œuvre
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`securityMeasures.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description de la mise en œuvre</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Décrivez comment cette mesure est implémentée dans votre organisation..."
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Validation */}
            <TabsContent value="validation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Validation et finalisation</CardTitle>
                  <CardDescription>
                    Finalisez votre AIPD et procédez à sa validation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">AIPD en cours de développement</h3>
                    <p className="text-gray-600 mb-4">
                      Cette section sera complétée avec les fonctionnalités de validation et de plan d'action.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dpia')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}