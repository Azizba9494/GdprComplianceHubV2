import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BotMessage {
  id: number;
  conversationId: number;
  content: string;
  isBot: boolean;
  timestamp: string;
}

interface BotConversation {
  id: number;
  botType: string;
  title: string;
  userId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

const BOT_INFO = {
  fondement: {
    name: "Jean Michel Fondement",
    title: "Expert en Fondements Juridiques",
    color: "bg-blue-500",
    welcomeMessage: "Bonjour ! Je suis Jean Michel Fondement, votre expert en fondements juridiques RGPD. Je vous aide à déterminer la base légale appropriée pour vos traitements de données personnelles. Quelle est votre question ?"
  },
  voyages: {
    name: "Jean Michel Voyages", 
    title: "Expert en Transferts Internationaux",
    color: "bg-green-500",
    welcomeMessage: "Salut ! Jean Michel Voyages à votre service ! Spécialiste des transferts de données vers les pays tiers, je connais toutes les décisions d'adéquation et modalités de transfert. Comment puis-je vous aider ?"
  },
  archive: {
    name: "Jean Michel Archive",
    title: "Spécialiste des Durées de Conservation", 
    color: "bg-orange-500",
    welcomeMessage: "Bonjour ! Jean Michel Archive, ancien archiviste devenu expert en durées de conservation RGPD. Je vous aide à déterminer combien de temps conserver vos données. Quelle est votre problématique ?"
  },
  irma: {
    name: "Jean Michel Irma",
    title: "Expert en Jurisprudence et Sanctions",
    color: "bg-red-500", 
    welcomeMessage: "Bonjour ! Jean Michel Irma, passionné de jurisprudence CNIL. J'analyse les risques de sanctions et estime les montants selon les décisions existantes. Que souhaitez-vous analyser ?"
  }
};

export default function LaTeamChat() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messageInput, setMessageInput] = useState("");
  const conversationId = parseInt(id || "0");

  // Get conversation details
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/bots/conversation', conversationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bots/conversations/${conversationId}`);
      return response.json();
    },
    enabled: !!conversationId,
  });

  // Get messages for this conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/bots/messages', conversationId],
    queryFn: () => apiRequest("GET", `/api/bots/conversations/${conversationId}/messages`).then(res => res.json()),
    enabled: !!conversationId,
  });

  // Get bot type from conversation data
  const botType = conversation?.botType || 'fondement';

  const botInfo = BOT_INFO[botType as keyof typeof BOT_INFO];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // First, save user message
      await apiRequest("POST", `/api/bots/conversations/${conversationId}/messages`, {
        content,
        isBot: false,
      });

      // Then get bot response
      const botResponse = await apiRequest("POST", `/api/bots/${botType}/chat`, {
        message: content,
        conversationId,
      });
      const botData = await botResponse.json();

      // Save bot response
      await apiRequest("POST", `/api/bots/conversations/${conversationId}/messages`, {
        content: botData.response,
        isBot: true,
      });

      return botData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots/messages', conversationId] });
      setMessageInput("");
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/bots/conversations/${conversationId}`),
    onSuccess: () => {
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
      setLocation("/la-team");
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

  // Initialize conversation with welcome message if no messages exist
  const initializeConversationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/bots/conversations/${conversationId}/messages`, {
        content: botInfo.welcomeMessage,
        isBot: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots/messages', conversationId] });
    },
  });

  // Initialize conversation if empty
  useEffect(() => {
    if (messages && messages.length === 0 && !messagesLoading) {
      initializeConversationMutation.mutate();
    }
  }, [messages, messagesLoading]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/la-team")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <Avatar className="h-12 w-12">
                <AvatarFallback className={`${botInfo.color} text-white flex items-center justify-center`}>
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">{botInfo.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">{botInfo.title}</Badge>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteConversationMutation.mutate()}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col mt-4">
        <CardContent className="flex-1 p-0">
          <div className="h-full overflow-y-auto p-6 space-y-4">
            {messages?.map((message: BotMessage) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "items-start" : "items-end justify-end"}`}
              >
                {message.isBot && (
                  <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                    <AvatarFallback className={`${botInfo.color} text-white flex items-center justify-center`}>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${message.isBot ? "mr-auto" : "ml-auto"}`}>
                  <div
                    className={`rounded-lg p-4 ${
                      message.isBot
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {!message.isBot && (
                  <Avatar className="h-8 w-8 ml-3 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className={`${botInfo.color} text-white flex items-center justify-center`}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-[70%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Posez votre question à ${botInfo.name}...`}
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}