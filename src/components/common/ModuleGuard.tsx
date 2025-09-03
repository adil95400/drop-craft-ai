import React from 'react';
import { useModules } from '@/hooks/useModules';
import { FeatureGate } from './FeatureGate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ModuleGuardProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export function ModuleGuard({ 
  moduleId, 
  children, 
  fallback,
  showUpgrade = true 
}: ModuleGuardProps) {
  const { canAccess, getModuleConfig } = useModules();
  const navigate = useNavigate();
  const moduleConfig = getModuleConfig(moduleId);

  if (!moduleConfig) {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Module "{moduleId}" non trouvé
        </AlertDescription>
      </Alert>
    );
  }

  if (!canAccess(moduleId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgrade) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <Crown className="h-16 w-16 mx-auto text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {moduleConfig.name}
            </h3>
            <p className="text-muted-foreground mb-4">
              {moduleConfig.description}
            </p>
            <Alert className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Ce module nécessite le plan <strong>{moduleConfig.minPlan}</strong> ou supérieur.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/pricing-plans')}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Crown className="w-4 h-4 mr-2" />
              Passer à {moduleConfig.minPlan}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Composants de garde spécialisés
export const ProModuleGuard: React.FC<Omit<ModuleGuardProps, 'moduleId'> & { moduleId?: string }> = ({ 
  moduleId = 'analytics', 
  ...props 
}) => (
  <ModuleGuard moduleId={moduleId} {...props} />
);

export const UltraProModuleGuard: React.FC<Omit<ModuleGuardProps, 'moduleId'> & { moduleId?: string }> = ({ 
  moduleId = 'ai', 
  ...props 
}) => (
  <ModuleGuard moduleId={moduleId} {...props} />
);

// HOC pour protéger les pages entières
export function withModuleGuard<P extends object>(
  Component: React.ComponentType<P>,
  moduleId: string
) {
  return function GuardedComponent(props: P) {
    return (
      <ModuleGuard moduleId={moduleId}>
        <Component {...props} />
      </ModuleGuard>
    );
  };
}