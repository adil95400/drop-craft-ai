import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading) {
      // Not authenticated and auth required
      if (requireAuth && !user) {
        window.location.href = redirectTo;
        return;
      }
      
      // Authenticated but auth not required (e.g., public pages)
      if (!requireAuth && user) {
        // Redirect based on role
        if (profile?.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
        return;
      }
      
      // Role-based access control
      if (requireAuth && user && requireRole && profile) {
        if (requireRole === 'admin' && profile.role !== 'admin') {
          window.location.href = '/dashboard'; // Non-admin users go to dashboard
          return;
        }
      }
    }
  }, [user, profile, loading, requireAuth, requireRole, redirectTo]);

  // Show loading spinner while checking auth
  if (loading || (requireAuth && user && !profile)) {
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

  if (!requireAuth && user) {
    return null; // Will redirect
  }

  if (requireAuth && user && requireRole === 'admin' && profile?.role !== 'admin') {
    return null; // Will redirect
  }

  return <>{children}</>;
};