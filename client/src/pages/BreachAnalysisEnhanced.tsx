import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Eye, 
  Calendar,
  Clock,
  Users,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Brain,
  Table,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Breach {
  id: number;
  companyId: number;
  incidentDate: string;
  discoveryDate: string;
  description: string;
  affectedDataTypes: string[];
  estimatedAffectedPersons: number;
  breachType: string;
  severity: string;
  technicalMeasures?: string;
  organizationalMeasures?: string;
  potentialImpact?: string;
  actualImpact?: string;
  riskAnalysisResult?: string;
  aiRecommendationAuthority?: string;
  aiRecommendationDataSubject?: string;
  aiJustification?: string;
  notificationRequired?: boolean;
  notificationDate?: string;
  notificationReason?: string;
  cnilResponse?: string;
  dataSubjectNotificationRequired?: boolean;
  dataSubjectNotificationDate?: string;
  dataSubjectNotificationMessage?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BreachAnalysisEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBreach, setSelectedBreach] = useState<Breach | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    // Nature de la violation
    violationStatus: 'etabli' as 'etabli' | 'suppose',
    discoveryDate: "",
    discoveryTime: "",
    discoveryUnknown: false,
    startDate: "",
    startTime: "",
    startUnknown: false,
    endDate: "",
    endTime: "",
    endUnknown: false,
    providerNotificationDate: "",
    providerNotificationTime: "",
    extendedPeriod: false,
    ongoingViolation: false,
    discoveryCircumstances: "",
    
    // Origines
    origins: [] as string[],
    otherOrigin: "",
    originUnknown: false,
    
    // Circonstances
    circumstances: [] as string[],
    otherCircumstance: "",
    circumstanceUnknown: false,
    
    // Causes
    causes: [] as string[],
    otherCause: "",
    causeUnknown: false,
    
    // Types de violation
    violationTypes: [] as string[],
    otherViolationType: "",
    
    // Données concernées
    dataCategories: [] as string[],
    otherDataCategory: "",
    dataCategoryUnknown: false,
    
    // Nombre de personnes
    exactPersonCount: "",
    estimatedPersonCount: "",
    personCountUnknown: false,
    
    // Conséquences
    consequences: [] as string[],
    otherConsequence: "",
    consequenceUnknown: false,
    
    // Mesures prises
    measures: [] as string[],
    otherMeasure: "",
    measureUnknown: false,
    
    // Mesures de sécurité préexistantes
    preexistingMeasures: [] as string[],
    otherPreexistingMeasure: "",
    
    // Informations complémentaires
    additionalInfo: "",
    
    // Évaluation interne
    internalAssessment: "",
    riskLevel: "",
    notificationDecision: "",
    notificationJustification: "",
  });

  // Fetch breaches
  const { data: breaches, isLoading } = useQuery({
    queryKey: ['/api/breaches/1'],
    staleTime: 5 * 60 * 1000,
  });

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async (breachData: any) => {
      setIsAnalyzing(true);
      const response = await apiRequest("POST", "/api/breaches/ai-analysis", breachData);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Analyse IA terminée",
        description: "L'analyse de la violation selon les directives EDPB a été effectuée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breaches/1'] });
      setIsAnalyzing(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'analyse IA.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  // Create/Update breach mutation
  const breachMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedBreach) {
        return await apiRequest("PUT", `/api/breaches/${selectedBreach.id}`, data);
      } else {
        return await apiRequest("POST", "/api/breaches", { ...data, companyId: 1 });
      }
    },
    onSuccess: () => {
      toast({
        title: selectedBreach ? "Violation mise à jour" : "Violation créée",
        description: "Les informations ont été sauvegardées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breaches/1'] });
      setShowForm(false);
      setSelectedBreach(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la violation.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      violationStatus: 'etabli',
      discoveryDate: "",
      discoveryTime: "",
      discoveryUnknown: false,
      startDate: "",
      startTime: "",
      startUnknown: false,
      endDate: "",
      endTime: "",
      endUnknown: false,
      providerNotificationDate: "",
      providerNotificationTime: "",
      extendedPeriod: false,
      ongoingViolation: false,
      discoveryCircumstances: "",
      origins: [],
      otherOrigin: "",
      originUnknown: false,
      circumstances: [],
      otherCircumstance: "",
      circumstanceUnknown: false,
      causes: [],
      otherCause: "",
      causeUnknown: false,
      violationTypes: [],
      otherViolationType: "",
      dataCategories: [],
      otherDataCategory: "",
      dataCategoryUnknown: false,
      exactPersonCount: "",
      estimatedPersonCount: "",
      personCountUnknown: false,
      consequences: [],
      otherConsequence: "",
      consequenceUnknown: false,
      measures: [],
      otherMeasure: "",
      measureUnknown: false,
      preexistingMeasures: [],
      otherPreexistingMeasure: "",
      additionalInfo: "",
      internalAssessment: "",
      riskLevel: "",
      notificationDecision: "",
      notificationJustification: "",
    });
  };

  const handleEdit = (breach: Breach) => {
    setSelectedBreach(breach);
    // For existing breaches, populate basic fields for backward compatibility
    setFormData({
      ...formData,
      startDate: breach.incidentDate.split('T')[0],
      discoveryDate: breach.discoveryDate ? breach.discoveryDate.split('T')[0] : "",
      discoveryCircumstances: breach.description,
      estimatedPersonCount: breach.estimatedAffectedPersons?.toString() || "",
      measures: breach.technicalMeasures ? [breach.technicalMeasures] : [],
      additionalInfo: breach.organizationalMeasures || "",
    });
    setShowForm(true);
    setActiveTab("form");
  };

  const handleNewBreach = () => {
    setSelectedBreach(null);
    resetForm();
    setShowForm(true);
    setActiveTab("form");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform comprehensive form data for storage
    const breachData = {
      companyId: 1,
      description: formData.discoveryCircumstances,
      incidentDate: formData.startDate,
      discoveryDate: formData.discoveryDate,
      affectedPersons: parseInt(formData.exactPersonCount || formData.estimatedPersonCount) || 0,
      dataCategories: formData.dataCategories,
      circumstances: formData.circumstances.join(', '),
      consequences: formData.consequences.join(', '),
      measures: formData.measures.join(', '),
      
      // Store comprehensive data in JSON for AI analysis
      comprehensiveData: JSON.stringify(formData),
      
      // Legacy fields for compatibility
      estimatedAffectedPersons: parseInt(formData.exactPersonCount || formData.estimatedPersonCount) || 0,
      technicalMeasures: formData.measures.join(', '),
      organizationalMeasures: formData.preexistingMeasures.join(', '),
      potentialImpact: formData.consequences.join(', '),
      actualImpact: formData.otherConsequence,
      breachType: formData.violationTypes.length > 0 ? formData.violationTypes[0] : 'confidentiality',
      severity: formData.riskLevel || 'medium'
    };
    
    breachMutation.mutate(breachData);
  };

  const handleAIAnalysis = (breach: Breach) => {
    aiAnalysisMutation.mutate({
      id: breach.id,
      ...breach
    });
  };

  const downloadJustification = (breach: Breach) => {
    if (!breach.aiJustification) return;
    
    const content = `Analyse de Violation de Données - Justification IA

Date de l'incident: ${new Date(breach.incidentDate).toLocaleDateString()}
Date de découverte: ${new Date(breach.discoveryDate).toLocaleDateString()}
Description: ${breach.description}

RECOMMANDATIONS:
Notification à l'autorité de contrôle: ${breach.aiRecommendationAuthority === 'required' ? 'REQUISE' : 'NON REQUISE'}
Notification aux personnes concernées: ${breach.aiRecommendationDataSubject === 'required' ? 'REQUISE' : 'NON REQUISE'}

JUSTIFICATION DÉTAILLÉE:
${breach.aiJustification}

AVERTISSEMENT:
Cette évaluation est basée sur les directives EDPB Guidelines 9/2022 et les informations fournies. Elle ne constitue pas un conseil juridique formel. Il est recommandé de consulter des professionnels juridiques qualifiés ou un DPO pour les décisions finales.

Généré le: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justification-violation-${breach.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse des Violations</h1>
          <p className="text-muted-foreground">
            Gestion et analyse des violations de données selon les directives EDPB Guidelines 9/2022
          </p>
        </div>
        <Button onClick={handleNewBreach}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Violation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Liste des Violations</TabsTrigger>
          <TabsTrigger value="form">Formulaire</TabsTrigger>
          <TabsTrigger value="summary">Tableau de Synthèse</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : breaches?.length > 0 ? (
            <div className="grid gap-4">
              {breaches.map((breach: Breach) => (
                <Card key={breach.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Violation #{breach.id}
                        </CardTitle>
                        <CardDescription>
                          {new Date(breach.incidentDate).toLocaleDateString()} - {breach.description.substring(0, 100)}...
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(breach.severity)}>
                          {breach.severity}
                        </Badge>
                        <Badge className={getStatusColor(breach.status)}>
                          {breach.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Découvert: {new Date(breach.discoveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Personnes affectées: {breach.estimatedAffectedPersons || 'Non précisé'}</span>
                      </div>
                    </div>

                    {breach.aiRecommendationAuthority && (
                      <Alert className="mb-4">
                        <Brain className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Analyse IA:</strong> Notification autorité: 
                          <Badge variant={breach.aiRecommendationAuthority === 'required' ? 'destructive' : 'secondary'} className="ml-2">
                            {breach.aiRecommendationAuthority === 'required' ? 'REQUISE' : 'NON REQUISE'}
                          </Badge>
                          {breach.aiJustification && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => downloadJustification(breach)}
                              className="ml-2 p-0 h-auto"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Télécharger la justification
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(breach)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        {!breach.aiRecommendationAuthority && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAIAnalysis(breach)}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4 mr-2" />
                            )}
                            Analyse IA
                          </Button>
                        )}
                      </div>
                      {breach.notificationRequired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://notifications.cnil.fr/notifications/index', '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Notifier à la CNIL
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune violation enregistrée</h3>
                <p className="text-gray-500 mb-4">
                  Commencez par enregistrer une violation de données pour l'analyser.
                </p>
                <Button onClick={handleNewBreach}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une violation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="form">
          {showForm ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedBreach ? 'Modifier la Violation' : 'Nouvelle Violation'}</CardTitle>
                <CardDescription>
                  Saisissez les détails de la violation selon les directives EDPB Guidelines 9/2022
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1: Nature de la violation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">1. Nature de la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Statut de la violation</Label>
                        <Select value={formData.violationStatus} onValueChange={(value: 'etabli' | 'suppose') => setFormData({ ...formData, violationStatus: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="etabli">Violation établie</SelectItem>
                            <SelectItem value="suppose">Violation supposée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date de début de la violation</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              disabled={formData.startUnknown}
                            />
                            <Input
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                              disabled={formData.startUnknown}
                            />
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Checkbox
                              id="startUnknown"
                              checked={formData.startUnknown}
                              onCheckedChange={(checked) => setFormData({ ...formData, startUnknown: checked as boolean })}
                            />
                            <Label htmlFor="startUnknown" className="text-sm">Date/heure inconnue</Label>
                          </div>
                        </div>

                        <div>
                          <Label>Date de prise de connaissance *</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={formData.discoveryDate}
                              onChange={(e) => setFormData({ ...formData, discoveryDate: e.target.value })}
                              disabled={formData.discoveryUnknown}
                              required={!formData.discoveryUnknown}
                            />
                            <Input
                              type="time"
                              value={formData.discoveryTime}
                              onChange={(e) => setFormData({ ...formData, discoveryTime: e.target.value })}
                              disabled={formData.discoveryUnknown}
                            />
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Checkbox
                              id="discoveryUnknown"
                              checked={formData.discoveryUnknown}
                              onCheckedChange={(checked) => setFormData({ ...formData, discoveryUnknown: checked as boolean })}
                            />
                            <Label htmlFor="discoveryUnknown" className="text-sm">Date/heure inconnue</Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Date de fin de la violation</Label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            disabled={formData.endUnknown || formData.ongoingViolation}
                          />
                          <Input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            disabled={formData.endUnknown || formData.ongoingViolation}
                          />
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="endUnknown"
                              checked={formData.endUnknown}
                              onCheckedChange={(checked) => setFormData({ ...formData, endUnknown: checked as boolean })}
                            />
                            <Label htmlFor="endUnknown" className="text-sm">Date/heure inconnue</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="ongoingViolation"
                              checked={formData.ongoingViolation}
                              onCheckedChange={(checked) => setFormData({ ...formData, ongoingViolation: checked as boolean })}
                            />
                            <Label htmlFor="ongoingViolation" className="text-sm">Violation en cours</Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Circonstances de découverte *</Label>
                        <Textarea
                          placeholder="Décrivez comment la violation a été découverte..."
                          value={formData.discoveryCircumstances}
                          onChange={(e) => setFormData({ ...formData, discoveryCircumstances: e.target.value })}
                          rows={3}
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 2: Origines */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">2. Origines de la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les origines applicables</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Action malveillante externe',
                            'Action malveillante interne',
                            'Erreur humaine',
                            'Défaillance technique',
                            'Catastrophe naturelle',
                            'Force majeure'
                          ].map((origin) => (
                            <div key={origin} className="flex items-center space-x-2">
                              <Checkbox
                                id={`origin-${origin}`}
                                checked={formData.origins.includes(origin)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, origins: [...formData.origins, origin] });
                                  } else {
                                    setFormData({ ...formData, origins: formData.origins.filter(o => o !== origin) });
                                  }
                                }}
                              />
                              <Label htmlFor={`origin-${origin}`} className="text-sm">{origin}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Autre origine</Label>
                        <Input
                          placeholder="Précisez une autre origine..."
                          value={formData.otherOrigin}
                          onChange={(e) => setFormData({ ...formData, otherOrigin: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="originUnknown"
                          checked={formData.originUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, originUnknown: checked as boolean })}
                        />
                        <Label htmlFor="originUnknown" className="text-sm">Origine inconnue</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 3: Types de violation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">3. Types de violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les types applicables</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Violation de confidentialité',
                            'Violation d\'intégrité',
                            'Violation de disponibilité'
                          ].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={formData.violationTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, violationTypes: [...formData.violationTypes, type] });
                                  } else {
                                    setFormData({ ...formData, violationTypes: formData.violationTypes.filter(t => t !== type) });
                                  }
                                }}
                              />
                              <Label htmlFor={`type-${type}`} className="text-sm">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4: Données concernées */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">4. Données à caractère personnel concernées</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Catégories de données</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Données d\'identification',
                            'Données de contact',
                            'Données financières',
                            'Données de santé',
                            'Données sensibles',
                            'Données de géolocalisation',
                            'Données techniques',
                            'Autres données personnelles'
                          ].map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`data-${category}`}
                                checked={formData.dataCategories.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, dataCategories: [...formData.dataCategories, category] });
                                  } else {
                                    setFormData({ ...formData, dataCategories: formData.dataCategories.filter(d => d !== category) });
                                  }
                                }}
                              />
                              <Label htmlFor={`data-${category}`} className="text-sm">{category}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre exact de personnes concernées</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.exactPersonCount}
                            onChange={(e) => setFormData({ ...formData, exactPersonCount: e.target.value })}
                            disabled={formData.personCountUnknown}
                          />
                        </div>
                        <div>
                          <Label>Nombre estimé (si exact inconnu)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.estimatedPersonCount}
                            onChange={(e) => setFormData({ ...formData, estimatedPersonCount: e.target.value })}
                            disabled={formData.personCountUnknown}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="personCountUnknown"
                          checked={formData.personCountUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, personCountUnknown: checked as boolean })}
                        />
                        <Label htmlFor="personCountUnknown" className="text-sm">Nombre de personnes inconnu</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 5: Conséquences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">5. Conséquences potentielles ou effectives</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les conséquences applicables</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Préjudices matériels',
                            'Préjudices moraux',
                            'Usurpation d\'identité',
                            'Atteinte à la réputation',
                            'Discrimination',
                            'Chantage/extorsion',
                            'Perte de confiance',
                            'Aucune conséquence identifiée'
                          ].map((consequence) => (
                            <div key={consequence} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cons-${consequence}`}
                                checked={formData.consequences.includes(consequence)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, consequences: [...formData.consequences, consequence] });
                                  } else {
                                    setFormData({ ...formData, consequences: formData.consequences.filter(c => c !== consequence) });
                                  }
                                }}
                              />
                              <Label htmlFor={`cons-${consequence}`} className="text-sm">{consequence}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 6: Mesures prises */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">6. Mesures prises pour remédier à la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Mesures techniques et organisationnelles</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Isolation du système compromis',
                            'Changement des mots de passe',
                            'Mise à jour de sécurité',
                            'Suppression des données compromises',
                            'Notification aux personnes concernées',
                            'Formation du personnel',
                            'Révision des procédures',
                            'Audit de sécurité'
                          ].map((measure) => (
                            <div key={measure} className="flex items-center space-x-2">
                              <Checkbox
                                id={`measure-${measure}`}
                                checked={formData.measures.includes(measure)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, measures: [...formData.measures, measure] });
                                  } else {
                                    setFormData({ ...formData, measures: formData.measures.filter(m => m !== measure) });
                                  }
                                }}
                              />
                              <Label htmlFor={`measure-${measure}`} className="text-sm">{measure}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 7: Évaluation du risque */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">7. Évaluation interne du risque</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Niveau de risque évalué</Label>
                        <Select value={formData.riskLevel} onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez le niveau de risque" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Risque faible</SelectItem>
                            <SelectItem value="medium">Risque modéré</SelectItem>
                            <SelectItem value="high">Risque élevé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Justification de l'évaluation</Label>
                        <Textarea
                          placeholder="Justifiez votre évaluation du niveau de risque..."
                          value={formData.internalAssessment}
                          onChange={(e) => setFormData({ ...formData, internalAssessment: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />
                  
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Une fois sauvegardée, vous pourrez lancer l'analyse IA pour obtenir une recommandation basée sur les directives EDPB Guidelines 9/2022 avec toutes ces informations détaillées.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setActiveTab("list");
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={breachMutation.isPending}>
                      {breachMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {selectedBreach ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Formulaire de violation</h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une violation à modifier ou créez-en une nouvelle.
                </p>
                <Button onClick={handleNewBreach}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Violation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Table className="w-5 h-5 mr-2" />
                Tableau de Synthèse des Violations
              </CardTitle>
              <CardDescription>
                Tableau récapitulatif éditable de toutes les violations analysées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {breaches && breaches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date de début</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date de découverte</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Description</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Mesures prises</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Répercussions</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Analyse du risque</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification CNIL</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification personnes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaches.map((breach: Breach) => (
                        <tr key={breach.id}>
                          <td className="border border-gray-300 p-2 text-sm">
                            {new Date(breach.incidentDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {new Date(breach.discoveryDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            <div className="truncate" title={breach.description}>
                              {breach.description.substring(0, 50)}...
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            <div className="truncate" title={breach.technicalMeasures || ''}>
                              {(breach.technicalMeasures || '').substring(0, 50)}
                              {(breach.technicalMeasures || '').length > 50 ? '...' : ''}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            <div className="truncate" title={breach.potentialImpact || ''}>
                              {(breach.potentialImpact || '').substring(0, 50)}
                              {(breach.potentialImpact || '').length > 50 ? '...' : ''}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {breach.aiRecommendationAuthority ? (
                              <Badge variant={breach.aiRecommendationAuthority === 'required' ? 'destructive' : 'secondary'}>
                                {breach.aiRecommendationAuthority === 'required' ? 'Risque élevé' : 'Risque faible'}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Non analysé</span>
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {breach.notificationDate ? (
                              <div>
                                <div className="font-medium text-green-600">Oui</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(breach.notificationDate).toLocaleDateString()}
                                </div>
                              </div>
                            ) : breach.aiRecommendationAuthority === 'required' ? (
                              <div className="font-medium text-orange-600">En attente</div>
                            ) : (
                              <div className="font-medium text-gray-600">Non</div>
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {breach.dataSubjectNotificationDate ? (
                              <div>
                                <div className="font-medium text-green-600">Oui</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(breach.dataSubjectNotificationDate).toLocaleDateString()}
                                </div>
                              </div>
                            ) : breach.aiRecommendationDataSubject === 'required' ? (
                              <div className="font-medium text-orange-600">En attente</div>
                            ) : (
                              <div className="font-medium text-gray-600">Non</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée à afficher</h3>
                  <p className="text-gray-500">
                    Créez des violations pour voir le tableau de synthèse.
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