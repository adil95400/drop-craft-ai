import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlan, PlanType } from '@/hooks/usePlan';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isInPreviewMode, getEffectivePlan } from '@/utils/adminUtils';

interface RequirePlanProps {
  children: ReactNode;
  minPlan: PlanType;
  feature?: string;
  fallback?: ReactNode;
  showUpgradeCard?: boolean;
}

const planConfig = {
  standard: {
    name: 'Standard',
    icon: Zap,
    color: 'text-blue-500',
    description: 'Fonctionnalités de base pour commencer',
    price: 'Gratuit',
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'text-purple-500',
    description: 'Outils avancés pour développer votre business',
    price: '29€/mois',
  },
  ultra_pro: {
    name: 'Ultra Pro',
    icon: Crown,
    color: 'text-yellow-500',
    description: 'Toutes les fonctionnalités pour les experts',
    price: '99€/mois',
  },
};

export const RequirePlan = ({ 
  children, 
  minPlan, 
  feature, 
  fallback, 
  showUpgradeCard = true 
}: RequirePlanProps) => {
  const { profile } = useAuth();
  const { hasPlan, effectivePlan } = usePlan();
  const navigate = useNavigate();

  const hasAccess = hasPlan(minPlan);
  const requiredPlanConfig = planConfig[minPlan];
  const RequiredIcon = requiredPlanConfig.icon;

  // Show children if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Don't show upgrade card if disabled
  if (!showUpgradeCard) {
    return null;
  }

  const isAdminInPreview = profile?.role === 'admin' && profile?.admin_mode?.startsWith('preview:');

  return (
    <Card className="border-dashed border-2 border-muted bg-muted/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <RequiredIcon className={`h-5 w-5 ${requiredPlanConfig.color}`} />
          {feature ? `${feature} - ` : ''}Plan {requiredPlanConfig.name} requis
        </CardTitle>
        <CardDescription>
          {requiredPlanConfig.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Votre plan : {effectivePlan}</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge className={requiredPlanConfig.color}>
            Plan requis : {requiredPlanConfig.name}
          </Badge>
        </div>

        {isAdminInPreview && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-sm text-accent">
              <Crown className="h-4 w-4" />
              Mode prévisualisation admin activé
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vous voyez cette restriction comme un utilisateur {effectivePlan}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-lg font-semibold text-primary">
            À partir de {requiredPlanConfig.price}
          </p>
          <Button 
            onClick={() => navigate('/pricing')}
            className="w-full"
            size="lg"
          >
            <Crown className="mr-2 h-4 w-4" />
            Mettre à niveau
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Déverrouillez cette fonctionnalité et bien plus encore
        </p>
      </CardContent>
    </Card>
  );
};