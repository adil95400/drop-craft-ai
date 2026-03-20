/**
 * LightAuthContext — Fast initial auth hint for routing
 * 
 * SECURITY NOTE: This context is a UX optimization ONLY. It checks localStorage
 * for a Supabase session token to avoid a blank flash on page load. This is NOT
 * a security gate — the actual authentication is handled by UnifiedAuthProvider
 * which performs server-side token validation via supabase.auth.getSession().
 * 
 * Never use isAuthenticated from this context for access control decisions.
 * It only determines whether to show the loading state or redirect to /auth.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LightAuthContextType {
  /** UX hint only — NOT a security assertion. See UnifiedAuthProvider for real auth. */
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
}

const LightAuthContext = createContext<LightAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  initializeAuth: async () => {},
});

export const LightAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const checkLocalSession = () => {
      try {
        // Find Supabase auth token in localStorage (fast, no network call)
        const storageKey = Object.keys(localStorage).find(key => 
          key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        
        if (storageKey) {
          const sessionData = localStorage.getItem(storageKey);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            // Validate token structure and expiry as a UX hint
            if (
              parsed?.access_token &&
              typeof parsed.expires_at === 'number' &&
              parsed.expires_at * 1000 > Date.now()
            ) {
              setIsAuthenticated(true);
            }
          }
        }
      } catch {
        // Silently fail — UnifiedAuthProvider will handle real auth
      }
      setIsLoading(false);
    };

    checkLocalSession();
  }, []);

  const initializeAuth = useCallback(async () => {
    if (authInitialized) return;
    setAuthInitialized(true);
    // Full auth initialization is deferred to UnifiedAuthProvider
  }, [authInitialized]);

  return (
    <LightAuthContext.Provider value={{ isAuthenticated, isLoading, initializeAuth }}>
      {children}
    </LightAuthContext.Provider>
  );
};

export const useLightAuth = () => useContext(LightAuthContext);
