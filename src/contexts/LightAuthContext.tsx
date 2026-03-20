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
        // Check for Supabase session in localStorage without importing supabase
        const storageKey = Object.keys(localStorage).find(key => 
          key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        
        if (storageKey) {
          const sessionData = localStorage.getItem(storageKey);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed?.access_token && parsed?.expires_at) {
              // Check if token is not expired
              const expiresAt = parsed.expires_at * 1000;
              if (Date.now() < expiresAt) {
                setIsAuthenticated(true);
              }
            }
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
