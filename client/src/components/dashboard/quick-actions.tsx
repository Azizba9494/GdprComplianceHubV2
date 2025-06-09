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

const progressData = [
  { label: "Registres", value: 80, color: "bg-primary" },
  { label: "Politiques", value: 60, color: "bg-orange-500" },
  { label: "Sécurité", value: 45, color: "bg-red-500" },
  { label: "Formation", value: 90, color: "bg-green-500" },
];

export default function QuickActions({ stats }: QuickActionsProps) {
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
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.value}%</span>
              </div>
              <Progress value={item.value} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
