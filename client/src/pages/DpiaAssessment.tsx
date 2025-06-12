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
import { useToast } from "@/hooks/use-toast";
import { Brain, Save, FileText, Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const dpiaFormSchema = z.object({
  companyId: z.number(),
  processingRecordId: z.number().optional(),
  // Part 1: Context Description
  generalDescription: z.string().optional(),
  processingPurposes: z.string().optional(),
  dataController: z.string().optional(),
  dataProcessors: z.string().optional(),
  personalDataCategories: z.array(z.object({
    category: z.string(),
    examples: z.string(),
    recipients: z.string(),
    retentionPeriod: z.string(),
  })).optional(),
  // Part 2: Fundamental Principles
  dataMinimization: z.string().optional(),
  retentionJustification: z.string().optional(),
  rightsInformation: z.string().optional(),
  rightsConsent: z.string().optional(),
  rightsAccess: z.string().optional(),
  rightsRectification: z.string().optional(),
  rightsOpposition: z.string().optional(),
  // Part 3: Risk Management
  securityMeasures: z.string().optional(),
  riskAssessment: z.array(z.object({
    riskType: z.enum(["illegitimate_access", "unwanted_modification", "data_disappearance"]),
    riskSources: z.string(),
    threats: z.string(),
    potentialImpacts: z.string(),
    severity: z.enum(["negligible", "limited", "significant", "maximum"]),
    likelihood: z.enum(["negligible", "limited", "significant", "maximum"]),
  })).optional(),
  // Part 4: Validation
  actionPlan: z.array(z.object({
    measure: z.string(),
    responsible: z.string(),
    deadline: z.string(),
    difficulty: z.string(),
    cost: z.string(),
    progress: z.string(),
  })).optional(),
  dpoAdvice: z.string().optional(),
  controllerValidation: z.string().optional(),
  status: z.string().default("draft"),
});

type DpiaFormData = z.infer<typeof dpiaFormSchema>;

interface DataCategory {
  category: string;
  examples: string;
  recipients: string;
  retentionPeriod: string;
}

interface RiskItem {
  riskType: "illegitimate_access" | "unwanted_modification" | "data_disappearance";
  riskSources: string;
  threats: string;
  potentialImpacts: string;
  severity: "negligible" | "limited" | "significant" | "maximum";
  likelihood: "negligible" | "limited" | "significant" | "maximum";
}

interface ActionItem {
  measure: string;
  responsible: string;
  deadline: string;
  difficulty: string;
  cost: string;
  progress: string;
}

export default function DpiaAssessment() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("context");
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Get user company info
  const userId = parseInt(localStorage.getItem("userId") || "1");
  const { data: company } = useQuery({
    queryKey: [`/api/companies/${userId}`],
  });

  // Load existing DPIA if editing
  const { data: existingDpia, isLoading } = useQuery({
    queryKey: [`/api/dpia/assessment/${id}`],
    enabled: !!id && id !== "new",
  });

  const form = useForm<DpiaFormData>({
    resolver: zodResolver(dpiaFormSchema),
    defaultValues: {
      companyId: (company as any)?.id || 1,
      status: "draft",
      personalDataCategories: [],
      riskAssessment: [],
      actionPlan: [],
    },
  });

  // Load existing data into form
  useEffect(() => {
    if (existingDpia && company) {
      const dpiaData = existingDpia as any;
      form.reset({
        ...dpiaData,
        companyId: company.id,
      });
      
      if (dpiaData.personalDataCategories) {
        setDataCategories(dpiaData.personalDataCategories);
      }
      if (dpiaData.riskAssessment) {
        setRisks(dpiaData.riskAssessment);
      }
      if (dpiaData.actionPlan) {
        setActions(dpiaData.actionPlan);
      }
    }
  }, [existingDpia, company, form]);

  // Save DPIA mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DpiaFormData) => {
      const payload = {
        ...data,
        personalDataCategories: dataCategories,
        riskAssessment: risks,
        actionPlan: actions,
      };

      if (id && id !== "new") {
        const response = await fetch(`/api/dpia/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return response.json();
      } else {
        const response = await fetch("/api/dpia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: "AIPD sauvegardée",
        description: "L'analyse d'impact a été sauvegardée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dpia"] });
      if (id === "new") {
        setLocation(`/dpia/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    },
  });

  // AI assistance mutation
  const aiAssistMutation = useMutation({
    mutationFn: async ({ questionField }: { questionField: string }) => {
      const response = await fetch("/api/dpia/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionField,
          companyId: company?.id,
          existingDpiaData: form.getValues(),
        }),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      form.setValue(variables.questionField as any, data.response);
      toast({
        title: "Proposition IA générée",
        description: "La proposition a été ajoutée au champ. Vous pouvez la modifier selon vos besoins.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur IA",
        description: error.message || "Erreur lors de la génération.",
        variant: "destructive",
      });
    },
  });

  // Generate AI risk assessment
  const generateRiskAssessment = async () => {
    if (!form.getValues("generalDescription")) {
      toast({
        title: "Information manquante",
        description: "Veuillez d'abord remplir la description générale du traitement.",
        variant: "destructive",
      });
      return;
    }

    setAiLoading("risk-assessment");
    try {
      const response = await fetch("/api/dpia/ai-risk-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingDescription: form.getValues("generalDescription"),
          dataCategories,
          companyId: company?.id,
        }),
      });
      const data = await response.json();
      setRisks(data.risks || []);
      toast({
        title: "Analyse de risques générée",
        description: "L'IA a généré une évaluation des risques selon la méthodologie CNIL.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération de l'analyse de risques.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiAssist = (questionField: string) => {
    setAiLoading(questionField);
    aiAssistMutation.mutate({ questionField }, {
      onSettled: () => setAiLoading(null),
    });
  };

  const onSubmit = (data: DpiaFormData) => {
    saveMutation.mutate(data);
  };

  const addDataCategory = () => {
    setDataCategories([...dataCategories, { category: "", examples: "", recipients: "", retentionPeriod: "" }]);
  };

  const updateDataCategory = (index: number, field: keyof DataCategory, value: string) => {
    const updated = [...dataCategories];
    updated[index][field] = value;
    setDataCategories(updated);
  };

  const removeDataCategory = (index: number) => {
    setDataCategories(dataCategories.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([...actions, { measure: "", responsible: "", deadline: "", difficulty: "", cost: "", progress: "" }]);
  };

  const updateAction = (index: number, field: keyof ActionItem, value: string) => {
    const updated = [...actions];
    updated[index][field] = value;
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const progress = (() => {
    const formValues = form.getValues();
    let completed = 0;
    const total = 15; // Total number of main fields

    if (formValues.generalDescription) completed++;
    if (formValues.processingPurposes) completed++;
    if (formValues.dataController) completed++;
    if (formValues.dataProcessors) completed++;
    if (dataCategories.length > 0) completed++;
    if (formValues.dataMinimization) completed++;
    if (formValues.retentionJustification) completed++;
    if (formValues.rightsInformation) completed++;
    if (formValues.rightsConsent) completed++;
    if (formValues.rightsAccess) completed++;
    if (formValues.rightsRectification) completed++;
    if (formValues.rightsOpposition) completed++;
    if (formValues.securityMeasures) completed++;
    if (risks.length > 0) completed++;
    if (actions.length > 0) completed++;

    return Math.round((completed / total) * 100);
  })();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analyse d'Impact RGPD (AIPD)</h1>
          <p className="text-muted-foreground mt-2">
            Questionnaire assisté par IA selon la méthodologie CNIL
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progression</div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-24" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="context" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                1. Contexte
              </TabsTrigger>
              <TabsTrigger value="principles" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                2. Principes
              </TabsTrigger>
              <TabsTrigger value="risks" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                3. Risques
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                4. Validation
              </TabsTrigger>
            </TabsList>

            {/* Part 1: Context Description */}
            <TabsContent value="context" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Partie 1 : Décrire le Contexte du Projet</CardTitle>
                  <CardDescription>
                    Avoir une vision claire et synthétique du traitement de données que vous envisagez. 
                    C'est la "carte d'identité" de votre projet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 1.1 Vue d'ensemble */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">1.1 Vue d'ensemble</h3>
                    
                    <FormField
                      control={form.control}
                      name="generalDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>1.1.1 Description générale du traitement</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("generalDescription")}
                              disabled={aiLoading === "generalDescription"}
                            >
                              {aiLoading === "generalDescription" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Décrivez votre projet de manière simple. Il s'agit de présenter sa nature, 
                            sa portée et son contexte général.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Exemple: Mise en place d'un système de recommandations personnalisées pour notre boutique en ligne..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="processingPurposes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>1.1.2 Finalités du traitement</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("processingPurposes")}
                              disabled={aiLoading === "processingPurposes"}
                            >
                              {aiLoading === "processingPurposes" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            La finalité est l'objectif principal de votre traitement. Définissez précisément 
                            à quoi vont servir les données collectées.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Finalité principale: ... Finalités secondaires: ..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataController"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>1.1.3 Responsable du traitement</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            L'entité juridique qui décide des objectifs et des moyens du traitement.
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={company?.name || "Nom de l'entreprise"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataProcessors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>1.1.4 Sous-traitant(s)</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("dataProcessors")}
                              disabled={aiLoading === "dataProcessors"}
                            >
                              {aiLoading === "dataProcessors" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Société qui traite les données pour votre compte. Listez tous vos prestataires 
                            qui auront accès aux données.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Hébergeur: ..., Prestataire de paie: ..., etc."
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* 1.2 Données, processus et supports */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">1.2 Données, Processus et Supports</h3>
                    
                    <div>
                      <Label className="text-base font-medium">1.2.1 Données personnelles traitées</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Listez toutes les catégories de données personnelles que vous allez collecter, 
                        qui y aura accès et pendant combien de temps vous les conserverez.
                      </p>
                      
                      <div className="space-y-4">
                        {dataCategories.map((category, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Catégorie de Données</Label>
                                <Input
                                  value={category.category}
                                  onChange={(e) => updateDataCategory(index, "category", e.target.value)}
                                  placeholder="État-civil, Email, etc."
                                />
                              </div>
                              <div>
                                <Label>Exemples de Données</Label>
                                <Input
                                  value={category.examples}
                                  onChange={(e) => updateDataCategory(index, "examples", e.target.value)}
                                  placeholder="Nom, prénom, adresse..."
                                />
                              </div>
                              <div>
                                <Label>Destinataires</Label>
                                <Input
                                  value={category.recipients}
                                  onChange={(e) => updateDataCategory(index, "recipients", e.target.value)}
                                  placeholder="Service RH, Service client..."
                                />
                              </div>
                              <div>
                                <Label>Durée de conservation</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={category.retentionPeriod}
                                    onChange={(e) => updateDataCategory(index, "retentionPeriod", e.target.value)}
                                    placeholder="3 ans, 5 ans..."
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeDataCategory(index)}
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addDataCategory}
                        >
                          Ajouter une catégorie de données
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Part 2: Fundamental Principles */}
            <TabsContent value="principles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Partie 2 : Vérifier le Respect des Principes Fondamentaux</CardTitle>
                  <CardDescription>
                    S'assurer que votre projet est conçu en respectant les règles de base de la protection des données 
                    et les droits des individus.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 2.1 Proportionnalité et Nécessité */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">2.1 Proportionnalité et Nécessité</h3>
                    
                    <FormField
                      control={form.control}
                      name="dataMinimization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>2.1.1 Minimisation des données</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("dataMinimization")}
                              disabled={aiLoading === "dataMinimization"}
                            >
                              {aiLoading === "dataMinimization" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Ne collectez que les données strictement nécessaires à votre objectif. 
                            Justifiez chaque donnée collectée.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Pour chaque donnée, expliquez en quoi elle est indispensable..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="retentionJustification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>2.1.2 Durées de conservation</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("retentionJustification")}
                              disabled={aiLoading === "retentionJustification"}
                            >
                              {aiLoading === "retentionJustification" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Comment avez-vous déterminé les durées de conservation ? Existe-t-il un processus 
                            pour supprimer ou archiver les données ?
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Justification des durées et processus de suppression..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* 2.2 Droits des Personnes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">2.2 Droits des Personnes</h3>
                    
                    <FormField
                      control={form.control}
                      name="rightsInformation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Information des personnes</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("rightsInformation")}
                              disabled={aiLoading === "rightsInformation"}
                            >
                              {aiLoading === "rightsInformation" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Comment, quand et où les personnes seront-elles informées ? L'information est-elle complète ?
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Modalités d'information (supports, moment, contenu)..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightsConsent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consentement (si applicable)</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Si votre traitement repose sur le consentement, comment l'obtenez-vous ? 
                            Est-il facile de le retirer ?
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Modalités de recueil et de retrait du consentement..."
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightsAccess"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accès et portabilité</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Procédure pour qu'une personne puisse accéder à ses données ou les récupérer.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Procédure d'accès aux données, délais de réponse..."
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightsRectification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rectification et effacement</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Procédure pour corriger ou supprimer des données personnelles.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Modalités de rectification et d'effacement..."
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightsOpposition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opposition et limitation</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Procédure pour s'opposer au traitement ou en limiter la portée.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Modalités d'opposition et de limitation..."
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Part 3: Risk Management */}
            <TabsContent value="risks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Partie 3 : Gérer les Risques pour la Vie Privée</CardTitle>
                  <CardDescription>
                    Anticiper les problèmes de sécurité potentiels et s'assurer que des mesures de protection 
                    adaptées sont en place.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">3.1 Mesures de Sécurité</h3>
                    
                    <FormField
                      control={form.control}
                      name="securityMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Mesures techniques et organisationnelles</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("securityMeasures")}
                              disabled={aiLoading === "securityMeasures"}
                            >
                              {aiLoading === "securityMeasures" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Listez toutes les mesures de protection des données : contrôle d'accès, chiffrement, 
                            traçabilité, sauvegardes, sécurité physique, formation, gestion des incidents.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Contrôle d'accès: ... Chiffrement: ... Traçabilité: ..."
                              className="min-h-[150px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">3.2 Appréciation des Risques</h3>
                      <Button
                        type="button"
                        onClick={generateRiskAssessment}
                        disabled={aiLoading === "risk-assessment"}
                        variant="outline"
                      >
                        {aiLoading === "risk-assessment" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        Générer l'analyse de risques par IA
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Évaluez la probabilité et l'impact des trois grands types de risques selon la méthodologie CNIL.
                    </p>

                    <div className="space-y-4">
                      {risks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type de Risque</TableHead>
                              <TableHead>Sources</TableHead>
                              <TableHead>Menaces</TableHead>
                              <TableHead>Impacts</TableHead>
                              <TableHead>Gravité</TableHead>
                              <TableHead>Vraisemblance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {risks.map((risk, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge variant={
                                    risk.riskType === "illegitimate_access" ? "destructive" :
                                    risk.riskType === "unwanted_modification" ? "default" : "secondary"
                                  }>
                                    {risk.riskType === "illegitimate_access" && "Accès illégitime"}
                                    {risk.riskType === "unwanted_modification" && "Modification non désirée"}
                                    {risk.riskType === "data_disappearance" && "Disparition de données"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div className="text-sm truncate" title={risk.riskSources}>
                                    {risk.riskSources}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div className="text-sm truncate" title={risk.threats}>
                                    {risk.threats}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div className="text-sm truncate" title={risk.potentialImpacts}>
                                    {risk.potentialImpacts}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    risk.severity === "maximum" ? "destructive" :
                                    risk.severity === "significant" ? "default" :
                                    risk.severity === "limited" ? "secondary" : "outline"
                                  }>
                                    {risk.severity === "negligible" && "Négligeable"}
                                    {risk.severity === "limited" && "Limitée"}
                                    {risk.severity === "significant" && "Importante"}
                                    {risk.severity === "maximum" && "Maximale"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    risk.likelihood === "maximum" ? "destructive" :
                                    risk.likelihood === "significant" ? "default" :
                                    risk.likelihood === "limited" ? "secondary" : "outline"
                                  }>
                                    {risk.likelihood === "negligible" && "Négligeable"}
                                    {risk.likelihood === "limited" && "Limitée"}
                                    {risk.likelihood === "significant" && "Importante"}
                                    {risk.likelihood === "maximum" && "Maximale"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune analyse de risques générée.</p>
                          <p className="text-sm mt-2">
                            Remplissez d'abord la description générale, puis cliquez sur "Générer l'analyse de risques par IA".
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Part 4: Validation */}
            <TabsContent value="validation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Partie 4 : Valider l'Analyse</CardTitle>
                  <CardDescription>
                    Conclure l'AIPD, formaliser la décision du responsable de traitement et planifier les actions à mener.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">4.1 Plan d'action</h3>
                    <p className="text-sm text-muted-foreground">
                      Si l'étape précédente a révélé des risques trop élevés, listez ici les mesures 
                      complémentaires à mettre en place pour les réduire.
                    </p>
                    
                    <div className="space-y-4">
                      {actions.map((action, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <Label>Mesures complémentaires</Label>
                              <Textarea
                                value={action.measure}
                                onChange={(e) => updateAction(index, "measure", e.target.value)}
                                placeholder="Description de la mesure..."
                                className="min-h-[80px]"
                              />
                            </div>
                            <div>
                              <Label>Responsable</Label>
                              <Input
                                value={action.responsible}
                                onChange={(e) => updateAction(index, "responsible", e.target.value)}
                                placeholder="Nom du responsable"
                              />
                            </div>
                            <div>
                              <Label>Échéance</Label>
                              <Input
                                value={action.deadline}
                                onChange={(e) => updateAction(index, "deadline", e.target.value)}
                                placeholder="Date limite"
                                type="date"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label>Difficulté</Label>
                              <Select
                                value={action.difficulty}
                                onValueChange={(value) => updateAction(index, "difficulty", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="faible">Faible</SelectItem>
                                  <SelectItem value="moyenne">Moyenne</SelectItem>
                                  <SelectItem value="élevée">Élevée</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Coût</Label>
                              <Select
                                value={action.cost}
                                onValueChange={(value) => updateAction(index, "cost", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="faible">Faible</SelectItem>
                                  <SelectItem value="moyen">Moyen</SelectItem>
                                  <SelectItem value="élevé">Élevé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Avancement</Label>
                              <Select
                                value={action.progress}
                                onValueChange={(value) => updateAction(index, "progress", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="non_commencé">Non commencé</SelectItem>
                                  <SelectItem value="en_cours">En cours</SelectItem>
                                  <SelectItem value="terminé">Terminé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => removeAction(index)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addAction}
                      >
                        Ajouter une action
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">4.2 Avis et Validation Formelle</h3>
                    
                    <FormField
                      control={form.control}
                      name="dpoAdvice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Avis du Délégué à la Protection des Données (DPO)</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAiAssist("dpoAdvice")}
                              disabled={aiLoading === "dpoAdvice"}
                            >
                              {aiLoading === "dpoAdvice" ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Générer une proposition par l'IA
                            </Button>
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Si votre organisme a un DPO, son avis doit être sollicité et formalisé.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Avis du DPO sur la méthodologie, la complétude de l'analyse..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="controllerValidation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validation par le responsable de traitement</FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Conclusion officielle de l'AIPD. Le responsable de traitement décide si le traitement 
                            peut être mis en œuvre, modifié, ou abandonné.
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Décision de validation du responsable de traitement..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}