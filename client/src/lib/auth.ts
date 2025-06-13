// Authentication utilities for client-side cookie management
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function isAuthenticatedClient(): boolean {
  return !!getCookie('auth_token');
}

export function forceAuthRefresh(): void {
  // Clear any stale auth state and force a fresh check
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}