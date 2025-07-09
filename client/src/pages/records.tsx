import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordsApi, dpiaApi, companyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Book, Plus, Building, Users, FileText, Download, Loader2, HelpCircle, Edit2, Save, X, AlertTriangle, CheckCircle2, Trash2, FileSearch, Search } from "lucide-react";

// Bases légales complètes du RGPD
const LEGAL_BASES = [
  { value: "consent", label: "Consentement (Art. 6.1.a)" },
  { value: "contract", label: "Exécution d'un contrat (Art. 6.1.b)" },
  { value: "legal_obligation", label: "Obligation légale (Art. 6.1.c)" },
  { value: "vital_interests", label: "Sauvegarde des intérêts vitaux (Art. 6.1.d)" },
  { value: "public_task", label: "Mission d'intérêt public (Art. 6.1.e)" },
  { value: "legitimate_interests", label: "Intérêts légitimes (Art. 6.1.f)" },
];

// Fonction pour convertir les bases légales
const getLegalBasisLabel = (value: string): string => {
  const basis = LEGAL_BASES.find(b => b.value === value);
  return basis ? basis.label : value;
};

// Catégories de données prédéfinies
const DATA_CATEGORIES = [
  "Données d'identité (nom, prénom, etc.)",
  "Données de contact (email, téléphone, adresse)",
  "Données professionnelles (fonction, entreprise)",
  "Données de connexion (logs, adresses IP)",
  "Données de localisation",
  "Données bancaires et financières",
  "Données de santé",
  "Données biométriques",
  "Données relatives aux condamnations pénales",
  "Données révélant l'origine raciale ou ethnique",
  "Opinions politiques",
  "Convictions religieuses ou philosophiques",
  "Appartenance syndicale",
  "Données concernant la vie sexuelle",
  "Autres données sensibles",
];

// Destinataires types
const RECIPIENT_TYPES = [
  "Personnel interne autorisé",
  "Prestataires de services (sous-traitants)",
  "Autorités publiques",
  "Organismes sociaux",
  "Institutions financières",
  "Clients/Partenaires commerciaux",
  "Autorités judiciaires",
  "Organismes de certification",
  "Hébergeurs de données",
  "Fournisseurs de solutions logicielles",
];

// Mesures de sécurité
const SECURITY_MEASURES = [
  "Chiffrement des données",
  "Contrôle d'accès par mot de passe",
  "Authentification à deux facteurs",
  "Sauvegarde régulière",
  "Antivirus et pare-feu",
  "Formation du personnel",
  "Journalisation des accès",
  "Pseudonymisation",
  "Minimisation des données",
  "Suppression automatique",
  "Contrôle des accès physiques",
  "Clauses de confidentialité",
];

interface ProcessingRecord {
  id: number;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  recipients: string[];
  retention: string;
  securityMeasures: string[];
  transfersOutsideEU: boolean;
  type: string;
  createdAt: string;
  dpiaRequired?: boolean;
  dpiaJustification?: string;
  // DPIA Criteria
  hasScoring?: boolean;
  hasAutomatedDecision?: boolean;
  hasSystematicMonitoring?: boolean;
  hasSensitiveData?: boolean;
  hasLargeScale?: boolean;
  hasDataCombination?: boolean;
  hasVulnerablePersons?: boolean;
  hasInnovativeTechnology?: boolean;
  preventsRightsExercise?: boolean;
  // Data Controller Information
  dataControllerName?: string;
  dataControllerAddress?: string;
  dataControllerPhone?: string;
  dataControllerEmail?: string;
  // DPO Information  
  hasDpo?: boolean;
  dpoName?: string;
  dpoPhone?: string;
  dpoEmail?: string;
}

export default function Records() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "controller" | "processor">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [showJustification, setShowJustification] = useState<{[key: string]: boolean}>({});
  const [dpiaResults, setDpiaResults] = useState<{[key: number]: {required: boolean, justification: string}}>({});
  const [editingValues, setEditingValues] = useState<{[key: string]: any}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateForm = useForm({
    defaultValues: {
      processingType: "",
      activityDescription: "",
      dataTypes: "",
      purposes: "",
      legalBasis: "",
      recipients: "",
      retentionPeriod: "",
      securityMeasures: "",
      thirdCountries: "",
      additionalInfo: "",
      // Data Controller fields
      dataControllerName: "",
      dataControllerAddress: "",
      dataControllerPhone: "",
      dataControllerEmail: "",
      // DPO fields
      hasDpo: false,
      dpoName: "",
      dpoPhone: "",
      dpoEmail: "",
      // Joint Controller field
      jointControllerInfo: "",
    },
  });

  const manualForm = useForm({
    defaultValues: {
      name: "",
      purpose: "",
      legalBasis: "",
      dataCategories: "",
      recipients: "",
      retention: "",
      securityMeasures: "",
      type: "controller",
      transfersOutsideEU: false,
      // DPIA Criteria
      hasScoring: false,
      hasAutomatedDecision: false,
      hasSystematicMonitoring: false,
      hasSensitiveData: false,
      hasLargeScale: false,
      hasDataCombination: false,
      hasVulnerablePersons: false,
      hasInnovativeTechnology: false,
      preventsRightsExercise: false,
      // Data Controller fields
      dataControllerName: "",
      dataControllerAddress: "",
      dataControllerPhone: "",
      dataControllerEmail: "",
      // DPO fields
      hasDpo: false,
      dpoName: "",
      dpoPhone: "",
      dpoEmail: "",
      // Joint Controller field
      jointControllerInfo: "",
    },
  });

  const { user, currentCompany } = useAuth();

  const companyId = currentCompany?.id;

  const { data: records, isLoading } = useQuery({
    queryKey: ['/api/records', companyId],
    queryFn: () => recordsApi.get(companyId).then(res => res.json()),
    enabled: !!companyId,
  });

  // Company data is already retrieved above

  // Auto-fill company data when forms open
  const handleOpenCreateDialog = () => {
    if (currentCompany) {
      manualForm.setValue('dataControllerName', currentCompany.name || '');
      manualForm.setValue('dataControllerAddress', currentCompany.address || '');
      manualForm.setValue('dataControllerPhone', currentCompany.phone || '');
      manualForm.setValue('dataControllerEmail', currentCompany.email || '');
    }
    setIsCreateDialogOpen(true);
  };

  const handleOpenGenerateDialog = () => {
    if (currentCompany) {
      generateForm.setValue('dataControllerName', currentCompany.name || '');
      generateForm.setValue('dataControllerAddress', currentCompany.address || '');
      generateForm.setValue('dataControllerPhone', currentCompany.phone || '');
      generateForm.setValue('dataControllerEmail', currentCompany.email || '');
    }
    setIsGenerateDialogOpen(true);
  };

  const generateMutation = useMutation({
    mutationFn: (data: any) => {
      const requestData = {
        companyId: companyId,
        processingType: data.processingType,
        description: `
Activité de traitement: ${data.activityDescription}
Types de données: ${data.dataTypes}
Finalités: ${data.purposes}
Base légale proposée: ${data.legalBasis}
Destinataires: ${data.recipients}
Durée de conservation: ${data.retentionPeriod}
Mesures de sécurité: ${data.securityMeasures}
Transferts pays tiers: ${data.thirdCountries}
Informations complémentaires: ${data.additionalInfo}
        `.trim(),
        // Include data controller and DPO information
        dataControllerName: data.dataControllerName,
        dataControllerAddress: data.dataControllerAddress,
        dataControllerPhone: data.dataControllerPhone,
        dataControllerEmail: data.dataControllerEmail,
        hasDpo: data.hasDpo,
        dpoName: data.dpoName,
        dpoPhone: data.dpoPhone,
        dpoEmail: data.dpoEmail,
        // Joint Controller field
        jointControllerInfo: data.jointControllerInfo,
      };
      
      console.log('Sending generateMutation data:', requestData);
      return recordsApi.generate(requestData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setIsGenerateDialogOpen(false);
      generateForm.reset();
      toast({
        title: "Fiche de traitement générée",
        description: "La fiche de traitement a été créée avec succès grâce à l'IA.",
      });
    },
    onError: (error: any) => {
      console.error('Generate mutation error:', error);
      
      // For permission errors, always show the specific message
      // The error message from the server contains "Droits insuffisants"
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Droits insuffisants') || errorMessage.includes('records.generate')) {
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour les fiches de traitement. Pour générer des fiches avec l'IA, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation pour obtenir les permissions nécessaires.",
          variant: "destructive",
        });
      } else {
        // For any other error, show the permission message anyway since this is likely a permission issue
        // based on the user's role as collaborator
        toast({
          title: "🔒 Droits insuffisants",
          description: "Vous ne disposez que des droits de lecture pour les fiches de traitement. Pour générer des fiches avec l'IA, vous devez disposer des droits d'écriture. Contactez l'administrateur de votre organisation pour obtenir les permissions nécessaires.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      recordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setEditingRecord(null);
      toast({
        title: "Fiche mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      toast({
        title: "Fiche supprimée",
        description: "La fiche de traitement a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la fiche",
        variant: "destructive",
      });
    },
  });

  const dpiaAnalysisMutation = useMutation({
    mutationFn: async (record: ProcessingRecord) => {
      const response = await recordsApi.analyzeDpia(record);
      return response.json();
    },
    onSuccess: (result: any, record) => {
      // Store results in local state for immediate display
      setDpiaResults(prev => ({
        ...prev,
        [record.id]: {
          required: result.dpiaRequired,
          justification: result.justification
        }
      }));
      
      // Update database in background
      updateMutation.mutate({
        id: record.id,
        data: {
          dpiaRequired: result.dpiaRequired,
          dpiaJustification: result.justification,
        },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser la nécessité d'une AIPD.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const recordData = {
        companyId: companyId,
        name: data.name,
        purpose: data.purpose,
        legalBasis: data.legalBasis,
        dataCategories: data.dataCategories ? data.dataCategories.split(',').map((s: string) => s.trim()) : [],
        recipients: data.recipients ? data.recipients.split(',').map((s: string) => s.trim()) : [],
        retention: data.retention,
        securityMeasures: data.securityMeasures ? data.securityMeasures.split(',').map((s: string) => s.trim()) : [],
        type: data.type,
        transfersOutsideEU: data.transfersOutsideEU,
        hasScoring: data.hasScoring,
        hasAutomatedDecision: data.hasAutomatedDecision,
        hasSystematicMonitoring: data.hasSystematicMonitoring,
        hasSensitiveData: data.hasSensitiveData,
        hasLargeScale: data.hasLargeScale,
        hasDataCombination: data.hasDataCombination,
        hasVulnerablePersons: data.hasVulnerablePersons,
        hasInnovativeTechnology: data.hasInnovativeTechnology,
        preventsRightsExercise: data.preventsRightsExercise,
        // Data Controller fields
        dataControllerName: data.dataControllerName,
        dataControllerAddress: data.dataControllerAddress,
        dataControllerPhone: data.dataControllerPhone,
        dataControllerEmail: data.dataControllerEmail,
        // DPO fields
        hasDpo: data.hasDpo,
        dpoName: data.dpoName,
        dpoPhone: data.dpoPhone,
        dpoEmail: data.dpoEmail,
        // Joint Controller field
        jointControllerInfo: data.jointControllerInfo,
      };
      
      const response = await recordsApi.create(recordData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setIsCreateDialogOpen(false);
      manualForm.reset();
      toast({
        title: "Fiche créée",
        description: "La fiche de traitement a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la fiche",
        variant: "destructive",
      });
    },
  });



  const exportCSV = () => {
    if (!records || records.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune fiche de traitement à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Nom du traitement",
      "Finalité",
      "Base légale",
      "Catégories de données",
      "Destinataires",
      "Durée de conservation",
      "Mesures de sécurité",
      "Transferts hors UE",
      "Type de responsabilité",
      "AIPD requise",
      "Date de création"
    ];

    const csvData = records.map((record: ProcessingRecord) => [
      record.name,
      record.purpose,
      record.legalBasis,
      Array.isArray(record.dataCategories) ? record.dataCategories.join("; ") : record.dataCategories,
      Array.isArray(record.recipients) ? record.recipients.join("; ") : record.recipients,
      record.retention,
      Array.isArray(record.securityMeasures) ? record.securityMeasures.join("; ") : record.securityMeasures,
      record.transfersOutsideEU ? "Oui" : "Non",
      record.type === "controller" ? "Responsable de traitement" : 
        record.type === "joint-controller" ? "Responsable de traitement conjoint" : "Sous-traitant",
      record.dpiaRequired ? "Oui" : "Non",
      new Date(record.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map((cell: string | number | boolean) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registre_traitements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredRecords = records?.filter((record: ProcessingRecord) => {
    // Filter by type
    const typeMatch = filterType === "all" || record.type === filterType;
    
    // Filter by search term
    if (searchTerm === "") {
      return typeMatch;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Helper function to search in field (string or array)
    const searchInField = (field: any): boolean => {
      if (!field) return false;
      if (typeof field === 'string') {
        return field.toLowerCase().includes(searchLower);
      }
      if (Array.isArray(field)) {
        return field.some(item => 
          typeof item === 'string' && item.toLowerCase().includes(searchLower)
        );
      }
      return false;
    };
    
    const searchMatch = 
      searchInField(record.name) ||
      searchInField(record.purpose) ||
      searchInField(record.recipients) ||
      searchInField(record.retention) ||
      searchInField(record.securityMeasures) ||
      searchInField(record.dataCategories) ||
      getLegalBasisLabel(record.legalBasis || "").toLowerCase().includes(searchLower);
    
    return typeMatch && searchMatch;
  }) || [];

  const toggleJustification = async (recordId: number, field: string) => {
    const key = `${recordId}_${field}`;
    const isCurrentlyShown = showJustification[key];
    
    // If hiding, just toggle off
    if (isCurrentlyShown) {
      setShowJustification(prev => ({
        ...prev,
        [key]: false
      }));
      return;
    }

    // If showing for the first time, generate the justification
    setShowJustification(prev => ({
      ...prev,
      [key]: true
    }));

    // Find the record
    const record = records?.find(r => r.id === recordId);
    if (record && !justificationCache[key]) {
      await generateDetailedJustification(field, record);
    }
  };

  const handleFieldChange = (recordId: number, field: string, value: any) => {
    setEditingValues(prev => ({
      ...prev,
      [`${recordId}_${field}`]: value
    }));
  };

  const saveAllChanges = (recordId: number) => {
    const changes: any = {};
    Object.keys(editingValues).forEach(key => {
      if (key.startsWith(`${recordId}_`)) {
        const field = key.split('_')[1];
        changes[field] = editingValues[key];
      }
    });

    if (Object.keys(changes).length > 0) {
      updateMutation.mutate({
        id: recordId,
        data: changes,
      });
    }

    // Clear editing values for this record
    setEditingValues(prev => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach(key => {
        if (key.startsWith(`${recordId}_`)) {
          delete newValues[key];
        }
      });
      return newValues;
    });

    setEditingRecord(null);
  };

  const cancelEdit = (recordId: number) => {
    // Clear editing values for this record
    setEditingValues(prev => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach(key => {
        if (key.startsWith(`${recordId}_`)) {
          delete newValues[key];
        }
      });
      return newValues;
    });
    setEditingRecord(null);
  };

  const getFieldValue = (record: any, field: string) => {
    const editKey = `${record.id}_${field}`;
    return editingValues[editKey] !== undefined ? editingValues[editKey] : record[field];
  };

  const handleFieldUpdate = (recordId: number, field: string, value: any) => {
    updateMutation.mutate({
      id: recordId,
      data: { [field]: value }
    });
  };

  // Enhanced AI justification with detailed legal references  
  const [justificationCache, setJustificationCache] = useState<{[key: string]: string}>({});
  const [loadingJustifications, setLoadingJustifications] = useState<{[key: string]: boolean}>({});

  // Clear cache to force regeneration with new parameters
  const clearJustificationCache = () => {
    setJustificationCache({});
  };

  const generateDetailedJustification = async (field: string, record: ProcessingRecord): Promise<string> => {
    const cacheKey = `${record.id}_${field}`;
    
    // Return cached justification if available
    if (justificationCache[cacheKey]) {
      return justificationCache[cacheKey];
    }

    // Show loading state
    setLoadingJustifications(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const response = await fetch('/api/ai/generate-detailed-justification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          record: {
            name: record.name,
            purpose: record.purpose,
            legalBasis: record.legalBasis,
            retention: record.retention,
            dataCategories: record.dataCategories,
            sector: company?.sector || 'Non spécifié'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de la justification');
      }

      const data = await response.json();
      const justification = data.justification;

      // Cache the result
      setJustificationCache(prev => ({ ...prev, [cacheKey]: justification }));
      
      return justification;
    } catch (error) {
      console.error('Error generating justification:', error);
      return 'Cette recommandation s\'appuie sur l\'analyse des obligations du RGPD et les lignes directrices du CEPD.';
    } finally {
      setLoadingJustifications(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  // Composant pour éditer les listes (catégories, destinataires, mesures)
  const EditableList = ({ items, field, recordId, predefinedOptions, placeholder }: {
    items: string[];
    field: string;
    recordId: number;
    predefinedOptions: string[];
    placeholder: string;
  }) => {
    const [editMode, setEditMode] = useState(false);
    const [currentItems, setCurrentItems] = useState<string[]>(items || []);
    const [newItem, setNewItem] = useState("");

    const addItem = () => {
      if (newItem.trim() && !currentItems.includes(newItem.trim())) {
        const updatedItems = [...currentItems, newItem.trim()];
        setCurrentItems(updatedItems);
        setNewItem("");
      }
    };

    const removeItem = (index: number) => {
      const updatedItems = currentItems.filter((_, i) => i !== index);
      setCurrentItems(updatedItems);
    };

    const addPredefinedItem = (item: string) => {
      if (!currentItems.includes(item)) {
        const updatedItems = [...currentItems, item];
        setCurrentItems(updatedItems);
      }
    };

    const saveChanges = () => {
      handleFieldUpdate(recordId, field, currentItems);
      setEditMode(false);
    };

    const cancelEdit = () => {
      setCurrentItems(items || []);
      setNewItem("");
      setEditMode(false);
    };

    if (!editMode) {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(items || []).map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
            {(!items || items.length === 0) && (
              <span className="text-muted-foreground text-sm">Aucun élément</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditMode(true)}
            className="mt-2"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Modifier
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3 border p-3 rounded-lg">
        <div className="flex flex-wrap gap-1">
          {currentItems.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item}
              <button
                onClick={() => removeItem(index)}
                className="ml-1 text-destructive hover:text-destructive/80"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="text-sm"
          />
          <Button size="sm" onClick={addItem}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Éléments prédéfinis :</Label>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {predefinedOptions
              .filter(option => !currentItems.includes(option))
              .map((option, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => addPredefinedItem(option)}
                  className="text-xs h-6"
                >
                  {option}
                </Button>
              ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={saveChanges}>
            <Save className="w-3 h-3 mr-1" />
            Enregistrer
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit}>
            <X className="w-3 h-3 mr-1" />
            Annuler
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre des traitements</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos fiches de traitement selon l'article 30 du RGPD
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleOpenCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Créer manuellement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une fiche de traitement</DialogTitle>
                <DialogDescription>
                  Créez manuellement une fiche de traitement en remplissant les informations requises
                </DialogDescription>
              </DialogHeader>
              
              <Form {...manualForm}>
                <form onSubmit={manualForm.handleSubmit(data => createMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={manualForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de responsabilité *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="controller">Responsable de traitement</SelectItem>
                              <SelectItem value="joint-controller">Responsable de traitement conjoint</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Champ conditionnel pour le responsable conjoint */}
                    {manualForm.watch("type") === "joint-controller" && (
                      <FormField
                        control={manualForm.control}
                        name="jointControllerInfo"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nom et coordonnées du responsable conjoint du traitement *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Indiquez le nom, l'adresse, les coordonnées de contact du responsable de traitement conjoint..."
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={manualForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du traitement *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gestion de la paie, Prospection commerciale..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualForm.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Finalité du traitement *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez la finalité du traitement de données..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualForm.control}
                      name="legalBasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base légale *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la base légale" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEGAL_BASES.map((basis) => (
                                <SelectItem key={basis.value} value={basis.value}>
                                  {basis.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualForm.control}
                      name="retention"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée de conservation *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 3 ans après fin du contrat..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualForm.control}
                      name="transfersOutsideEU"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Transferts hors UE *</FormLabel>
                        </FormItem>
                      )}
                    />

                    {/* Catégories de données - Liste de choix + texte libre */}
                    <div className="space-y-3">
                      <Label>Catégories de données *</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                        {DATA_CATEGORIES.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`category-${category}`}
                              className="rounded"
                              onChange={(e) => {
                                const currentCategories = manualForm.getValues('dataCategories') || [];
                                if (e.target.checked) {
                                  const newCategories = Array.isArray(currentCategories) ? [...currentCategories, category] : [category];
                                  manualForm.setValue('dataCategories', newCategories);
                                } else {
                                  const filteredCategories = Array.isArray(currentCategories) ? currentCategories.filter(c => c !== category) : [];
                                  manualForm.setValue('dataCategories', filteredCategories);
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm">{category}</Label>
                          </div>
                        ))}
                      </div>
                      <Input 
                        placeholder="Autres catégories de données (séparées par des virgules)"
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            const newCategories = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                            const currentCategories = manualForm.getValues('dataCategories') || [];
                            const combinedCategories = Array.isArray(currentCategories) ? [...currentCategories, ...newCategories] : newCategories;
                            manualForm.setValue('dataCategories', combinedCategories);
                          }
                        }}
                      />
                    </div>

                    {/* Destinataires - Liste de choix + texte libre */}
                    <div className="space-y-3">
                      <Label>Destinataires *</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                        {RECIPIENT_TYPES.map((recipient) => (
                          <div key={recipient} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`recipient-${recipient}`}
                              className="rounded"
                              onChange={(e) => {
                                const currentRecipients = manualForm.getValues('recipients') || [];
                                if (e.target.checked) {
                                  const newRecipients = Array.isArray(currentRecipients) ? [...currentRecipients, recipient] : [recipient];
                                  manualForm.setValue('recipients', newRecipients);
                                } else {
                                  const filteredRecipients = Array.isArray(currentRecipients) ? currentRecipients.filter(r => r !== recipient) : [];
                                  manualForm.setValue('recipients', filteredRecipients);
                                }
                              }}
                            />
                            <Label htmlFor={`recipient-${recipient}`} className="text-sm">{recipient}</Label>
                          </div>
                        ))}
                      </div>
                      <Input 
                        placeholder="Autres destinataires (séparés par des virgules)"
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            const newRecipients = e.target.value.split(',').map(r => r.trim()).filter(r => r);
                            const currentRecipients = manualForm.getValues('recipients') || [];
                            const combinedRecipients = Array.isArray(currentRecipients) ? [...currentRecipients, ...newRecipients] : newRecipients;
                            manualForm.setValue('recipients', combinedRecipients);
                          }
                        }}
                      />
                    </div>

                    {/* Mesures de sécurité - Liste de choix + texte libre */}
                    <div className="space-y-3">
                      <Label>Mesures de sécurité *</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                        {SECURITY_MEASURES.map((measure) => (
                          <div key={measure} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`security-${measure}`}
                              className="rounded"
                              onChange={(e) => {
                                const currentMeasures = manualForm.getValues('securityMeasures') || [];
                                if (e.target.checked) {
                                  const newMeasures = Array.isArray(currentMeasures) ? [...currentMeasures, measure] : [measure];
                                  manualForm.setValue('securityMeasures', newMeasures);
                                } else {
                                  const filteredMeasures = Array.isArray(currentMeasures) ? currentMeasures.filter(m => m !== measure) : [];
                                  manualForm.setValue('securityMeasures', filteredMeasures);
                                }
                              }}
                            />
                            <Label htmlFor={`security-${measure}`} className="text-sm">{measure}</Label>
                          </div>
                        ))}
                      </div>
                      <Input 
                        placeholder="Autres mesures de sécurité (séparées par des virgules)"
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            const newMeasures = e.target.value.split(',').map(m => m.trim()).filter(m => m);
                            const currentMeasures = manualForm.getValues('securityMeasures') || [];
                            const combinedMeasures = Array.isArray(currentMeasures) ? [...currentMeasures, ...newMeasures] : newMeasures;
                            manualForm.setValue('securityMeasures', combinedMeasures);
                          }
                        }}
                      />
                    </div>

                    {/* Section Responsable de traitement */}
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <Label className="text-base font-semibold">Responsable de traitement</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <FormField
                          control={manualForm.control}
                          name="dataControllerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dénomination</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom de l'entreprise..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={manualForm.control}
                          name="dataControllerAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse complète..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={manualForm.control}
                          name="dataControllerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="Numéro de téléphone..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={manualForm.control}
                          name="dataControllerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse email..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Section DPO */}
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <Label className="text-base font-semibold">Délégué à la Protection des Données (DPO)</Label>
                      </div>
                      
                      <div className="pl-6 space-y-4">
                        <FormField
                          control={manualForm.control}
                          name="hasDpo"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>L'entreprise dispose-t-elle d'un DPO ?</FormLabel>
                            </FormItem>
                          )}
                        />

                        {manualForm.watch('hasDpo') && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={manualForm.control}
                              name="dpoName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom du DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nom complet du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={manualForm.control}
                              name="dpoPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Téléphone DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Téléphone du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={manualForm.control}
                              name="dpoEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Email du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer la fiche"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenGenerateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Générer avec l'IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Générer une fiche de traitement</DialogTitle>
                <DialogDescription>
                  Utilisez l'intelligence artificielle pour créer automatiquement une fiche de traitement basée sur votre activité
                </DialogDescription>
              </DialogHeader>
              
              <Form {...generateForm}>
                <form onSubmit={generateForm.handleSubmit(data => generateMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generateForm.control}
                      name="processingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de responsabilité *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="controller">Responsable de traitement</SelectItem>
                              <SelectItem value="joint-controller">Responsable de traitement conjoint</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Champ conditionnel pour le responsable conjoint */}
                    {generateForm.watch("processingType") === "joint-controller" && (
                      <FormField
                        control={generateForm.control}
                        name="jointControllerInfo"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nom et coordonnées du responsable conjoint du traitement *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Indiquez le nom, l'adresse, les coordonnées de contact du responsable de traitement conjoint..."
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={generateForm.control}
                      name="activityDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description de l'activité *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez précisément l'activité de traitement (ex: gestion de la paie, prospection commerciale, etc.)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground mt-1">
                            * Champ obligatoire pour la génération IA. Vous pouvez renseigner les autres champs pour obtenir une fiche plus complète.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="dataTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Types de données collectées </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Listez les catégories de données : identité, contact, données professionnelles, données sensibles, etc."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="purposes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finalités du traitement </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Pourquoi collectez-vous ces données ? (gestion RH, facturation, marketing, etc.)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="legalBasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base légale envisagée</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la base légale" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEGAL_BASES.map((basis) => (
                                <SelectItem key={basis.value} value={basis.value}>
                                  {basis.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="recipients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinataires des données</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Qui a accès aux données ? (équipes internes, prestataires, partenaires, autorités...)"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="retentionPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée de conservation envisagée</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 3 ans après fin du contrat, 10 ans pour obligations comptables..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="securityMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures de sécurité</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Chiffrement, contrôle d'accès, sauvegarde, formation du personnel..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="thirdCountries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transferts vers pays tiers</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Pays de destination et garanties appropriées (si applicable)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Informations complémentaires</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Autres éléments importants pour le traitement (contexte, spécificités sectorielles, etc.)"
                              {...field}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Section Responsable de traitement */}
                    <Separator className="md:col-span-2 my-6" />
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <Label className="text-base font-semibold">Responsable de traitement</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <FormField
                          control={generateForm.control}
                          name="dataControllerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dénomination</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom de l'entreprise..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generateForm.control}
                          name="dataControllerAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse complète..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generateForm.control}
                          name="dataControllerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="Numéro de téléphone..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generateForm.control}
                          name="dataControllerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse email..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Section DPO */}
                    <Separator className="md:col-span-2 my-6" />
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <Label className="text-base font-semibold">Délégué à la Protection des Données (DPO)</Label>
                      </div>
                      
                      <div className="pl-6 space-y-4">
                        <FormField
                          control={generateForm.control}
                          name="hasDpo"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>L'entreprise dispose-t-elle d'un DPO ?</FormLabel>
                            </FormItem>
                          )}
                        />

                        {generateForm.watch('hasDpo') && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={generateForm.control}
                              name="dpoName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom du DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nom complet du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={generateForm.control}
                              name="dpoPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Téléphone DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Téléphone du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={generateForm.control}
                              name="dpoEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email DPO</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Email du DPO..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        "Générer la fiche"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Filtres et Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une fiche de traitement (nom, finalité, données, destinataires, base légale...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres par type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Label>Filtrer par type :</Label>
                <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="controller">Responsable de traitement</TabsTrigger>
                    <TabsTrigger value="joint-controller">Responsable conjoint</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredRecords.length} fiche{filteredRecords.length > 1 ? 's' : ''} de traitement
                {searchTerm && ` (recherche: "${searchTerm}")`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Liste des fiches */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement des fiches de traitement...
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Book className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune fiche de traitement</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première fiche de traitement avec l'IA
            </p>
            <Button onClick={handleOpenGenerateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première fiche
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record: ProcessingRecord) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={record.name}
                          onBlur={(e) => handleFieldUpdate(record.id, 'name', e.target.value)}
                          className="font-semibold"
                        />
                      ) : (
                        record.name
                      )}
                    </CardTitle>
                    <Badge variant={record.type === "controller" ? "default" : "secondary"}>
                      {record.type === "controller" ? "Responsable" : 
                        record.type === "joint-controller" ? "Resp. conjoint" : "Sous-traitant"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {editingRecord === record.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => saveAllChanges(record.id)}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEdit(record.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRecord(record.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Finalité</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'purpose')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Textarea
                        defaultValue={record.purpose}
                        onBlur={(e) => handleFieldUpdate(record.id, 'purpose', e.target.value)}
                      />
                    ) : (
                      <ExpandableText
                        text={record.purpose}
                        maxLength={120}
                        className="text-sm"
                        previewMode="characters"
                      />
                    )}
                    {showJustification[`${record.id}_purpose`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> {
                          loadingJustifications[`${record.id}_purpose`] ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Génération de l'analyse juridique...
                            </span>
                          ) : (
                            justificationCache[`${record.id}_purpose`] || 
                            'Cette finalité a été déterminée en analysant l\'activité décrite et les obligations légales applicables.'
                          )
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Base légale</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'legalBasis')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Select
                        defaultValue={record.legalBasis}
                        onValueChange={(value) => handleFieldUpdate(record.id, 'legalBasis', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEGAL_BASES.map((basis) => (
                            <SelectItem key={basis.value} value={basis.value}>
                              {basis.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{getLegalBasisLabel(record.legalBasis)}</p>
                    )}
                    {showJustification[`${record.id}_legalBasis`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> {
                          loadingJustifications[`${record.id}_legalBasis`] ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Analyse de la base légale...
                            </span>
                          ) : (
                            justificationCache[`${record.id}_legalBasis`] || 
                            'Cette base légale a été sélectionnée selon la finalité du traitement et le contexte d\'utilisation des données.'
                          )
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium">Catégories de données</Label>
                    <EditableList
                      items={Array.isArray(record.dataCategories) ? record.dataCategories : [record.dataCategories].filter(Boolean)}
                      field="dataCategories"
                      recordId={record.id}
                      predefinedOptions={DATA_CATEGORIES}
                      placeholder="Ajouter une catégorie de données..."
                    />
                  </div>

                  <div>
                    <Label className="font-medium">Destinataires</Label>
                    <EditableList
                      items={Array.isArray(record.recipients) ? record.recipients : [record.recipients].filter(Boolean)}
                      field="recipients"
                      recordId={record.id}
                      predefinedOptions={RECIPIENT_TYPES}
                      placeholder="Ajouter un destinataire..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Label className="font-medium">Durée de conservation</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleJustification(record.id, 'retention')}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    {editingRecord === record.id ? (
                      <Input
                        defaultValue={record.retention}
                        onBlur={(e) => handleFieldUpdate(record.id, 'retention', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm">{record.retention}</p>
                    )}
                    {showJustification[`${record.id}_retention`] && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
                        <strong>Justification IA :</strong> {
                          loadingJustifications[`${record.id}_retention`] ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Analyse de la durée de conservation...
                            </span>
                          ) : (
                            justificationCache[`${record.id}_retention`] || 
                            'Cette durée respecte les obligations légales sectorielles et le principe de minimisation des données.'
                          )
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium">Transferts hors UE</Label>
                    <div className="mt-2">
                      {editingRecord === record.id ? (
                        <Switch
                          checked={record.transfersOutsideEU}
                          onCheckedChange={(checked) => handleFieldUpdate(record.id, 'transfersOutsideEU', checked)}
                        />
                      ) : (
                        <Badge variant={record.transfersOutsideEU ? "destructive" : "secondary"}>
                          {record.transfersOutsideEU ? "Oui" : "Non"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsable de traitement */}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building className="w-4 h-4" />
                    <Label className="font-medium text-base">Responsable de traitement</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label className="text-sm font-medium">Dénomination</Label>
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={getFieldValue(record, 'dataControllerName') || ""}
                          onChange={(e) => handleFieldChange(record.id, 'dataControllerName', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm mt-1">{record.dataControllerName || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Adresse</Label>
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={getFieldValue(record, 'dataControllerAddress') || ""}
                          onChange={(e) => handleFieldChange(record.id, 'dataControllerAddress', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm mt-1">{record.dataControllerAddress || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Téléphone</Label>
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={getFieldValue(record, 'dataControllerPhone') || ""}
                          onChange={(e) => handleFieldChange(record.id, 'dataControllerPhone', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm mt-1">{record.dataControllerPhone || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      {editingRecord === record.id ? (
                        <Input
                          defaultValue={getFieldValue(record, 'dataControllerEmail') || ""}
                          onChange={(e) => handleFieldChange(record.id, 'dataControllerEmail', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm mt-1">{record.dataControllerEmail || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DPO */}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-4 h-4" />
                    <Label className="font-medium text-base">Délégué à la Protection des Données (DPO)</Label>
                  </div>
                  <div className="pl-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Label className="text-sm font-medium">L'entreprise dispose-t-elle d'un DPO ?</Label>
                      {editingRecord === record.id ? (
                        <Switch
                          checked={getFieldValue(record, 'hasDpo') || false}
                          onCheckedChange={(checked) => handleFieldChange(record.id, 'hasDpo', checked)}
                        />
                      ) : (
                        <Badge variant={record.hasDpo ? "default" : "secondary"}>
                          {record.hasDpo ? "Oui" : "Non"}
                        </Badge>
                      )}
                    </div>
                    
                    {(editingRecord === record.id ? getFieldValue(record, 'hasDpo') : record.hasDpo) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Nom du DPO</Label>
                          {editingRecord === record.id ? (
                            <Input
                              defaultValue={getFieldValue(record, 'dpoName') || ""}
                              onChange={(e) => handleFieldChange(record.id, 'dpoName', e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm mt-1">{record.dpoName || "Non renseigné"}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Téléphone DPO</Label>
                          {editingRecord === record.id ? (
                            <Input
                              defaultValue={getFieldValue(record, 'dpoPhone') || ""}
                              onChange={(e) => handleFieldChange(record.id, 'dpoPhone', e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm mt-1">{record.dpoPhone || "Non renseigné"}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email DPO</Label>
                          {editingRecord === record.id ? (
                            <Input
                              defaultValue={getFieldValue(record, 'dpoEmail') || ""}
                              onChange={(e) => handleFieldChange(record.id, 'dpoEmail', e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm mt-1">{record.dpoEmail || "Non renseigné"}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsable conjoint - seulement pour les traitements conjoints */}
                {record.type === "joint-controller" && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="w-4 h-4" />
                      <Label className="font-medium text-base">Responsable conjoint du traitement</Label>
                    </div>
                    <div className="pl-6">
                      <div>
                        <Label className="text-sm font-medium">Nom et coordonnées du responsable conjoint</Label>
                        {editingRecord === record.id ? (
                          <Textarea
                            defaultValue={getFieldValue(record, 'jointControllerInfo') || ""}
                            onChange={(e) => handleFieldChange(record.id, 'jointControllerInfo', e.target.value)}
                            className="mt-1"
                            rows={3}
                            placeholder="Indiquez le nom, l'adresse, les coordonnées de contact du responsable de traitement conjoint..."
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <p className="text-sm whitespace-pre-wrap">
                              {record.jointControllerInfo || "Informations du responsable conjoint non renseignées"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Label className="font-medium">Mesures de sécurité</Label>
                  <EditableList
                    items={Array.isArray(record.securityMeasures) ? record.securityMeasures : [record.securityMeasures].filter(Boolean)}
                    field="securityMeasures"
                    recordId={record.id}
                    predefinedOptions={SECURITY_MEASURES}
                    placeholder="Ajouter une mesure de sécurité..."
                  />
                </div>



                {/* Actions */}
                <div className="pt-4 border-t flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la fiche de traitement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer la fiche "{record.name}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(record.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}