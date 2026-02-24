import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlanType } from '@/hooks/usePlan';

interface FeatureGateProps {
  feature?: string;
  plan?: PlanType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

const PLAN_LABELS: Record<PlanType, string> = {
  'free': 'Gratuit',
  'standard': 'Standard',
  'pro': 'Pro',
  'ultra_pro': 'Ultra Pro'
};

const PLAN_ICONS: Record<PlanType, React.ComponentType> = {
  'free': Lock,
  'standard': Lock,
  'pro': Crown,
  'ultra_pro': Zap
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  plan: requiredPlanProp,
  children,
  fallback,
  showUpgrade = true,
  className
}) => {
  const navigate = useNavigate();
  const { hasFeature, hasPlan, currentPlan, canBypass } = useUnifiedPlan();
  const { profile } = useUnifiedAuth();
  
  // Admin en mode bypass a TOUJOURS accès
  if (canBypass() || (profile?.is_admin && profile?.admin_mode === 'bypass')) {
    return <>{children}</>;
  }
  
  // Determine access
  let hasAccess = true;
  let requiredPlan: PlanType | null = null;
  
  if (feature) {
    hasAccess = hasFeature(feature);
    // Find the required plan for this feature
    const featureRequirements = {
      'ai-import': 'ultra_pro',
      'bulk-import': 'ultra_pro',
      'scheduled-import': 'ultra_pro',
      'advanced-import': 'pro',
      'advanced-analytics': 'ultra_pro',
      'predictive-analytics': 'ultra_pro',
      'ai-insights': 'pro',
      'marketing-automation': 'ultra_pro',
      'advanced-automation': 'ultra_pro',
      'workflow-builder': 'pro',
      'crm-prospects': 'ultra_pro',
      'advanced-crm': 'pro',
      'advanced-seo': 'ultra_pro',
      'seo-automation': 'pro',
      'security-monitoring': 'ultra_pro',
      'advanced-security': 'pro',
      'premium-integrations': 'ultra_pro',
      'advanced-integrations': 'pro',
      'advanced-tracking': 'ultra_pro',
      'real-time-tracking': 'pro'
    } as const;
    
    requiredPlan = featureRequirements[feature as keyof typeof featureRequirements] || null;
  }
  
  if (requiredPlanProp) {
    hasAccess = hasPlan(requiredPlanProp);
    requiredPlan = requiredPlanProp;
  }
  
  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }
  
  // Custom fallback provided
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }
  
  // Default upgrade prompt
  if (!showUpgrade) {
    return null;
  }
  
  const RequiredIcon = requiredPlan ? PLAN_ICONS[requiredPlan] : Lock;
  const planLabel = requiredPlan ? PLAN_LABELS[requiredPlan] : 'Premium';
  
  return (
    <div className={className}>
      <Alert className="border-primary/20 bg-primary/5">
        <RequiredIcon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {feature ? 'Fonctionnalité' : 'Contenu'} {planLabel} requise
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Passez au plan {planLabel} pour accéder à cette fonctionnalité.
            </p>
          </div>
          <Button 
            size="sm" 
            className="ml-4"
            onClick={() => navigate('/choose-plan')}
          >
            Passer au {planLabel}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Convenience components for common use cases
export const ProFeature: React.FC<Omit<FeatureGateProps, 'plan'>> = (props) => (
  <FeatureGate {...props} plan="pro" />
);

export const UltraProFeature: React.FC<Omit<FeatureGateProps, 'plan'>> = (props) => (
  <FeatureGate {...props} plan="ultra_pro" />
);

// Hook version for conditional logic
export const useFeatureGate = () => {
  const { hasFeature, hasPlan } = useUnifiedPlan();
  
  return {
    hasFeature,
    hasPlan,
    canAccess: (featureOrPlan: string | PlanType) => {
      // If it looks like a plan (contains underscore or is exactly 'pro')
      if (featureOrPlan === 'pro' || featureOrPlan.includes('_')) {
        return hasPlan(featureOrPlan as PlanType);
      }
      return hasFeature(featureOrPlan);
    }
  };
};
