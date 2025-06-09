import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dpiaApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  BarChart3, Plus, AlertTriangle, Shield, Download, Loader2, 
  CheckCircle, Info, FileText, Lightbulb, Search
} from "lucide-react";

const COMPANY_ID = 1; // Mock company ID

interface DpiaAssessment {
  id: number;
  processingName: string;
  processingDescription: string;
  riskAssessment: {
    risks: Array<{
      threat: string;
      impact: string;
      likelihood: string;
      severity: string;
    }>;
    measures: Array<{
      type: string;
      description: string;
      effectiveness: string;
    }>;
  };
  status: string;
  createdAt: string;
}

interface RiskAssessment {
  risks: Array<{
    threat: string;
    impact: string;
    likelihood: string;
    severity: string;
  }>;
  measures: Array<{
    type: string;
    description: string;
    effectiveness: string;
  }>;
}

export default function DPIA() {
  const [isAssessing, setIsAssessing] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<RiskAssessment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      processingName: "",
      processingDescription: "",
    },
  });

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['/api/dpia', COMPANY_ID],
    queryFn: () => dpiaApi.get(COMPANY_ID).then(res => res.json()),
  });

  const assessMutation = useMutation({
    mutationFn: (data: { processingName: string; processingDescription: string }) =>
      dpiaApi.assess({
        companyId: COMPANY_ID,
        processingName: data.processingName,
        processingDescription: data.processingDescription,
      }),
    onSuccess: (response: any) => {
      const assessment = response;
      setCurrentAssessment(assessment.riskAssessment);
      queryClient.invalidateQueries({ queryKey: ['/api/dpia'] });
      setIsAssessing(false);
      toast({
        title: "Analyse d'impact terminée !",
        description: "L'évaluation des risques a été réalisée selon la méthodologie CNIL.",
      });
    },
    onError: (error: any) => {
      setIsAssessing(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réaliser l'analyse d'impact",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { processingName: string; processingDescription: string }) => {
    setIsAssessing(true);
    setCurrentAssessment(null);
    assessMutation.mutate(data);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'maximale':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'importante':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
      case 'limitée':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      case 'négligeable':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300';
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood.toLowerCase()) {
      case 'élevée':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'modérée':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
      case 'faible':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300';
    }
  };

  const downloadReport = () => {
    if (!currentAssessment) return;

    const formData = form.getValues();
    const content = `ANALYSE D'IMPACT RELATIVE À LA PROTECTION DES DONNÉES (AIPD)

Nom du traitement: ${formData.processingName}
Description: ${formData.processingDescription}
Date d'analyse: ${new Date().toLocaleDateString('fr-FR')}

=== ÉVALUATION DES RISQUES ===

${currentAssessment.risks.map((risk, index) => `
RISQUE ${index + 1}:
- Menace: ${risk.threat}
- Impact: ${risk.impact}
- Vraisemblance: ${risk.likelihood}
- Gravité: ${risk.severity}
`).join('\n')}

=== MESURES DE PROTECTION ===

${currentAssessment.measures.map((measure, index) => `
MESURE ${index + 1}:
- Type: ${measure.type}
- Description: ${measure.description}
- Efficacité: ${measure.effectiveness}
`).join('\n')}

---
Cette analyse a été réalisée selon la méthodologie CNIL pour les analyses d'impact relatives à la protection des données.

AVERTISSEMENT: Cette analyse est générée automatiquement et doit être revue par un expert en protection des données.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aipd_${formData.processingName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement des analyses d'impact...</p>
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
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyse d'Impact (AIPD)</h2>
          <p className="text-muted-foreground">
            Assistant pour la réalisation d'analyses d'impact selon la méthodologie CNIL
          </p>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quand réaliser une AIPD ?</strong> Une analyse d'impact est obligatoire pour les traitements 
          susceptibles d'engendrer un risque élevé pour les droits et libertés des personnes physiques.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assessment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle analyse d'impact</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="processingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du traitement</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Système de vidéosurveillance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="processingDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description détaillée du traitement</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez le traitement, les données collectées, les finalités, les destinataires, la durée de conservation..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isAssessing || assessMutation.isPending}
                >
                  {isAssessing || assessMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyser les risques
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Assessment Results */}
        {currentAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Résultats de l'analyse</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risks */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>Risques identifiés</span>
                </h4>
                <div className="space-y-3">
                  {currentAssessment.risks.map((risk, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">{risk.threat}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{risk.impact}</p>
                      <div className="flex space-x-2">
                        <Badge 
                          variant="outline"
                          className={getLikelihoodColor(risk.likelihood)}
                        >
                          {risk.likelihood}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={getSeverityColor(risk.severity)}
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Measures */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Mesures recommandées</span>
                </h4>
                <div className="space-y-3">
                  {currentAssessment.measures.map((measure, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="default">{measure.type}</Badge>
                        <span className="text-sm font-medium">{measure.effectiveness}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{measure.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Button onClick={downloadReport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le rapport AIPD
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Previous Assessments */}
      {assessments && assessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analyses précédentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessments.map((assessment: DpiaAssessment) => (
                <div key={assessment.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{assessment.processingName}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {assessment.processingDescription}
                      </p>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge variant="default">
                          {assessment.riskAssessment?.risks?.length || 0} risques identifiés
                        </Badge>
                        <Badge variant="outline">
                          {assessment.riskAssessment?.measures?.length || 0} mesures proposées
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(assessment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Voir le détail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span>Guide méthodologique</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">1. Description du traitement</h4>
                <p className="text-sm text-muted-foreground">
                  Décrivez précisément le traitement envisagé, ses finalités, 
                  les données collectées et les personnes concernées.
                </p>
              </div>
              <div>
                <h4 className="font-medium">2. Évaluation des risques</h4>
                <p className="text-sm text-muted-foreground">
                  L'IA identifie les menaces potentielles et évalue leur impact 
                  sur les droits et libertés des personnes.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">3. Mesures de protection</h4>
                <p className="text-sm text-muted-foreground">
                  Des mesures techniques et organisationnelles sont proposées 
                  pour réduire les risques identifiés.
                </p>
              </div>
              <div>
                <h4 className="font-medium">4. Rapport final</h4>
                <p className="text-sm text-muted-foreground">
                  Un rapport complet est généré, conforme à la méthodologie CNIL 
                  et prêt pour archivage ou présentation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
