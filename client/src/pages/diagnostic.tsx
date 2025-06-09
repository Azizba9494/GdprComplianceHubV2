import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { diagnosticApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COMPANY_ID = 1; // Mock company ID

export default function Diagnostic() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/diagnostic/questions'],
    queryFn: () => diagnosticApi.getQuestions().then(res => res.json()),
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
        title: "Diagnostic terminé !",
        description: "Votre plan d'action personnalisé a été généré.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setIsCompleted(true);
    },
  });

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

  if (!questions || questions.length === 0) {
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

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

  if (isCompleted) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Diagnostic terminé !</h2>
              <p className="text-muted-foreground">
                Votre diagnostic RGPD a été analysé et votre plan d'action personnalisé est maintenant disponible.
              </p>
              <Button onClick={() => window.location.href = '/actions'}>
                Voir mon plan d'action
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
              <CardTitle>Diagnostic RGPD</CardTitle>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} sur {questions.length}
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
