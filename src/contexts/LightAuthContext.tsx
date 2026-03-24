/**
 * Lightweight auth context for initial page load
 * Defers heavy Supabase imports until actually needed
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LightAuthContextType {
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

  // Check for existing session token in localStorage (fast, no network)
  useEffect(() => {
    const checkLocalSession = () => {
      try {
        const storageKeys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') && key.endsWith('-auth-token')
        );

        for (const storageKey of storageKeys) {
          const sessionData = localStorage.getItem(storageKey);
          if (!sessionData) continue;

          const parsed = JSON.parse(sessionData);
          const session = parsed?.currentSession ?? parsed?.session ?? parsed;
          const accessToken = session?.access_token;
          const expiresAtRaw = session?.expires_at;

          if (!accessToken || typeof accessToken !== 'string') continue;

          // Ignore clearly invalid tokens and cleanup stale entries
          if (accessToken.split('.').length !== 3) {
            localStorage.removeItem(storageKey);
            continue;
          }

          const expiresAtMs = Number(expiresAtRaw) * 1000;
          if (Number.isFinite(expiresAtMs) && Date.now() < expiresAtMs) {
            setIsAuthenticated(true);
            break;
          }
        }
      } catch {
        // Ignore errors, just mark as not authenticated
      }

      setIsLoading(false);
    };

    checkLocalSession();
  }, []);

  const initializeAuth = useCallback(async () => {
    if (authInitialized) return;
    setAuthInitialized(true);
    
    // This will be called by components that need full auth
    // The actual auth initialization is handled by UnifiedAuthProvider
  }, [authInitialized]);

  return (
    <LightAuthContext.Provider value={{ isAuthenticated, isLoading, initializeAuth }}>
      {children}
    </LightAuthContext.Provider>
  );
};

export const useLightAuth = () => useContext(LightAuthContext);
