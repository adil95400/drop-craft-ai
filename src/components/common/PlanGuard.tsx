/**
 * Composant de protection basé sur le plan
 * Affiche un message de mise à niveau si la fonctionnalité n'est pas disponible
 */

import { ReactNode } from 'react';
import { usePlanManager } from '@/hooks/usePlanManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanGuardProps {
  children: ReactNode;
  feature?: string;
  resource?: string;
  fallback?: ReactNode;
  requiredPlan?: 'starter' | 'pro' | 'enterprise';
}

export function PlanGuard({
  children,
  feature,
  resource,
  fallback,
  requiredPlan = 'pro',
}: PlanGuardProps) {
  const { canUseFeature, canAddResource, currentPlan } = usePlanManager();
  const navigate = useNavigate();

  // Check feature access
  if (feature && !canUseFeature(feature)) {
    return (
      fallback || (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  Fonctionnalité Premium
                  <Badge variant="secondary">{requiredPlan}</Badge>
                </CardTitle>
                <CardDescription>
                  Cette fonctionnalité nécessite un plan {requiredPlan} ou supérieur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Débloquez des fonctionnalités avancées</p>
                  <p className="text-sm text-muted-foreground">
                    Accédez à l'automatisation, l'IA avancée et plus encore
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Augmentez vos limites</p>
                  <p className="text-sm text-muted-foreground">
                    Plus de produits, boutiques et commandes
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/dashboard/subscription')}
                className="w-full"
              >
                Mettre à niveau vers {requiredPlan}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    );
  }

  // Check resource limits
  if (resource && !canAddResource(resource)) {
    return (
      fallback || (
        <Card className="border-2 border-dashed border-yellow-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Lock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <CardTitle>Limite atteinte</CardTitle>
                <CardDescription>
                  Vous avez atteint la limite de {resource} pour votre plan {currentPlan}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/dashboard/subscription')}
              variant="outline"
              className="w-full"
            >
              Augmenter mes limites
            </Button>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
}
