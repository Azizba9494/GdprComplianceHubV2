import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  currentCompany: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  findUserByEmail: (email: string) => Promise<{ found: boolean; user?: User }>;
  switchCompany: (companyId: number) => void;
  forceUseOwnedCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check authentication status on app load
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        const data = await res.json();
        return data;
      } catch (error) {
        console.error('Auth me query error:', error);
        return { authenticated: false };
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (authData?.authenticated && authData.user) {
      setUser(authData.user);
      // Reset currentCompany to null so it will be properly initialized from localStorage
      setCurrentCompany(null);
    } else {
      setUser(null);
      setCurrentCompany(null);
    }
  }, [authData]);

  // Get user's accessible companies
  const { data: userCompanies } = useQuery({
    queryKey: [`/api/users/${user?.id}/companies`],
    enabled: !!user?.id,
  });

  // Set current company when user or companies change
  useEffect(() => {
    if (userCompanies && userCompanies.length > 0 && !currentCompany) {
      const savedCompanyId = localStorage.getItem('currentCompanyId');
      console.log('Auth - Available companies:', userCompanies);
      console.log('Auth - Saved company ID from localStorage:', savedCompanyId);
      
      if (savedCompanyId) {
        // Validate user has access to saved company
        const savedCompany = userCompanies.find((c: any) => c.id === parseInt(savedCompanyId));
        if (savedCompany) {
          console.log('Auth - Found saved company, setting as current:', savedCompany);
          setCurrentCompany(savedCompany);
          return;
        }
      }
      
      // If no valid saved company, prefer the user's owned company
      const ownedCompany = userCompanies.find((c: any) => c.role === 'owner');
      const defaultCompany = ownedCompany || userCompanies[0];
      console.log('Auth - Using default company (prefer owned):', defaultCompany);
      setCurrentCompany(defaultCompany);
      localStorage.setItem('currentCompanyId', defaultCompany.id.toString());
    }
  }, [userCompanies, currentCompany]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { identifier: string; password: string }) => {
      try {
        const response = await authApi.login(credentials);
        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('Login API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Login success:', data);
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.firstName || data.user.username}`,
        });
      } else {
        throw new Error("Réponse inattendue du serveur");
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => {
      try {
        const response = await authApi.register(userData);
        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('Registration API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Registration success:', data);
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        toast({
          title: "Inscription réussie",
          description: `Bienvenue ${data.user.firstName || data.user.username}`,
        });
      } else {
        throw new Error("Réponse inattendue du serveur");
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Erreur lors de la création du compte",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.logout();
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      // Force logout even if server request fails
      setUser(null);
      queryClient.clear();
    },
  });

  const findUserByEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.findUserByEmail(email);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Find user error:', error);
    },
  });

  const login = async (credentials: { identifier: string; password: string }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result;
    } catch (error) {
      console.error('Login function error:', error);
      throw error;
    }
  };

  const register = async (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => {
    try {
      const result = await registerMutation.mutateAsync(userData);
      return result;
    } catch (error) {
      console.error('Register function error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const findUserByEmail = async (email: string) => {
    return await findUserByEmailMutation.mutateAsync(email);
  };

  const switchCompany = async (companyId: number) => {
    try {
      // Get user's companies to validate access
      const response = await fetch(`/api/users/${user?.id}/companies`);
      if (response.ok) {
        const companies = await response.json();
        const hasAccess = companies.some((c: any) => c.id === companyId);
        
        if (!hasAccess) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas accès à cette entreprise",
            variant: "destructive",
          });
          return;
        }
        
        // Find the company details
        const selectedCompany = companies.find((c: any) => c.id === companyId);
        if (selectedCompany) {
          console.log('Switching to company:', selectedCompany);
          
          // Clear all cached data and update state
          queryClient.clear();
          setCurrentCompany(selectedCompany);
          localStorage.setItem('currentCompanyId', companyId.toString());
          
          // Force a complete page reload to ensure clean state
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error switching company:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer d'entreprise",
        variant: "destructive",
      });
    }
  };

  const forceUseOwnedCompany = async () => {
    try {
      if (userCompanies && userCompanies.length > 0) {
        const ownedCompany = userCompanies.find((c: any) => c.role === 'owner');
        if (ownedCompany) {
          console.log('Force switching to owned company:', ownedCompany);
          
          // Clear localStorage completely
          localStorage.removeItem('currentCompanyId');
          
          // Clear all cached data and update state
          queryClient.clear();
          setCurrentCompany(ownedCompany);
          localStorage.setItem('currentCompanyId', ownedCompany.id.toString());
          
          // Force a complete page reload to ensure clean state
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error forcing owned company:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentCompany,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        findUserByEmail,
        switchCompany,
        forceUseOwnedCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}