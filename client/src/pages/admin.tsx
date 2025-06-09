import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, diagnosticApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Settings, Plus, Edit, Brain, MessageSquare, ClipboardList, 
  FileText, AlertTriangle, BarChart3, Loader2, CheckCircle, Clock
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
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<DiagnosticQuestion | null>(null);
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

  const questionForm = useForm({
    defaultValues: {
      question: "",
      category: "",
      order: 0,
    },
  });

  // Queries
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['/api/admin/prompts'],
    queryFn: () => adminApi.getPrompts().then(res => res.json()),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/diagnostic/questions'],
    queryFn: () => diagnosticApi.getQuestions().then(res => res.json()),
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
    mutationFn: (data: any) => {
      // This would need to be implemented in the API
      return Promise.resolve(); // Placeholder
    },
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

  const onPromptSubmit = (data: any) => {
    if (editingPrompt) {
      updatePromptMutation.mutate({ id: editingPrompt.id, data });
    } else {
      createPromptMutation.mutate(data);
    }
  };

  const onQuestionSubmit = (data: any) => {
    if (editingQuestion) {
      // Update question logic
    } else {
      createQuestionMutation.mutate(data);
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
      });
    } else {
      setEditingQuestion(null);
      questionForm.reset();
    }
    setIsQuestionDialogOpen(true);
  };

  const togglePromptStatus = (prompt: AiPrompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      data: { isActive: !prompt.isActive }
    });
  };

  if (promptsLoading || questionsLoading) {
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
            Gérez les prompts IA et les questions de diagnostic
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuestionDialog(question)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
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
