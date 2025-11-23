import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile } = useUnifiedAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) {
        setIsVerified(false);
        setIsLoading(false);
        return;
      }

      try {
        // Vérification serveur sécurisée
        const { data, error } = await supabase.rpc('is_admin_secure');
        
        if (error) {
          console.error('Admin verification error:', error);
          setIsVerified(false);
        } else {
          setIsVerified(data === true);
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminStatus();
  }, [user, profile?.is_admin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};