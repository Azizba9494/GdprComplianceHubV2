import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/AccessDenied";
import { Users, MessageCircle, Plus, Bot, Scale, MapPin, Archive, Gavel, Settings, Calendar, ChevronRight, History, Clock, Trash2, X, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface BotConversation {
  id: number;
  botType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const BOTS = [
  {
    id: "fondement",
    name: "Jean Michel Fondement",
    title: "Expert en Fondements Juridiques",
    description: "L'expert incontesté pour déterminer les fondements juridiques applicables à vos traitements de données personnelles. Si vous voulez savoir quelle base légale utiliser, c'est votre homme !",
    icon: Scale,
    color: "bg-blue-500",
    expertise: ["Base légale RGPD", "Consentement", "Intérêt légitime", "Contrat", "Obligation légale"]
  },
  {
    id: "voyages", 
    name: "Jean Michel Voyages",
    title: "Expert en Transferts Internationaux",
    description: "Passionné de voyages et expert en transferts de données vers les pays tiers. Il connaît toutes les décisions d'adéquation et vous guidera dans vos transferts internationaux.",
    icon: MapPin,
    color: "bg-green-500",
    expertise: ["Décisions d'adéquation", "Clauses contractuelles types", "BCR", "Transferts hors UE", "Pays sûrs"]
  },
  {
    id: "archive",
    name: "Jean Michel Archive",
    title: "Spécialiste des Durées de Conservation",
    description: "Ancien archiviste reconverti dans le RGPD, il est passionné par les durées de conservation. Il vous aidera à déterminer combien de temps garder vos données.",
    icon: Archive,
    color: "bg-orange-500",
    expertise: ["Durées légales", "Conservation active", "Archivage intermédiaire", "Destruction", "Justifications"]
  },
  {
    id: "irma",
    name: "Jean Michel Irma",
    title: "Expert en Jurisprudence et Sanctions",
    description: "Passionné de jurisprudence CNIL et de sanctions, il analyse les risques de non-conformité et estime les montants des sanctions potentielles selon les décisions existantes.",
    icon: Gavel,
    color: "bg-red-500",
    expertise: ["Jurisprudence CNIL", "Calcul sanctions", "Analyse risques", "Décisions EDPB", "Tables IL"]
  }
];

export default function LaTeam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAllConversations, setShowAllConversations] = useState<string | null>(null);

  const { user, currentCompany } = useAuth();
  const { hasPermission } = usePermissions();

  const companyId = currentCompany?.id;

  // Check permissions after all hooks - use 'access' for team module
  const hasTeamAccess = hasPermission('team', 'access') || hasPermission('team', 'read');

  if (!hasTeamAccess) {
    return (
      <AccessDenied 
        module="LA Team Jean Michel" 
        requiredPermission="team.access"
        description="Vous n'avez pas accès au module LA Team Jean Michel car vos droits ne le permettent pas."
      />
    );
  }

  // Get existing bot conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['/api/bots/conversations', companyId],
    queryFn: () => companyId ? fetch(`/api/bots/conversations/${companyId}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!companyId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ botType, title }: { botType: string; title: string }) => {
      const response = await apiRequest("POST", "/api/bots/conversations", {
        companyId,
        botType,
        title,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots/conversations', companyId] });
      setLocation(`/la-team/chat/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Create conversation error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation avec Jean Michel",
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("DELETE", `/api/bots/conversations/${conversationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots/conversations', companyId] });
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      console.error('Delete conversation error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive",
      });
    },
  });

  const startChatWithBot = (botType: string, botName: string) => {
    console.log('Starting chat with bot:', { botType, botName });
    const title = `Conversation avec ${botName}`;
    createConversationMutation.mutate({ botType, title });
  };

  const openExistingConversation = (conversationId: number) => {
    setLocation(`/la-team/chat/${conversationId}`);
  };

  const handleDeleteConversation = (conversationId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent conversation opening
    if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  const getBotConversations = (botType: string) => {
    if (!conversations || !Array.isArray(conversations)) return [];
    return conversations.filter((conv: BotConversation) => conv.botType === botType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If showing all conversations for a specific bot
  if (showAllConversations) {
    const bot = BOTS.find(b => b.id === showAllConversations);
    const botConversations = getBotConversations(showAllConversations);
    
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllConversations(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${bot?.color} text-white`}>
                {bot?.icon && <bot.icon className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bot?.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toutes les conversations ({botConversations.length})</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {botConversations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Vous n'avez pas encore de conversations avec {bot?.name}.
                </p>
                <Button 
                  onClick={() => startChatWithBot(bot?.id || '', bot?.name || '')}
                  disabled={createConversationMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle conversation
                </Button>
              </CardContent>
            </Card>
          ) : (
            botConversations.map((conversation: BotConversation) => (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Créée le {new Date(conversation.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Modifiée le {new Date(conversation.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExistingConversation(conversation.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Ouvrir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        disabled={deleteConversationMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="text-center pt-4">
          <Button 
            onClick={() => startChatWithBot(bot?.id || '', bot?.name || '')}
            disabled={createConversationMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle conversation avec {bot?.name}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LA Team Jean Michel</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Bienvenue dans votre équipe de spécialistes RGPD ! Par un heureux hasard, ils s'appellent tous Jean Michel, 
          mais chacun a sa propre expertise. Choisissez votre Jean Michel selon votre problématique et posez-lui toutes vos questions !
        </p>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {BOTS.map((bot) => {
          const botConversations = getBotConversations(bot.id);
          const IconComponent = bot.icon;
          
          return (
            <Card key={bot.id} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-18 w-18 shadow-lg">
                    <AvatarFallback className={`${bot.color} text-white flex items-center justify-center shadow-inner`}>
                      <IconComponent className="h-9 w-9" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">{bot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{bot.title}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5 pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {bot.description}
                </p>

                {/* Action buttons */}
                <div className="space-y-4">
                  <Button 
                    onClick={() => startChatWithBot(bot.id, bot.name)}
                    className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={createConversationMutation.isPending}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Nouvelle conversation avec {bot.name.split(' ').slice(-1)[0]}
                  </Button>

                  {/* Existing conversations */}
                  {botConversations.length > 0 && (
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <History className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Conversations récentes ({botConversations.length})
                        </p>
                      </div>
                      <div className="space-y-2">
                        {botConversations.slice(0, 3).map((conversation: BotConversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => openExistingConversation(conversation.id)}
                            className="group p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <Bot className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {conversation.title.length > 30 
                                      ? conversation.title.substring(0, 30) + "..."
                                      : conversation.title
                                    }
                                  </p>
                                </div>
                                <div className="flex items-center mt-1 space-x-2">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(conversation.createdAt).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                  title="Supprimer la conversation"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                        {botConversations.length > 3 && (
                          <div className="text-center py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => setShowAllConversations(bot.id)}
                            >
                              Voir toutes les conversations ({botConversations.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Jean Michel "Sur Mesure" - Custom bot section */}
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
              <Settings className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Jean Michel "Sur Mesure"</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Bientôt disponible ! En fonction de votre offre, nous pourrons configurer votre propre Jean Michel 
            personnalisé à partir de vos documents et spécificités métier.
          </p>
          <Badge variant="outline" className="text-sm px-4 py-2 bg-white dark:bg-gray-800 shadow-sm">
            Prochainement
          </Badge>
        </CardContent>
      </Card>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        <p>
          Tous les Jean Michel sont alimentés par l'IA Gemini 2.5 Flash et peuvent être configurés 
          depuis la section Administration pour s'adapter à vos besoins spécifiques.
        </p>
      </div>
    </div>
  );
}