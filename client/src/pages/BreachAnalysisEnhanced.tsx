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
    incidentDate: "",
    discoveryDate: "",
    description: "",
    affectedDataTypes: [] as string[],
    estimatedAffectedPersons: "",
    breachType: "",
    severity: "",
    technicalMeasures: "",
    organizationalMeasures: "",
    potentialImpact: "",
    actualImpact: "",
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
      incidentDate: "",
      discoveryDate: "",
      description: "",
      affectedDataTypes: [],
      estimatedAffectedPersons: "",
      breachType: "",
      severity: "",
      technicalMeasures: "",
      organizationalMeasures: "",
      potentialImpact: "",
      actualImpact: "",
    });
  };

  const handleEdit = (breach: Breach) => {
    setSelectedBreach(breach);
    setFormData({
      incidentDate: breach.incidentDate.split('T')[0],
      discoveryDate: breach.discoveryDate.split('T')[0],
      description: breach.description,
      affectedDataTypes: breach.affectedDataTypes,
      estimatedAffectedPersons: breach.estimatedAffectedPersons?.toString() || "",
      breachType: breach.breachType,
      severity: breach.severity,
      technicalMeasures: breach.technicalMeasures || "",
      organizationalMeasures: breach.organizationalMeasures || "",
      potentialImpact: breach.potentialImpact || "",
      actualImpact: breach.actualImpact || "",
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
    breachMutation.mutate({
      ...formData,
      estimatedAffectedPersons: parseInt(formData.estimatedAffectedPersons) || 0,
    });
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incidentDate">Date de début de la violation *</Label>
                      <Input
                        id="incidentDate"
                        type="date"
                        value={formData.incidentDate}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="discoveryDate">Date de prise de connaissance *</Label>
                      <Input
                        id="discoveryDate"
                        type="date"
                        value={formData.discoveryDate}
                        onChange={(e) => setFormData({ ...formData, discoveryDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description détaillée de la violation *</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez précisément les circonstances de la violation, les données concernées, et les causes identifiées..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="breachType">Type de violation *</Label>
                      <Select value={formData.breachType} onValueChange={(value) => setFormData({ ...formData, breachType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confidentiality">Violation de confidentialité</SelectItem>
                          <SelectItem value="integrity">Violation d'intégrité</SelectItem>
                          <SelectItem value="availability">Violation de disponibilité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Gravité évaluée *</Label>
                      <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Évaluez la gravité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedAffectedPersons">Nombre estimé de personnes concernées</Label>
                    <Input
                      id="estimatedAffectedPersons"
                      type="number"
                      min="0"
                      placeholder="Estimation du nombre de personnes affectées"
                      value={formData.estimatedAffectedPersons}
                      onChange={(e) => setFormData({ ...formData, estimatedAffectedPersons: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="technicalMeasures">Mesures techniques prises pour remédier à la violation</Label>
                    <Textarea
                      id="technicalMeasures"
                      placeholder="Décrivez les mesures techniques mises en place (correctifs de sécurité, blocage d'accès, etc.)"
                      value={formData.technicalMeasures}
                      onChange={(e) => setFormData({ ...formData, technicalMeasures: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizationalMeasures">Mesures organisationnelles prises</Label>
                    <Textarea
                      id="organizationalMeasures"
                      placeholder="Décrivez les mesures organisationnelles (procédures, formation, communication interne, etc.)"
                      value={formData.organizationalMeasures}
                      onChange={(e) => setFormData({ ...formData, organizationalMeasures: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="potentialImpact">Répercussions potentielles</Label>
                    <Textarea
                      id="potentialImpact"
                      placeholder="Décrivez les conséquences potentielles pour les personnes concernées (risques financiers, discrimination, atteinte à la réputation, etc.)"
                      value={formData.potentialImpact}
                      onChange={(e) => setFormData({ ...formData, potentialImpact: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="actualImpact">Répercussions effectives (si connues)</Label>
                    <Textarea
                      id="actualImpact"
                      placeholder="Décrivez les conséquences réellement observées ou rapportées"
                      value={formData.actualImpact}
                      onChange={(e) => setFormData({ ...formData, actualImpact: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Separator />
                  
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Une fois sauvegardée, vous pourrez lancer l'analyse IA pour obtenir une recommandation basée sur les directives EDPB Guidelines 9/2022.
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