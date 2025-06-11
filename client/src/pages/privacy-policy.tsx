import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { privacyPolicyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ExpandableText } from "@/components/ui/expandable-text";
import { FileText, Download, Sparkles, Clock, CheckCircle, Loader2 } from "lucide-react";

const COMPANY_ID = 1; // Mock company ID

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

  const { data: policies, isLoading } = useQuery({
    queryKey: ['/api/privacy-policies', COMPANY_ID],
    queryFn: () => privacyPolicyApi.get(COMPANY_ID).then(res => res.json()),
  });

  const generateMutation = useMutation({
    mutationFn: () => privacyPolicyApi.generate(COMPANY_ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policies'] });
      toast({
        title: "Politique générée !",
        description: "Votre politique de confidentialité personnalisée a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la politique de confidentialité",
        variant: "destructive",
      });
    },
  });

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
              <div 
                className="text-sm text-muted-foreground max-h-32 overflow-hidden"
                dangerouslySetInnerHTML={{ 
                  __html: activePolicy.content.substring(0, 200) + '...' 
                }}
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
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer ma première politique
                  </>
                )}
              </Button>
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
                dangerouslySetInnerHTML={{ __html: selectedPolicy.content }}
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
