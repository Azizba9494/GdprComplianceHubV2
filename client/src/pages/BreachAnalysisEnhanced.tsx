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
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
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
  AlertCircle,
  Table,
  Loader2,
  Save,
  Trash2
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
  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const [selectedBreach, setSelectedBreach] = useState<Breach | null>(null);
  const [previewBreach, setPreviewBreach] = useState<Breach | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{breachId: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAnalysisModal, setShowAnalysisModal] = useState<Breach | null>(null);

  const companyId = currentCompany?.id;

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
  const { data: breaches, isLoading, refetch: refetchBreaches } = useQuery({
    queryKey: [`/api/breaches/${companyId}`],
    enabled: !!companyId,
    staleTime: 0, // Pas de cache pour s'assurer d'avoir les données fraîches
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
      queryClient.invalidateQueries({ queryKey: [`/api/breaches/${companyId}`] });
      setIsAnalyzing(false);
    },
    onError: (error: any) => {
      console.error('AI Analysis error:', error);
      
      // Check if it's a permission error
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Droits insuffisants') || errorMessage.includes('breaches.write')) {
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour effectuer des analyses IA, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'effectuer l'analyse IA.",
          variant: "destructive",
        });
      }
      setIsAnalyzing(false);
    },
  });

  // Create/Update breach mutation
  const breachMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedBreach) {
        return await apiRequest("PUT", `/api/breaches/${selectedBreach.id}`, data);
      } else {
        return await apiRequest("POST", "/api/breaches", { ...data, companyId: companyId });
      }
    },
    onSuccess: async () => {
      toast({
        title: selectedBreach ? "Violation mise à jour" : "Violation créée",
        description: "Les informations ont été sauvegardées avec succès.",
      });
      // Invalidate et refetch pour s'assurer que la liste est mise à jour
      await queryClient.invalidateQueries({ queryKey: [`/api/breaches/${companyId}`] });
      await refetchBreaches();
      setShowForm(false);
      setSelectedBreach(null);
      setActiveTab("list"); // Retourner à la liste après création
      resetForm();
    },
    onError: (error: any) => {
      console.error('Breach mutation error:', error);
      
      // Check if it's a permission error
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Droits insuffisants') || errorMessage.includes('breaches.write')) {
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour créer ou modifier des violations, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la violation.",
          variant: "destructive",
        });
      }
    },
  });

  // Delete breach mutation
  const deleteBreachMutation = useMutation({
    mutationFn: async (breachId: number) => {
      return await apiRequest("DELETE", `/api/breaches/${breachId}`);
    },
    onSuccess: async () => {
      toast({
        title: "Violation supprimée",
        description: "La violation a été supprimée avec succès.",
      });
      // Invalidate et refetch pour s'assurer que la liste est mise à jour
      await queryClient.invalidateQueries({ queryKey: [`/api/breaches/${companyId}`] });
      await refetchBreaches();
    },
    onError: (error: any) => {
      console.error('Delete breach error:', error);
      
      // Check if it's a permission error
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Droits insuffisants') || errorMessage.includes('breaches.delete')) {
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour supprimer des violations, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la violation.",
          variant: "destructive",
        });
      }
    },
  });

  const handleDeleteBreach = async (breach: Breach) => {
    if (!hasPermission('breaches', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour supprimer des violations, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la violation #${breach.id} ? Cette action est irréversible.`)) {
      deleteBreachMutation.mutate(breach.id);
    }
  };

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
    if (!hasPermission('breaches', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour modifier des violations, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
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
    if (!hasPermission('breaches', 'write')) {
      toast({
        title: "🔒 Droits insuffisants",
        description: "Vous ne disposez que des droits de lecture pour l'analyse des violations. Pour créer des violations, vous devez disposer des droits d'écriture.",
        variant: "destructive",
      });
      return;
    }
    
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
      companyId: companyId,
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

  const toggleRowExpansion = (breachId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(breachId)) {
      newExpanded.delete(breachId);
    } else {
      newExpanded.add(breachId);
    }
    setExpandedRows(newExpanded);
  };

  const startEditing = (breachId: number, field: string, currentValue: string) => {
    if (!hasPermission('breaches', 'write')) {
      toast({
        title: "Permissions insuffisantes",
        description: "Vous n'avez pas les droits d'écriture pour modifier les violations.",
        variant: "destructive"
      });
      return;
    }
    setEditingCell({ breachId, field });
    setEditValue(currentValue || "");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    try {
      await apiRequest('PUT', `/api/breaches/${editingCell.breachId}`, {
        [editingCell.field]: editValue
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/breaches/${companyId}`] });
      toast({
        title: "Modification sauvegardée",
        description: "La violation a été mise à jour avec succès."
      });
      
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error('Save edit error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la modification.",
        variant: "destructive"
      });
    }
  };

  const downloadSummaryTable = () => {
    if (!breaches || breaches.length === 0) return;
    
    const headers = [
      'Date de début',
      'Date de découverte', 
      'Description',
      'Mesures prises',
      'Répercussions',
      'Analyse du risque',
      'Notification CNIL',
      'Date notification CNIL',
      'Notification personnes',
      'Date notification personnes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...breaches.map((breach: Breach) => [
        new Date(breach.incidentDate).toLocaleDateString(),
        new Date(breach.discoveryDate).toLocaleDateString(),
        `"${breach.description.replace(/"/g, '""')}"`,
        `"${(breach.measures || '').replace(/"/g, '""')}"`,
        `"${(breach.consequences || '').replace(/"/g, '""')}"`,
        `"${(breach.riskAnalysisResult || 'Non analysé').replace(/"/g, '""')}"`,
        breach.aiRecommendationAuthority === 'required' ? 'Requise' : 'Non requise',
        breach.notificationDate ? new Date(breach.notificationDate).toLocaleDateString() : '',
        breach.aiRecommendationDataSubject === 'required' ? 'Requise' : 'Non requise',
        breach.dataSubjectNotificationDate ? new Date(breach.dataSubjectNotificationDate).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tableau-synthese-violations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Le tableau de synthèse a été téléchargé au format CSV."
    });
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

  // Check permissions after all hooks are initialized
  if (!hasPermission('breaches', 'read')) {
    return (
      <AccessDenied
        module="Analyse des violations"
        requiredPermission="breaches.read"
        description="Vous n'avez pas accès au module d'analyse des violations de données. Ce module permet de gérer et analyser les incidents de sécurité selon les directives EDPB."
      />
    );
  }

  // Show loading states
  if (!user) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Connexion requise</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Chargement...</h2>
          <p className="text-muted-foreground">Récupération des données de l'entreprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse des Violations</h1>
          <p className="text-muted-foreground">
            Gestion et analyse des violations de données selon les directives EDPB Guidelines 9/2022
          </p>
        </div>
        <Button 
          onClick={handleNewBreach} 
          disabled={!hasPermission('breaches', 'write')}
          title={!hasPermission('breaches', 'write') ? "Droits insuffisants pour créer des violations" : ""}
        >
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
                      <div>
                        <CardTitle className="text-lg">
                          Violation #{breach.id}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 leading-relaxed">
                          <div className="mb-1">
                            <strong>Date de l'incident:</strong> {new Date(breach.incidentDate).toLocaleDateString()}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {breach.description}
                          </div>
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
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(breach)}
                          disabled={!hasPermission('breaches', 'write')}
                          title={!hasPermission('breaches', 'write') ? "Droits insuffisants pour modifier des violations" : ""}
                        >
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
                            disabled={isAnalyzing || !hasPermission('breaches', 'write')}
                            title={!hasPermission('breaches', 'write') ? "Droits insuffisants pour analyser des violations" : ""}
                          >
                            {isAnalyzing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4 mr-2" />
                            )}
                            Analyse IA
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteBreach(breach)}
                          disabled={deleteBreachMutation.isPending || !hasPermission('breaches', 'write')}
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                          title={!hasPermission('breaches', 'write') ? "Droits insuffisants pour supprimer des violations" : ""}
                        >
                          {deleteBreachMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Supprimer
                        </Button>
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
                <Button 
                  onClick={handleNewBreach}
                  disabled={!hasPermission('breaches', 'write')}
                  title={!hasPermission('breaches', 'write') ? "Droits insuffisants pour créer des violations" : ""}
                >
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
                          Ces personnes sont-elles identifiables directement ?
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Table className="w-5 h-5 mr-2" />
                  Tableau de Synthèse des Violations
                </div>
                <Button onClick={downloadSummaryTable} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </CardTitle>
              <CardDescription>
                Tableau récapitulatif éditable de toutes les violations analysées avec possibilité d'expansion et modification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {breaches && breaches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Actions</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date de début</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date de découverte</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Description</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Mesures prises</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Répercussions</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Analyse du risque</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification CNIL</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date notification CNIL</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Notification personnes</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Date notification personnes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaches.map((breach: Breach) => (
                        <tr key={breach.id} className="hover:bg-gray-50">
                          {/* Colonne Actions */}
                          <td className="border border-gray-300 p-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleRowExpansion(breach.id)}
                                title="Développer/Réduire"
                                className="h-6 w-6 p-0"
                              >
                                {expandedRows.has(breach.id) ? '−' : '+'}
                              </Button>
                            </div>
                          </td>
                          
                          {/* Date de début */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'incidentDate' ? (
                              <div className="flex gap-1">
                                <Input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'incidentDate', breach.incidentDate.split('T')[0])}
                              >
                                {new Date(breach.incidentDate).toLocaleDateString()}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Date de découverte */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'discoveryDate' ? (
                              <div className="flex gap-1">
                                <Input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'discoveryDate', breach.discoveryDate.split('T')[0])}
                              >
                                {new Date(breach.discoveryDate).toLocaleDateString()}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Description */}
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'description' ? (
                              <div className="flex gap-1">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-20 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'description', breach.description)}
                              >
                                {expandedRows.has(breach.id) ? (
                                  <div>{breach.description}</div>
                                ) : (
                                  <div className="truncate" title={breach.description}>
                                    {breach.description.substring(0, 50)}...
                                  </div>
                                )}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Mesures prises */}
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'measures' ? (
                              <div className="flex gap-1">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-20 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'measures', breach.measures || '')}
                              >
                                {(() => {
                                  try {
                                    const measures = breach.measures ? JSON.parse(breach.measures) : {};
                                    const allMeasures = [measures.immediate, measures.mediumTerm, measures.longTerm, measures.other]
                                      .filter(Boolean).join(', ');
                                    return allMeasures ? (
                                      expandedRows.has(breach.id) ? (
                                        <div>{allMeasures}</div>
                                      ) : (
                                        <div className="truncate" title={allMeasures}>
                                          {allMeasures.substring(0, 30)}...
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400 italic">A renseigner par l'utilisateur</span>
                                    );
                                  } catch {
                                    return breach.measures ? (
                                      expandedRows.has(breach.id) ? (
                                        <div>{breach.measures}</div>
                                      ) : (
                                        <div className="truncate" title={breach.measures}>
                                          {breach.measures.substring(0, 30)}...
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400 italic">A renseigner par l'utilisateur</span>
                                    );
                                  }
                                })()}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Répercussions */}
                          <td className="border border-gray-300 p-2 text-sm max-w-xs">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'consequences' ? (
                              <div className="flex gap-1">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="min-h-20 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'consequences', breach.consequences || '')}
                              >
                                {(() => {
                                  try {
                                    const consequences = breach.consequences ? JSON.parse(breach.consequences) : {};
                                    const allConsequences = [
                                      ...(consequences.consequences || []),
                                      ...(consequences.potentialHarms || [])
                                    ].join(', ');
                                    return allConsequences ? (
                                      expandedRows.has(breach.id) ? (
                                        <div>{allConsequences}</div>
                                      ) : (
                                        <div className="truncate" title={allConsequences}>
                                          {allConsequences.substring(0, 30)}...
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400 italic">A renseigner par l'utilisateur</span>
                                    );
                                  } catch {
                                    return breach.consequences ? (
                                      expandedRows.has(breach.id) ? (
                                        <div>{breach.consequences}</div>
                                      ) : (
                                        <div className="truncate" title={breach.consequences}>
                                          {breach.consequences.substring(0, 30)}...
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-400 italic">A renseigner par l'utilisateur</span>
                                    );
                                  }
                                })()}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Analyse du risque */}
                          <td className="border border-gray-300 p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant={breach.riskAnalysisResult === 'élevé' ? 'destructive' : 
                                             breach.riskAnalysisResult === 'moyen' ? 'secondary' : 'default'}>
                                {breach.riskAnalysisResult || 'Non analysé'}
                              </Badge>
                              {breach.aiJustification && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowAnalysisModal(breach)}
                                  title="Voir les détails de l'analyse"
                                  className="h-5 w-5 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                          
                          {/* Notification CNIL */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {breach.aiRecommendationAuthority === 'required' ? (
                              <Badge variant="destructive">Requise</Badge>
                            ) : (
                              <Badge variant="secondary">Non requise</Badge>
                            )}
                          </td>
                          
                          {/* Date notification CNIL */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'notificationDate' ? (
                              <div className="flex gap-1">
                                <Input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'notificationDate', breach.notificationDate?.split('T')[0] || '')}
                              >
                                {breach.notificationDate ? (
                                  new Date(breach.notificationDate).toLocaleDateString()
                                ) : (
                                  <span className="text-gray-400">Non définie</span>
                                )}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
                            )}
                          </td>
                          
                          {/* Notification personnes */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {breach.aiRecommendationDataSubject === 'required' ? (
                              <Badge variant="destructive">Requise</Badge>
                            ) : (
                              <Badge variant="secondary">Non requise</Badge>
                            )}
                          </td>
                          
                          {/* Date notification personnes */}
                          <td className="border border-gray-300 p-2 text-sm">
                            {editingCell?.breachId === breach.id && editingCell?.field === 'dataSubjectNotificationDate' ? (
                              <div className="flex gap-1">
                                <Input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                />
                                <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                                  <Save className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                                onClick={() => startEditing(breach.id, 'dataSubjectNotificationDate', breach.dataSubjectNotificationDate?.split('T')[0] || '')}
                              >
                                {breach.dataSubjectNotificationDate ? (
                                  new Date(breach.dataSubjectNotificationDate).toLocaleDateString()
                                ) : (
                                  <span className="text-gray-400">Non définie</span>
                                )}
                                <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                              </div>
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune violation enregistrée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Créez votre première violation pour commencer à utiliser le tableau de synthèse.
                  </p>
                  <Button onClick={handleNewBreach}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Violation
                  </Button>
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
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
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
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aucune analyse sélectionnée</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
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

      {/* Modale d'analyse IA */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Analyse IA - Violation #{showAnalysisModal.id}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysisModal(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description de la violation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {showAnalysisModal.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Recommandations de notification</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">CNIL:</span>
                        <Badge variant={showAnalysisModal.aiRecommendationAuthority === 'required' ? 'destructive' : 'secondary'}>
                          {showAnalysisModal.aiRecommendationAuthority === 'required' ? 'Requise' : 'Non requise'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Personnes concernées:</span>
                        <Badge variant={showAnalysisModal.aiRecommendationDataSubject === 'required' ? 'destructive' : 'secondary'}>
                          {showAnalysisModal.aiRecommendationDataSubject === 'required' ? 'Requise' : 'Non requise'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Niveau de risque</h3>
                    <Badge variant={showAnalysisModal.riskAnalysisResult === 'élevé' ? 'destructive' : 
                                   showAnalysisModal.riskAnalysisResult === 'moyen' ? 'secondary' : 'default'}>
                      {showAnalysisModal.riskAnalysisResult || 'Non analysé'}
                    </Badge>
                  </div>
                </div>
                
                {showAnalysisModal.aiJustification && (
                  <div>
                    <h3 className="font-medium mb-2">Justification détaillée</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded whitespace-pre-wrap">
                      {showAnalysisModal.aiJustification}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500">
                    Analyse basée sur les directives EDPB Guidelines 9/2022
                  </span>
                  <Button
                    onClick={() => downloadJustification(showAnalysisModal)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger l'analyse
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}