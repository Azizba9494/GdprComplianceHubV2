import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useCompany() {
  const { user, isAuthenticated } = useAuth();

  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
    select: (data: any) => data?.company,
    retry: false,
  });

  return {
    company,
    isLoading,
    companyId: company?.id,
  };
}