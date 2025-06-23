
import { useQuery } from "@tanstack/react-query";
import { companyApi } from "../lib/api";

export function useUserCompany() {
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['/api/user/company'],
    queryFn: async () => {
      const response = await companyApi.getCurrentUserCompany();
      return response.json();
    },
    retry: false,
  });

  return {
    company,
    isLoading,
    error,
    companyId: company?.id || null,
  };
}
