import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, ChevronDown, Check } from "lucide-react";

export default function CompanySwitcher() {
  const { user, currentCompany, switchCompany } = useAuth();

  // Get all companies accessible to the user
  const { data: companies = [], isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/companies`],
    enabled: !!user?.id,
  });

  // Find current company details
  const currentCompanyDetails = companies.find(c => c.id === currentCompany?.id);

  if (isLoading || !currentCompanyDetails) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
        <Building className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  // If user has access to only one company, show simple display
  if (companies.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
        <Building className="h-4 w-4 text-blue-600" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{currentCompanyDetails.name}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {currentCompanyDetails.role === 'owner' ? 'Propriétaire' : 
             currentCompanyDetails.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{currentCompanyDetails.name}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {currentCompanyDetails.role === 'owner' ? 'Propriétaire' : 
                 currentCompanyDetails.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
          Mes Entreprises
        </div>
        <DropdownMenuSeparator />
        
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="font-medium">{company.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {company.role === 'owner' ? 'Propriétaire' : 
                     company.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                  </span>
                  {company.sector && (
                    <span className="text-xs text-gray-500">{company.sector}</span>
                  )}
                </div>
              </div>
            </div>
            {currentCompany?.id === company.id && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}