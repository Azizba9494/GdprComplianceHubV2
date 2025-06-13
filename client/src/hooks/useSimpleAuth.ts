import { useQuery } from "@tanstack/react-query";

export function useSimpleAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: true, // Always authenticated for now
  };
}