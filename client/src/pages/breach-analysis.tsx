import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { breachApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertTriangle, Shield, Download, Loader2, CheckCircle, XCircle, Info } from "lucide-react";

const COMPANY_ID = 1; // Mock company ID

interface DataBreach {
  id: number;
  description: string;
  incidentDate: string;
  dataCategories: string[];
  affectedPersons: number;
  circumstances: string;
  consequences: string;
  measures: string;
  notificationRequired: boolean;
  notificationJustification: string;
  status: string;
  createdAt: string;
}

interface AnalysisResult {
  notificationRequired: boolean;
  justification: string;
  riskLevel: string;
  recommendations: string[];
}

export default function BreachAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      description: "",
      incidentDate: "",
      dataCategories: [] as string[],
      affectedPersons: 0,
      circumstances: "",
      consequences: "",
      measures: "",
    },
  });

  const { data: breaches, isLoading } = useQuery({
    queryKey: ['/api/breaches', COMPANY_ID],
    queryFn: () => breachApi.get(COMPANY_ID).then(res => res.json()),
  });

  const analyzeMutation = useMutation({
    mutationFn: (data: any) => {
      const breachData = {
        ...data,
        companyId: COMPANY_ID,
        incidentDate: new Date(data.incidentDate).toISOString(),
      };
      return breachApi.analyze(breachData);
    },
    onSuccess: (response: any) => {
      const { analysis } = response;
      setAnalysisResult(analysis);
      queryClient.invalidateQueries({ queryKey: ['/api/breaches'] });
      toast({
        title: "Analyse terminée !",
        description: "L'évaluation de la violation a été réalisée selon les lignes directrices EDPB 9/2022.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'analyser la violation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    analyzeMutation.mutate(data);
  };

  const downloadJustification = () => {
    if (!analysisResult) return;
    
    const content = `ANALYSE DE VIOLATION DE DONNÉES PERSONNELLES
    
Date d'analyse: ${new Date().toLocaleDateString('fr-FR')}

RECOMMANDATION:
${analysisResult.notificationRequired ? 
  "Notification à l'autorité de contrôle RECOMMANDÉE" : 
  "Notification à l'autorité de contrôle NON REQUISE"}

NIVEAU DE RISQUE: ${analysisResult.riskLevel.toUpperCase()}

JUSTIFICATION:
${analysisResult.justification}

RECOMMANDATIONS:
${analysisResult.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---
Cette analyse est basée sur les Lignes directrices 9/2022 de l'EDPB sur la notification des violations de données personnelles dans le cadre du RGPD.

AVERTISSEMENT: Cette analyse ne constitue pas un conseil juridique formel. Il est recommandé de consulter un professionnel qualifié pour toute décision finale.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justification_violation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dataCategories = [
    "Données d'identification",
    "Données de contact",
    "Données financières",
    "Données de santé",
    "Données biométriques",
    "Données de localisation",
    "Données comportementales",
    "Autres données sensibles"
  ];

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'élevé':
        return 'text-red-600 dark:text-red-400';
      case 'modéré':
        return 'text-orange-600 dark:text-orange-400';
      case 'faible':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement des analyses...</p>
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
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyse de violations de données</h2>
          <p className="text-muted-foreground">
            Assistant IA basé sur les lignes directrices EDPB 9/2022
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Avertissement :</strong> Cette analyse ne constitue pas un conseil juridique formel. 
          Il est fortement recommandé de consulter un professionnel qualifié pour toute décision finale 
          concernant la notification d'une violation de données.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Analysis Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle analyse de violation</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description de l'incident</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez brièvement la nature de la violation..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de l'incident</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégories de données concernées</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {dataCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={field.value.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, category]);
                                } else {
                                  field.onChange(field.value.filter((c) => c !== category));
                                }
                              }}
                            />
                            <Label htmlFor={category} className="text-sm">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="affectedPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de personnes concernées (estimation)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="circumstances"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Circonstances de la violation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Comment la violation s'est-elle produite ?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consequences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conséquences probables</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Quels sont les impacts possibles pour les personnes concernées ?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="measures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesures prises ou envisagées</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Quelles actions avez-vous mises en place pour remédier à la violation ?"
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
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Analyser la violation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Analysis Result */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {analysisResult.notificationRequired ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <span>Résultat de l'analyse</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommendation */}
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Recommandation</h4>
                <p className={`font-medium ${
                  analysisResult.notificationRequired ? 'text-red-600' : 'text-green-600'
                }`}>
                  {analysisResult.notificationRequired
                    ? "Notification à l'autorité de contrôle RECOMMANDÉE"
                    : "Notification à l'autorité de contrôle NON REQUISE"
                  }
                </p>
              </div>

              {/* Risk Level */}
              <div>
                <Label className="text-sm font-medium">Niveau de risque</Label>
                <p className={`text-lg font-semibold ${getRiskColor(analysisResult.riskLevel)}`}>
                  {analysisResult.riskLevel}
                </p>
              </div>

              {/* Justification */}
              <div>
                <Label className="text-sm font-medium">Justification détaillée</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{analysisResult.justification}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <Label className="text-sm font-medium">Recommandations</Label>
                <ul className="mt-2 space-y-1">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="text-primary font-medium">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <Button onClick={downloadJustification} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Télécharger la justification complète
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Previous Analyses */}
      {breaches && breaches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analyses précédentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breaches.map((breach: DataBreach) => (
                <div key={breach.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{breach.description}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Incident du {new Date(breach.incidentDate).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={breach.notificationRequired ? "destructive" : "default"}>
                          {breach.notificationRequired ? "Notification requise" : "Pas de notification"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {breach.affectedPersons} personnes concernées
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(breach.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
