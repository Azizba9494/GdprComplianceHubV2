import { Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AccessDeniedProps {
  module: string;
  requiredPermission?: string;
  description?: string;
}

export function AccessDenied({ 
  module, 
  requiredPermission, 
  description = "Vous n'avez pas accès à ce module car vos droits ne le permettent pas." 
}: AccessDeniedProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-600 dark:text-red-400">
            Accès refusé
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Module : {module}</span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {description}
          </p>
          
          {requiredPermission && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              Permission requise : <code className="font-mono">{requiredPermission}</code>
            </p>
          )}
          
          <div className="pt-4">
            <Button 
              onClick={() => setLocation("/")} 
              variant="outline"
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Contactez votre administrateur pour obtenir les droits nécessaires.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}