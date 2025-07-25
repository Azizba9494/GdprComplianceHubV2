// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Save, FileText, Shield, AlertTriangle, CheckCircle, Loader2, Plus, Trash2, ArrowLeft, Download, Users, Printer } from "lucide-react";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import constants directly in the file since the shared import is causing issues
const SECURITY_CATEGORIES = [
  "Authentification",
  "Chiffrement", 
  "Contrôle d'accès",
  "Contrôle d'accès logique",
  "Sécurité réseau",
  "Surveillance",
  "Sauvegarde",
  "Organisationnel",
  "Sécurité physique",
  "Maintenance",
  "Anonymisation",
  "Cloisonnement",
  "Traçabilité",
  "Intégrité",
  "Archivage",
  "Sécurité documentaire"
];

const CNIL_SECURITY_MEASURES = [
  // Authentification
  {
    id: "auth_001",
    name: "Authentification par mot de passe",
    category: "Authentification",
    description: "Mise en place de mots de passe robustes avec politique de complexité",
  },
  {
    id: "auth_002",
    name: "Authentification à deux facteurs (2FA)",
    category: "Authentification",
    description: "Authentification renforcée par un second facteur",
  },
  {
    id: "auth_003",
    name: "Authentification unique (SSO)",
    category: "Authentification",
    description: "Système d'authentification centralisée",
  },
  
  // Anonymisation
  {
    id: "anon_001",
    name: "Anonymisation",
    category: "Anonymisation",
    description: "Suppression de tout élément d'identification directe ou indirecte",
  },
  {
    id: "anon_002",
    name: "Pseudonymisation",
    category: "Anonymisation",
    description: "Remplacement des identifiants par des pseudonymes",
  },
  
  // Cloisonnement
  {
    id: "compartment_001",
    name: "Cloisonnement des données",
    category: "Cloisonnement",
    description: "Isolation des données par rapport au reste du système d'information",
  },
  {
    id: "compartment_002",
    name: "Séparation des environnements",
    category: "Cloisonnement",
    description: "Isolation des environnements de développement et production",
  },
  
  // Contrôle d'accès logique
  {
    id: "logical_access_001",
    name: "Contrôle des accès logiques",
    category: "Contrôle d'accès logique",
    description: "Gestion fine des droits d'accès aux systèmes et applications",
  },
  {
    id: "logical_access_002",
    name: "Gestion des rôles et permissions",
    category: "Contrôle d'accès logique",
    description: "Attribution des droits selon le principe du moindre privilège",
  },
  
  // Traçabilité
  {
    id: "traceability_001",
    name: "Traçabilité (journalisation)",
    category: "Traçabilité",
    description: "Enregistrement détaillé de toutes les opérations sur les données",
  },
  {
    id: "traceability_002",
    name: "Horodatage sécurisé",
    category: "Traçabilité",
    description: "Horodatage qualifié des opérations critiques",
  },
  
  // Intégrité
  {
    id: "integrity_001",
    name: "Contrôle d'intégrité",
    category: "Intégrité",
    description: "Vérification de l'intégrité et de l'authenticité des données",
  },
  {
    id: "integrity_002",
    name: "Signature électronique",
    category: "Intégrité",
    description: "Protection de l'authenticité par signature numérique",
  },
  
  // Archivage
  {
    id: "archive_001",
    name: "Archivage sécurisé",
    category: "Archivage",
    description: "Conservation sécurisée à long terme des données",
  },
  {
    id: "archive_002",
    name: "Coffre-fort numérique",
    category: "Archivage",
    description: "Stockage hautement sécurisé pour documents sensibles",
  },
  
  // Sécurité documentaire
  {
    id: "doc_security_001",
    name: "Sécurité des documents papier",
    category: "Sécurité documentaire",
    description: "Protection physique des documents papier contenant des données personnelles",
  },
  {
    id: "doc_security_002",
    name: "Destruction sécurisée",
    category: "Sécurité documentaire",
    description: "Procédures de destruction certifiée des documents",
  },
  {
    id: "crypto_001",
    name: "Chiffrement des données en transit",
    category: "Chiffrement",
    description: "Protection des données lors de leur transmission",
  },
  {
    id: "crypto_002",
    name: "Chiffrement des données au repos",
    category: "Chiffrement",
    description: "Protection des données stockées",
  },
  {
    id: "access_001",
    name: "Gestion des habilitations",
    category: "Contrôle d'accès",
    description: "Attribution et révision des droits d'accès",
  },
  {
    id: "network_001",
    name: "Pare-feu (Firewall)",
    category: "Sécurité réseau",
    description: "Filtrage du trafic réseau entrant et sortant",
  },
  {
    id: "monitor_001",
    name: "Surveillance continue",
    category: "Surveillance",
    description: "Monitoring 24/7 des systèmes et réseaux",
  },
  {
    id: "backup_001",
    name: "Sauvegarde régulière",
    category: "Sauvegarde",
    description: "Copies de sécurité automatisées et testées",
  },
  {
    id: "org_001",
    name: "Formation du personnel",
    category: "Organisationnel",
    description: "Sensibilisation à la sécurité et protection des données",
  },
  {
    id: "physical_001",
    name: "Contrôle d'accès physique",
    category: "Sécurité physique",
    description: "Protection des locaux et équipements",
  },
  {
    id: "update_001",
    name: "Gestion des correctifs",
    category: "Maintenance",
    description: "Application régulière des mises à jour de sécurité",
  }
];

// Enhanced schema with new sections
const dpiaFormSchema = z.object({
  companyId: z.number(),
  processingRecordId: z.number(),
  
  // Part 1: Context Description - Enhanced
  generalDescription: z.string().optional(),
  processingPurposes: z.string().optional(),
  dataController: z.string().optional(), // Responsable du traitement
  dataProcessors: z.string().optional(), // Sous-traitants
  applicableReferentials: z.string().optional(), // 1.1.5 - New field
  personalDataProcessed: z.string().optional(), // 1.2.1 - Enhanced field
  personalDataCategories: z.array(z.object({
    category: z.string(),
    examples: z.string(),
    recipients: z.string(),
    retentionPeriod: z.string(),
  })).optional().nullable(), // Processus, supports, destinataires et durées
  
  // Part 2.1: Proportionality and necessity measures - New sections
  finalitiesJustification: z.string().optional(), // 2.1.3
  dataMinimization: z.string().optional(), // Minimisation des données
  retentionJustification: z.string().optional(), // Durées de conservation
  legalBasisType: z.enum(["consent", "contract", "legal_obligation", "public_task", "vital_interests", "legitimate_interests"]).optional().nullable(),
  legalBasisJustification: z.string().optional(), // 2.1.4
  dataQualityJustification: z.string().optional(), // 2.1.5
  proportionalityEvaluation: z.object({
    finalities: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    legalBasis: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    dataMinimization: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    dataQuality: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    retentionPeriods: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() })
  }).optional(), // 2.1.6
  
  // Part 2.2: Rights protection measures - Enhanced sections
  rightsInformation: z.string().optional(), // Mesures pour l'information des personnes
  rightsConsent: z.string().optional(), // Mesures pour le recueil du consentement
  rightsAccess: z.string().optional(), // Mesures pour les droits d'accès et à la portabilité
  rightsRectification: z.string().optional(), // Mesures pour les droits de rectification et d'effacement
  rightsOpposition: z.string().optional(), // Mesures pour les droits de limitation et d'opposition
  subcontractingMeasures: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    scope: z.string(),
    contractReference: z.string(),
    gdprCompliance: z.string()
  })).optional(), // 2.2.6 - New
  internationalTransfersMeasures: z.array(z.object({
    dataType: z.string(),
    country: z.string(),
    justification: z.string()
  })).optional(), // 2.2.7 - Simplified
  rightsProtectionEvaluation: z.object({
    information: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    consent: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    accessPortability: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    rectificationErasure: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    limitationOpposition: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    subcontracting: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() }),
    internationalTransfers: z.object({ status: z.enum(["acceptable", "improvable"]), measures: z.string() })
  }).optional(), // 2.2.8 - New
  
  // Part 3: Security measures - Enhanced with CNIL measures
  securityMeasures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    implemented: z.boolean()
  })).optional(),
  customSecurityMeasures: z.array(z.object({
    name: z.string(),
    category: z.string(),
    description: z.string(),
    implemented: z.boolean()
  })).optional(),
  
  // Part 4: Risk Assessment - New section
  riskScenarios: z.object({
    illegitimateAccess: z.object({
      impacts: z.string().optional(),
      threats: z.string().optional(),
      sources: z.string().optional(),
      measures: z.string().optional(),
      severity: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      severityJustification: z.string().optional(),
      likelihood: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      likelihoodJustification: z.string().optional()
    }).optional(),
    unwantedModification: z.object({
      impacts: z.string().optional(),
      threats: z.string().optional(),
      sources: z.string().optional(),
      measures: z.string().optional(),
      severity: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      severityJustification: z.string().optional(),
      likelihood: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      likelihoodJustification: z.string().optional()
    }).optional(),
    dataDisappearance: z.object({
      impacts: z.string().optional(),
      threats: z.string().optional(),
      sources: z.string().optional(),
      measures: z.string().optional(),
      severity: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      severityJustification: z.string().optional(),
      likelihood: z.enum(["undefined", "negligible", "limited", "important", "maximum"]).optional(),
      likelihoodJustification: z.string().optional()
    }).optional()
  }).optional(),
  
  // Part 6: Evaluation section - New
  evaluation: z.object({
    generalDescription: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    dataProcesses: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    finalitiesExplanation: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    dataMinimizationExplanation: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    retentionExplanation: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    legalBasisExplanation: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    dataQualityExplanation: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    informationMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    consentMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    accessPortabilityMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    rectificationErasureMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    limitationOppositionMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    subcontractingMeasuresEval: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    internationalTransferMeasures: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    securityMeasuresEval: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    illegitimateAccess: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    unwantedModification: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional(),
    dataDisappearance: z.object({
      rating: z.enum(["unsatisfactory", "improvement_planned", "satisfactory"]).optional(),
      justification: z.string().optional(),
      additionalMeasures: z.string().optional()
    }).optional()
  }).optional(),

  // Status
  status: z.enum(["draft", "inprogress", "completed", "validated"]).default("draft")
});

type DpiaFormData = z.infer<typeof dpiaFormSchema>;

export default function DpiaAssessmentEnhanced() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, currentCompany } = useAuth();
  const [generatingFields, setGeneratingFields] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Helper functions for field-specific generation state
  const setFieldGenerating = (field: string, isGenerating: boolean) => {
    setGeneratingFields(prev => ({
      ...prev,
      [field]: isGenerating
    }));
  };

  const isFieldGenerating = (field: string) => {
    return generatingFields[field] || false;
  };

  // Get user company
  const { data: company } = useQuery({
    queryKey: ['/api/companies/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/companies/user/${user.id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
    enabled: !!user?.id,
  }) as { data: any };

  // Fetch collaborators for responsible person selection
  const { data: collaborators = [] } = useQuery({
    queryKey: ['/api/collaborators', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const res = await fetch(`/api/collaborators/${currentCompany.id}`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentCompany?.id,
  });

  // Get DPIA data
  const { data: dpia, isLoading } = useQuery({
    queryKey: [`/api/dpia/assessment/${id}`],
    enabled: !!id && id !== "new",
  }) as { data: any, isLoading: boolean };

  // Get processing record for AI assistance
  const { data: processingRecord } = useQuery({
    queryKey: [`/api/records/${company?.id}`],
    enabled: !!company?.id && !!dpia?.processingRecordId,
    select: (records: any[]) => records.find(r => r.id === dpia?.processingRecordId)
  }) as { data: any };

  const form = useForm<any>({
    resolver: zodResolver(dpiaFormSchema),
    mode: "onChange",
    defaultValues: {
      securityMeasures: [],
      customSecurityMeasures: [],
      subcontractingMeasures: [],
      internationalTransfersMeasures: [],
      riskScenarios: {},
      proportionalityEvaluation: {
        finalities: { status: "acceptable", measures: "" },
        legalBasis: { status: "acceptable", measures: "" },
        dataMinimization: { status: "acceptable", measures: "" },
        dataQuality: { status: "acceptable", measures: "" },
        retentionPeriods: { status: "acceptable", measures: "" }
      },
      rightsProtectionEvaluation: {
        information: { status: "acceptable", measures: "" },
        consent: { status: "acceptable", measures: "" },
        accessPortability: { status: "acceptable", measures: "" },
        rectificationErasure: { status: "acceptable", measures: "" },
        limitationOpposition: { status: "acceptable", measures: "" },
        subcontracting: { status: "acceptable", measures: "" },
        internationalTransfers: { status: "acceptable", measures: "" }
      },
      evaluation: {},
      actionPlan: []
    }
  });

  // Remove auto-save functionality - save only on button click





  // Load form data when DPIA is fetched
  useEffect(() => {
    if (dpia) {
      const cleanedData = {
        ...dpia,
        companyId: dpia.companyId || currentCompany?.id,
        // Clean null values to prevent React warnings
        generalDescription: dpia.generalDescription || "",
        processingPurposes: dpia.processingPurposes || "",
        dataController: dpia.dataController || "",
        dataProcessors: dpia.dataProcessors || "",
        applicableReferentials: dpia.applicableReferentials || "",
        personalDataProcessed: dpia.personalDataProcessed || "",
        dataMinimization: dpia.dataMinimization || "",
        retentionJustification: dpia.retentionJustification || "",
        finalitiesJustification: dpia.finalitiesJustification || "",
        legalBasisJustification: dpia.legalBasisJustification || "",
        dataQualityJustification: dpia.dataQualityJustification || "",
        rightsInformation: dpia.rightsInformation || "",
        rightsConsent: dpia.rightsConsent || "",
        rightsAccess: dpia.rightsAccess || "",
        rightsRectification: dpia.rightsRectification || "",
        rightsOpposition: dpia.rightsOpposition || "",
        dpoAdvice: dpia.dpoAdvice || "",
        controllerValidation: dpia.controllerValidation || "",
        securityMeasures: dpia.securityMeasures || [],
        customSecurityMeasures: dpia.customSecurityMeasures || [],
        subcontractingMeasures: dpia.subcontractingMeasures || [],
        internationalTransfersMeasures: Array.isArray(dpia.internationalTransfersMeasures) 
          ? dpia.internationalTransfersMeasures.map((transfer: any) => {
              // Convert old format to new simplified format
              if (transfer.france !== undefined || transfer.eu !== undefined) {
                return {
                  dataType: transfer.dataType || "",
                  country: transfer.country || "",
                  justification: transfer.justification || ""
                };
              }
              return transfer;
            })
          : [],
        riskScenarios: dpia.riskScenarios || {},
        proportionalityEvaluation: dpia.proportionalityEvaluation || {
          finalities: { status: "acceptable", measures: "" },
          legalBasis: { status: "acceptable", measures: "" },
          dataMinimization: { status: "acceptable", measures: "" },
          dataQuality: { status: "acceptable", measures: "" },
          retentionPeriods: { status: "acceptable", measures: "" }
        },
        rightsProtectionEvaluation: dpia.rightsProtectionEvaluation || {
          information: { status: "acceptable", measures: "" },
          consent: { status: "acceptable", measures: "" },
          accessPortability: { status: "acceptable", measures: "" },
          rectificationErasure: { status: "acceptable", measures: "" },
          limitationOpposition: { status: "acceptable", measures: "" },
          subcontracting: { status: "acceptable", measures: "" },
          internationalTransfers: { status: "acceptable", measures: "" }
        },
        evaluation: dpia.evaluation || {},
        actionPlan: dpia.actionPlan || []
      };
      form.reset(cleanedData);
    }
  }, [dpia, currentCompany, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DpiaFormData) => {
      const url = id && id !== "new" ? `/api/dpia/assessment/${id}` : `/api/dpia`;
      const method = id && id !== "new" ? "PUT" : "POST";
      
      // Clean data before sending
      const cleanData = {
        ...data,
        companyId: currentCompany?.id,
        securityMeasures: Array.isArray(data.securityMeasures) ? data.securityMeasures : [],
        customSecurityMeasures: Array.isArray(data.customSecurityMeasures) ? data.customSecurityMeasures : [],
        subcontractingMeasures: Array.isArray(data.subcontractingMeasures) ? data.subcontractingMeasures : [],
        internationalTransfersMeasures: Array.isArray(data.internationalTransfersMeasures) ? data.internationalTransfersMeasures : [],
        actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan : []
      };
      
      // Remove problematic date fields
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la sauvegarde: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (savedDpia) => {
      toast({
        title: "AIPD sauvegardée",
        description: "Vos modifications ont été enregistrées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/dpia/assessment/${savedDpia.id}`] });
      if (id === "new") {
        setLocation(`/dpia/${savedDpia.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'AIPD",
        variant: "destructive",
      });
    },
  });

  // AI generation mutation with enhanced context
  const generateWithAI = useMutation({
    mutationFn: async ({ field, context }: { field: string, context?: any }) => {
      setFieldGenerating(field, true);
      
      // Enhanced context with registry data and prompt type mapping
      const registryData = {
        name: processingRecord?.name,
        description: processingRecord?.description,
        purpose: processingRecord?.purpose,
        legalBasis: processingRecord?.legalBasis,
        dataCategories: processingRecord?.dataCategories,
        recipients: processingRecord?.recipients,
        retentionPeriod: processingRecord?.retentionPeriod,
        dataController: company?.name,
        dataProcessors: processingRecord?.processors,
        isInternational: processingRecord?.isInternational,
        securityMeasures: processingRecord?.securityMeasures
      };

      // Determine specialized prompt type for each field
      const getPromptType = (fieldName: string): string => {
        const promptMappings: Record<string, string> = {
          'generalDescription': 'registry_based_description',
          'purposes': 'registry_based_purposes', 
          'dataController': 'registry_based_controller',
          'dataProcessors': 'registry_based_processors',
          'applicableReferentials': 'referentials_analysis',
          'personalDataProcessed': 'registry_based_data',
          'personalDataCategories': 'registry_based_categories',
          'finalitiesJustification': 'finalities_justification',
          'dataMinimization': 'data_minimization_analysis',
          'retentionJustification': 'retention_justification',
          'legalBasisJustification': 'legal_basis_justification',
          'dataQualityJustification': 'insufficient_data_analysis',
          'rightsInformation': 'insufficient_data_analysis',
          'rightsConsent': 'insufficient_data_analysis',
          'rightsAccess': 'insufficient_data_analysis',
          'rightsRectification': 'insufficient_data_analysis',
          'rightsOpposition': 'insufficient_data_analysis',
          'subcontractingMeasures': 'insufficient_data_analysis',
          'internationalTransfersMeasures': 'insufficient_data_analysis'
        };
        return promptMappings[fieldName] || 'general_analysis';
      };

      const response = await fetch("/api/dpia/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionField: field,
          companyId: company?.id,
          existingDpiaData: form.getValues()
        })
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la génération AI");
      }
      
      return response.json();
    },
    onSuccess: (result, variables) => {
      // Apply the same cleaning logic as in handleRiskAIGenerate
      let cleanResponse = result.response
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^### (.*$)/gm, '$1')
        .replace(/^## (.*$)/gm, '$1')
        .replace(/^# (.*$)/gm, '$1')
        .trim();
      
      // Remove technical field names that might appear at the beginning
      const technicalFields = [
        'illegitimateAccessImpacts', 'illegitimateAccessSources', 'illegitimateAccessMeasures',
        'dataModificationImpacts', 'dataModificationSources', 'dataModificationMeasures',
        'dataDisappearanceImpacts', 'dataDisappearanceSources', 'dataDisappearanceMeasures',
        'generalDescription', 'processingPurposes', 'dataController', 'dataProcessors',
        'applicableReferentials', 'personalDataProcessed', 'personalDataCategories',
        'finalitiesJustification', 'dataMinimization', 'retentionJustification',
        'legalBasisJustification', 'dataQualityJustification', 'rightsInformation',
        'rightsConsent', 'rightsAccess', 'rightsRectification', 'rightsOpposition',
        'subcontractingMeasures', 'internationalTransfersMeasures'
      ];
      
      for (const field of technicalFields) {
        if (cleanResponse.startsWith(field)) {
          cleanResponse = cleanResponse.substring(field.length).replace(/^[:\s-]*/, '').trim();
          break;
        }
      }
      
      form.setValue(variables.field as any, cleanResponse);
      toast({
        title: "Contenu généré",
        description: "Le contenu a été généré avec succès par l'IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le contenu",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      setFieldGenerating(variables.field, false);
    }
  });

  // PDF Export mutation
  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/dpia/${id}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.getValues()),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AIPD-${dpia?.processingRecordId || 'nouveau'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export réussi",
        description: "Le PDF de l'AIPD a été téléchargé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'export",
        description: error.message || "Impossible d'exporter l'AIPD en PDF",
        variant: "destructive",
      });
    },
  });

  // Report Generation mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/dpia/${id}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.getValues()),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport-AIPD-${dpia?.processingRecordId || 'nouveau'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Rapport généré",
        description: "Le rapport d'AIPD a été généré et téléchargé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le rapport d'AIPD",
        variant: "destructive",
      });
    },
  });

  // Risk analysis AI generation using DPIA prompts
  const handleRiskAIGenerate = async (scenario: string, riskType: string) => {
    if (!currentCompany?.id) {
      console.error('Missing company ID for risk AI generation');
      return;
    }
    
    // Map scenario and riskType to the correct questionField for DPIA prompts
    const fieldMapping: Record<string, Record<string, string>> = {
      'illegitimateAccess': {
        'impacts': 'illegitimateAccessImpacts',
        'sources': 'illegitimateAccessSources',
        'measures': 'illegitimateAccessMeasures'
      },
      'unwantedModification': {
        'impacts': 'dataModificationImpacts',
        'sources': 'dataModificationSources', 
        'measures': 'dataModificationMeasures'
      },
      'dataDisappearance': {
        'impacts': 'dataDisappearanceImpacts',
        'sources': 'dataDisappearanceSources',
        'measures': 'dataDisappearanceMeasures'
      }
    };
    
    const questionField = fieldMapping[scenario]?.[riskType];
    
    if (!questionField) {
      console.error(`Mapping non trouvé pour ${scenario}.${riskType}`);
      return;
    }
    
    setFieldGenerating(questionField, true);
    
    try {
      
      console.log('Risk AI Generate request:', { scenario, riskType, questionField, companyId: currentCompany.id });
      
      const response = await fetch('/api/dpia/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionField: questionField,
          companyId: currentCompany.id,
          processingRecordId: dpia?.processingRecordId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }
      
      const data = await response.json();
      
      // Clean the response and remove markdown formatting and technical field names
      let cleanResponse = data.response
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^### (.*$)/gm, '$1')
        .replace(/^## (.*$)/gm, '$1')
        .replace(/^# (.*$)/gm, '$1')
        .trim();
      
      // Remove technical field names that might appear at the beginning of the response
      const technicalFields = [
        'illegitimateAccessImpacts',
        'illegitimateAccessSources', 
        'illegitimateAccessMeasures',
        'dataModificationImpacts',
        'dataModificationSources',
        'dataModificationMeasures', 
        'dataDisappearanceImpacts',
        'dataDisappearanceSources',
        'dataDisappearanceMeasures'
      ];
      
      // Check if response starts with any technical field name and remove it
      for (const field of technicalFields) {
        if (cleanResponse.startsWith(field)) {
          cleanResponse = cleanResponse.substring(field.length).replace(/^[:\s-]*/, '').trim();
          break;
        }
      }
      
      // Update the specific field with generated content
      form.setValue(`riskScenarios.${scenario}.${riskType}`, cleanResponse);
      
      toast({
        title: "Analyse générée",
        description: "L'IA a généré l'analyse de risque pour vous.",
      });
    } catch (error: any) {
      console.error('Risk AI generation error:', error);
      toast({
        title: "Erreur lors de la génération",
        description: error.message || "Erreur lors de la génération de l'analyse.",
        variant: "destructive",
      });
    } finally {
      setFieldGenerating(questionField, false);
    }
  };

  // Legacy function kept for compatibility
  const generateRiskAnalysis = async (scenario: string, riskType: string) => {
    return handleRiskAIGenerate(scenario, riskType);
  };

  const onSubmit = (data: DpiaFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    saveMutation.mutate(data);
  };

  const addSecurityMeasure = (measure: any) => {
    const currentMeasures = form.getValues("securityMeasures") || [];
    const newMeasure = {
      ...measure,
      implemented: false
    };
    form.setValue("securityMeasures", [...currentMeasures, newMeasure]);
  };

  const removeSecurityMeasure = (index: number) => {
    const currentMeasures = form.getValues("securityMeasures") || [];
    form.setValue("securityMeasures", currentMeasures.filter((_, i) => i !== index));
  };

  const addSubcontractor = () => {
    const current = form.getValues("subcontractingMeasures") || [];
    form.setValue("subcontractingMeasures", [...current, {
      name: "",
      purpose: "",
      scope: "",
      contractReference: "",
      gdprCompliance: ""
    }]);
  };

  const removeSubcontractor = (index: number) => {
    const current = form.getValues("subcontractingMeasures") || [];
    form.setValue("subcontractingMeasures", current.filter((_, i) => i !== index));
  };

  const addTransfer = () => {
    const current = form.getValues("internationalTransfersMeasures") || [];
    form.setValue("internationalTransfersMeasures", [...current, {
      dataType: "",
      country: "",
      justification: ""
    }]);
  };

  const removeTransfer = (index: number) => {
    const current = form.getValues("internationalTransfersMeasures") || [];
    form.setValue("internationalTransfersMeasures", current.filter((_, i) => i !== index));
  };

  // Show loading states
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Connexion requise</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données de l'entreprise...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'AIPD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dpia')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dpia?.title || "Nouvelle AIPD"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse d'Impact relative à la Protection des Données
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={dpia?.status === "completed" ? "default" : "secondary"}>
            {dpia?.status || "draft"}
          </Badge>

        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="proportionality">Proportionnalité</TabsTrigger>
              <TabsTrigger value="rights">Droits</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
              <TabsTrigger value="risks">Risques</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            {/* Tab 1: Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description générale du traitement</CardTitle>
                  <CardDescription>
                    Décrivez de manière claire et précise le traitement de données personnelles concerné par cette AIPD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="generalDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description générale</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez le contexte, les objectifs et le fonctionnement général du traitement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("generalDescription")}
                            onClick={() => generateWithAI.mutate({ field: "generalDescription" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération description générale...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processingPurposes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finalités du traitement</FormLabel>
                        <FormDescription>
                          Listez les objectifs précis et légitimes poursuivis par ce traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Gestion de la relation client, suivi des commandes, support technique..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("processingPurposes")}
                            onClick={() => generateWithAI.mutate({ field: "processingPurposes" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération finalités traitement...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 1.1.5 - New field: Applicable referentials */}
                  <FormField
                    control={form.control}
                    name="dataController"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable du traitement</FormLabel>
                        <FormDescription>
                          Identifiez l'organisme qui détermine les finalités et les moyens du traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Nom de l'entreprise, adresse, représentant légal..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("dataController")}
                            onClick={() => generateWithAI.mutate({ field: "dataController" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération responsable traitement...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataProcessors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sous-traitants</FormLabel>
                        <FormDescription>
                          Listez les organismes qui traitent des données personnelles pour le compte du responsable de traitement.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Prestataires informatiques, hébergeurs, services de maintenance..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("dataProcessors")}
                            onClick={() => generateWithAI.mutate({ field: "dataProcessors" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération sous-traitants...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicableReferentials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référentiels applicables</FormLabel>
                        <FormDescription>
                          Recensez les référentiels applicables au traitement, utiles ou à respecter et certifications en matière de protection des données (art. 42 du RGPD), notamment les codes de conduite approuvés (art. 40 du RGPD).
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: ISO 27001, certification HDS, code de conduite sectoriel, référentiel CNIL..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("applicableReferentials")}
                            onClick={() => generateWithAI.mutate({ field: "applicableReferentials" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération référentiels applicables...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 1.2 Personal data processed - Enhanced */}
              <Card>
                <CardHeader>
                  <CardTitle>Données personnelles traitées</CardTitle>
                  <CardDescription>
                    Identifiez précisément les catégories de données personnelles concernées par le traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="personalDataProcessed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Données personnelles traitées</FormLabel>
                        <FormDescription>
                          Décrivez les catégories de données personnelles, les processus de traitement, les supports utilisés, les destinataires et les durées de conservation.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Données d'identification (nom, prénom, email) collectées via formulaire web, stockées en base de données, transmises au service commercial, conservées 3 ans après fin de relation..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("personalDataProcessed")}
                            onClick={() => generateWithAI.mutate({ field: "personalDataProcessed" })}
                            buttonText="Générer avec l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération données personnelles...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Proportionality and necessity measures */}
            <TabsContent value="proportionality" className="space-y-6">
              {/* 2.1.3 - Finalities justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification des finalités</CardTitle>
                  <CardDescription>
                    Vous avez déjà listé vos objectifs (finalités) dans la partie 1. Il s'agit maintenant de justifier en quoi ils sont légitimes, c'est-à-dire conformes à la loi et clairement définis. Une finalité ne doit pas être vague ou "fourre-tout".
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Vos objectifs sont-ils précis et compréhensibles ?</li>
                        <li>Sont-ils en accord avec l'activité légale de votre organisme ?</li>
                        <li>Chaque finalité est-elle nécessaire et proportionnée ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="finalitiesJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification des finalités</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez pourquoi chaque finalité est légitime, nécessaire et proportionnée à votre activité..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("finalitiesJustification")}
                            onClick={() => generateWithAI.mutate({ field: "finalitiesJustification" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération justification finalités...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.3.1 - Data minimization justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification de la minimisation des données</CardTitle>
                  <CardDescription>
                    Les données collectées doivent être adéquates, pertinentes et limitées à ce qui est nécessaire au regard des finalités pour lesquelles elles sont traitées.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous vérifié que toutes les données collectées sont strictement nécessaires ?</li>
                        <li>Pouvez-vous atteindre vos objectifs avec moins de données ?</li>
                        <li>Avez-vous mis en place des processus pour éviter la collecte excessive ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="dataMinimization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification de la minimisation des données</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez comment vous limitez la collecte aux données strictement nécessaires et les mesures mises en place..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("dataMinimization")}
                            onClick={() => generateWithAI.mutate({ field: "dataMinimization" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération justification minimisation...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.3.2 - Retention periods justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification des durées de conservation</CardTitle>
                  <CardDescription>
                    Les données ne doivent pas être conservées plus longtemps que nécessaire pour atteindre les finalités du traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous défini des durées de conservation précises pour chaque catégorie de données ?</li>
                        <li>Ces durées sont-elles justifiées par vos besoins métier ou des obligations légales ?</li>
                        <li>Avez-vous mis en place un processus de suppression automatique ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="retentionJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification des durées de conservation</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Justifiez les durées de conservation définies pour chaque catégorie de données et les processus de suppression..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("retentionJustification")}
                            onClick={() => generateWithAI.mutate({ field: "retentionJustification" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération justification rétention...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.4 - Legal basis justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification du fondement (Base légale)</CardTitle>
                  <CardDescription>
                    Tout traitement de données personnelles doit reposer sur une des six bases légales prévues par le RGPD. Vous devez choisir celle qui correspond à votre situation et justifier ce choix. Il n'est généralement pas possible de changer de base légale en cours de traitement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="legalBasisType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base légale du traitement</FormLabel>
                        <FormDescription>
                          Cochez la base légale de votre traitement et expliquez pourquoi :
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="consent" id="consent" className="mt-1" />
                              <div>
                                <Label htmlFor="consent" className="font-medium">Le consentement</Label>
                                <p className="text-sm text-gray-600">La personne a-t-elle donné son accord explicite, libre et éclairé ? (ex: inscription à une newsletter)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="contract" id="contract" className="mt-1" />
                              <div>
                                <Label htmlFor="contract" className="font-medium">Le contrat</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il indispensable à l'exécution d'un contrat avec la personne ? (ex: traitement d'une adresse pour livrer un colis)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="legal_obligation" id="legal_obligation" className="mt-1" />
                              <div>
                                <Label htmlFor="legal_obligation" className="font-medium">L'obligation légale</Label>
                                <p className="text-sm text-gray-600">Une loi vous oblige-t-elle à traiter ces données ? (ex: déclarations sociales pour les salariés)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="public_task" id="public_task" className="mt-1" />
                              <div>
                                <Label htmlFor="public_task" className="font-medium">La mission d'intérêt public</Label>
                                <p className="text-sm text-gray-600">Êtes-vous un organisme public qui traite des données dans le cadre de ses missions ?</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="vital_interests" id="vital_interests" className="mt-1" />
                              <div>
                                <Label htmlFor="vital_interests" className="font-medium">La sauvegarde des intérêts vitaux</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il nécessaire pour protéger la vie d'une personne ? (cas très rare)</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value="legitimate_interests" id="legitimate_interests" className="mt-1" />
                              <div>
                                <Label htmlFor="legitimate_interests" className="font-medium">L'intérêt légitime</Label>
                                <p className="text-sm text-gray-600">Le traitement est-il nécessaire à la poursuite des intérêts de votre organisme, sans porter une atteinte excessive aux droits et libertés des personnes ? (ex: lutte contre la fraude)</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalBasisJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification de la base légale choisie</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez en détail pourquoi cette base légale est appropriée pour votre traitement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("legalBasisJustification")}
                            onClick={() => generateWithAI.mutate({ field: "legalBasisJustification" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération justification base légale...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.1.5 - Data quality justification */}
              <Card>
                <CardHeader>
                  <CardTitle>Explication et justification de la qualité des données</CardTitle>
                  <CardDescription>
                    Les données que vous traitez doivent être "exactes et, si nécessaire, tenues à jour". Des décisions basées sur des données erronées peuvent avoir des conséquences négatives pour les personnes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous mis en place des processus pour vérifier l'exactitude des données lors de leur collecte ?</li>
                        <li>Comment les personnes peuvent-elles corriger leurs données si elles sont inexactes ? (voir aussi la section sur les droits)</li>
                        <li>Comment mettez-vous à jour les informations qui peuvent devenir obsolètes ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="dataQualityJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures de qualité des données</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez vos processus de vérification, mise à jour et correction des données personnelles..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("dataQualityJustification")}
                            onClick={() => generateWithAI.mutate({ field: "dataQualityJustification" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures qualité données...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Rights protection measures */}
            <TabsContent value="rights" className="space-y-6">
              {/* 2.2.1 - Information measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour l'information des personnes</CardTitle>
                  <CardDescription>
                    Les personnes concernées doivent être informées de manière claire et transparente du traitement de leurs données personnelles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures d'information</FormLabel>
                        <FormDescription>
                          Décrivez comment vous informez les personnes concernées : mentions légales, politique de confidentialité, notices d'information, etc.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Politique de confidentialité accessible sur le site, mentions dans les formulaires de collecte, information lors de la création de compte..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("rightsInformation")}
                            onClick={() => generateWithAI.mutate({ field: "rightsInformation" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures information...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.2 - Consent measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour le recueil du consentement</CardTitle>
                  <CardDescription>
                    Si votre base légale est le consentement, décrivez comment vous le recueillez de manière libre, spécifique, éclairée et univoque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsConsent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour le consentement</FormLabel>
                        <FormDescription>
                          Détaillez vos mécanismes de recueil et de gestion du consentement (cases à cocher, double opt-in, etc.).
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Cases à cocher non pré-cochées, double opt-in pour la newsletter, possibilité de retrait facile du consentement..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("rightsConsent")}
                            onClick={() => generateWithAI.mutate({ field: "rightsConsent" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures consentement...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.3 - Access and portability rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits d'accès et à la portabilité</CardTitle>
                  <CardDescription>
                    Les personnes ont le droit d'accéder à leurs données et de les récupérer dans un format structuré et couramment utilisé.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsAccess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour l'accès et la portabilité</FormLabel>
                        <FormDescription>
                          Décrivez comment les personnes peuvent exercer leurs droits d'accès et de portabilité des données.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Formulaire en ligne dédié, adresse email de contact DPO, export des données en format JSON/CSV, délai de réponse 1 mois..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("rightsAccess")}
                            onClick={() => generateWithAI.mutate({ field: "rightsAccess" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures accès/portabilité...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.4 - Rectification and erasure rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits de rectification et d'effacement</CardTitle>
                  <CardDescription>
                    Les personnes peuvent demander la rectification de leurs données inexactes ou leur effacement dans certaines conditions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsRectification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour la rectification et l'effacement</FormLabel>
                        <FormDescription>
                          Expliquez vos procédures pour traiter les demandes de rectification et d'effacement des données.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Interface utilisateur pour modifier les données, procédure de vérification d'identité, suppression définitive après demande, information des sous-traitants..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("rightsRectification")}
                            onClick={() => generateWithAI.mutate({ field: "rightsRectification" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures rectification...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2.2.5 - Limitation and opposition rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour les droits de limitation du traitement et d'opposition</CardTitle>
                  <CardDescription>
                    Les personnes peuvent demander la limitation du traitement de leurs données ou s'opposer au traitement dans certaines situations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="rightsOpposition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesures pour la limitation et l'opposition</FormLabel>
                        <FormDescription>
                          Décrivez comment vous gérez les demandes de limitation du traitement et d'opposition.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Marquage des données limitées, arrêt du traitement marketing, procédure d'opposition pour prospection, gestion des listes d'opposition..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex gap-2">
                          <AIProgressIndicator
                            isGenerating={isFieldGenerating("rightsOpposition")}
                            onClick={() => generateWithAI.mutate({ field: "rightsOpposition" })}
                            buttonText="Générer une proposition par l'IA"
                            variant="outline"
                            size="sm"
                            estimatedSeconds={40}
                            steps={[
                              "Analyse du contexte AIPD...",
                              "Extraction profil entreprise...",
                              "Application méthodologie CNIL...",
                              "Génération mesures opposition...",
                              "Finalisation de la réponse..."
                            ]}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* 2.2.6 - Subcontracting measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour la sous-traitance</CardTitle>
                  <CardDescription>
                    Lorsque vous faites appel à un prestataire (sous-traitant) qui traite des données pour vous, vous devez signer un contrat spécifique et détaillé. Ce contrat doit garantir que le sous-traitant présente des garanties suffisantes en matière de protection des données et qu'il ne traitera les données que sur vos instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Avez-vous listé tous vos sous-traitants pour ce traitement ?</li>
                        <li>Pour chacun d'entre eux, disposez-vous d'un contrat écrit qui respecte les exigences de l'article 28 du RGPD ?</li>
                        <li>Ce contrat précise-t-il bien la nature, la finalité, la durée du traitement, ainsi que les obligations du sous-traitant en matière de sécurité, de confidentialité et d'aide à l'exercice des droits ?</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Sous-traitants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubcontractor}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un sous-traitant
                      </Button>
                    </div>

                    {form.watch("subcontractingMeasures")?.map((_, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Sous-traitant {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubcontractor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du sous-traitant</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Google Cloud Platform" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.purpose`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Finalité de la sous-traitance</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Hébergement des données" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.scope`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Périmètre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Données clients européennes" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`subcontractingMeasures.${index}.contractReference`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Référence du contrat</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: DPA-2024-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`subcontractingMeasures.${index}.gdprCompliance`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Conformité (Art. 28 RGPD)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Décrivez comment le contrat respecte les exigences de l'article 28 du RGPD..."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                    
                  </div>
                </CardContent>
              </Card>

              {/* 2.2.7 - International transfers measures */}
              <Card>
                <CardHeader>
                  <CardTitle>Détermination et description des mesures pour le transfert de données hors de l'Union européenne</CardTitle>
                  <CardDescription>
                    Le transfert de données personnelles hors de l'UE est interdit par principe, sauf si le pays de destination offre un niveau de protection adéquat ou si des garanties spécifiques sont mises en place (ex: Clauses Contractuelles Types, BCR). Cela s'applique aussi si les données sont simplement accessibles depuis un pays tiers (ex: pour de la maintenance informatique).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Questions pour vous guider :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Les données sont-elles stockées ou accessibles en dehors de l'Union européenne (y compris par un de vos sous-traitants) ?</li>
                        <li>Si oui, dans quel(s) pays ?</li>
                        <li>Quel outil juridique utilisez-vous pour encadrer ce transfert ? (ex: décision d'adéquation de la Commission européenne, signature de Clauses Contractuelles Types, etc.)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Transferts internationaux</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTransfer}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un transfert
                      </Button>
                    </div>

                    {(form.watch("internationalTransfersMeasures") || []).map((_: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Transfert {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransfer(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`internationalTransfersMeasures.${index}.dataType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de données</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Données clients, logs de connexion" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`internationalTransfersMeasures.${index}.country`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pays de destination</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Ex: États-Unis, Royaume-Uni, Suisse, Canada, etc." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`internationalTransfersMeasures.${index}.justification`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Justification et encadrement juridique</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Décrivez l'outil juridique utilisé pour encadrer ce transfert (CCT, BCR, décision d'adéquation, etc.)..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}

                    
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Security measures - Enhanced */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mesures de sécurité</CardTitle>
                  <CardDescription>
                    Sélectionnez et décrivez les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Security measures selection */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Mesures de sécurité disponibles
                      </Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Cliquez sur les mesures que vous souhaitez ajouter à votre AIPD. Vous pourrez ensuite les décrire en détail.
                      </p>
                      
                      {SECURITY_CATEGORIES.map(category => (
                        <div key={category} className="mb-6">
                          <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {CNIL_SECURITY_MEASURES
                              .filter(measure => measure.category === category)
                              .map(measure => (
                                <Button
                                  key={measure.id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSecurityMeasure(measure)}
                                  className="justify-start h-auto p-4 text-left min-h-[100px] whitespace-normal"
                                  disabled={form.watch("securityMeasures")?.some((m: any) => m.id === measure.id)}
                                >
                                  <div className="w-full">
                                    <div className="font-medium text-sm mb-2 leading-tight">{measure.name}</div>
                                    <div className="text-xs text-gray-500 leading-relaxed break-words">
                                      {measure.description}
                                    </div>
                                  </div>
                                </Button>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Selected security measures */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Mesures sélectionnées ({form.watch("securityMeasures")?.length || 0})
                      </Label>
                      
                      {form.watch("securityMeasures")?.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Aucune mesure sélectionnée. Utilisez les boutons ci-dessus pour ajouter des mesures.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {form.watch("securityMeasures")?.map((measure: any, index: number) => (
                            <Card key={measure.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium">{measure.name}</h4>
                                  <p className="text-sm text-gray-600">{measure.description}</p>
                                  <Badge variant="outline" className="mt-1">
                                    {measure.category}
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSecurityMeasure(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`securityMeasures.${index}.implemented`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel>
                                        Cette mesure est mise en œuvre
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`securityMeasures.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description de la mise en œuvre</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Décrivez comment cette mesure est implémentée dans votre organisation..."
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Custom security measures */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-medium">
                          Mesures techniques ou organisationnelles personnalisées
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues("customSecurityMeasures") || [];
                            form.setValue("customSecurityMeasures", [...current, {
                              name: "",
                              category: "",
                              description: "",
                              implemented: false
                            }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une mesure personnalisée
                        </Button>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Ajoutez vos propres mesures techniques ou organisationnelles spécifiques à votre organisation.
                      </p>

                      {(!form.watch("customSecurityMeasures") || form.watch("customSecurityMeasures")?.length === 0) ? (
                        <p className="text-sm text-gray-500">
                          Aucune mesure personnalisée ajoutée.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {form.watch("customSecurityMeasures")?.map((_: any, index: number) => (
                            <Card key={index} className="p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium">Mesure personnalisée {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const current = form.getValues("customSecurityMeasures") || [];
                                    form.setValue("customSecurityMeasures", current.filter((_, i) => i !== index));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <FormField
                                  control={form.control}
                                  name={`customSecurityMeasures.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nom de la mesure</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Ex: Chiffrement des emails internes" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`customSecurityMeasures.${index}.category`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Catégorie</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une catégorie" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {SECURITY_CATEGORIES.map(category => (
                                            <SelectItem key={category} value={category}>
                                              {category}
                                            </SelectItem>
                                          ))}
                                          <SelectItem value="Personnalisé">Personnalisé</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name={`customSecurityMeasures.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="mb-4">
                                    <FormLabel>Description de la mesure</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Décrivez en détail cette mesure de sécurité et son fonctionnement..."
                                        className="min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`customSecurityMeasures.${index}.implemented`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel>
                                      Cette mesure est mise en œuvre
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Risk Assessment */}
            <TabsContent value="risks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évaluation des risques</CardTitle>
                  <CardDescription>
                    Analysez les risques potentiels pour les droits et libertés des personnes concernées selon les 3 scénarios de risque principaux.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    
                    {/* Scenario 1: Illegitimate Access */}
                    <div className="border rounded-lg p-6 space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 font-semibold">1</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Accès illégitime aux données
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="riskScenarios.illegitimateAccess.impacts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Impacts potentiels sur les personnes concernées</FormLabel>
                              <FormDescription>
                                Décrivez les conséquences possibles d'un accès non autorisé aux données personnelles.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Usurpation d'identité, discrimination, atteinte à la réputation, préjudice financier, perte de confiance..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('illegitimateAccessImpacts')}
                                  onClick={() => handleRiskAIGenerate('illegitimateAccess', 'impacts')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse du contexte de traitement...",
                                    "Identification des données sensibles...",
                                    "Évaluation des impacts potentiels...",
                                    "Application méthodologie CNIL...",
                                    "Génération de l'analyse..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.illegitimateAccess.sources"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sources de risques et menaces</FormLabel>
                              <FormDescription>
                                Identifiez les sources potentielles pouvant causer un accès illégitime aux données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Piratage informatique, négligence humaine, défaillance technique, vol d'équipements, accès par des tiers non autorisés..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('illegitimateAccessSources')}
                                  onClick={() => handleRiskAIGenerate('illegitimateAccess', 'sources')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse du contexte technique...",
                                    "Identification des vulnérabilités...",
                                    "Évaluation des menaces sectorielles...",
                                    "Application référentiel CNIL...",
                                    "Génération des sources de risques..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.illegitimateAccess.measures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures existantes ou prévues</FormLabel>
                              <FormDescription>
                                Décrivez les mesures mises en place pour prévenir les accès illégitimes aux données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Contrôle d'accès, chiffrement, authentification forte, formation du personnel, surveillance des accès..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('illegitimateAccessMeasures')}
                                  onClick={() => handleRiskAIGenerate('illegitimateAccess', 'measures')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse des sources de risques...",
                                    "Consultation référentiel sécurité...",
                                    "Adaptation aux spécificités métier...",
                                    "Application standards CNIL...",
                                    "Génération des mesures de protection..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Risk evaluation */}
                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Évaluation du risque</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.illegitimateAccess.severity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gravité des impacts</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la gravité" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.illegitimateAccess.severityJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la gravité</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la gravité..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.illegitimateAccess.likelihood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vraisemblance</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la vraisemblance" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.illegitimateAccess.likelihoodJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la vraisemblance</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la vraisemblance..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scenario 2: Unwanted Modification */}
                    <div className="border rounded-lg p-6 space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">2</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Modification non désirée des données
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="riskScenarios.unwantedModification.impacts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Impacts potentiels sur les personnes concernées</FormLabel>
                              <FormDescription>
                                Décrivez les conséquences possibles d'une modification non autorisée des données personnelles.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Données erronées, perte de crédibilité, décisions injustes, préjudice financier, atteinte aux droits..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataModificationImpacts')}
                                  onClick={() => handleRiskAIGenerate('unwantedModification', 'impacts')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse des données modifiables...",
                                    "Évaluation des conséquences...",
                                    "Identification des préjudices...",
                                    "Application méthodologie CNIL...",
                                    "Génération de l'analyse..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.unwantedModification.sources"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sources de risques et menaces</FormLabel>
                              <FormDescription>
                                Identifiez les sources potentielles pouvant causer une modification non désirée des données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Erreur humaine, bug informatique, manipulation malveillante, défaillance système, corruption de données..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataModificationSources')}
                                  onClick={() => handleRiskAIGenerate('unwantedModification', 'sources')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse des processus de modification...",
                                    "Identification des points de vulnérabilité...",
                                    "Évaluation des risques humains et techniques...",
                                    "Application référentiel CNIL...",
                                    "Génération des sources de risques..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.unwantedModification.measures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures existantes ou prévues</FormLabel>
                              <FormDescription>
                                Décrivez les mesures mises en place pour prévenir les modifications non désirées des données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Contrôle d'intégrité, validation des saisies, historique des modifications, sauvegarde, procédures de vérification..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataModificationMeasures')}
                                  onClick={() => handleRiskAIGenerate('unwantedModification', 'measures')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse des sources de modification...",
                                    "Consultation standards d'intégrité...",
                                    "Adaptation aux processus métier...",
                                    "Application bonnes pratiques CNIL...",
                                    "Génération des mesures de contrôle..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Risk evaluation */}
                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Évaluation du risque</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.unwantedModification.severity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gravité des impacts</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la gravité" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.unwantedModification.severityJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la gravité</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la gravité..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.unwantedModification.likelihood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vraisemblance</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la vraisemblance" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.unwantedModification.likelihoodJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la vraisemblance</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la vraisemblance..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scenario 3: Data Disappearance */}
                    <div className="border rounded-lg p-6 space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">3</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Disparition des données
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="riskScenarios.dataDisappearance.impacts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Impacts potentiels sur les personnes concernées</FormLabel>
                              <FormDescription>
                                Décrivez les conséquences possibles de la perte ou destruction des données personnelles.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Perte d'accès aux services, impossibilité d'exercer ses droits, perte d'historique, préjudice administratif..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataDisappearanceImpacts')}
                                  onClick={() => handleRiskAIGenerate('dataDisappearance', 'impacts')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse de la criticité des données...",
                                    "Évaluation de la dépendance des services...",
                                    "Identification des impacts utilisateur...",
                                    "Application méthodologie CNIL...",
                                    "Génération de l'analyse..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.dataDisappearance.sources"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sources de risques et menaces</FormLabel>
                              <FormDescription>
                                Identifiez les sources potentielles pouvant causer la disparition des données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Panne matérielle, catastrophe naturelle, suppression accidentelle, cyberattaque, défaillance du cloud..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataDisappearanceSources')}
                                  onClick={() => handleRiskAIGenerate('dataDisappearance', 'sources')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse de l'infrastructure de stockage...",
                                    "Identification des vulnérabilités...",
                                    "Évaluation des risques environnementaux...",
                                    "Application référentiel CNIL...",
                                    "Génération des sources de risques..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskScenarios.dataDisappearance.measures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures existantes ou prévues</FormLabel>
                              <FormDescription>
                                Décrivez les mesures mises en place pour prévenir la disparition des données.
                              </FormDescription>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: Sauvegardes régulières, redondance, plan de continuité, supervision, contrats de niveau de service..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex gap-2">
                                <AIProgressIndicator
                                  isGenerating={isFieldGenerating('dataDisappearanceMeasures')}
                                  onClick={() => handleRiskAIGenerate('dataDisappearance', 'measures')}
                                  buttonText="Générer une proposition par l'IA"
                                  variant="outline"
                                  size="sm"
                                  estimatedSeconds={35}
                                  steps={[
                                    "Analyse des besoins de continuité...",
                                    "Consultation standards de sauvegarde...",
                                    "Adaptation aux enjeux métier...",
                                    "Application bonnes pratiques CNIL...",
                                    "Génération des mesures de protection..."
                                  ]}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Risk evaluation */}
                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Évaluation du risque</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.dataDisappearance.severity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gravité des impacts</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la gravité" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.dataDisappearance.severityJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la gravité</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la gravité..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="riskScenarios.dataDisappearance.likelihood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vraisemblance</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la vraisemblance" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="negligible">Négligeable</SelectItem>
                                      <SelectItem value="limited">Limitée</SelectItem>
                                      <SelectItem value="important">Importante</SelectItem>
                                      <SelectItem value="maximum">Maximale</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="riskScenarios.dataDisappearance.likelihoodJustification"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Justification de la vraisemblance</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Justifiez votre évaluation de la vraisemblance..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 6: Evaluation */}
            <TabsContent value="evaluation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation de l'AIPD</CardTitle>
                  <CardDescription>
                    Évaluez chaque section selon les critères : Insatisfaisant / Amélioration prévue / Satisfaisant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    {/* Description générale du traitement */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Description générale du traitement</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.generalDescription.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="generalDescription-unsatisfactory" />
                                <Label htmlFor="generalDescription-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="generalDescription-improvement" />
                                <Label htmlFor="generalDescription-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="generalDescription-satisfactory" />
                                <Label htmlFor="generalDescription-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evaluation.generalDescription.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Justifiez votre évaluation..."
                                className="min-h-[80px]"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("evaluation.generalDescription.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.generalDescription.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez les mesures additionnelles à mettre en place..."
                                  className="min-h-[100px]"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Données, processus et supports */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Données, processus et supports</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.dataProcesses.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="dataProcesses-unsatisfactory" />
                                <Label htmlFor="dataProcesses-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="dataProcesses-improvement" />
                                <Label htmlFor="dataProcesses-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="dataProcesses-satisfactory" />
                                <Label htmlFor="dataProcesses-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evaluation.dataProcesses.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Justifiez votre évaluation..."
                                className="min-h-[80px]"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("evaluation.dataProcesses.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.dataProcesses.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez les mesures additionnelles à mettre en place..."
                                  className="min-h-[100px]"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Explication et justification des finalités */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Explication et justification des finalités</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.finalitiesExplanation.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="finalitiesExplanation-unsatisfactory" />
                                <Label htmlFor="finalitiesExplanation-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="finalitiesExplanation-improvement" />
                                <Label htmlFor="finalitiesExplanation-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="finalitiesExplanation-satisfactory" />
                                <Label htmlFor="finalitiesExplanation-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.finalitiesExplanation.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.finalitiesExplanation.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.finalitiesExplanation.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Explication et justification de la minimisation des données */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Explication et justification de la minimisation des données</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.dataMinimizationExplanation.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="dataMinimizationExplanation-unsatisfactory" />
                                <Label htmlFor="dataMinimizationExplanation-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="dataMinimizationExplanation-improvement" />
                                <Label htmlFor="dataMinimizationExplanation-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="dataMinimizationExplanation-satisfactory" />
                                <Label htmlFor="dataMinimizationExplanation-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.dataMinimizationExplanation.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.dataMinimizationExplanation.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.dataMinimizationExplanation.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Explication et justification des durées de conservation */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Explication et justification des durées de conservation</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.retentionExplanation.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="retentionExplanation-unsatisfactory" />
                                <Label htmlFor="retentionExplanation-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="retentionExplanation-improvement" />
                                <Label htmlFor="retentionExplanation-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="retentionExplanation-satisfactory" />
                                <Label htmlFor="retentionExplanation-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.retentionExplanation.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.retentionExplanation.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.retentionExplanation.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Explication et justification du fondement (Base légale) */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Explication et justification du fondement (Base légale)</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.legalBasisExplanation.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="legalBasisExplanation-unsatisfactory" />
                                <Label htmlFor="legalBasisExplanation-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="legalBasisExplanation-improvement" />
                                <Label htmlFor="legalBasisExplanation-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="legalBasisExplanation-satisfactory" />
                                <Label htmlFor="legalBasisExplanation-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.legalBasisExplanation.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.legalBasisExplanation.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.legalBasisExplanation.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Explication et justification de la qualité des données */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Explication et justification de la qualité des données</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.dataQualityExplanation.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="dataQualityExplanation-unsatisfactory" />
                                <Label htmlFor="dataQualityExplanation-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="dataQualityExplanation-improvement" />
                                <Label htmlFor="dataQualityExplanation-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="dataQualityExplanation-satisfactory" />
                                <Label htmlFor="dataQualityExplanation-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.dataQualityExplanation.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.dataQualityExplanation.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.dataQualityExplanation.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour l'information des personnes */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour l'information des personnes</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.informationMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="informationMeasures-unsatisfactory" />
                                <Label htmlFor="informationMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="informationMeasures-improvement" />
                                <Label htmlFor="informationMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="informationMeasures-satisfactory" />
                                <Label htmlFor="informationMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.informationMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.informationMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.informationMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour le recueil du consentement */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour le recueil du consentement</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.consentMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="consentMeasures-unsatisfactory" />
                                <Label htmlFor="consentMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="consentMeasures-improvement" />
                                <Label htmlFor="consentMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="consentMeasures-satisfactory" />
                                <Label htmlFor="consentMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.consentMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.consentMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.consentMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Mesures de sécurité */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Mesures de sécurité</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.securityMeasuresEval.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="securityMeasuresEval-unsatisfactory" />
                                <Label htmlFor="securityMeasuresEval-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="securityMeasuresEval-improvement" />
                                <Label htmlFor="securityMeasuresEval-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="securityMeasuresEval-satisfactory" />
                                <Label htmlFor="securityMeasuresEval-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evaluation.securityMeasuresEval.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Justifiez votre évaluation..."
                                className="min-h-[80px]"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("evaluation.securityMeasuresEval.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.securityMeasuresEval.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez les mesures additionnelles à mettre en place..."
                                  className="min-h-[100px]"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour les droits d'accès et à la portabilité */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour les droits d'accès et à la portabilité</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.accessPortabilityMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="accessPortabilityMeasures-unsatisfactory" />
                                <Label htmlFor="accessPortabilityMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="accessPortabilityMeasures-improvement" />
                                <Label htmlFor="accessPortabilityMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="accessPortabilityMeasures-satisfactory" />
                                <Label htmlFor="accessPortabilityMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.accessPortabilityMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.accessPortabilityMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.accessPortabilityMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour les droits de rectification et d'effacement */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour les droits de rectification et d'effacement</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.rectificationErasureMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="rectificationErasureMeasures-unsatisfactory" />
                                <Label htmlFor="rectificationErasureMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="rectificationErasureMeasures-improvement" />
                                <Label htmlFor="rectificationErasureMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="rectificationErasureMeasures-satisfactory" />
                                <Label htmlFor="rectificationErasureMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.rectificationErasureMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.rectificationErasureMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.rectificationErasureMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour les droits de limitation du traitement et d'opposition */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour les droits de limitation du traitement et d'opposition</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.limitationOppositionMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="limitationOppositionMeasures-unsatisfactory" />
                                <Label htmlFor="limitationOppositionMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="limitationOppositionMeasures-improvement" />
                                <Label htmlFor="limitationOppositionMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="limitationOppositionMeasures-satisfactory" />
                                <Label htmlFor="limitationOppositionMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.limitationOppositionMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.limitationOppositionMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.limitationOppositionMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour la sous-traitance */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour la sous-traitance</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.subcontractingMeasuresEval.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="subcontractingMeasuresEval-unsatisfactory" />
                                <Label htmlFor="subcontractingMeasuresEval-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="subcontractingMeasuresEval-improvement" />
                                <Label htmlFor="subcontractingMeasuresEval-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="subcontractingMeasuresEval-satisfactory" />
                                <Label htmlFor="subcontractingMeasuresEval-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.subcontractingMeasuresEval.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.subcontractingMeasuresEval.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.subcontractingMeasuresEval.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Détermination et description des mesures pour le transfert de données hors de l'Union européenne */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Détermination et description des mesures pour le transfert de données hors de l'Union européenne</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.internationalTransferMeasures.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="internationalTransferMeasures-unsatisfactory" />
                                <Label htmlFor="internationalTransferMeasures-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="internationalTransferMeasures-improvement" />
                                <Label htmlFor="internationalTransferMeasures-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="internationalTransferMeasures-satisfactory" />
                                <Label htmlFor="internationalTransferMeasures-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.internationalTransferMeasures.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.internationalTransferMeasures.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.internationalTransferMeasures.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Accès illégitime aux données */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Accès illégitime aux données</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.illegitimateAccess.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="illegitimateAccess-unsatisfactory" />
                                <Label htmlFor="illegitimateAccess-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="illegitimateAccess-improvement" />
                                <Label htmlFor="illegitimateAccess-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="illegitimateAccess-satisfactory" />
                                <Label htmlFor="illegitimateAccess-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.illegitimateAccess.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.illegitimateAccess.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.illegitimateAccess.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Modification non désirée des données */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Modification non désirée des données</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.unwantedModification.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="unwantedModification-unsatisfactory" />
                                <Label htmlFor="unwantedModification-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="unwantedModification-improvement" />
                                <Label htmlFor="unwantedModification-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="unwantedModification-satisfactory" />
                                <Label htmlFor="unwantedModification-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.unwantedModification.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.unwantedModification.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.unwantedModification.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Disparition des données */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Disparition des données</h4>
                      
                      <FormField
                        control={form.control}
                        name="evaluation.dataDisappearance.rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Évaluation</FormLabel>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsatisfactory" id="dataDisappearance-unsatisfactory" />
                                <Label htmlFor="dataDisappearance-unsatisfactory" className="text-red-600">Insatisfaisant</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement_planned" id="dataDisappearance-improvement" />
                                <Label htmlFor="dataDisappearance-improvement" className="text-orange-600">Amélioration prévue</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="satisfactory" id="dataDisappearance-satisfactory" />
                                <Label htmlFor="dataDisappearance-satisfactory" className="text-green-600">Satisfaisant</Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="evaluation.dataDisappearance.justification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Justification de l'évaluation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Justifiez votre évaluation..." className="min-h-[80px]" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("evaluation.dataDisappearance.rating") === "improvement_planned" && (
                        <FormField
                          control={form.control}
                          name="evaluation.dataDisappearance.additionalMeasures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesures additionnelles préconisées</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez les mesures additionnelles..." className="min-h-[100px]" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 7: Validation */}
            <TabsContent value="validation" className="space-y-6">
              {/* Validation summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif de l'AIPD</CardTitle>
                  <CardDescription>
                    Vérifiez l'exhaustivité de votre analyse d'impact avant validation finale.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-700">Sections complétées</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Vue d'ensemble du traitement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Données personnelles traitées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Mesures de proportionnalité</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Protection des droits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Mesures de sécurité</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-700">Statistiques</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Mesures de sécurité sélectionnées:</span>
                          <span className="font-medium">{form.watch("securityMeasures")?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Mesures personnalisées:</span>
                          <span className="font-medium">{form.watch("customSecurityMeasures")?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Catégories de données:</span>
                          <span className="font-medium">{form.watch("personalDataCategories")?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sous-traitants:</span>
                          <span className="font-medium">{form.watch("subcontractingMeasures")?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan d'action</CardTitle>
                  <CardDescription>
                    Définissez les actions à mettre en œuvre pour améliorer la conformité.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Actions recommandées basées sur l'évaluation */}
                    {(() => {
                      const evaluationData = form.watch("evaluation") || {};
                      const additionalMeasures = [];
                      
                      // Collect all additional measures from evaluation
                      Object.keys(evaluationData).forEach(key => {
                        const section = evaluationData[key];
                        if (section?.rating === "improvement_planned" && section?.additionalMeasures) {
                          additionalMeasures.push({
                            id: key,
                            measure: section.additionalMeasures,
                            section: key
                          });
                        }
                      });

                      return (
                        <div className="border-l-4 border-orange-400 pl-4">
                          <h4 className="font-medium text-orange-700 mb-4">Actions recommandées</h4>
                          
                          {additionalMeasures.length > 0 ? (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600 mb-3">Mesures identifiées lors de l'évaluation :</p>
                              {additionalMeasures.map((measure, index) => (
                                <div key={measure.id} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg space-y-3">
                                  <div className="font-medium text-sm text-orange-800 dark:text-orange-200">
                                    {measure.measure}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`actionPlan.${index}.responsible`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Responsable de mise en œuvre</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                              <SelectTrigger className="text-sm">
                                                <SelectValue placeholder="Sélectionner un responsable..." />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {collaborators.map((collaborator: any) => (
                                                <SelectItem 
                                                  key={collaborator.id} 
                                                  value={`${collaborator.firstName} ${collaborator.lastName}`}
                                                >
                                                  <div className="flex items-center space-x-2">
                                                    <Users className="h-3 w-3" />
                                                    <span>{collaborator.firstName} {collaborator.lastName}</span>
                                                    <span className="text-xs text-gray-500">({collaborator.email})</span>
                                                  </div>
                                                </SelectItem>
                                              ))}
                                              <SelectItem value="other-custom">
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs text-gray-600">Saisie libre...</span>
                                                </div>
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          
                                          {/* Show text input if "other-custom" is selected */}
                                          {field.value === "other-custom" && (
                                            <div className="mt-2">
                                              <Input
                                                placeholder="Ex: Responsable IT, DPO, Prestataire externe..."
                                                className="text-sm"
                                                onChange={(e) => field.onChange(e.target.value)}
                                                value=""
                                              />
                                            </div>
                                          )}
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name={`actionPlan.${index}.deadline`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs">Échéance</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="date"
                                              className="text-sm"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  {/* Hidden fields to store the measure details */}
                                  <FormField
                                    control={form.control}
                                    name={`actionPlan.${index}.measure`}
                                    render={({ field }) => (
                                      <input type="hidden" {...field} value={measure.measure} />
                                    )}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600">Actions générales recommandées :</p>
                              <ul className="space-y-1 ml-4">
                                <li>• Finaliser la documentation des mesures de sécurité</li>
                                <li>• Mettre en place un processus de révision périodique</li>
                                <li>• Former les équipes aux procédures RGPD</li>
                                <li>• Planifier des audits de conformité réguliers</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Prochaines étapes</h4>
                      <ol className="space-y-1 text-sm list-decimal list-inside">
                        <li>Valider cette AIPD avec votre DPO ou responsable conformité</li>
                        <li>Intégrer les mesures dans votre système de management</li>
                        <li>Planifier une révision dans 12 mois ou en cas de modification</li>
                        <li>Conserver cette AIPD dans votre registre des traitements</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final validation */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation finale</CardTitle>
                  <CardDescription>
                    Confirmez que l'AIPD est complète et prête pour validation officielle.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut de l'AIPD</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Brouillon</SelectItem>
                              <SelectItem value="inprogress">En cours</SelectItem>
                              <SelectItem value="completed">Terminée</SelectItem>
                              <SelectItem value="validated">Validée</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Cette AIPD doit être revue et mise à jour en cas de modification substantielle du traitement 
                        ou au minimum tous les 3 ans. Conservez ce document dans votre documentation RGPD.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => exportPdfMutation.mutate()}
                        disabled={exportPdfMutation.isPending}
                      >
                        {exportPdfMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Export en cours...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter en PDF
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => generateReportMutation.mutate()}
                        disabled={generateReportMutation.isPending}
                      >
                        {generateReportMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Printer className="h-4 w-4 mr-2" />
                            Générer le rapport
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dpia')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              onClick={(e) => {
                console.log("Save button clicked");
                console.log("Form valid:", form.formState.isValid);
                console.log("Form errors:", form.formState.errors);
                const formData = form.getValues();
                console.log("internationalTransfersMeasures data:", formData.internationalTransfersMeasures);
              }}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}