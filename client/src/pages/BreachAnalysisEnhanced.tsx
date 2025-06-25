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
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from "lucide-react";

interface Breach {
  id: number;
  companyId: number;
  incidentDate: string;
  discoveryDate: string;
  description: string;
  affectedDataTypes?: string[];
  estimatedAffectedPersons?: number;
  dataCategories?: string[];
  affectedPersons?: number;
  circumstances?: string;
  consequences?: string;
  measures?: string;
  comprehensiveData?: string;
  breachType?: string;
  severity?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export default function BreachAnalysisEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBreach, setSelectedBreach] = useState<Breach | null>(null);
  const [previewBreach, setPreviewBreach] = useState<Breach | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedBreaches, setExpandedBreaches] = useState<Set<number>>(new Set());
  const [expandedSynthesis, setExpandedSynthesis] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});

  // Delete breach mutation
  const deleteBreach = useMutation({
    mutationFn: async (breachId: number) => {
      const response = await fetch(`/api/breaches/${breachId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Violation supprimée",
        description: "La violation a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breaches/1'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la violation.",
        variant: "destructive",
      });
    },
  });

  // Update breach cell mutation
  const updateBreachCell = useMutation({
    mutationFn: async ({ breachId, field, value }: { breachId: number; field: string; value: string }) => {
      const response = await fetch(`/api/breaches/${breachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mise à jour réussie",
        description: "Les données ont été mises à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breaches/1'] });
      setEditingCell(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les données.",
        variant: "destructive",
      });
    },
  });

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedBreaches);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBreaches(newExpanded);
  };

  const toggleSynthesisExpanded = (key: string) => {
    const newExpanded = new Set(expandedSynthesis);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSynthesis(newExpanded);
  };

  const handleCellEdit = (breachId: number, field: string, currentValue: string) => {
    const cellKey = `${breachId}-${field}`;
    setEditingCell(cellKey);
    setCellValues({ ...cellValues, [cellKey]: currentValue });
  };

  const saveCellEdit = (breachId: number, field: string) => {
    const cellKey = `${breachId}-${field}`;
    const value = cellValues[cellKey];
    if (value !== undefined) {
      updateBreachCell.mutate({ breachId, field, value });
    }
  };

  const downloadSynthesisTable = () => {
    if (!breaches || breaches.length === 0) return;

    const csvContent = [
      ["N° Violation", "Description", "Date incident", "Personnes concernées", "Données", "Mesures", "Répercussions", "Évaluation risque", "Notification CNIL", "Date notification CNIL", "Notification personnes", "Date notification personnes"].join(","),
      ...breaches.map((breach: Breach) => [
        `"Violation ${breach.id}"`,
        `"${(breach.description || '').replace(/"/g, '""')}"`,
        `"${new Date(breach.incidentDate).toLocaleDateString()}"`,
        `"${breach.affectedPersons || 0}"`,
        `"${Array.isArray(breach.dataCategories) ? breach.dataCategories.join(', ') : (breach.dataCategories || '').replace(/"/g, '""')}"`,
        `"${(() => {
          try {
            const measures = breach.measures ? JSON.parse(breach.measures) : {};
            return [measures.immediate, measures.mediumTerm, measures.longTerm, measures.other].filter(Boolean).join(', ').replace(/"/g, '""');
          } catch {
            return (breach.measures || breach.technicalMeasures || '').replace(/"/g, '""');
          }
        })()}"`,
        `"${(() => {
          try {
            const consequences = breach.consequences ? JSON.parse(breach.consequences) : {};
            return [...(consequences.consequences || []), ...(consequences.potentialHarms || [])].join(', ').replace(/"/g, '""');
          } catch {
            return (breach.consequences || breach.potentialImpact || '').replace(/"/g, '""');
          }
        })()}"`,
        `"${breach.aiRecommendationAuthority === 'required' ? 'Risque élevé' : breach.aiRecommendationAuthority === 'not_required' ? 'Risque faible' : 'Non analysé'}"`,
        `"${breach.notificationDate ? 'Oui' : breach.aiRecommendationAuthority === 'required' ? 'En attente' : 'Non'}"`,
        `"${breach.notificationDate ? new Date(breach.notificationDate).toLocaleDateString() : ''}"`,
        `"${breach.dataSubjectNotificationDate ? 'Oui' : breach.aiRecommendationDataSubject === 'required' ? 'En attente' : 'Non'}"`,
        `"${breach.dataSubjectNotificationDate ? new Date(breach.dataSubjectNotificationDate).toLocaleDateString() : ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tableau-synthese-violations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    
    // Origines de l'incident
    origins: [] as string[],
    otherOrigin: "",
    originUnknown: false,
    
    // Circonstances de la violation
    circumstances: [] as string[],
    otherCircumstance: "",
    circumstanceUnknown: false,
    
    // Causes de la violation
    causes: [] as string[],
    otherCause: "",
    causeUnknown: false,
    
    // Sous-traitants
    hasSubcontractors: false,
    subcontractorDetails: "",
    
    // Catégories de personnes concernées
    personCategories: [] as string[],
    otherPersonCategory: "",
    personCategoryUnknown: false,
    affectedPersonsCount: "",
    directlyIdentifiable: false,
    
    // Catégories de données personnelles
    dataCategories: [] as string[],
    otherDataCategory: "",
    dataCategoryUnknown: false,
    dataVolume: "",
    dataSupport: [] as string[],
    otherDataSupport: "",
    dataSupportUnknown: false,
    
    // Conséquences probables
    consequences: [] as string[],
    otherConsequence: "",
    consequenceUnknown: false,
    
    // Préjudices potentiels
    potentialHarms: [] as string[],
    otherPotentialHarm: "",
    potentialHarmUnknown: false,
    
    // Mesures prises
    immediateMeasures: "",
    mediumTermMeasures: "",
    longTermMeasures: "",
    otherMeasures: "",
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
      hasSubcontractors: false,
      subcontractorDetails: "",
      personCategories: [],
      otherPersonCategory: "",
      personCategoryUnknown: false,
      affectedPersonsCount: "",
      directlyIdentifiable: false,
      dataCategories: [],
      otherDataCategory: "",
      dataCategoryUnknown: false,
      dataVolume: "",
      dataSupport: [],
      otherDataSupport: "",
      dataSupportUnknown: false,
      consequences: [],
      otherConsequence: "",
      consequenceUnknown: false,
      potentialHarms: [],
      otherPotentialHarm: "",
      potentialHarmUnknown: false,
      immediateMeasures: "",
      mediumTermMeasures: "",
      longTermMeasures: "",
      otherMeasures: "",
    });
  };

  const handleEdit = (breach: Breach) => {
    setSelectedBreach(breach);
    
    // Try to load comprehensive data if available
    let loadedFormData = { ...formData };
    
    try {
      if (breach.comprehensiveData) {
        const comprehensiveData = JSON.parse(breach.comprehensiveData);
        loadedFormData = { ...formData, ...comprehensiveData };
      } else {
        // Fallback: populate basic fields from breach data
        loadedFormData = {
          ...formData,
          startDate: breach.incidentDate.split('T')[0],
          startTime: breach.incidentDate.includes('T') ? breach.incidentDate.split('T')[1].substring(0, 5) : "",
          discoveryDate: breach.discoveryDate ? breach.discoveryDate.split('T')[0] : "",
          discoveryTime: breach.discoveryDate && breach.discoveryDate.includes('T') ? breach.discoveryDate.split('T')[1].substring(0, 5) : "",
          discoveryCircumstances: breach.description,
          affectedPersonsCount: breach.estimatedAffectedPersons?.toString() || "",
          dataCategories: breach.affectedDataTypes || [],
        };
        
        // Try to parse structured JSON fields
        if (breach.circumstances) {
          try {
            const circumstances = JSON.parse(breach.circumstances);
            loadedFormData = { ...loadedFormData, ...circumstances };
          } catch (e) {
            // If not JSON, treat as simple string
            loadedFormData.circumstances = [breach.circumstances];
          }
        }
        
        if (breach.consequences) {
          try {
            const consequences = JSON.parse(breach.consequences);
            loadedFormData = { ...loadedFormData, ...consequences };
          } catch (e) {
            loadedFormData.consequences = [breach.consequences];
          }
        }
        
        if (breach.measures) {
          try {
            const measures = JSON.parse(breach.measures);
            loadedFormData.immediateMeasures = measures.immediate || "";
            loadedFormData.mediumTermMeasures = measures.mediumTerm || "";
            loadedFormData.longTermMeasures = measures.longTerm || "";
            loadedFormData.otherMeasures = measures.other || "";
          } catch (e) {
            loadedFormData.immediateMeasures = breach.measures;
          }
        }
      }
    } catch (error) {
      console.error("Error loading form data:", error);
      // Use basic fallback data
      loadedFormData = {
        ...formData,
        startDate: breach.incidentDate.split('T')[0],
        discoveryDate: breach.discoveryDate ? breach.discoveryDate.split('T')[0] : "",
        discoveryCircumstances: breach.description,
        affectedPersonsCount: breach.estimatedAffectedPersons?.toString() || "",
      };
    }
    
    setFormData(loadedFormData);
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
    
    // Validate required fields
    if (!formData.discoveryCircumstances.trim()) {
      toast({
        title: "Champ requis",
        description: "Veuillez décrire les circonstances de découverte.",
        variant: "destructive",
      });
      return;
    }
    
    // Transform comprehensive form data for storage
    const breachData = {
      companyId: 1,
      description: formData.discoveryCircumstances,
      incidentDate: formData.startDate ? formData.startDate + (formData.startTime ? `T${formData.startTime}:00` : 'T12:00:00') : new Date().toISOString(),
      discoveryDate: formData.discoveryDate ? formData.discoveryDate + (formData.discoveryTime ? `T${formData.discoveryTime}:00` : 'T12:00:00') : new Date().toISOString(),
      affectedPersons: parseInt(formData.affectedPersonsCount) || 0,
      dataCategories: formData.dataCategories.length > 0 ? formData.dataCategories : null,
      
      // Comprehensive structured data for analysis
      circumstances: JSON.stringify({
        violationStatus: formData.violationStatus,
        origins: formData.origins,
        otherOrigin: formData.otherOrigin,
        circumstances: formData.circumstances,
        otherCircumstance: formData.otherCircumstance,
        causes: formData.causes,
        otherCause: formData.otherCause,
        hasSubcontractors: formData.hasSubcontractors,
        subcontractorDetails: formData.subcontractorDetails,
        ongoingViolation: formData.ongoingViolation,
        extendedPeriod: formData.extendedPeriod
      }),
      
      consequences: JSON.stringify({
        consequences: formData.consequences,
        otherConsequence: formData.otherConsequence,
        potentialHarms: formData.potentialHarms,
        otherPotentialHarm: formData.otherPotentialHarm,
        personCategories: formData.personCategories,
        otherPersonCategory: formData.otherPersonCategory,
        directlyIdentifiable: formData.directlyIdentifiable,
        dataVolume: formData.dataVolume,
        dataSupport: formData.dataSupport,
        otherDataSupport: formData.otherDataSupport
      }),
      
      measures: JSON.stringify({
        immediate: formData.immediateMeasures,
        mediumTerm: formData.mediumTermMeasures,
        longTerm: formData.longTermMeasures,
        other: formData.otherMeasures
      }),
      
      // Store complete form data for future editing and AI analysis
      comprehensiveData: JSON.stringify(formData),
      
      status: 'draft'
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Liste des Violations</TabsTrigger>
          <TabsTrigger value="form">Formulaire</TabsTrigger>
          <TabsTrigger value="preview">Aperçu Analyse</TabsTrigger>
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Violation {breach.id}</Badge>
                          <Badge variant={getStatusColor(breach.status).includes('green') ? 'default' : 'secondary'}>
                            {breach.status === 'resolved' ? 'Résolue' : 
                             breach.status === 'investigating' ? 'En cours' : 
                             breach.status === 'closed' ? 'Fermée' : 'Brouillon'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          {new Date(breach.discoveryDate).toLocaleDateString()} - {breach.description.substring(0, 100)}
                          {breach.description.length > 100 ? '...' : ''}
                        </CardTitle>
                        {expandedBreaches.has(breach.id) && (
                          <CardDescription className="text-sm text-gray-600 mt-2">
                            {breach.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(breach.id)}
                        >
                          {expandedBreaches.has(breach.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Réduire
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              En savoir plus
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBreach(breach);
                            setActiveTab("form");
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Êtes-vous sûr de vouloir supprimer cette violation ?")) {
                              deleteBreach.mutate(breach.id);
                            }
                          }}
                          disabled={deleteBreach.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Affectées: {breach.affectedPersons || 0} personnes
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Statut: {breach.status === 'resolved' ? 'Résolue' : 
                                   breach.status === 'investigating' ? 'En cours' : 
                                   breach.status === 'closed' ? 'Fermée' : 'Brouillon'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Découvert: {new Date(breach.discoveryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{breach.affectedPersons || 0} personnes</span>
                        </div>
                      </div>
                    </div>
                    
                    {breach.aiRecommendationAuthority && (
                      <div className="mt-4">
                        <Alert>
                          <Brain className="w-4 h-4" />
                          <AlertDescription>
                            <strong>Analyse IA:</strong> Notification autorité: 
                            <Badge variant={breach.aiRecommendationAuthority === 'required' ? 'destructive' : 'secondary'} className="ml-2">
                              {breach.aiRecommendationAuthority === 'required' ? 'REQUISE' : 'NON REQUISE'}
                            </Badge>
                            {breach.aiJustification && (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => downloadJustification(breach)}
                                  className="ml-2 p-0 h-auto"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Télécharger la justification
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewBreach(breach);
                                    setActiveTab('preview');
                                  }}
                                  className="ml-2 p-0 h-auto"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Aperçu
                                </Button>
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedBreach(breach);
                          setActiveTab("form");
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        {breach.aiJustification && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setPreviewBreach(breach);
                              setActiveTab('preview');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Aperçu Analyse
                          </Button>
                        )}
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

                  {/* Section 2: Origines de l'incident */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">2. Origines de l'incident</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les origines applicables</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Equipement perdu ou volé',
                            'Papier perdu, volé ou laissé accessible dans un endroit non sécurisé',
                            'Courrier perdu ou ouvert avant d\'être retourné à l\'envoyeur',
                            'Piratage, logiciel malveillant (par exemple rançongiciel) et/ou hameçonnage',
                            'Mise au rebut de documents papier contenant des données personnelles sans destruction physique',
                            'Mise au rebut d\'appareils numériques contenant des données personnelles sans effacement sécurisé',
                            'Publication non volontaire d\'informations',
                            'Données de la mauvaise personne affichées sur le portail du client',
                            'Données personnelles envoyées à un mauvais destinataire',
                            'Informations personnelles divulguées de façon verbale'
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
                        <Label>Autre origine (à préciser)</Label>
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
                        <Label htmlFor="originUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 3: Circonstances de la violation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">3. Circonstances de la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les circonstances applicables</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Perte de confidentialité (divulgation ou accès non autorisé(e) ou accidentel(le) à des données à caractère personnel)',
                            'Perte d\'intégrité (altération non autorisée ou accidentelle de données à caractère personnel)',
                            'Perte de disponibilité (destruction ou perte accidentelle ou non autorisée de données à caractère personnel)'
                          ].map((circumstance) => (
                            <div key={circumstance} className="flex items-center space-x-2">
                              <Checkbox
                                id={`circumstance-${circumstance}`}
                                checked={formData.circumstances.includes(circumstance)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, circumstances: [...formData.circumstances, circumstance] });
                                  } else {
                                    setFormData({ ...formData, circumstances: formData.circumstances.filter(c => c !== circumstance) });
                                  }
                                }}
                              />
                              <Label htmlFor={`circumstance-${circumstance}`} className="text-sm">{circumstance}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Autre circonstance (à préciser)</Label>
                        <Input
                          placeholder="Précisez une autre circonstance..."
                          value={formData.otherCircumstance}
                          onChange={(e) => setFormData({ ...formData, otherCircumstance: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="circumstanceUnknown"
                          checked={formData.circumstanceUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, circumstanceUnknown: checked as boolean })}
                        />
                        <Label htmlFor="circumstanceUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4: Causes de la violation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">4. Cause(s) de la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les causes applicables</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Acte interne malveillant',
                            'Acte interne accidentel',
                            'Acte externe malveillant',
                            'Acte externe accidentel'
                          ].map((cause) => (
                            <div key={cause} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cause-${cause}`}
                                checked={formData.causes.includes(cause)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, causes: [...formData.causes, cause] });
                                  } else {
                                    setFormData({ ...formData, causes: formData.causes.filter(c => c !== cause) });
                                  }
                                }}
                              />
                              <Label htmlFor={`cause-${cause}`} className="text-sm">{cause}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Autre cause (à préciser)</Label>
                        <Input
                          placeholder="Précisez une autre cause..."
                          value={formData.otherCause}
                          onChange={(e) => setFormData({ ...formData, otherCause: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="causeUnknown"
                          checked={formData.causeUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, causeUnknown: checked as boolean })}
                        />
                        <Label htmlFor="causeUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 5: Sous-traitants */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">5. Existence d'un ou de plusieurs sous-traitant(s)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasSubcontractors"
                          checked={formData.hasSubcontractors}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasSubcontractors: checked as boolean })}
                        />
                        <Label htmlFor="hasSubcontractors">Oui, il y a des sous-traitants impliqués</Label>
                      </div>

                      {formData.hasSubcontractors && (
                        <div>
                          <Label>Nom(s) et coordonnées des sous-traitants</Label>
                          <Textarea
                            placeholder="Précisez les noms et coordonnées des sous-traitants impliqués..."
                            value={formData.subcontractorDetails}
                            onChange={(e) => setFormData({ ...formData, subcontractorDetails: e.target.value })}
                            rows={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 6: Catégories de personnes concernées */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">6. Catégories de personnes concernées</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Catégorie(s) de personnes</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Clients',
                            'Prospects',
                            'Salariés',
                            'Mandataires sociaux',
                            'Prestataires',
                            'Fournisseurs',
                            'Personnes vulnérables'
                          ].map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`person-${category}`}
                                checked={formData.personCategories.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, personCategories: [...formData.personCategories, category] });
                                  } else {
                                    setFormData({ ...formData, personCategories: formData.personCategories.filter(p => p !== category) });
                                  }
                                }}
                              />
                              <Label htmlFor={`person-${category}`} className="text-sm">{category}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Autres catégories (à préciser)</Label>
                        <Input
                          placeholder="Précisez d'autres catégories de personnes..."
                          value={formData.otherPersonCategory}
                          onChange={(e) => setFormData({ ...formData, otherPersonCategory: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="personCategoryUnknown"
                          checked={formData.personCategoryUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, personCategoryUnknown: checked as boolean })}
                        />
                        <Label htmlFor="personCategoryUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>

                      <div>
                        <Label>Nombre (éventuellement approximatif) de personnes concernées</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Nombre de personnes concernées"
                          value={formData.affectedPersonsCount}
                          onChange={(e) => setFormData({ ...formData, affectedPersonsCount: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directlyIdentifiable"
                          checked={formData.directlyIdentifiable}
                          onCheckedChange={(checked) => setFormData({ ...formData, directlyIdentifiable: checked as boolean })}
                        />
                        <Label htmlFor="directlyIdentifiable" className="text-sm">
                          Les personnes concernées sont directement identifiables
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 7: Catégories de données personnelles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">7. Catégories de données personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Nature des données personnelles touchées par la violation</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Nom',
                            'Prénom',
                            'Date de naissance',
                            'Etat civil (marié, divorcé, pacsé etc.)',
                            'Filiation (parents, enfants etc.)',
                            'Genre',
                            'Numéro de sécurité sociale',
                            'Coordonnées (adresse postale ou électronique, numéros de téléphone)',
                            'Adresse IP',
                            'Données transactionnelles (produits achetés, date heure et lieu d\'achat etc.)',
                            'Données de connexion',
                            'Données de localisation',
                            'Documents officiels (Passeport, pièce d\'identité, etc.)',
                            'Données relatives à des infractions, condamnations, mesures de sûreté',
                            'Informations d\'ordre économique et financier (revenus, situation bancaire, etc.)',
                            'Données comportementales (habitudes de vie, marques préférées etc.)',
                            'Données sensibles (origine raciale, opinions politiques, santé, biométriques, etc.)'
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

                      <div>
                        <Label>Autres données (à préciser)</Label>
                        <Input
                          placeholder="Précisez d'autres types de données..."
                          value={formData.otherDataCategory}
                          onChange={(e) => setFormData({ ...formData, otherDataCategory: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dataCategoryUnknown"
                          checked={formData.dataCategoryUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, dataCategoryUnknown: checked as boolean })}
                        />
                        <Label htmlFor="dataCategoryUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>

                      <div>
                        <Label>Volume de données concernées par la violation</Label>
                        <Textarea
                          placeholder="Décrivez le volume de données concernées..."
                          value={formData.dataVolume}
                          onChange={(e) => setFormData({ ...formData, dataVolume: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Support des données concernées</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            'Serveur',
                            'Poste fixe',
                            'Ordinateur portable',
                            'Disque de sauvegarde',
                            'Clé USB',
                            'Téléphone portable',
                            'Document papier'
                          ].map((support) => (
                            <div key={support} className="flex items-center space-x-2">
                              <Checkbox
                                id={`support-${support}`}
                                checked={formData.dataSupport.includes(support)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, dataSupport: [...formData.dataSupport, support] });
                                  } else {
                                    setFormData({ ...formData, dataSupport: formData.dataSupport.filter(s => s !== support) });
                                  }
                                }}
                              />
                              <Label htmlFor={`support-${support}`} className="text-sm">{support}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Autres supports (à préciser)</Label>
                        <Input
                          placeholder="Précisez d'autres supports..."
                          value={formData.otherDataSupport}
                          onChange={(e) => setFormData({ ...formData, otherDataSupport: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dataSupportUnknown"
                          checked={formData.dataSupportUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, dataSupportUnknown: checked as boolean })}
                        />
                        <Label htmlFor="dataSupportUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 8: Conséquences probables */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">8. Conséquences probables de la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sélectionnez les conséquences applicables</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Les données ont été diffusées plus que nécessaire et ont échappé à la maîtrise des personnes concernées',
                            'Les données peuvent être croisées ou rapprochées avec d\'autres informations relatives aux personnes concernées',
                            'Les données peuvent être détournées par un tiers à d\'autres fins que celles prévues initialement et/ou de manière non loyale ou malveillante',
                            'Les données peuvent être falsifiées'
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

                      <div>
                        <Label>Autres conséquences (à préciser)</Label>
                        <Input
                          placeholder="Précisez d'autres conséquences..."
                          value={formData.otherConsequence}
                          onChange={(e) => setFormData({ ...formData, otherConsequence: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="consequenceUnknown"
                          checked={formData.consequenceUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, consequenceUnknown: checked as boolean })}
                        />
                        <Label htmlFor="consequenceUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 9: Préjudices potentiels */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">9. Préjudices potentiels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Nature des préjudices potentiels pour les personnes concernées</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {[
                            'Perte de contrôle sur les données à caractère personnel',
                            'Limitation des droits des personnes concernées',
                            'Discrimination',
                            'Vol d\'identité',
                            'Fraude',
                            'Levée non autorisée de la pseudonymisation',
                            'Pertes financières',
                            'Atteinte à la réputation',
                            'Atteinte à la vie privée',
                            'Perte de la confidentialité de données protégées par un secret professionnel'
                          ].map((harm) => (
                            <div key={harm} className="flex items-center space-x-2">
                              <Checkbox
                                id={`harm-${harm}`}
                                checked={formData.potentialHarms.includes(harm)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({ ...formData, potentialHarms: [...formData.potentialHarms, harm] });
                                  } else {
                                    setFormData({ ...formData, potentialHarms: formData.potentialHarms.filter(h => h !== harm) });
                                  }
                                }}
                              />
                              <Label htmlFor={`harm-${harm}`} className="text-sm">{harm}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Autres préjudices (à préciser)</Label>
                        <Input
                          placeholder="Précisez d'autres préjudices potentiels..."
                          value={formData.otherPotentialHarm}
                          onChange={(e) => setFormData({ ...formData, otherPotentialHarm: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="potentialHarmUnknown"
                          checked={formData.potentialHarmUnknown}
                          onCheckedChange={(checked) => setFormData({ ...formData, potentialHarmUnknown: checked as boolean })}
                        />
                        <Label htmlFor="potentialHarmUnknown" className="text-sm">Ne sait pas pour l'instant</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 10: Mesures prises */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">10. Mesures prises pour remédier à la violation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Mesures prises en réaction immédiate à la violation</Label>
                        <Textarea
                          placeholder="Décrivez les mesures prises immédiatement après la découverte de la violation..."
                          value={formData.immediateMeasures}
                          onChange={(e) => setFormData({ ...formData, immediateMeasures: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Mesures de moyen terme prises ou prévues pour revenir à une situation normale</Label>
                        <Textarea
                          placeholder="Décrivez les mesures à moyen terme pour rétablir la situation..."
                          value={formData.mediumTermMeasures}
                          onChange={(e) => setFormData({ ...formData, mediumTermMeasures: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Mesures de moyen et long termes prises ou prévues pour éviter que la violation ne se reproduise</Label>
                        <Textarea
                          placeholder="Décrivez les mesures préventives pour éviter la répétition de l'incident..."
                          value={formData.longTermMeasures}
                          onChange={(e) => setFormData({ ...formData, longTermMeasures: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Autre - Préciser</Label>
                        <Textarea
                          placeholder="Autres mesures ou informations complémentaires..."
                          value={formData.otherMeasures}
                          onChange={(e) => setFormData({ ...formData, otherMeasures: e.target.value })}
                          rows={2}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Table className="w-5 h-5 mr-2" />
                    Tableau de Synthèse des Violations
                  </CardTitle>
                  <CardDescription>
                    Tableau récapitulatif éditable de toutes les violations analysées
                  </CardDescription>
                </div>
                <Button onClick={downloadSynthesisTable} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {breaches && breaches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">N° Violation</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Description</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date incident</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Personnes concernées</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Données</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Mesures</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Répercussions</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Évaluation risque</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification CNIL</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date notification CNIL</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification personnes</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date notification personnes</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaches.map((breach: Breach) => {
                        const renderEditableCell = (field: string, value: string, maxLength = 50) => {
                          const cellKey = `${breach.id}-${field}`;
                          const isExpanded = expandedSynthesis.has(cellKey);
                          const isEditing = editingCell === cellKey;
                          const displayValue = isExpanded ? value : (value?.substring(0, maxLength) + (value?.length > maxLength ? '...' : ''));
                          
                          return (
                            <div className="space-y-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Textarea
                                    value={cellValues[cellKey] || value}
                                    onChange={(e) => setCellValues({...cellValues, [cellKey]: e.target.value})}
                                    className="text-xs min-h-[60px]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.ctrlKey) {
                                        saveCellEdit(breach.id, field);
                                      } else if (e.key === 'Escape') {
                                        setEditingCell(null);
                                      }
                                    }}
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button size="sm" variant="outline" onClick={() => saveCellEdit(breach.id, field)}>
                                      <Save className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingCell(null)}>
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div 
                                    className="cursor-pointer text-xs" 
                                    title={value}
                                    onClick={() => handleCellEdit(breach.id, field, value)}
                                  >
                                    {displayValue}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {value?.length > maxLength && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 text-xs p-1"
                                        onClick={() => toggleSynthesisExpanded(cellKey)}
                                      >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 text-xs p-1"
                                      onClick={() => handleCellEdit(breach.id, field, value)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        };

                        return (
                          <tr key={breach.id}>
                            <td className="border border-gray-300 p-2 text-sm">
                              <Badge variant="outline">Violation {breach.id}</Badge>
                            </td>
                            <td className="border border-gray-300 p-2 text-sm max-w-xs">
                              {renderEditableCell('description', breach.description || '', 50)}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {new Date(breach.incidentDate).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {breach.affectedPersons || 0}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm max-w-xs">
                              {(() => {
                                const dataText = Array.isArray(breach.dataCategories) 
                                  ? breach.dataCategories.join(', ') 
                                  : (breach.dataCategories || 'Non spécifié');
                                return renderEditableCell('dataCategories', dataText, 30);
                              })()}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm max-w-xs">
                              {(() => {
                                try {
                                  const measures = breach.measures ? JSON.parse(breach.measures) : {};
                                  const allMeasures = [measures.immediate, measures.mediumTerm, measures.longTerm, measures.other]
                                    .filter(Boolean).join(', ');
                                  const measuresText = allMeasures || breach.technicalMeasures || 'Aucune mesure';
                                  return renderEditableCell('measures', measuresText, 30);
                                } catch {
                                  const measuresText = breach.measures || breach.technicalMeasures || 'Aucune mesure';
                                  return renderEditableCell('measures', measuresText, 30);
                                }
                              })()}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm max-w-xs">
                              {(() => {
                                try {
                                  const consequences = breach.consequences ? JSON.parse(breach.consequences) : {};
                                  const allConsequences = [
                                    ...(consequences.consequences || []),
                                    ...(consequences.potentialHarms || [])
                                  ].join(', ');
                                  const consequencesText = allConsequences || breach.potentialImpact || 'Aucune répercussion';
                                  return renderEditableCell('consequences', consequencesText, 30);
                                } catch {
                                  const consequencesText = breach.consequences || breach.potentialImpact || 'Aucune répercussion';
                                  return renderEditableCell('consequences', consequencesText, 30);
                                }
                              })()}
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
                              {editingCell === `${breach.id}-notificationCnil` ? (
                                <div className="flex items-center gap-1">
                                  <Select 
                                    value={cellValues[`${breach.id}-notificationCnil`] || (breach.notificationDate ? 'Oui' : breach.aiRecommendationAuthority === 'required' ? 'En attente' : 'Non')}
                                    onValueChange={(value) => setCellValues({...cellValues, [`${breach.id}-notificationCnil`]: value})}
                                  >
                                    <SelectTrigger className="w-20 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Oui">Oui</SelectItem>
                                      <SelectItem value="Non">Non</SelectItem>
                                      <SelectItem value="En attente">En attente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="outline" onClick={() => saveCellEdit(breach.id, 'notificationRequired')}>
                                    <Save className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">
                                    {breach.notificationDate ? 'Oui' : breach.aiRecommendationAuthority === 'required' ? 'En attente' : 'Non'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-xs p-1"
                                    onClick={() => handleCellEdit(breach.id, 'notificationCnil', breach.notificationDate ? 'Oui' : breach.aiRecommendationAuthority === 'required' ? 'En attente' : 'Non')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {editingCell === `${breach.id}-notificationCnilDate` ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="date"
                                    value={cellValues[`${breach.id}-notificationCnilDate`] || (breach.notificationDate ? new Date(breach.notificationDate).toISOString().split('T')[0] : '')}
                                    onChange={(e) => setCellValues({...cellValues, [`${breach.id}-notificationCnilDate`]: e.target.value})}
                                    className="w-32 h-8 text-xs"
                                  />
                                  <Button size="sm" variant="outline" onClick={() => saveCellEdit(breach.id, 'notificationDate')}>
                                    <Save className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">
                                    {breach.notificationDate ? new Date(breach.notificationDate).toLocaleDateString() : '-'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-xs p-1"
                                    onClick={() => handleCellEdit(breach.id, 'notificationCnilDate', breach.notificationDate ? new Date(breach.notificationDate).toISOString().split('T')[0] : '')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {editingCell === `${breach.id}-notificationPersons` ? (
                                <div className="flex items-center gap-1">
                                  <Select 
                                    value={cellValues[`${breach.id}-notificationPersons`] || (breach.dataSubjectNotificationDate ? 'Oui' : breach.aiRecommendationDataSubject === 'required' ? 'En attente' : 'Non')}
                                    onValueChange={(value) => setCellValues({...cellValues, [`${breach.id}-notificationPersons`]: value})}
                                  >
                                    <SelectTrigger className="w-20 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Oui">Oui</SelectItem>
                                      <SelectItem value="Non">Non</SelectItem>
                                      <SelectItem value="En attente">En attente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="outline" onClick={() => saveCellEdit(breach.id, 'dataSubjectNotificationRequired')}>
                                    <Save className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">
                                    {breach.dataSubjectNotificationDate ? 'Oui' : breach.aiRecommendationDataSubject === 'required' ? 'En attente' : 'Non'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-xs p-1"
                                    onClick={() => handleCellEdit(breach.id, 'notificationPersons', breach.dataSubjectNotificationDate ? 'Oui' : breach.aiRecommendationDataSubject === 'required' ? 'En attente' : 'Non')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {editingCell === `${breach.id}-notificationPersonsDate` ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="date"
                                    value={cellValues[`${breach.id}-notificationPersonsDate`] || (breach.dataSubjectNotificationDate ? new Date(breach.dataSubjectNotificationDate).toISOString().split('T')[0] : '')}
                                    onChange={(e) => setCellValues({...cellValues, [`${breach.id}-notificationPersonsDate`]: e.target.value})}
                                    className="w-32 h-8 text-xs"
                                  />
                                  <Button size="sm" variant="outline" onClick={() => saveCellEdit(breach.id, 'dataSubjectNotificationDate')}>
                                    <Save className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">
                                    {breach.dataSubjectNotificationDate ? new Date(breach.dataSubjectNotificationDate).toLocaleDateString() : '-'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-xs p-1"
                                    onClick={() => handleCellEdit(breach.id, 'notificationPersonsDate', breach.dataSubjectNotificationDate ? new Date(breach.dataSubjectNotificationDate).toISOString().split('T')[0] : '')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              <div className="flex items-center gap-1">
                                {breach.aiJustification && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPreviewBreach(breach);
                                      setActiveTab("preview");
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Analyse
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("Supprimer cette violation ?")) {
                                      deleteBreach.mutate(breach.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

        <TabsContent value="preview" className="space-y-4">
          {previewBreach && previewBreach.aiJustification ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Aperçu de l'Analyse IA - Violation #{previewBreach.id}
                </CardTitle>
                <CardDescription>
                  Analyse générée selon les directives EDPB Guidelines 9/2022
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-semibold">Date de l'incident</Label>
                    <p className="text-sm">{new Date(previewBreach.incidentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Date de découverte</Label>
                    <p className="text-sm">{new Date(previewBreach.discoveryDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="font-semibold">Description</Label>
                    <p className="text-sm">{previewBreach.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Notification Autorité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge 
                        variant={previewBreach.aiRecommendationAuthority === 'required' ? 'destructive' : 'secondary'}
                        className="mb-2"
                      >
                        {previewBreach.aiRecommendationAuthority === 'required' ? 'REQUISE' : 'NON REQUISE'}
                      </Badge>
                      {previewBreach.aiRecommendationAuthority === 'required' && (
                        <Alert className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            Notification à la CNIL requise dans les 72 heures
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Notification Personnes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge 
                        variant={previewBreach.aiRecommendationDataSubject === 'required' ? 'destructive' : 'secondary'}
                        className="mb-2"
                      >
                        {previewBreach.aiRecommendationDataSubject === 'required' ? 'REQUISE' : 'NON REQUISE'}
                      </Badge>
                      {previewBreach.aiRecommendationDataSubject === 'required' && (
                        <Alert className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            Notification aux personnes concernées recommandée
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Justification Détaillée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                        {previewBreach.aiJustification}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <strong>Avertissement:</strong> Cette évaluation est basée sur les directives EDPB Guidelines 9/2022. 
                    Il est recommandé de consulter des professionnels juridiques qualifiés pour les décisions finales.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadJustification(previewBreach)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('list')}
                    >
                      Retour à la liste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune analyse sélectionnée</h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une violation avec une analyse IA pour voir l'aperçu.
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Retour à la liste
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}