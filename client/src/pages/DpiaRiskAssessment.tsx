import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, AlertTriangle, Users, Shield, Zap } from "lucide-react";

interface RiskAssessmentProps {
  dpiaId: number;
  companyId: number;
  processingRecord?: any;
}

const RISK_CATEGORIES = [
  {
    id: 'illegitimate_access',
    title: 'Accès illégitime aux données',
    icon: <Shield className="h-5 w-5" />,
    color: 'red'
  },
  {
    id: 'unwanted_modification', 
    title: 'Modification non désirée des données',
    icon: <Zap className="h-5 w-5" />,
    color: 'orange'
  },
  {
    id: 'data_disappearance',
    title: 'Disparition des données',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'yellow'
  }
];

const RISK_SECTIONS = [
  {
    id: 'potentialImpacts',
    title: 'Impacts potentiels sur les personnes concernées',
    description: 'Analysez les conséquences possibles pour les individus',
    promptKey: 'dpia_risk_impacts'
  },
  {
    id: 'threats',
    title: 'Menaces identifiées', 
    description: 'Identifiez les menaces spécifiques à ce traitement',
    promptKey: 'dpia_risk_threats'
  },
  {
    id: 'riskSources',
    title: 'Sources de risque',
    description: 'Analysez l\'origine des risques identifiés',
    promptKey: 'dpia_risk_sources'
  },
  {
    id: 'existingMeasures',
    title: 'Mesures existantes ou prévues',
    description: 'Documentez les mesures de protection en place',
    promptKey: 'dpia_risk_measures'
  }
];

export default function DpiaRiskAssessment({ dpiaId, companyId, processingRecord }: RiskAssessmentProps) {
  const [riskData, setRiskData] = useState<Record<string, Record<string, string>>>({});
  const [loadingPrompts, setLoadingPrompts] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing risk assessment data
  const { data: existingRiskData } = useQuery({
    queryKey: [`/api/dpia/${dpiaId}/risks`],
    enabled: !!dpiaId,
  });

  // Remove unused mutation - using direct API calls now

  const handleGenerateAnalysis = async (riskCategory: string, section: string, promptKey: string) => {
    const key = `${riskCategory}-${section}`;
    setLoadingPrompts(prev => ({ ...prev, [key]: true }));
    
    try {
      // Call AI generation API directly
      const response = await fetch('/api/ai/generate-risk-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: section,
          companyId,
          processingRecordId: dpiaId,
          riskType: riskCategory
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }
      
      const data = await response.json();
      
      // Update the risk data
      setRiskData(prev => ({
        ...prev,
        [riskCategory]: {
          ...prev[riskCategory],
          [section]: data.content
        }
      }));
      
      toast({ 
        title: "Contenu généré avec succès",
        description: "L'analyse de risque a été générée par l'IA."
      });
      
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({ 
        title: "Erreur lors de la génération", 
        description: error.message || "Une erreur est survenue",
        variant: "destructive" 
      });
    } finally {
      setLoadingPrompts(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTextChange = (riskCategory: string, section: string, value: string) => {
    setRiskData(prev => ({
      ...prev,
      [riskCategory]: {
        ...prev[riskCategory],
        [section]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Analyse des risques</h2>
        <p className="text-muted-foreground mt-2">
          Évaluez les risques pour chaque type de menace et utilisez l'IA pour enrichir votre analyse
        </p>
      </div>

      {RISK_CATEGORIES.map((riskCategory) => (
        <Card key={riskCategory.id} className="border-l-4" 
              style={{ borderLeftColor: riskCategory.color === 'red' ? '#ef4444' : 
                                        riskCategory.color === 'orange' ? '#f97316' : '#eab308' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {riskCategory.icon}
              {riskCategory.title}
            </CardTitle>
            <CardDescription>
              Analysez les risques liés à {riskCategory.title.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {RISK_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{section.title}</h4>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAnalysis(riskCategory.id, section.id, section.promptKey)}
                    disabled={loadingPrompts[`${riskCategory.id}-${section.id}`]}
                  >
                    {loadingPrompts[`${riskCategory.id}-${section.id}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Générer avec l'IA
                  </Button>
                </div>
                
                <Textarea
                  placeholder={`Décrivez ${section.title.toLowerCase()} pour ${riskCategory.title.toLowerCase()}...`}
                  value={riskData[riskCategory.id]?.[section.id] || ''}
                  onChange={(e) => handleTextChange(riskCategory.id, section.id, e.target.value)}
                  rows={4}
                  className="min-h-[100px]"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}