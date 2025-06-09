import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface PriorityAction {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate?: string;
  status: string;
}

interface PriorityActionsProps {
  actions: PriorityAction[];
  diagnosticData?: {
    compliance: {
      categoryScores?: Record<string, { score: number; total: number; answered: number }>;
    };
    riskMapping?: {
      riskAreas: Array<{ 
        category: string; 
        score: number; 
        severity: string; 
        specificRisks: Array<{ 
          questionId: number; 
          question: string; 
          response: string; 
          riskLevel: string 
        }> 
      }>;
    };
  };
}

const priorityColors = {
  urgent: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  important: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
  normal: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
};

const priorityBadgeColors = {
  urgent: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  important: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
  normal: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
};

const riskBadgeColors = {
  critique: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  elevé: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300", 
  moyen: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  faible: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
};

export default function PriorityActions({ actions, diagnosticData }: PriorityActionsProps) {
  const getActionLink = (category: string) => {
    switch (category) {
      case "registres":
        return "/records";
      case "politiques":
        return "/privacy-policy";
      case "sécurité":
        return "/dpia";
      default:
        return "/actions";
    }
  };

  const getRiskLevelForCategory = (category: string): string => {
    if (!diagnosticData?.riskMapping?.riskAreas) return "moyen";
    
    // Map action categories to diagnostic categories
    const categoryMapping: Record<string, string> = {
      "gouvernance": "Gouvernance",
      "documentation": "Documentation", 
      "consentement": "Consentement",
      "sécurité": "Sécurité",
      "droits": "Droits",
      "formation": "Formation",
      "violations": "Violations"
    };

    const diagnosticCategory = categoryMapping[category.toLowerCase()] || category;
    
    // Find the risk area for this category
    const riskArea = diagnosticData.riskMapping.riskAreas.find(
      area => area.category.toLowerCase() === diagnosticCategory.toLowerCase()
    );
    
    if (!riskArea) return "moyen";
    
    // Use the severity calculated from actual diagnostic question risk levels
    return riskArea.severity;
  };

  const getRiskLabel = (riskLevel: string): string => {
    switch (riskLevel) {
      case "critique": return "Critique";
      case "elevé": return "Élevé";
      case "moyen": return "Moyen";
      case "faible": return "Faible";
      default: return "Moyen";
    }
  };

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Actions prioritaires</CardTitle>
            <Link href="/actions">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune action prioritaire</p>
              <p className="text-sm text-muted-foreground mt-1">
                Toutes vos actions sont à jour !
              </p>
            </div>
          ) : (
            actions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg border",
                  priorityColors[action.priority as keyof typeof priorityColors]
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  action.priority === "urgent" ? "bg-red-500" :
                  action.priority === "important" ? "bg-orange-500" : "bg-slate-400"
                )} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">{action.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary"
                        className={cn("text-xs", priorityBadgeColors[action.priority as keyof typeof priorityBadgeColors])}
                      >
                        {action.priority === "urgent" ? "Urgent" :
                         action.priority === "important" ? "Important" : "Normal"}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={cn("text-xs", riskBadgeColors[getRiskLevelForCategory(action.category) as keyof typeof riskBadgeColors])}
                      >
                        Risque {getRiskLabel(getRiskLevelForCategory(action.category))}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                  
                  <div className="flex items-center justify-between">
                    {action.dueDate && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    
                    <Link href={getActionLink(action.category)}>
                      <Button size="sm" className="ml-auto">
                        {action.category === "registres" ? "Générer" : "Commencer"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
