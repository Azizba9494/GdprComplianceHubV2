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

    uploadDocumentMutation.mutate(formData);
  };

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

  const openPromptDialog = (prompt?: AiPrompt) => {
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
      promptForm.reset();
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
      </Tabs>
    </div>
  );
}
