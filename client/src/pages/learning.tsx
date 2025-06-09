import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learningApi, gamificationApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Trophy, Star, Flame, Crown, Award, Clock,
  Play, CheckCircle, Lock, Target, TrendingUp, Users,
  GraduationCap, Shield, FileText, UserCheck
} from "lucide-react";

interface LearningModule {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  content: string;
  estimatedDuration: number;
  xpReward: number;
  isActive: boolean;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xpRequired: number;
  isSecret: boolean;
}

interface UserProgress {
  totalXp: number;
  level: number;
  streak: number;
  lastActivityDate: string | null;
}

interface ModuleProgress {
  id: number;
  moduleId: number;
  status: string;
  progress: number;
  timeSpent: number;
  completedAt: string | null;
}

export default function Learning() {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hardcoded user ID for demo - in real app this would come from auth
  const userId = 1;

  const { data: modules } = useQuery({
    queryKey: ['/api/learning/modules'],
    queryFn: async () => {
      const response = await learningApi.getModules();
      return response.json();
    },
  });

  const { data: userProgressData } = useQuery({
    queryKey: ['/api/gamification/progress', userId],
    queryFn: async () => {
      const response = await gamificationApi.getUserProgress(userId);
      return response.json();
    },
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/gamification/achievements'],
    queryFn: async () => {
      const response = await gamificationApi.getAchievements();
      return response.json();
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/gamification/leaderboard'],
    queryFn: async () => {
      const response = await gamificationApi.getLeaderboard(5);
      return response.json();
    },
  });

  const completeModuleMutation = useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: number; moduleId: number }) => {
      const response = await learningApi.completeModule(userId, moduleId);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/progress', userId] });
      setIsModuleDialogOpen(false);
      setSelectedModule(null);
      setCurrentProgress(0);
      
      if (data.newAchievements && data.newAchievements.length > 0) {
        toast({
          title: "Nouveau badge débloqué !",
          description: `Félicitations ! Vous avez gagné ${data.newAchievements.length} nouveau(x) badge(s).`,
        });
      }
      
      toast({
        title: "Module complété !",
        description: `Vous avez gagné ${selectedModule?.xpReward || 0} XP !`,
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ userId, moduleId, progress, timeSpent }: { 
      userId: number; 
      moduleId: number; 
      progress: number; 
      timeSpent: number 
    }) => {
      const response = await learningApi.updateProgress(userId, moduleId, progress, timeSpent);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/progress', userId] });
    },
  });

  // Track time spent when module is open
  useEffect(() => {
    if (isModuleDialogOpen && selectedModule) {
      setStartTime(new Date());
      return () => {
        if (startTime) {
          const timeSpentMinutes = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60);
          setTimeSpent(prev => prev + timeSpentMinutes);
        }
      };
    }
  }, [isModuleDialogOpen, selectedModule]);

  const openModule = (module: LearningModule) => {
    setSelectedModule(module);
    setIsModuleDialogOpen(true);
    
    // Find existing progress
    const existingProgress = userProgressData?.moduleProgress?.find(
      (mp: ModuleProgress) => mp.moduleId === module.id
    );
    setCurrentProgress(existingProgress?.progress || 0);
    setTimeSpent(existingProgress?.timeSpent || 0);
  };

  const handleProgressUpdate = (progress: number) => {
    setCurrentProgress(progress);
    if (selectedModule && startTime) {
      const timeSpentMinutes = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60);
      updateProgressMutation.mutate({
        userId,
        moduleId: selectedModule.id,
        progress,
        timeSpent: timeSpentMinutes
      });
    }
  };

  const completeModule = () => {
    if (selectedModule) {
      completeModuleMutation.mutate({ userId, moduleId: selectedModule.id });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gouvernance': return Shield;
      case 'droits': return UserCheck;
      case 'securite': return Lock;
      default: return FileText;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy': return Trophy;
      case 'crown': return Crown;
      case 'flame': return Flame;
      case 'award': return Award;
      case 'graduation-cap': return GraduationCap;
      case 'shield-check': return Shield;
      default: return Star;
    }
  };

  const getModuleProgress = (moduleId: number) => {
    if (!userProgressData?.moduleProgress) return undefined;
    return userProgressData.moduleProgress.find(
      (mp: ModuleProgress) => mp.moduleId === moduleId
    );
  };

  const userProgress = userProgressData?.progress;
  const userAchievements = userProgressData?.achievements || [];
  const userModuleProgress = userProgressData?.moduleProgress || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header with user progress */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Centre d'apprentissage RGPD</h2>
            <p className="text-muted-foreground">
              Développez vos compétences et débloquez des badges
            </p>
          </div>
        </div>
        
        {/* User stats */}
        {userProgress && (
          <div className="flex space-x-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Niveau {userProgress.level}</p>
                  <p className="text-xs text-muted-foreground">{userProgress.totalXp} XP</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Série {userProgress.streak}</p>
                  <p className="text-xs text-muted-foreground">jours consécutifs</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="achievements">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
        </TabsList>

        {/* Learning Modules */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules && Array.isArray(modules) && modules.map((module: LearningModule) => {
              const progress = getModuleProgress(module.id);
              const isCompleted = progress?.status === 'completed';
              const isInProgress = progress?.status === 'in_progress';
              const CategoryIcon = getCategoryIcon(module.category);

              return (
                <Card key={module.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CategoryIcon className="w-6 h-6 text-primary" />
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-6">{module.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress bar */}
                      {progress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span>{progress.progress}%</span>
                          </div>
                          <Progress value={progress.progress} className="h-2" />
                        </div>
                      )}
                      
                      {/* Module info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{module.estimatedDuration} min</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>+{module.xpReward} XP</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <Button 
                        onClick={() => openModule(module)}
                        className="w-full"
                        variant={isCompleted ? "secondary" : "default"}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complété
                          </>
                        ) : isInProgress ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Continuer
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Commencer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements && Array.isArray(achievements) && achievements.map((achievement: Achievement) => {
              const isUnlocked = userAchievements.some(
                (ua: any) => ua.achievementId === achievement.id
              );
              const AchievementIcon = getAchievementIcon(achievement.icon);

              return (
                <Card key={achievement.id} className={`${!isUnlocked ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        <AchievementIcon 
                          className={`w-6 h-6 ${isUnlocked ? 'text-primary' : 'text-gray-400'}`} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        {achievement.xpRequired > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Requis: {achievement.xpRequired} XP
                          </p>
                        )}
                        {isUnlocked && (
                          <Badge variant="secondary" className="mt-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Débloqué
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Classement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard && Array.isArray(leaderboard) && leaderboard.map((user: any, index: number) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          index === 1 ? 'bg-gray-100 text-gray-800' : 
                          index === 2 ? 'bg-orange-100 text-orange-800' : 
                          'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">Utilisateur {user.userId}</p>
                        <p className="text-sm text-muted-foreground">Niveau {user.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{user.totalXp} XP</p>
                      <p className="text-sm text-muted-foreground">{user.streak} jours</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Learning Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>{selectedModule?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedModule && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression du module</span>
                  <span>{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="h-3" />
              </div>

              {/* Content */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedModule.content}
                </div>
              </div>

              {/* Learning actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <span>⏱️ {selectedModule.estimatedDuration} min</span>
                  <span>🏆 +{selectedModule.xpReward} XP</span>
                  <span>⏰ {timeSpent} min passées</span>
                </div>
                
                <div className="flex space-x-2">
                  {currentProgress < 100 && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProgressUpdate(Math.min(currentProgress + 25, 100))}
                      >
                        Avancer +25%
                      </Button>
                      <Button 
                        onClick={() => handleProgressUpdate(100)}
                      >
                        Marquer comme lu
                      </Button>
                    </>
                  )}
                  
                  {currentProgress >= 100 && (
                    <Button 
                      onClick={completeModule}
                      disabled={completeModuleMutation.isPending}
                    >
                      {completeModuleMutation.isPending ? "Validation..." : "Valider le module"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}