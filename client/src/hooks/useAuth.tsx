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
    } else {
      setUser(null);
      setCurrentCompany(null);
    }
  }, [authData]);

  // Get user's primary company
  const { data: primaryCompany } = useQuery({
    queryKey: [`/api/companies/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Set current company when user or primary company changes
  useEffect(() => {
    if (primaryCompany && !currentCompany) {
      const savedCompanyId = localStorage.getItem('currentCompanyId');
      if (savedCompanyId) {
        // TODO: Validate user has access to this company
        setCurrentCompany({ id: parseInt(savedCompanyId) });
      } else {
        setCurrentCompany(primaryCompany);
      }
    }
  }, [primaryCompany, currentCompany]);

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

  const switchCompany = (companyId: number) => {
    // TODO: Validate user has access to this company
    setCurrentCompany({ id: companyId });
    localStorage.setItem('currentCompanyId', companyId.toString());
    
    // Invalidate all queries to refetch data for new company
    queryClient.invalidateQueries();
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