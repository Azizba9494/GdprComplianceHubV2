import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@shared/schema";
import { isAuthenticatedClient } from "@/lib/auth";

export function useAuth() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(isAuthenticatedClient());
  }, []);

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: hasToken, // Only fetch if we have a token
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    user,
    isLoading: hasToken ? isLoading : false,
    isAuthenticated: !!user && !error && hasToken,
    error,
  };
}