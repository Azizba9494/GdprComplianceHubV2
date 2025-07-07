import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Users, MessageCircle, Plus, Bot, Scale, MapPin, Archive, Gavel, Settings } from "lucide-react";
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's company information
  const { data: userCompany } = useQuery({
    queryKey: ['/api/companies/user', user?.id],
    queryFn: () => user ? fetch(`/api/companies/user/${user.id}`).then(res => res.json()) : Promise.resolve(null),
    enabled: !!user,
  });

  const companyId = userCompany?.id;

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

  const startChatWithBot = (botType: string, botName: string) => {
    console.log('Starting chat with bot:', { botType, botName });
    const title = `Conversation avec ${botName}`;
    createConversationMutation.mutate({ botType, title });
  };

  const openExistingConversation = (conversationId: number) => {
    setLocation(`/la-team/chat/${conversationId}`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BOTS.map((bot) => {
          const botConversations = getBotConversations(bot.id);
          const IconComponent = bot.icon;
          
          return (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className={`${bot.color} text-white flex items-center justify-center`}>
                      <IconComponent className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{bot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">{bot.title}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {bot.description}
                </p>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => startChatWithBot(bot.id, bot.name)}
                    className="w-full"
                    disabled={createConversationMutation.isPending}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Nouvelle conversation avec {bot.name.split(' ').slice(-1)[0]}
                  </Button>

                  {/* Existing conversations */}
                  {botConversations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Conversations existantes ({botConversations.length})
                      </p>
                      {botConversations.slice(0, 3).map((conversation: BotConversation) => (
                        <Button
                          key={conversation.id}
                          variant="outline"
                          size="sm"
                          onClick={() => openExistingConversation(conversation.id)}
                          className="w-full justify-start text-xs"
                        >
                          <Bot className="w-3 h-3 mr-2" />
                          {conversation.title.length > 50 
                            ? conversation.title.substring(0, 50) + "..."
                            : conversation.title
                          }
                        </Button>
                      ))}
                      {botConversations.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{botConversations.length - 3} autre(s) conversation(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Jean Michel "Sur Mesure" - Custom bot section */}
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Settings className="h-8 w-8 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Jean Michel "Sur Mesure"</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Bientôt disponible ! En fonction de votre offre, nous pourrons configurer votre propre Jean Michel 
            personnalisé à partir de vos documents et spécificités métier.
          </p>
          <Badge variant="outline" className="text-sm">
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