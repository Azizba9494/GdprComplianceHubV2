import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Company {
  id: number;
  name: string;
  sector: string;
  size: string;
  userId: number;
}

interface AuthData {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthData {
  // Get current user
  const { data: authResponse, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => fetch('/api/auth/me').then(res => res.json()),
    retry: false
  });

  const user = authResponse?.user || null;
  const isAuthenticated = !!user;

  // Get user's company
  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ['/api/companies', user?.id],
    queryFn: () => fetch(`/api/companies/${user.id}`).then(res => res.json()),
    enabled: !!user?.id,
    retry: false
  });

  return {
    user,
    company,
    isLoading: isAuthLoading || isCompanyLoading,
    isAuthenticated
  };
}

export function useCompanyId(): number | null {
  const { company } = useAuth();
  return company?.id || null;
}