import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'user';
  redirectTo?: string;
}

export const AuthGuard = ({ 
  children, 
  requireAuth = true,
  requireRole,
  redirectTo = '/auth' 
}: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout pour éviter le chargement infini
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 secondes maximum

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !loadingTimeout) {
      // Not authenticated and auth required
      if (requireAuth && !user) {
        window.location.href = redirectTo;
        return;
      }
      
      // Role-based access control - simplifiée
      if (requireAuth && user && requireRole === 'admin' && profile && !profile.is_admin) {
        window.location.href = '/dashboard';
        return;
      }
    }
  }, [user, profile, loading, requireAuth, requireRole, redirectTo, loadingTimeout]);

  // Show loading spinner while checking auth (avec timeout)
  if ((loading || (requireAuth && user && !profile)) && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Block access if conditions not met
  if (requireAuth && !user) {
    return null; // Will redirect
  }

  if (requireAuth && user && requireRole === 'admin' && profile && !profile.is_admin) {
    return null; // Will redirect
  }

  return <>{children}</>;
};