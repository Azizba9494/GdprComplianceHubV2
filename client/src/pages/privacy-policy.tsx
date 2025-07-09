import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { privacyPolicyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ExpandableText } from "@/components/ui/expandable-text";
import { FileText, Download, Sparkles, Clock, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";

interface PrivacyPolicy {
  id: number;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export default function PrivacyPolicy() {
  const [selectedPolicy, setSelectedPolicy] = useState<PrivacyPolicy | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Fetch company data for the current user
  const { data: company, isLoading: companyLoading } = useQuery({
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
  });

  const { data: policies, isLoading } = useQuery({
    queryKey: ['/api/privacy-policies', company?.id],
    queryFn: () => privacyPolicyApi.get(company.id).then(res => res.json()),
    enabled: !!company?.id,
  });

  const generateMutation = useMutation({
    mutationFn: () => privacyPolicyApi.generate(company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policies'] });
      toast({
        title: "Politique générée !",
        description: "Votre politique de confidentialité personnalisée a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      console.error('Privacy policy generation error:', error);
      
      // Analyser la réponse d'erreur pour afficher un message approprié
      let errorMessage = "Impossible de générer la politique de confidentialité";
      let errorTitle = "Erreur";
      
      if (error?.response?.status === 503) {
        errorTitle = "Service temporairement indisponible";
        errorMessage = "Le service de génération IA est surchargé. Veuillez réessayer dans quelques minutes.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.error) {
          errorTitle = error.response.data.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000, // Afficher plus longtemps pour les erreurs temporaires
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (policyId: number) => {
      const response = await fetch(`/api/privacy-policies/${policyId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policies'] });
      toast({
        title: "Politique supprimée",
        description: "La politique de confidentialité a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la politique",
        variant: "destructive",
      });
    },
  });

  // Check permissions after all hooks
  if (!hasPermission('policies', 'read')) {
    return (
      <AccessDenied 
        module="Politique de confidentialité" 
        requiredPermission="policies.read"
        description="Vous n'avez pas accès au module de politique de confidentialité car vos droits ne le permettent pas."
      />
    );
  }

  // Early returns after all hooks
  if (!user || companyLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Aucune entreprise trouvée pour cet utilisateur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadPolicy = (policy: PrivacyPolicy) => {
    const blob = new Blob([policy.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `politique_confidentialite_v${policy.version}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activePolicy = policies?.find((p: PrivacyPolicy) => p.isActive);

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Chargement des politiques de confidentialité...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Politique de confidentialité</h2>
          <p className="text-muted-foreground">
            Générez automatiquement une politique conforme au RGPD
          </p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec IA
            </>
          )}
        </Button>
      </div>

      {/* Current Active Policy */}
      {activePolicy && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Politique active</span>
                  <Badge variant="default">Version {activePolicy.version}</Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Créée le {new Date(activePolicy.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPolicy(activePolicy)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button onClick={() => downloadPolicy(activePolicy)}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ExpandableText
                text={activePolicy.content.replace(/<[^>]*>/g, '')} // Strip HTML tags for preview
                maxLength={300}
                className="text-sm text-muted-foreground"
                previewMode="characters"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Policies State */}
      {!policies || policies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Aucune politique de confidentialité</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Générez automatiquement une politique de confidentialité personnalisée pour votre site web, 
                conforme aux exigences du RGPD.
              </p>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer ma première politique
                  </>
                )}
              </Button>
              {generateMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-red-700 mb-2">
                        Si le problème persiste, vous pouvez :
                      </p>
                      <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                        <li>Attendre quelques minutes et réessayer</li>
                        <li>Vérifier votre connexion internet</li>
                        <li>Contacter le support technique</li>
                      </ul>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                      className="ml-4"
                    >
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Policies History */
        <Card>
          <CardHeader>
            <CardTitle>Historique des versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policies.map((policy: PrivacyPolicy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      policy.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-muted'
                    }`}>
                      {policy.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Version {policy.version}</span>
                        {policy.isActive && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Créée le {new Date(policy.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPolicy(policy)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la politique</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette politique de confidentialité ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(policy.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Preview Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Politique de confidentialité - Version {selectedPolicy.version}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadPolicy(selectedPolicy)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPolicy(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedPolicy.content
                    .replace(/\n/g, '<br/>')
                    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Fonctionnalités IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Personnalisation automatique</h4>
                <p className="text-sm text-muted-foreground">
                  L'IA utilise les informations de votre entreprise et vos registres de traitement 
                  pour générer une politique adaptée à vos activités.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Conformité RGPD</h4>
                <p className="text-sm text-muted-foreground">
                  Chaque politique générée respecte les exigences des articles 13 et 14 du RGPD 
                  et utilise un langage clair et accessible.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Format web-ready</h4>
                <p className="text-sm text-muted-foreground">
                  Le document généré est au format HTML, prêt à être intégré directement 
                  sur votre site web.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Versioning</h4>
                <p className="text-sm text-muted-foreground">
                  Chaque nouvelle génération crée une nouvelle version, permettant de suivre 
                  l'évolution de votre politique.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
