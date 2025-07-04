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
  address?: string;
  phone?: string;
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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = authResponse?.user || null;
  const isAuthenticated = !!user;

  // Get user's company
  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ['/api/companies', user?.id],
    queryFn: () => fetch(`/api/companies/${user.id}`).then(res => res.json()),
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    company,
    isLoading: isAuthLoading || isCompanyLoading,
    isAuthenticated
  };
}