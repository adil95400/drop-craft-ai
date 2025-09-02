import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import { FeatureGate } from '@/components/common/FeatureGate';
import type { PlanType } from '@/hooks/usePlan';

interface RouteGuardProps {
  children: React.ReactNode;
  feature?: string;
  plan?: PlanType;
  redirectTo?: string;
  showUpgrade?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  feature,
  plan,
  redirectTo = '/pricing',
  showUpgrade = true
}) => {
  const { hasFeature, hasPlan } = useUnifiedPlan();
  
  // Check access
  let hasAccess = true;
  
  if (feature) {
    hasAccess = hasFeature(feature);
  }
  
  if (plan) {
    hasAccess = hasPlan(plan);
  }
  
  if (!hasAccess) {
    if (showUpgrade) {
      return (
        <div className="container mx-auto px-4 py-8">
          <FeatureGate 
            feature={feature} 
            plan={plan}
            showUpgrade={true}
          >
            {children}
          </FeatureGate>
        </div>
      );
    }
    
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

// Convenience components
export const ProRoute: React.FC<Omit<RouteGuardProps, 'plan'>> = (props) => (
  <RouteGuard {...props} plan="pro" />
);

export const UltraProRoute: React.FC<Omit<RouteGuardProps, 'plan'>> = (props) => (
  <RouteGuard {...props} plan="ultra_pro" />
);