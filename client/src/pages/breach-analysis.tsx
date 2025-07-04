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
import { AlertTriangle, Shield, Download, Loader2, CheckCircle, XCircle, Info, Calendar } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth"; // Mock company ID

interface BreachFormData {
  // Nature de la violation
  violationStatus: 'etabli' | 'suppose';
  discoveryDate: string;
  discoveryTime: string;
  discoveryUnknown: boolean;
  startDate: string;
  startTime: string;
  startUnknown: boolean;
  endDate: string;
  endTime: string;
  endUnknown: boolean;
  providerNotificationDate: string;
  providerNotificationTime: string;
  extendedPeriod: boolean;
  ongoingViolation: boolean;
  discoveryCircumstances: string;
  
  // Origines
  origins: string[];
  otherOrigin: string;
  originUnknown: boolean;
  
  // Circonstances
  circumstances: string[];
  otherCircumstance: string;
  circumstanceUnknown: boolean;
  
  // Causes
  causes: string[];
  otherCause: string;
  causeUnknown: boolean;
  
  // Sous-traitants
  hasSubcontractors: boolean;
  subcontractorDetails: string;
  
  // Catégories de personnes
  personCategories: string[];
  otherPersonCategory: string;
  personCategoryUnknown: boolean;
  affectedPersonsCount: string;
  directlyIdentifiable: boolean;
  
  // Catégories de données
  dataCategories: string[];
  otherDataCategory: string;
  dataCategoryUnknown: boolean;
  dataVolume: string;
  dataSupport: string[];
  otherDataSupport: string;
  dataSupportUnknown: boolean;
  
  // Conséquences
  consequences: string[];
  otherConsequence: string;
  consequenceUnknown: boolean;
  
  // Préjudices
  potentialHarms: string[];
  otherPotentialHarm: string;
  potentialHarmUnknown: boolean;
  
  // Mesures
  immediateMeasures: string;
  mediumTermMeasures: string;
  longTermMeasures: string;
  otherMeasures: string;
}

export default function BreachAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { company, isLoading: isAuthLoading } = useAuth();
  
  const COMPANY_ID = company?.id;

  // Don't render if not authenticated or company not loaded
  if (isAuthLoading || !COMPANY_ID) {
    return <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  const form = useForm<BreachFormData>({
    defaultValues: {
      violationStatus: 'etabli',
      discoveryUnknown: false,
      startUnknown: false,
      endUnknown: false,
      extendedPeriod: false,
      ongoingViolation: false,
      origins: [],
      otherOrigin: '',
      originUnknown: false,
      circumstances: [],
      otherCircumstance: '',
      circumstanceUnknown: false,
      causes: [],
      otherCause: '',
      causeUnknown: false,
      hasSubcontractors: false,
      subcontractorDetails: '',
      personCategories: [],
      otherPersonCategory: '',
      personCategoryUnknown: false,
      directlyIdentifiable: false,
      dataCategories: [],
      otherDataCategory: '',
      dataCategoryUnknown: false,
      dataSupport: [],
      otherDataSupport: '',
      dataSupportUnknown: false,
      consequences: [],
      otherConsequence: '',
      consequenceUnknown: false,
      potentialHarms: [],
      otherPotentialHarm: '',
      potentialHarmUnknown: false,
    }
  });

  const { data: breaches, isLoading } = useQuery({
    queryKey: ['/api/breaches', COMPANY_ID],
    queryFn: () => breachApi.get(COMPANY_ID).then(res => res.json()),
  });

  const createBreachMutation = useMutation({
    mutationFn: (data: any) => breachApi.create(data),
    onSuccess: () => {
      toast({
        title: "Violation enregistrée",
        description: "L'analyse de violation a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breaches'] });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BreachFormData) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const riskLevel = data.dataCategories.some(cat => 
        ['Données sensibles', 'Numéro de sécurité sociale', 'Documents officiels'].includes(cat)
      ) ? 'élevé' : 'moyen';
      
      const notificationRequired = riskLevel === 'élevé' || data.affectedPersonsCount && parseInt(data.affectedPersonsCount) > 250;
      
      setAnalysisResult({
        notificationRequired,
        riskLevel,
        justification: notificationRequired 
          ? "Notification requise en raison du type de données impliquées ou du nombre de personnes concernées"
          : "Risque limité, notification non obligatoire mais surveillance recommandée",
        recommendations: [
          "Documenter l'incident dans le registre des violations",
          "Informer les personnes concernées si nécessaire",
          "Renforcer les mesures de sécurité",
          notificationRequired ? "Notifier la CNIL dans les 72h" : "Surveiller d'éventuelles conséquences"
        ]
      });
      
      setIsAnalyzing(false);
    }, 2000);

    // Save to database
    const breachData = {
      companyId: COMPANY_ID,
      description: `Violation ${data.violationStatus} - ${data.discoveryCircumstances}`,
      incidentDate: data.startDate || data.discoveryDate,
      dataCategories: data.dataCategories,
      affectedPersons: parseInt(data.affectedPersonsCount) || 0,
      circumstances: JSON.stringify({
        origins: data.origins,
        circumstances: data.circumstances,
        causes: data.causes
      }),
      consequences: JSON.stringify({
        consequences: data.consequences,
        potentialHarms: data.potentialHarms
      }),
      measures: JSON.stringify({
        immediate: data.immediateMeasures,
        mediumTerm: data.mediumTermMeasures,
        longTerm: data.longTermMeasures
      }),
      status: 'analysed'
    };

    createBreachMutation.mutate(breachData);
  };

  const originOptions = [
    "Equipement perdu ou volé",
    "Papier perdu, volé ou laissé accessible dans un endroit non sécurisé",
    "Courrier perdu ou ouvert avant d'être retourné à l'envoyeur",
    "Piratage, logiciel malveillant (par exemple rançongiciel) et/ou hameçonnage",
    "Mise au rebut de documents papier contenant des données personnelles sans destruction physique",
    "Mise au rebut d'appareils numériques contenant des données personnelles sans effacement sécurisé",
    "Publication non volontaire d'informations",
    "Données de la mauvaise personne affichées sur le portail du client",
    "Données personnelles envoyées à un mauvais destinataire",
    "Informations personnelles divulguées de façon verbale"
  ];

  const circumstanceOptions = [
    "Perte de confidentialité (divulgation ou accès non autorisé(e) ou accidentel(le) à des données à caractère personnel)",
    "Perte d'intégrité (altération non autorisée ou accidentelle de données à caractère personnel)",
    "Perte de disponibilité (destruction ou perte accidentelle ou non autorisée de données à caractère personnel)"
  ];

  const causeOptions = [
    "Acte interne malveillant",
    "Acte interne accidentel",
    "Acte externe malveillant",
    "Acte externe accidentel"
  ];

  const personCategoryOptions = [
    "Clients",
    "Prospects",
    "Salariés",
    "Mandataires sociaux",
    "Prestataires",
    "Fournisseurs",
    "Personnes vulnérables"
  ];

  const dataCategoryOptions = [
    "Nom",
    "Prénom", 
    "Date de naissance",
    "Etat civil (marié, divorcé, pacsé etc.)",
    "Filiation (parents, enfants etc.)",
    "Genre",
    "Numéro de sécurité sociale",
    "Coordonnées (ex : adresse postale ou électronique, numéros de téléphone fixe ou portable...)",
    "Adresse IP",
    "Données transactionnelles (produits achetés, date heure et lieu d'achat etc.)",
    "Données de connexion",
    "Données de localisation",
    "Documents officiels (Passeport, pièce d'identité, etc.)",
    "Données relatives à des infractions, condamnations, mesures de sûreté",
    "Informations d'ordre économique et financier (revenus, situation bancaire, situation fiscale etc.)",
    "Données comportementales (habitudes de vie, marques préférées etc.)",
    "Données sensibles (origine raciale ou ethnique, opinions politiques, opinions philosophiques ou religieuses, appartenance syndicale, orientation sexuelle, données de santé, données biométriques, données génétiques)"
  ];

  const dataSupportOptions = [
    "Serveur",
    "Poste fixe",
    "Ordinateur portable",
    "Disque de sauvegarde",
    "Clé USB",
    "Téléphone portable",
    "Document papier"
  ];

  const consequenceOptions = [
    "Les données ont été diffusées plus que nécessaire et ont échappé à la maîtrise des personnes concernées",
    "Les données peuvent être croisées ou rapprochées avec d'autres informations relatives aux personnes concernées",
    "Les données peuvent être détournées par un tiers à d'autres fins que celles prévues initialement et/ou de manière non loyale ou malveillante",
    "Les données peuvent être falsifiées"
  ];

  const potentialHarmOptions = [
    "Perte de contrôle sur les données à caractère personnel",
    "Limitation des droits des personnes concernées",
    "Discrimination",
    "Vol d'identité",
    "Fraude",
    "Levée non autorisée de la pseudonymisation",
    "Pertes financières",
    "Atteinte à la réputation",
    "Atteinte à la vie privée",
    "Perte de la confidentialité de données protégées par un secret professionnel"
  ];

  const CheckboxGroup = ({ options, value, onChange, otherValue, onOtherChange, unknownValue, onUnknownChange, label }: any) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option: string) => (
          <div key={option} className="flex items-start space-x-2">
            <Checkbox
              checked={value.includes(option)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...value, option]);
                } else {
                  onChange(value.filter((v: string) => v !== option));
                }
              }}
              disabled={unknownValue}
            />
            <Label className="text-sm leading-5">{option}</Label>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Label className="text-sm">Autre (à préciser):</Label>
          <Input
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            className="flex-1"
            disabled={unknownValue}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={unknownValue}
            onCheckedChange={onUnknownChange}
          />
          <Label className="text-sm">Ne sait pas pour l'instant</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analyse des violations de données</h1>
          <p className="text-muted-foreground">Documentez et analysez les incidents de violation de données personnelles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Déclaration de violation</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Nature de la violation */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Nature de la violation</h3>
                    
                    <FormField
                      control={form.control}
                      name="violationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caractère établi ou supposé de la violation</FormLabel>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === 'etabli'}
                                onCheckedChange={() => field.onChange('etabli')}
                              />
                              <Label>Établi</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === 'suppose'}
                                onCheckedChange={() => field.onChange('suppose')}
                              />
                              <Label>Supposé</Label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="discoveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de découverte</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={form.watch('discoveryUnknown')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discoveryTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heure de découverte</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={form.watch('discoveryUnknown')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="discoveryUnknown"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <FormLabel>Ne sait pas pour l'instant</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={form.watch('startUnknown')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heure de début</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={form.watch('startUnknown')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="startUnknown"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <FormLabel>Ne sait pas pour l'instant</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ongoingViolation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>La violation est-elle toujours en cours ?</FormLabel>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={() => field.onChange(true)}
                              />
                              <Label>Oui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === false}
                                onCheckedChange={() => field.onChange(false)}
                              />
                              <Label>Non</Label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discoveryCircumstances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Circonstances de la découverte (par qui, où, quand, comment etc.)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder="Décrivez les circonstances de la découverte..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Origines */}
                  <FormField
                    control={form.control}
                    name="origins"
                    render={({ field }) => (
                      <FormItem>
                        <CheckboxGroup
                          label="Origines de l'incident"
                          options={originOptions}
                          value={field.value}
                          onChange={field.onChange}
                          otherValue={form.watch('otherOrigin')}
                          onOtherChange={(value: string) => form.setValue('otherOrigin', value)}
                          unknownValue={form.watch('originUnknown')}
                          onUnknownChange={(value: boolean) => form.setValue('originUnknown', value)}
                        />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Circonstances */}
                  <FormField
                    control={form.control}
                    name="circumstances"
                    render={({ field }) => (
                      <FormItem>
                        <CheckboxGroup
                          label="Circonstances de la violation"
                          options={circumstanceOptions}
                          value={field.value}
                          onChange={field.onChange}
                          otherValue={form.watch('otherCircumstance')}
                          onOtherChange={(value: string) => form.setValue('otherCircumstance', value)}
                          unknownValue={form.watch('circumstanceUnknown')}
                          onUnknownChange={(value: boolean) => form.setValue('circumstanceUnknown', value)}
                        />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Causes */}
                  <FormField
                    control={form.control}
                    name="causes"
                    render={({ field }) => (
                      <FormItem>
                        <CheckboxGroup
                          label="Cause(s) de la violation"
                          options={causeOptions}
                          value={field.value}
                          onChange={field.onChange}
                          otherValue={form.watch('otherCause')}
                          onOtherChange={(value: string) => form.setValue('otherCause', value)}
                          unknownValue={form.watch('causeUnknown')}
                          onUnknownChange={(value: boolean) => form.setValue('causeUnknown', value)}
                        />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Sous-traitants */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sous-traitants</h3>
                    
                    <FormField
                      control={form.control}
                      name="hasSubcontractors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Existence d'un ou de plusieurs sous-traitant(s) des données visées par la violation</FormLabel>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={() => field.onChange(true)}
                              />
                              <Label>Oui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === false}
                                onCheckedChange={() => field.onChange(false)}
                              />
                              <Label>Non</Label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('hasSubcontractors') && (
                      <FormField
                        control={form.control}
                        name="subcontractorDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom(s) et coordonnées des sous-traitants</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder="Précisez les noms et coordonnées..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Catégories de personnes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Catégories de personnes concernées</h3>
                    
                    <FormField
                      control={form.control}
                      name="personCategories"
                      render={({ field }) => (
                        <FormItem>
                          <CheckboxGroup
                            label="Catégorie(s) de personnes"
                            options={personCategoryOptions}
                            value={field.value}
                            onChange={field.onChange}
                            otherValue={form.watch('otherPersonCategory')}
                            onOtherChange={(value: string) => form.setValue('otherPersonCategory', value)}
                            unknownValue={form.watch('personCategoryUnknown')}
                            onUnknownChange={(value: boolean) => form.setValue('personCategoryUnknown', value)}
                          />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="affectedPersonsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre (éventuellement approximatif) de personnes concernées</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              placeholder="Nombre de personnes concernées"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="directlyIdentifiable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ces personnes sont-elles identifiables directement ?</FormLabel>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={() => field.onChange(true)}
                              />
                              <Label>Oui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value === false}
                                onCheckedChange={() => field.onChange(false)}
                              />
                              <Label>Non</Label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Catégories de données */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Catégories de données personnelles</h3>
                    
                    <FormField
                      control={form.control}
                      name="dataCategories"
                      render={({ field }) => (
                        <FormItem>
                          <CheckboxGroup
                            label="Nature des données personnelles touchées par la violation"
                            options={dataCategoryOptions}
                            value={field.value}
                            onChange={field.onChange}
                            otherValue={form.watch('otherDataCategory')}
                            onOtherChange={(value: string) => form.setValue('otherDataCategory', value)}
                            unknownValue={form.watch('dataCategoryUnknown')}
                            onUnknownChange={(value: boolean) => form.setValue('dataCategoryUnknown', value)}
                          />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataVolume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume de données concernées par la violation</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Décrivez le volume de données..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataSupport"
                      render={({ field }) => (
                        <FormItem>
                          <CheckboxGroup
                            label="Support des données concernées par la violation"
                            options={dataSupportOptions}
                            value={field.value}
                            onChange={field.onChange}
                            otherValue={form.watch('otherDataSupport')}
                            onOtherChange={(value: string) => form.setValue('otherDataSupport', value)}
                            unknownValue={form.watch('dataSupportUnknown')}
                            onUnknownChange={(value: boolean) => form.setValue('dataSupportUnknown', value)}
                          />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Conséquences */}
                  <FormField
                    control={form.control}
                    name="consequences"
                    render={({ field }) => (
                      <FormItem>
                        <CheckboxGroup
                          label="Conséquences probables de la violation"
                          options={consequenceOptions}
                          value={field.value}
                          onChange={field.onChange}
                          otherValue={form.watch('otherConsequence')}
                          onOtherChange={(value: string) => form.setValue('otherConsequence', value)}
                          unknownValue={form.watch('consequenceUnknown')}
                          onUnknownChange={(value: boolean) => form.setValue('consequenceUnknown', value)}
                        />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Préjudices */}
                  <FormField
                    control={form.control}
                    name="potentialHarms"
                    render={({ field }) => (
                      <FormItem>
                        <CheckboxGroup
                          label="Nature des préjudices potentiels pour les personnes concernées"
                          options={potentialHarmOptions}
                          value={field.value}
                          onChange={field.onChange}
                          otherValue={form.watch('otherPotentialHarm')}
                          onOtherChange={(value: string) => form.setValue('otherPotentialHarm', value)}
                          unknownValue={form.watch('potentialHarmUnknown')}
                          onUnknownChange={(value: boolean) => form.setValue('potentialHarmUnknown', value)}
                        />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Mesures */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Mesures prises pour remédier à la violation</h3>
                    
                    <FormField
                      control={form.control}
                      name="immediateMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures prises en réaction immédiate à la violation</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Décrivez les mesures immédiates..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mediumTermMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures de moyen terme prises ou prévues pour revenir à une situation normale</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Décrivez les mesures à moyen terme..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longTermMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesures de moyen et long termes prises ou prévues pour éviter que la violation ne se reproduise</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Décrivez les mesures préventives..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherMeasures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autre - Préciser</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Autres mesures..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="submit" disabled={isAnalyzing}>
                      {isAnalyzing ? (
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
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Résultats et violations existantes */}
        <div className="space-y-6">
          {/* Résultat de l'analyse */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Résultat de l'analyse</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {analysisResult.notificationRequired ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className="font-medium">
                    {analysisResult.notificationRequired ? "Notification CNIL requise" : "Notification non requise"}
                  </span>
                </div>

                <Badge variant={analysisResult.riskLevel === 'élevé' ? 'destructive' : 'secondary'}>
                  Risque {analysisResult.riskLevel}
                </Badge>

                <p className="text-sm text-muted-foreground">
                  {analysisResult.justification}
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Recommandations :</Label>
                  <ul className="text-sm space-y-1">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Violations existantes */}
          <Card>
            <CardHeader>
              <CardTitle>Violations déclarées</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : breaches && breaches.length > 0 ? (
                <div className="space-y-4">
                  {breaches.map((breach: any) => (
                    <div key={breach.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{breach.description}</h4>
                        <Badge variant={breach.status === 'analysed' ? 'default' : 'secondary'}>
                          {breach.status === 'analysed' ? 'Analysée' : 'En cours'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(breach.incidentDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm">
                        {breach.affectedPersons} personne(s) concernée(s)
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune violation déclarée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}