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
  Upload, Trash2, Link, FileIcon
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

  const openPromptDialog = (prompt?: AiPrompt, defaultCategory?: string) => {
    if (prompt) {
      setEditingPrompt(prompt);
      promptForm.reset({
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        prompt: prompt.prompt,
      });
    } else {
      setEditingPrompt(null);
      promptForm.reset({
        category: defaultCategory || '',
        name: '',
        description: '',
        prompt: ''
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Gestion des prompts IA</h3>
                <p className="text-muted-foreground">
                  Configurez et personnalisez les prompts d'intelligence artificielle pour optimiser les analyses automatiques
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/setup-breach-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const result = await response.json();
                      
                      if (result.success) {
                        toast({
                          title: "Prompt d'analyse des violations",
                          description: result.message,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
                      } else {
                        throw new Error(result.error);
                      }
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Initialiser prompts par défaut
                </Button>
                <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openPromptDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un prompt
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Prompts by Category - Enhanced Visual Design */}
            <div className="grid gap-6">
              {Object.entries(promptCategories).map(([categoryKey, categoryLabel]) => {
                const categoryPrompts = prompts?.filter((p: AiPrompt) => p.category === categoryKey) || [];
                const Icon = categoryIcons[categoryKey as keyof typeof categoryIcons];
                
                return (
                  <Card key={categoryKey} className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <span className="text-lg font-semibold">{categoryLabel}</span>
                            <p className="text-sm text-muted-foreground font-normal">
                              {categoryKey === 'breach' && 'Analyse automatique des violations de données RGPD'}
                              {categoryKey === 'dpia' && 'Génération assistée des analyses d\'impact'}
                              {categoryKey === 'processing' && 'Aide à la création des registres de traitement'}
                              {categoryKey === 'chatbot' && 'Assistant conversationnel spécialisé RGPD'}
                              {categoryKey === 'privacy' && 'Génération de politiques de confidentialité'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {categoryPrompts.length} prompt{categoryPrompts.length > 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    {categoryPrompts.length > 0 ? (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {categoryPrompts.map((prompt: AiPrompt) => (
                            <div
                              key={prompt.id}
                              className="flex items-start justify-between p-4 bg-white dark:bg-slate-800 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <h4 className="font-semibold text-base">{prompt.name}</h4>
                                  <Badge variant={prompt.isActive ? "default" : "secondary"} className="text-xs">
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
                                  <Badge variant="outline" className="text-xs">v{prompt.version}</Badge>
                                  {categoryKey === 'breach' && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Utilisé pour violations
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {prompt.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    Créé le {new Date(prompt.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                  {prompt.prompt && (
                                    <p className="text-xs text-muted-foreground">
                                      {prompt.prompt.length} caractères
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">Actif</span>
                                  <Switch
                                    checked={prompt.isActive}
                                    onCheckedChange={() => togglePromptStatus(prompt)}
                                    disabled={updatePromptMutation.isPending}
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPromptDialog(prompt)}
                                  className="min-w-[100px]"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="pt-0">
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Aucun prompt configuré pour cette catégorie</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => openPromptDialog(undefined, categoryKey)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer le premier prompt
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
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
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openPromptDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau prompt AIPD
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrompt ? "Modifier le prompt AIPD" : "Créer un nouveau prompt AIPD"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez un prompt IA pour automatiser la génération de contenu dans les AIPD
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
                              <Input placeholder="Ex: Description générale AIPD" {...field} />
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
                            <FormLabel>Section AIPD</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une section" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dpia">AIPD - Général</SelectItem>
                                {Object.entries(dpiaPromptSubcategories).map(([key, label]) => (
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
                            <Input placeholder="Description du rôle de ce prompt dans l'AIPD..." {...field} />
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
                              placeholder="Rédigez le prompt IA ici... Utilisez {{variableName}} pour les variables dynamiques"
                              rows={12}
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

          {/* DPIA Prompts organized by sections */}
          <div className="grid gap-6">
            {/* Section 1: Information générale */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Section 1 - Information générale</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {['generalDescription', 'purposes', 'personalDataProcessed', 'dataController', 'dataProcessors', 'applicableReferentials'].map(key => {
                    const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                    const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{label}</h4>
                          {prompt ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                {prompt.isActive ? "Actif" : "Inactif"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{prompt.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                            size="sm"
                            onClick={() => {
                              if (prompt) {
                                openPromptDialog(prompt);
                              } else {
                                promptForm.reset({
                                  name: `${label}`,
                                  description: `Prompt pour générer ${label.toLowerCase()}`,
                                  category: key,
                                  prompt: ""
                                });
                                setEditingPrompt(null);
                                setIsPromptDialogOpen(true);
                              }
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {prompt ? "Modifier" : "Créer"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Justifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Section 2 - Justifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {['finalitiesJustification', 'dataMinimization', 'retentionJustification', 'legalBasisJustification'].map(key => {
                    const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                    const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{label}</h4>
                          {prompt ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                {prompt.isActive ? "Actif" : "Inactif"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{prompt.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                            size="sm"
                            onClick={() => {
                              if (prompt) {
                                openPromptDialog(prompt);
                              } else {
                                promptForm.reset({
                                  name: `${label}`,
                                  description: `Prompt pour générer ${label.toLowerCase()}`,
                                  category: key,
                                  prompt: ""
                                });
                                setEditingPrompt(null);
                                setIsPromptDialogOpen(true);
                              }
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {prompt ? "Modifier" : "Créer"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Mesures techniques et organisationnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Section 3 - Mesures techniques et organisationnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {['dataQualityMeasures', 'informationMeasures', 'consentMeasures', 'accessMeasures', 'rectificationMeasures', 'oppositionMeasures'].map(key => {
                    const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                    const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{label}</h4>
                          {prompt ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                {prompt.isActive ? "Actif" : "Inactif"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{prompt.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                            size="sm"
                            onClick={() => {
                              if (prompt) {
                                openPromptDialog(prompt);
                              } else {
                                promptForm.reset({
                                  name: `${label}`,
                                  description: `Prompt pour générer ${label.toLowerCase()}`,
                                  category: key,
                                  prompt: ""
                                });
                                setEditingPrompt(null);
                                setIsPromptDialogOpen(true);
                              }
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {prompt ? "Modifier" : "Créer"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Analyse des risques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Section 4 - Analyse des risques</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Accès illégitime aux données */}
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">Accès illégitime aux données</h4>
                    <div className="grid gap-3">
                      {['illegitimateAccessImpacts', 'illegitimateAccessThreats', 'illegitimateAccessSources', 'illegitimateAccessMeasures'].map(key => {
                        const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                        const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{label}</h5>
                              {prompt ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                    {prompt.isActive ? "Actif" : "Inactif"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">{prompt.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                                size="sm"
                                onClick={() => {
                                  if (prompt) {
                                    openPromptDialog(prompt);
                                  } else {
                                    promptForm.reset({
                                      name: `${label}`,
                                      description: `Prompt pour générer ${label.toLowerCase()}`,
                                      category: key,
                                      prompt: ""
                                    });
                                    setEditingPrompt(null);
                                    setIsPromptDialogOpen(true);
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {prompt ? "Modifier" : "Créer"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modification non désirée des données */}
                  <div>
                    <h4 className="font-medium mb-3 text-orange-600">Modification non désirée des données</h4>
                    <div className="grid gap-3">
                      {['dataModificationImpacts', 'dataModificationThreats', 'dataModificationSources', 'dataModificationMeasures'].map(key => {
                        const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                        const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50/50">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{label}</h5>
                              {prompt ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                    {prompt.isActive ? "Actif" : "Inactif"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">{prompt.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                                size="sm"
                                onClick={() => {
                                  if (prompt) {
                                    openPromptDialog(prompt);
                                  } else {
                                    promptForm.reset({
                                      name: `${label}`,
                                      description: `Prompt pour générer ${label.toLowerCase()}`,
                                      category: key,
                                      prompt: ""
                                    });
                                    setEditingPrompt(null);
                                    setIsPromptDialogOpen(true);
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {prompt ? "Modifier" : "Créer"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disparition des données */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Disparition des données</h4>
                    <div className="grid gap-3">
                      {['dataDisappearanceImpacts', 'dataDisappearanceThreats', 'dataDisappearanceSources', 'dataDisappearanceMeasures'].map(key => {
                        const prompt = prompts?.find((p: AiPrompt) => p.category === key);
                        const label = dpiaPromptSubcategories[key as keyof typeof dpiaPromptSubcategories];
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{label}</h5>
                              {prompt ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={prompt.isActive ? "default" : "secondary"}>
                                    {prompt.isActive ? "Actif" : "Inactif"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">{prompt.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Aucun prompt configuré</span>
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
                                size="sm"
                                onClick={() => {
                                  if (prompt) {
                                    openPromptDialog(prompt);
                                  } else {
                                    promptForm.reset({
                                      name: `${label}`,
                                      description: `Prompt pour générer ${label.toLowerCase()}`,
                                      category: key,
                                      prompt: ""
                                    });
                                    setEditingPrompt(null);
                                    setIsPromptDialogOpen(true);
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {prompt ? "Modifier" : "Créer"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Diagnostic Questions Management */}
        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions de diagnostic</h3>
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openQuestionDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle question
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Modifier la question" : "Créer une nouvelle question"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingQuestion ? "Modifiez cette question du diagnostic RGPD." : "Ajoutez une nouvelle question au diagnostic de conformité RGPD."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rédigez la question du diagnostic..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={questionForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catégorie</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Sécurité" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ordre</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Action Plans and Risk Levels */}
                    <div className="space-y-6 mt-6 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium">Configuration des plans d'action</h4>
                      
                      {/* Yes Response */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-green-700">Si la réponse est "Oui"</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <FormField
                              control={questionForm.control}
                              name="actionPlanYes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Plan d'action</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Décrivez le plan d'action si la réponse est 'Oui'"
                                      className="min-h-[80px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={questionForm.control}
                            name="riskLevelYes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Niveau de risque</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir un niveau" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="faible">Faible</SelectItem>
                                    <SelectItem value="moyen">Moyen</SelectItem>
                                    <SelectItem value="elevé">Élevé</SelectItem>
                                    <SelectItem value="critique">Critique</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* No Response */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-red-700">Si la réponse est "Non"</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <FormField
                              control={questionForm.control}
                              name="actionPlanNo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Plan d'action</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Décrivez le plan d'action si la réponse est 'Non'"
                                      className="min-h-[80px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={questionForm.control}
                            name="riskLevelNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Niveau de risque</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir un niveau" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="faible">Faible</SelectItem>
                                    <SelectItem value="moyen">Moyen</SelectItem>
                                    <SelectItem value="elevé">Élevé</SelectItem>
                                    <SelectItem value="critique">Critique</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsQuestionDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createQuestionMutation.isPending}>
                        {createQuestionMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingQuestion ? "Modification..." : "Création..."}
                          </>
                        ) : (
                          editingQuestion ? "Modifier" : "Créer"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Questions existantes</CardTitle>
            </CardHeader>
            <CardContent>
              {!questions || questions.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucune question</h3>
                  <p className="text-muted-foreground">
                    Créez votre première question de diagnostic.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question: DiagnosticQuestion) => (
                    <div
                      key={question.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline">#{question.order}</Badge>
                          <Badge variant="secondary">{question.category}</Badge>
                          <Badge variant={question.isActive ? "default" : "secondary"}>
                            {question.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm">{question.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Créée le {new Date(question.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQuestionDialog(question)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteQuestionMutation.mutate(question.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Configuration Management */}
        <TabsContent value="llm-configs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configuration des modèles IA</h3>
            <Dialog open={isLlmDialogOpen} onOpenChange={setIsLlmDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openLlmDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLlm ? "Modifier la configuration" : "Créer une nouvelle configuration"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau fournisseur d'IA pour le système
                  </DialogDescription>
                </DialogHeader>
                <Form {...llmForm}>
                  <form onSubmit={llmForm.handleSubmit(onLlmSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={llmForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: OpenAI GPT-4o" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={llmForm.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fournisseur</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un fournisseur" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                <SelectItem value="azure">Azure OpenAI</SelectItem>
                                <SelectItem value="custom">Personnalisé</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={llmForm.control}
                        name="modelName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du modèle</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: gpt-4o" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={llmForm.control}
                        name="apiKeyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de la clé API</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: OPENAI_API_KEY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={llmForm.control}
                      name="apiEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Point de terminaison API (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: https://api.openai.com/v1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={llmForm.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tokens maximum</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 4000)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={llmForm.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Température</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 0.7" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={llmForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Configuration active</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={llmForm.control}
                        name="supportsJsonMode"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Support mode JSON</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsLlmDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createLlmMutation.isPending || updateLlmMutation.isPending}>
                        {(createLlmMutation.isPending || updateLlmMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingLlm ? "Modification..." : "Création..."}
                          </>
                        ) : (
                          editingLlm ? "Modifier" : "Créer"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configurations IA existantes</CardTitle>
            </CardHeader>
            <CardContent>
              {llmLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <p>Chargement des configurations...</p>
                </div>
              ) : !llmConfigs || llmConfigs.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucune configuration</h3>
                  <p className="text-muted-foreground">
                    Créez votre première configuration de modèle IA.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {llmConfigs.map((config: LlmConfiguration) => (
                    <div
                      key={config.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{config.name}</h4>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">{config.provider}</Badge>
                          {config.supportsJsonMode && (
                            <Badge variant="secondary">JSON</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Modèle:</span> {config.modelName}
                          </div>
                          <div>
                            <span className="font-medium">Tokens max:</span> {config.maxTokens}
                          </div>
                          <div>
                            <span className="font-medium">Température:</span> {config.temperature}
                          </div>
                          <div>
                            <span className="font-medium">Clé API:</span> {config.apiKeyName}
                          </div>
                        </div>
                        {config.apiEndpoint && (
                          <div className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Endpoint:</span> {config.apiEndpoint}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Créée le {new Date(config.createdAt).toLocaleDateString('fr-FR')} • 
                          Modifiée le {new Date(config.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openLlmDialog(config)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteLlmMutation.mutate(config.id)}
                          disabled={deleteLlmMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAG Documents Management */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des documents RAG</h3>
            <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDocumentDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Télécharger un document PDF</DialogTitle>
                  <DialogDescription>
                    Importez un document PDF pour enrichir les réponses de l'IA avec vos propres documents.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document-name">Nom du document (optionnel)</Label>
                    <Input
                      id="document-name"
                      placeholder="Nom descriptif du document"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="document-category">Catégorie</Label>
                    <Select value={documentCategory} onValueChange={setDocumentCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentCategories).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags (mots-clés)</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Ajouter un tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {documentTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {documentTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} <Trash2 className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="file-upload">Fichier PDF</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDocumentDialogOpen(false);
                        setSelectedFile(null);
                        setDocumentName("");
                        setDocumentCategory("general");
                        setDocumentTags([]);
                        setNewTag("");
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploadDocumentMutation.isPending}
                    >
                      {uploadDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        "Télécharger"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Documents importés</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher dans les documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {Object.entries(documentCategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les tags</SelectItem>
                      {allTags.map((tag: string) => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <p>Chargement des documents...</p>
                </div>
              ) : !filteredDocuments || filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    {documents && documents.length > 0 ? "Aucun document correspondant" : "Aucun document"}
                  </h3>
                  <p className="text-muted-foreground">
                    {documents && documents.length > 0 
                      ? "Aucun document ne correspond aux critères de recherche."
                      : "Téléchargez votre premier document PDF pour enrichir les réponses de l'IA."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}
                    {documents && filteredDocuments.length !== documents.length && ` sur ${documents.length}`}
                  </div>
                  {filteredDocuments.map((document: RagDocument) => (
                    <div
                      key={document.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-medium">{document.name}</h4>
                          <Badge variant="outline">
                            {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                          <Badge variant="secondary">
                            {documentCategories[document.category as keyof typeof documentCategories] || document.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Fichier: {document.filename}
                        </p>
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {document.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Importé le {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDocumentMutation.mutate(document.id)}
                          disabled={deleteDocumentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Association Prompt-Document</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configurez quels documents utiliser en priorité pour chaque prompt IA
              </p>
            </CardHeader>
            <CardContent>
              {prompts && prompts.length > 0 ? (
                <div className="space-y-6">
                  {prompts.map((prompt: AiPrompt) => (
                    <div key={prompt.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{prompt.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Catégorie: {prompt.category}
                          </p>
                        </div>
                        <Badge variant={prompt.isActive ? "default" : "secondary"}>
                          {prompt.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Documents disponibles
                          </Label>
                          {documents && documents.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                              {documents.map((document: RagDocument) => {
                                const isAssociated = isDocumentAssociated(prompt.id, document.id);
                                return (
                                  <div
                                    key={document.id}
                                    className={`flex items-center justify-between p-3 border rounded hover:bg-muted/50 ${
                                      isAssociated ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <FileIcon className={`w-4 h-4 ${isAssociated ? 'text-green-600' : 'text-primary'}`} />
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">{document.name}</span>
                                          {isAssociated && (
                                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                              Associé
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {document.filename} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {isAssociated ? (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDissociateDocument(prompt.id, document.id)}
                                          disabled={dissociateDocumentMutation.isPending}
                                        >
                                          {dissociateDocumentMutation.isPending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Trash2 className="w-3 h-3 mr-1" />
                                              Dissocier
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAssociateDocument(prompt.id, document.id, 1)}
                                          disabled={associateDocumentMutation.isPending}
                                        >
                                          {associateDocumentMutation.isPending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Plus className="w-3 h-3 mr-1" />
                                              Associer
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground border rounded">
                              <FileIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucun document disponible</p>
                              <p className="text-xs">Téléchargez des documents dans l'onglet ci-dessus</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucun prompt configuré</h3>
                  <p className="text-muted-foreground">
                    Créez d'abord des prompts IA pour pouvoir les associer à des documents.
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
