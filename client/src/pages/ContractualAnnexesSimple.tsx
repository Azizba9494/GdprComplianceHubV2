import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContractualAnnexesSimple() {
  const { currentCompany, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div>Chargement...</div>;
  }

  if (!currentCompany) {
    return <div>Aucune entreprise sélectionnée</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Annexes contractuelles</h1>
          <p className="text-muted-foreground mt-1">
            Générez des DPA et CCT à partir de vos contrats existants
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune annexe contractuelle
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première annexe contractuelle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}