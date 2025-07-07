import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, diagnosticApi, ragDocumentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Settings, Plus, Edit, Brain, MessageSquare, ClipboardList, 
  FileText, AlertTriangle, BarChart3, Loader2, CheckCircle, Clock,
  Upload, Trash2, Link, FileIcon, Users
} from "lucide-react";

interface AiPrompt {
  id: number;
  name: string;
  description: string;
  category: string;
  prompt: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

interface DiagnosticQuestion {
  id: number;
  question: string;
  category: string;
  order: number;
  isActive: boolean;
  actionPlanYes?: string;
  riskLevelYes?: string;
  actionPlanNo?: string;
  riskLevelNo?: string;
  createdAt: string;
}

interface LlmConfiguration {
  id: number;
  name: string;
  provider: string;
  apiEndpoint?: string;
  apiKeyName: string;
  modelName: string;
  maxTokens: number;
  temperature: string;
  isActive: boolean;
  supportsJsonMode: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RagDocument {
  id: number;
  name: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  content: string;
  uploadedBy: number;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromptDocument {
  id: number;
  promptId: number;
  documentId: number;
  priority: number;
  createdAt: string;
}

const promptCategories = {
  diagnostic: "Diagnostic",
  records: "Registres",
  policy: "Politique",
  breach: "Violations",
  dpia: "AIPD",
  chatbot: "Chatbot",
};

// DPIA-specific prompt subcategories
// Document categories for RAG documents
const documentCategories = {
  general: "Général",
  compliance: "Conformité RGPD",
  security: "Sécurité",
  legal: "Juridique",
  dpia: "AIPD",
  technical: "Technique",
  training: "Formation",
  templates: "Modèles",
};

const dpiaPromptSubcategories = {
  // Section 1: Information générale
  generalDescription: "Description générale",
  purposes: "Finalités du traitement", 
  dataController: "Responsable du traitement",
  dataProcessors: "Sous-traitants",
  applicableReferentials: "Référentiels applicables",
  
  // Section 2: Justifications
  finalitiesJustification: "Justification des finalités",
  dataMinimization: "Justification de la minimisation des données",
  retentionJustification: "Justification des durées de conservation",
  legalBasisJustification: "Justification de la base légale choisie",
  
  // Section 3: Mesures techniques et organisationnelles
  dataQualityMeasures: "Mesures de qualité des données",
  informationMeasures: "Mesures d'information",
  consentMeasures: "Mesures pour le consentement",
  accessMeasures: "Mesures pour l'accès et la portabilité",
  rectificationMeasures: "Mesures pour la rectification et l'effacement",
  oppositionMeasures: "Mesures pour la limitation et l'opposition",
  
  // Section 4: Analyse des risques
  illegitimateAccessImpacts: "Impacts - Accès illégitime aux données",
  illegitimateAccessThreats: "Menaces - Accès illégitime aux données", 
  illegitimateAccessSources: "Sources de risque - Accès illégitime aux données",
  illegitimateAccessMeasures: "Mesures existantes - Accès illégitime aux données",
  
  dataModificationImpacts: "Impacts - Modification non désirée des données",
  dataModificationThreats: "Menaces - Modification non désirée des données",
  dataModificationSources: "Sources de risque - Modification non désirée des données", 
  dataModificationMeasures: "Mesures existantes - Modification non désirée des données",
  
  dataDisappearanceImpacts: "Impacts - Disparition des données",
  dataDisappearanceThreats: "Menaces - Disparition des données",
  dataDisappearanceSources: "Sources de risque - Disparition des données",
  dataDisappearanceMeasures: "Mesures existantes - Disparition des données"
};

const categoryIcons = {
  diagnostic: ClipboardList,
  records: FileText,
  policy: FileText,
  breach: AlertTriangle,
  dpia: BarChart3,
  chatbot: MessageSquare,
};

export default function Admin() {
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentCategory, setDocumentCategory] = useState("general");
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const promptForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      prompt: "",
    },
  });

  const questionForm = useForm<{
    question: string;
    category: string;
    order: number;
    actionPlanYes: string;
    riskLevelYes: string;
    actionPlanNo: string;
    riskLevelNo: string;
  }>({
    defaultValues: {
      question: "",
      category: "",
      order: 0,
      actionPlanYes: "",
      riskLevelYes: "faible",
      actionPlanNo: "",
      riskLevelNo: "faible",
    },
  });

  const llmForm = useForm({
    defaultValues: {
      name: "",
      provider: "openai",
      apiEndpoint: "",
      apiKeyName: "",
      modelName: "",
      maxTokens: 4000,
      temperature: "0.7",
      isActive: false,
      supportsJsonMode: false,
    },
  });

  const [isLlmDialogOpen, setIsLlmDialogOpen] = useState(false);
  const [editingLlm, setEditingLlm] = useState<LlmConfiguration | null>(null);

  // Queries
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['/api/admin/prompts'],
    queryFn: () => adminApi.getPrompts().then(res => res.json()),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/diagnostic/questions'],
    queryFn: () => diagnosticApi.getQuestions().then(res => res.json()),
  });

  const { data: llmConfigs, isLoading: llmLoading } = useQuery({
    queryKey: ['/api/admin/llm-configs'],
    queryFn: () => adminApi.getLlmConfigs().then(res => res.json()),
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/admin/documents'],
    queryFn: () => ragDocumentsApi.getDocuments().then(res => res.json()),
  });

  // Mutations
  const createPromptMutation = useMutation({
    mutationFn: (data: any) => adminApi.createPrompt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setIsPromptDialogOpen(false);
      promptForm.reset();
      setEditingPrompt(null);
      toast({
        title: "Prompt créé !",
        description: "Le nouveau prompt IA a été ajouté avec succès.",
      });
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updatePrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setIsPromptDialogOpen(false);
      promptForm.reset();
      setEditingPrompt(null);
      toast({
        title: "Prompt mis à jour !",
        description: "Le prompt IA a été modifié avec succès.",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => adminApi.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic/questions'] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setEditingQuestion(null);
      toast({
        title: "Question créée !",
        description: "La nouvelle question de diagnostic a été ajoutée.",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic/questions'] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setEditingQuestion(null);
      toast({
        title: "Question mise à jour !",
        description: "La question de diagnostic a été modifiée avec succès.",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic/questions'] });
      toast({
        title: "Question supprimée !",
        description: "La question a été supprimée avec succès.",
      });
    },
  });

  // LLM Configuration mutations
  const createLlmMutation = useMutation({
    mutationFn: (data: any) => adminApi.createLlmConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-configs'] });
      setIsLlmDialogOpen(false);
      llmForm.reset();
      setEditingLlm(null);
      toast({
        title: "Configuration IA créée !",
        description: "La nouvelle configuration d'IA a été ajoutée avec succès.",
      });
    },
  });

  const updateLlmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateLlmConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-configs'] });
      setIsLlmDialogOpen(false);
      llmForm.reset();
      setEditingLlm(null);
      toast({
        title: "Configuration IA mise à jour !",
        description: "La configuration d'IA a été modifiée avec succès.",
      });
    },
  });

  const deleteLlmMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteLlmConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-configs'] });
      toast({
        title: "Configuration supprimée !",
        description: "La configuration d'IA a été supprimée avec succès.",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (formData: FormData) => ragDocumentsApi.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      setIsDocumentDialogOpen(false);
      setSelectedFile(null);
      setDocumentName("");
      toast({
        title: "Document téléchargé !",
        description: "Le document PDF a été importé avec succès.",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) => ragDocumentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "Document supprimé !",
        description: "Le document a été supprimé avec succès.",
      });
    },
  });

  const onPromptSubmit = (data: any) => {
    if (editingPrompt) {
      updatePromptMutation.mutate({ id: editingPrompt.id, data });
    } else {
      createPromptMutation.mutate(data);
    }
  };

  const onQuestionSubmit = (data: any) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const onLlmSubmit = (data: any) => {
    if (editingLlm) {
      updateLlmMutation.mutate({ id: editingLlm.id, data });
    } else {
      createLlmMutation.mutate(data);
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier PDF.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (documentName) {
      formData.append('name', documentName);
    }
    formData.append('category', documentCategory);
    formData.append('tags', JSON.stringify(documentTags));

    uploadDocumentMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !documentTags.includes(newTag.trim())) {
      setDocumentTags([...documentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocumentTags(documentTags.filter(tag => tag !== tagToRemove));
  };

  // Filter and search documents
  const filteredDocuments = documents?.filter((doc: RagDocument) => {
    const matchesSearch = !searchQuery || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    
    const matchesTag = selectedTag === "all" || 
      (doc.tags && doc.tags.includes(selectedTag));
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  // Get all unique tags from documents
  const allTags = documents?.reduce((tags: string[], doc: RagDocument) => {
    if (doc.tags) {
      doc.tags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    return tags;
  }, []) || [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Format invalide",
          description: "Seuls les fichiers PDF sont acceptés.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace('.pdf', ''));
      }
    }
  };

  // Get prompt-document associations
  const { data: promptDocuments, isLoading: promptDocumentsLoading, refetch: refetchPromptDocuments } = useQuery({
    queryKey: ['/api/admin/prompt-documents'],
    queryFn: async () => {
      const response = await fetch('/api/admin/prompt-documents');
      if (!response.ok) throw new Error('Erreur lors du chargement des associations');
      return response.json();
    }
  });

  // Handle document association
  const associateDocumentMutation = useMutation({
    mutationFn: async ({ promptId, documentId, priority }: { promptId: number; documentId: number; priority: number }) => {
      const response = await fetch('/api/admin/prompt-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId, documentId, priority }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'association');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchPromptDocuments();
      toast({
        title: "Association créée",
        description: "Le document a été associé au prompt avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'associer le document.",
        variant: "destructive"
      });
    }
  });

  // Handle document dissociation
  const dissociateDocumentMutation = useMutation({
    mutationFn: async ({ promptId, documentId }: { promptId: number; documentId: number }) => {
      const response = await fetch(`/api/admin/prompt-documents/${promptId}/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la dissociation');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchPromptDocuments();
      toast({
        title: "Dissociation réussie",
        description: "Le document a été dissocié du prompt avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dissocier le document.",
        variant: "destructive"
      });
    }
  });

  const handleAssociateDocument = (promptId: number, documentId: number, priority: number) => {
    associateDocumentMutation.mutate({ promptId, documentId, priority });
  };

  const handleDissociateDocument = (promptId: number, documentId: number) => {
    dissociateDocumentMutation.mutate({ promptId, documentId });
  };

  // Helper function to check if document is associated with prompt
  const isDocumentAssociated = (promptId: number, documentId: number): boolean => {
    if (!promptDocuments) return false;
    return promptDocuments.some((pd: any) => pd.promptId === promptId && pd.documentId === documentId);
  };

  const openPromptDialog = (prompt?: AiPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      promptForm.reset({
        name: prompt.name || "",
        description: prompt.description || "",
        category: prompt.category || "",
        prompt: prompt.prompt || "",
      });
    } else {
      setEditingPrompt(null);
      promptForm.reset({
        name: "",
        description: "",
        category: "",
        prompt: "",
      });
    }
    setIsPromptDialogOpen(true);
  };

  const openQuestionDialog = (question?: DiagnosticQuestion) => {
    if (question) {
      setEditingQuestion(question);
      questionForm.reset({
        question: question.question,
        category: question.category,
        order: question.order,
        actionPlanYes: question.actionPlanYes || '',
        riskLevelYes: question.riskLevelYes || 'faible',
        actionPlanNo: question.actionPlanNo || '',
        riskLevelNo: question.riskLevelNo || 'faible',
      });
    } else {
      setEditingQuestion(null);
      questionForm.reset();
    }
    setIsQuestionDialogOpen(true);
  };

  const openLlmDialog = (config?: LlmConfiguration) => {
    if (config) {
      setEditingLlm(config);
      llmForm.reset({
        name: config.name,
        provider: config.provider,
        apiEndpoint: config.apiEndpoint || "",
        apiKeyName: config.apiKeyName,
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        isActive: config.isActive,
        supportsJsonMode: config.supportsJsonMode,
      });
    } else {
      setEditingLlm(null);
      llmForm.reset();
    }
    setIsLlmDialogOpen(true);
  };

  const togglePromptStatus = (prompt: AiPrompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      data: { isActive: !prompt.isActive }
    });
  };

  if (promptsLoading || questionsLoading || llmLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement de l'administration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Administration</h2>
          <p className="text-muted-foreground">
            Gérez les prompts IA, questions de diagnostic et documents RAG
          </p>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="prompts" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Prompts IA</span>
          </TabsTrigger>
          <TabsTrigger value="dpia-prompts" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Prompts AIPD</span>
          </TabsTrigger>
          <TabsTrigger value="lateam-prompts" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Prompts La Team</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <ClipboardList className="w-4 h-4" />
            <span>Questions diagnostic</span>
          </TabsTrigger>
          <TabsTrigger value="llm-configs" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration IA</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileIcon className="w-4 h-4" />
            <span>Documents RAG</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Prompts Management */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des prompts IA</h3>
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openPromptDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrompt ? "Modifier le prompt" : "Créer un nouveau prompt"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrompt ? "Modifiez les détails du prompt IA existant." : "Créez un nouveau prompt IA pour automatiser les tâches de conformité."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...promptForm}>
                  <form onSubmit={promptForm.handleSubmit(onPromptSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={promptForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du prompt</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Génération registre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={promptForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catégorie</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(promptCategories).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={promptForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Description du prompt..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promptForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contenu du prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rédigez le prompt IA ici..."
                              rows={8}
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
                        onClick={() => setIsPromptDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createPromptMutation.isPending || updatePromptMutation.isPending}>
                        {(createPromptMutation.isPending || updatePromptMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingPrompt ? "Modification..." : "Création..."}
                          </>
                        ) : (
                          editingPrompt ? "Modifier" : "Créer"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Prompts by Category */}
          {Object.entries(promptCategories).map(([categoryKey, categoryLabel]) => {
            const categoryPrompts = prompts?.filter((p: AiPrompt) => p.category === categoryKey) || [];
            const Icon = categoryIcons[categoryKey as keyof typeof categoryIcons];
            
            if (categoryPrompts.length === 0) return null;

            return (
              <Card key={categoryKey}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{categoryLabel}</span>
                    <Badge variant="outline">{categoryPrompts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryPrompts.map((prompt: AiPrompt) => (
                      <div
                        key={prompt.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium">{prompt.name}</h4>
                            <Badge variant={prompt.isActive ? "default" : "secondary"}>
                              {prompt.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Actif
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Inactif
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline">v{prompt.version}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {prompt.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Créé le {new Date(prompt.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={prompt.isActive}
                            onCheckedChange={() => togglePromptStatus(prompt)}
                            disabled={updatePromptMutation.isPending}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPromptDialog(prompt)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* DPIA Prompts Management */}
        <TabsContent value="dpia-prompts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestion des prompts AIPD</h3>
              <p className="text-sm text-muted-foreground">
                Configurez les prompts IA pour chaque section des analyses d'impact (AIPD)
              </p>
            </div>
            <Button onClick={() => openPromptDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau prompt AIPD
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Configuration AIPD Prompts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les prompts AIPD sont gérés dans l'onglet "Prompts IA" principal.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LA Team Prompts Management */}
        <TabsContent value="lateam-prompts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des prompts LA Team Jean Michel</h3>
            <div className="text-sm text-muted-foreground">
              Configurez les personnalités et expertises de vos bots spécialisés
            </div>
          </div>

          <div className="grid gap-6">
            {/* Jean Michel Fondement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JM</span>
                  </div>
                  <span>Jean Michel Fondement</span>
                  <Badge variant="secondary">Expert en Bases Légales</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const prompt = prompts?.find((p: AiPrompt) => p.category === "Jean Michel Fondement");
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          Expert en détermination des fondements juridiques pour les traitements RGPD
                        </p>
                        {prompt ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={prompt.isActive ? "default" : "secondary"}>
                              {prompt.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Dernière modification: {new Date(prompt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Prompt non configuré</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {prompt && (
                          <Switch
                            checked={prompt.isActive}
                            onCheckedChange={() => togglePromptStatus(prompt)}
                            disabled={updatePromptMutation.isPending}
                          />
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (prompt) {
                              openPromptDialog(prompt);
                            }
                          }}
                          disabled={!prompt}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Jean Michel Voyages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JM</span>
                  </div>
                  <span>Jean Michel Voyages</span>
                  <Badge variant="secondary">Expert en Transferts Internationaux</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const prompt = prompts?.find((p: AiPrompt) => p.category === "Jean Michel Voyages");
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          Spécialiste des transferts de données vers les pays tiers et décisions d'adéquation
                        </p>
                        {prompt ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={prompt.isActive ? "default" : "secondary"}>
                              {prompt.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Dernière modification: {new Date(prompt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Prompt non configuré</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {prompt && (
                          <Switch
                            checked={prompt.isActive}
                            onCheckedChange={() => togglePromptStatus(prompt)}
                            disabled={updatePromptMutation.isPending}
                          />
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (prompt) {
                              openPromptDialog(prompt);
                            }
                          }}
                          disabled={!prompt}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Jean Michel Archive */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JM</span>
                  </div>
                  <span>Jean Michel Archive</span>
                  <Badge variant="secondary">Spécialiste des Durées de Conservation</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const prompt = prompts?.find((p: AiPrompt) => p.category === "Jean Michel Archive");
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          Expert en durées de conservation et archivage des données personnelles
                        </p>
                        {prompt ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={prompt.isActive ? "default" : "secondary"}>
                              {prompt.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Dernière modification: {new Date(prompt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Prompt non configuré</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {prompt && (
                          <Switch
                            checked={prompt.isActive}
                            onCheckedChange={() => togglePromptStatus(prompt)}
                            disabled={updatePromptMutation.isPending}
                          />
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (prompt) {
                              openPromptDialog(prompt);
                            }
                          }}
                          disabled={!prompt}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Jean Michel Irma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JM</span>
                  </div>
                  <span>Jean Michel Irma</span>
                  <Badge variant="secondary">Expert en Jurisprudence et Sanctions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const prompt = prompts?.find((p: AiPrompt) => p.category === "Jean Michel Irma");
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          Spécialiste en jurisprudence CNIL et calcul des sanctions administratives
                        </p>
                        {prompt ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={prompt.isActive ? "default" : "secondary"}>
                              {prompt.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Dernière modification: {new Date(prompt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Prompt non configuré</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {prompt && (
                          <Switch
                            checked={prompt.isActive}
                            onCheckedChange={() => togglePromptStatus(prompt)}
                            disabled={updatePromptMutation.isPending}
                          />
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (prompt) {
                              openPromptDialog(prompt);
                            }
                          }}
                          disabled={!prompt}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Diagnostic Questions Management */}
        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions de diagnostic</h3>
          </div>
        </TabsContent>

        {/* Other sections continue here */}
      </Tabs>
    </div>
  );
}
