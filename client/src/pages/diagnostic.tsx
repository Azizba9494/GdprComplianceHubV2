import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { diagnosticApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, FileText, Shield, Users, Settings, Book, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryIcons = {
  "Gouvernance": Settings,
  "Documentation": FileText,
  "Consentement": Users,
  "Sécurité": Shield,
  "Droits": Book,
  "Formation": Users,
  "Violations": AlertTriangle,
};

const categoryDescriptions = {
  "Gouvernance": "Organisation et responsabilités RGPD",
  "Documentation": "Registres et politiques de confidentialité",
  "Consentement": "Collecte et gestion du consentement",
  "Sécurité": "Mesures techniques et organisationnelles",
  "Droits": "Gestion des droits des personnes concernées",
  "Formation": "Sensibilisation et formation du personnel",
  "Violations": "Procédures de gestion des incidents",
};

export default function Diagnostic() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get authenticated user and company
  const { data: authResponse } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => fetch('/api/auth/me').then(res => res.json()),
  });
  
  const { data: userCompany } = useQuery({
    queryKey: ['/api/companies', authResponse?.user?.id],
    queryFn: () => fetch(`/api/companies/${authResponse.user.id}`).then(res => res.json()),
    enabled: !!authResponse?.user?.id,
  });

  const COMPANY_ID = userCompany?.id;

  const { data: allQuestions, isLoading } = useQuery({
    queryKey: ['/api/diagnostic/questions'],
    queryFn: () => diagnosticApi.getQuestions().then(res => res.json()),
  });

  const { data: existingResponses } = useQuery({
    queryKey: ['/api/diagnostic/responses', COMPANY_ID],
    queryFn: () => diagnosticApi.getResponses(COMPANY_ID).then(res => res.json()),
    enabled: !!COMPANY_ID,
  });

  const submitResponseMutation = useMutation({
    mutationFn: (responseData: any) => diagnosticApi.submitResponse(responseData),
    onSuccess: () => {
      console.log('Response submitted successfully');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (companyId: number) => diagnosticApi.analyze(companyId),
    onSuccess: () => {
      toast({
        title: "Questionnaire terminé !",
        description: "Vos réponses ont été enregistrées et analysées.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic/responses'] });
      setSelectedCategory(null);
      setCurrentQuestionIndex(0);
      setResponses({});
    },
  });

  // Show loading while getting company info
  if (!userCompany && authResponse?.user) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Process data
  const categories = allQuestions ? Array.from(new Set(allQuestions.map((q: any) => q.category))) as string[] : [];
  const questionsByCategory = allQuestions ? allQuestions.filter((q: any) => q.category === selectedCategory) : [];
  const answeredQuestionIds = existingResponses ? existingResponses.map((r: any) => r.questionId) : [];
  
  // Update completed categories based on existing responses
  React.useEffect(() => {
    if (existingResponses && allQuestions) {
      const completedList: string[] = [];
      const allCategories = Array.from(new Set(allQuestions.map((q: any) => q.category))) as string[];
      allCategories.forEach((category: string) => {
        const categoryQuestions = allQuestions.filter((q: any) => q.category === category);
        const answeredInCategory = categoryQuestions.filter((q: any) => 
          existingResponses.some((r: any) => r.questionId === q.id)
        );
        if (answeredInCategory.length === categoryQuestions.length && categoryQuestions.length > 0) {
          completedList.push(category);
        }
      });
      setCompletedCategories(new Set(completedList));
    }
  }, [existingResponses, allQuestions]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Chargement du diagnostic...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Aucune question de diagnostic disponible.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show category selection if no category is selected
  if (!selectedCategory) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic RGPD par catégorie</CardTitle>
            <p className="text-muted-foreground">
              Choisissez une catégorie de questions pour commencer votre diagnostic RGPD.
              Vous pouvez compléter les questionnaires dans l'ordre de votre choix.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || FileText;
                const isCompleted = completedCategories.has(category);
                const categoryQuestions = allQuestions.filter((q: any) => q.category === category);
                
                return (
                  <Card 
                    key={category} 
                    className={`cursor-pointer transition-all hover:shadow-md ${isCompleted ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'hover:border-primary'}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-8 h-8 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{category}</h3>
                            {isCompleted && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Terminé
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {categoryQuestions.length} question{categoryQuestions.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questionsByCategory[currentQuestionIndex];
  const progress = questionsByCategory.length > 0 ? ((currentQuestionIndex + 1) / questionsByCategory.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questionsByCategory.length - 1;

  const handleResponse = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    const response = responses[currentQuestion.id];
    if (!response) {
      toast({
        title: "Réponse requise",
        description: "Veuillez sélectionner une réponse avant de continuer.",
        variant: "destructive",
      });
      return;
    }

    // Submit the response
    const score = response === "oui" ? 1 : 0;
    await submitResponseMutation.mutateAsync({
      companyId: COMPANY_ID,
      questionId: currentQuestion.id,
      response,
      score,
    });

    if (isLastQuestion) {
      // Analyze all responses and generate action plan
      await analyzeMutation.mutateAsync(COMPANY_ID);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Show questionnaire for selected category
  if (!currentQuestion) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Questionnaire "{selectedCategory}" terminé !</h2>
              <p className="text-muted-foreground">
                Toutes les questions de cette catégorie ont été complétées.
              </p>
              <Button onClick={() => setSelectedCategory(null)}>
                Retour aux catégories
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Diagnostic RGPD - {selectedCategory}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="mt-2 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                >
                  ← Retour aux catégories
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} sur {questionsByCategory.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
            
            <RadioGroup
              value={responses[currentQuestion.id] || ""}
              onValueChange={handleResponse}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oui" id="oui" />
                <Label htmlFor="oui">Oui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non" id="non" />
                <Label htmlFor="non">Non</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            <Button
              onClick={handleNext}
              disabled={submitResponseMutation.isPending || analyzeMutation.isPending}
            >
              {isLastQuestion ? "Terminer le diagnostic" : "Suivant"}
              {!isLastQuestion && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
