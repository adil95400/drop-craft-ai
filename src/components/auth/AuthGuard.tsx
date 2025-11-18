import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth as useAuth } from '@/contexts/UnifiedAuthContext';
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
  const navigate = useNavigate();
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
        navigate(redirectTo, { replace: true });
        return;
      }
      
      // Role-based access control - simplifiée
      if (requireAuth && user && requireRole === 'admin' && profile && !profile.is_admin) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, requireAuth, requireRole, redirectTo, loadingTimeout, navigate]);

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