import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Plan = 'free' | 'pro' | 'enterprise';

interface PlanContextType {
  currentPlan: Plan;
  isLoading: boolean;
  upgradeToPro: () => Promise<void>;
  upgradeToEnterprise: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

interface PlanProviderProps {
  children: ReactNode;
}

export const PlanProvider = ({ children }: PlanProviderProps) => {
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate plan fetching
    const fetchUserPlan = async () => {
      if (user) {
        // In a real app, this would fetch from your database
        setCurrentPlan('free');
      }
      setIsLoading(false);
    };

    fetchUserPlan();
  }, [user]);

  const upgradeToPro = async () => {
    // In a real app, this would integrate with Stripe or another payment processor
    setCurrentPlan('pro');
  };

  const upgradeToEnterprise = async () => {
    // In a real app, this would integrate with Stripe or another payment processor
    setCurrentPlan('enterprise');
  };

  const checkFeatureAccess = (feature: string): boolean => {
    const featureAccess = {
      free: ['basic-import', 'basic-export'],
      pro: ['basic-import', 'basic-export', 'advanced-analytics', 'ai-features'],
      enterprise: ['basic-import', 'basic-export', 'advanced-analytics', 'ai-features', 'custom-integrations', 'priority-support']
    };

    return featureAccess[currentPlan].includes(feature);
  };

  const value = {
    currentPlan,
    isLoading,
    upgradeToPro,
    upgradeToEnterprise,
    checkFeatureAccess,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};