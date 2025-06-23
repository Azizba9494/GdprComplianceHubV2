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
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  findUserByEmail: (email: string) => Promise<{ found: boolean; user?: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check authentication status on app load
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then(res => res.json()),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (authData?.authenticated && authData.user) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const data = response.json ? response.json() : response;
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.firstName || data.user.username}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive",
      });
      throw error;
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      const data = response.json ? response.json() : response;
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        toast({
          title: "Inscription réussie",
          description: `Bienvenue ${data.user.firstName || data.user.username}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Erreur lors de la création du compte",
        variant: "destructive",
      });
      throw error;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
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
    mutationFn: authApi.findUserByEmail,
    onError: (error: any) => {
      console.error('Find user error:', error);
    },
  });

  const login = async (credentials: { identifier: string; password: string }) => {
    const response = await loginMutation.mutateAsync(credentials);
    return response;
  };

  const register = async (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => {
    const response = await registerMutation.mutateAsync(userData);
    return response;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const findUserByEmail = async (email: string) => {
    const response = await findUserByEmailMutation.mutateAsync(email);
    const data = response.json ? await response.json() : response;
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        findUserByEmail,
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