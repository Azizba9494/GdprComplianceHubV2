import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertTriangle, UserCheck, PieChart } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsProps {
  stats: {
    actions: {
      total: number;
      completed: number;
    };
    compliance?: {
      categoryScores?: Record<string, { score: number; total: number; answered: number }>;
    };
    records?: { total: number };
    policies?: { total: number };
  };
}

const quickActions = [
  {
    title: "Générer une politique",
    description: "Créer une nouvelle politique de confidentialité",
    icon: FileText,
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    href: "/privacy-policy",
  },
  {
    title: "Analyser une violation",
    description: "Évaluer si une notification est requise",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    href: "/breach-analysis",
  },
  {
    title: "Traiter une demande",
    description: "Gérer les droits des personnes concernées",
    icon: UserCheck,
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    href: "/rights",
  },
];

export default function QuickActions({ stats }: QuickActionsProps) {
  // Calculate dynamic progress data based on real compliance scores
  const calculateProgressData = () => {
    const categoryScores = stats.compliance?.categoryScores || {};
    
    // Map categories to display names and colors (using exact category names from database)
    const categoryMappings = {
      'Gouvernance et principes fondamentaux': { label: 'Gouvernance', color: 'bg-blue-500' },
      'Bases légales et gestion du consentement': { label: 'Bases légales', color: 'bg-orange-500' },
      'Information et droits des personnes concernées': { label: 'Droits des personnes', color: 'bg-purple-500' },
      'Sécurité': { label: 'Sécurité', color: 'bg-red-500' }
    };

    // Calculate progress for each available category
    const progressData = Object.entries(categoryScores)
      .filter(([category]) => categoryMappings[category as keyof typeof categoryMappings])
      .map(([category, data]) => {
        const mapping = categoryMappings[category as keyof typeof categoryMappings];
        // data.score is already a percentage (0-100), no need to recalculate
        const percentage = Math.max(0, Math.min(100, data.score || 0));
        
        return {
          label: mapping.label,
          value: percentage,
          color: mapping.color
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending

    // If no categories available, show default message
    if (progressData.length === 0) {
      return [
        { label: 'Diagnostic', value: 0, color: 'bg-gray-400' },
        { label: 'En attente', value: 0, color: 'bg-gray-300' }
      ];
    }

    return progressData;
  };

  const progressData = calculateProgressData();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="ghost"
                  className="w-full flex items-center space-x-3 p-3 h-auto justify-start hover:bg-muted/50"
                >
                  <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progression par domaine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progressData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
