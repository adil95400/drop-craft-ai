import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlanType } from '@/hooks/usePlan';

export interface PlanStore {
  // Core plan state
  currentPlan: PlanType;
  loading: boolean;
  error: string | null;
  
  // Feature flags
  features: {
    // Import features
    'ai-import': boolean;
    'bulk-import': boolean;
    'scheduled-import': boolean;
    'advanced-import': boolean;
    
    // Analytics features
    'advanced-analytics': boolean;
    'predictive-analytics': boolean;
    'ai-insights': boolean;
    
    // Automation features
    'marketing-automation': boolean;
    'advanced-automation': boolean;
    'workflow-builder': boolean;
    
    // CRM features
    'crm-prospects': boolean;
    'advanced-crm': boolean;
    
    // SEO features
    'advanced-seo': boolean;
    'seo-automation': boolean;
    
    // Security features
    'security-monitoring': boolean;
    'advanced-security': boolean;
    
    // Integration features
    'premium-integrations': boolean;
    'advanced-integrations': boolean;
    
    // Tracking features
    'advanced-tracking': boolean;
    'real-time-tracking': boolean;
  };
  
  // Actions
  setPlan: (plan: PlanType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasFeature: (feature: string) => boolean;
  hasPlan: (minPlan: PlanType) => boolean;
  updateFeatures: () => void;
}

const PLAN_HIERARCHY: Record<PlanType, number> = {
  'standard': 1,
  'pro': 2,
  'ultra_pro': 3,
};

const FEATURE_REQUIREMENTS: Record<string, PlanType> = {
  // Import features
  'ai-import': 'ultra_pro',
  'bulk-import': 'ultra_pro',
  'scheduled-import': 'ultra_pro',
  'advanced-import': 'pro',
  
  // Analytics features
  'advanced-analytics': 'ultra_pro',
  'predictive-analytics': 'ultra_pro',
  'ai-insights': 'pro',
  
  // Automation features
  'marketing-automation': 'ultra_pro',
  'advanced-automation': 'ultra_pro',
  'workflow-builder': 'pro',
  
  // CRM features
  'crm-prospects': 'ultra_pro',
  'advanced-crm': 'pro',
  
  // SEO features
  'advanced-seo': 'ultra_pro',
  'seo-automation': 'pro',
  
  // Security features
  'security-monitoring': 'ultra_pro',
  'advanced-security': 'pro',
  
  // Integration features
  'premium-integrations': 'ultra_pro',
  'advanced-integrations': 'pro',
  
  // Tracking features
  'advanced-tracking': 'ultra_pro',
  'real-time-tracking': 'pro'
};

export const usePlanStore = create<PlanStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentPlan: 'standard',
    loading: false,
    error: null,
    features: {
      'ai-import': false,
      'bulk-import': false,
      'scheduled-import': false,
      'advanced-import': false,
      'advanced-analytics': false,
      'predictive-analytics': false,
      'ai-insights': false,
      'marketing-automation': false,
      'advanced-automation': false,
      'workflow-builder': false,
      'crm-prospects': false,
      'advanced-crm': false,
      'advanced-seo': false,
      'seo-automation': false,
      'security-monitoring': false,
      'advanced-security': false,
      'premium-integrations': false,
      'advanced-integrations': false,
      'advanced-tracking': false,
      'real-time-tracking': false,
    },
    
    // Actions
    setPlan: (plan: PlanType) => {
      set({ currentPlan: plan });
      get().updateFeatures();
    },
    
    setLoading: (loading: boolean) => set({ loading }),
    
    setError: (error: string | null) => set({ error }),
    
    hasFeature: (feature: string): boolean => {
      const state = get();
      return state.features[feature as keyof typeof state.features] || false;
    },
    
    hasPlan: (minPlan: PlanType): boolean => {
      const currentLevel = PLAN_HIERARCHY[get().currentPlan];
      const requiredLevel = PLAN_HIERARCHY[minPlan];
      return currentLevel >= requiredLevel;
    },
    
    updateFeatures: () => {
      const { currentPlan } = get();
      const newFeatures = { ...get().features };
      
      // Update each feature based on plan
      Object.keys(FEATURE_REQUIREMENTS).forEach(feature => {
        const requiredPlan = FEATURE_REQUIREMENTS[feature];
        const hasAccess = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
        newFeatures[feature as keyof typeof newFeatures] = hasAccess;
      });
      
      set({ features: newFeatures });
    }
  }))
);

// Subscribe to plan changes to update features automatically
usePlanStore.subscribe(
  (state) => state.currentPlan,
  () => {
    usePlanStore.getState().updateFeatures();
  }
);