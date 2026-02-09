/**
 * Service centralisé de gestion des plans et quotas
 * Point d'entrée unique pour toutes les vérifications de limites
 */

import { supabase } from '@/integrations/supabase/client';
import { getProductCount } from '@/services/api/productHelpers';

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  products: number;
  stores: number;
  orders: number;
  aiTasks: number;
  apiCalls: number;
  storage: number; // in MB
  users: number;
  customDomains: number;
  features: {
    advancedAnalytics: boolean;
    aiAutomation: boolean;
    multiStore: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
  };
}

export interface PlanUsage {
  products: number;
  stores: number;
  orders: number;
  aiTasks: number;
  apiCalls: number;
  storage: number;
  users: number;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    products: 100,
    stores: 1,
    orders: 50,
    aiTasks: 10,
    apiCalls: 1000,
    storage: 100,
    users: 1,
    customDomains: 0,
    features: {
      advancedAnalytics: false,
      aiAutomation: false,
      multiStore: false,
      whiteLabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
  },
  starter: {
    products: 1000,
    stores: 3,
    orders: 500,
    aiTasks: 100,
    apiCalls: 10000,
    storage: 1000,
    users: 3,
    customDomains: 1,
    features: {
      advancedAnalytics: true,
      aiAutomation: false,
      multiStore: true,
      whiteLabel: false,
      prioritySupport: false,
      customIntegrations: false,
    },
  },
  pro: {
    products: 10000,
    stores: 10,
    orders: 5000,
    aiTasks: 1000,
    apiCalls: 100000,
    storage: 10000,
    users: 10,
    customDomains: 5,
    features: {
      advancedAnalytics: true,
      aiAutomation: true,
      multiStore: true,
      whiteLabel: true,
      prioritySupport: true,
      customIntegrations: false,
    },
  },
  enterprise: {
    products: -1, // unlimited
    stores: -1,
    orders: -1,
    aiTasks: -1,
    apiCalls: -1,
    storage: -1,
    users: -1,
    customDomains: -1,
    features: {
      advancedAnalytics: true,
      aiAutomation: true,
      multiStore: true,
      whiteLabel: true,
      prioritySupport: true,
      customIntegrations: true,
    },
  },
};

export class PlanService {
  private static instance: PlanService;
  private currentPlan: PlanTier = 'free';
  private usage: PlanUsage | null = null;

  private constructor() {}

  static getInstance(): PlanService {
    if (!PlanService.instance) {
      PlanService.instance = new PlanService();
    }
    return PlanService.instance;
  }

  async initialize(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await (supabase
        .from('profiles') as any)
        .select('subscription_plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        this.currentPlan = 'free';
        return;
      }

      this.currentPlan = (profile?.subscription_plan as PlanTier) || 'free';
      await this.refreshUsage(userId);
    } catch (error) {
      console.error('Failed to initialize PlanService:', error);
      this.currentPlan = 'free';
    }
  }

  async refreshUsage(userId: string): Promise<void> {
    try {
      const [productCount, stores, orders, aiTasks, apiCalls] = await Promise.all([
        getProductCount(),
        supabase.from('integrations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        (supabase.from('ai_optimization_jobs' as any) as any).select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('api_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      this.usage = {
        products: productCount,
        stores: stores.count || 0,
        orders: orders.count || 0,
        aiTasks: aiTasks.count || 0,
        apiCalls: apiCalls.count || 0,
        storage: 0,
        users: 1,
      };
    } catch (error) {
      console.error('Failed to refresh usage:', error);
      this.usage = {
        products: 0,
        stores: 0,
        orders: 0,
        aiTasks: 0,
        apiCalls: 0,
        storage: 0,
        users: 1,
      };
    }
  }

  getCurrentPlan(): PlanTier {
    return this.currentPlan;
  }

  getLimits(plan?: PlanTier): PlanLimits {
    return PLAN_LIMITS[plan || this.currentPlan];
  }

  getUsage(): PlanUsage | null {
    return this.usage;
  }

  canUseFeature(feature: keyof PlanLimits['features']): boolean {
    return PLAN_LIMITS[this.currentPlan].features[feature];
  }

  canAddResource(resource: 'products' | 'stores' | 'orders' | 'aiTasks' | 'apiCalls' | 'users'): boolean {
    if (!this.usage) return false;

    const limit = PLAN_LIMITS[this.currentPlan][resource];
    const current = this.usage[resource];

    // -1 means unlimited
    if (limit === -1) return true;

    return current < limit;
  }

  getRemainingQuota(resource: 'products' | 'stores' | 'orders' | 'aiTasks' | 'apiCalls' | 'users'): number {
    if (!this.usage) return 0;

    const limit = PLAN_LIMITS[this.currentPlan][resource];
    const current = this.usage[resource];

    // -1 means unlimited
    if (limit === -1) return Infinity;

    return Math.max(0, limit - current);
  }

  getUsagePercentage(resource: 'products' | 'stores' | 'orders' | 'aiTasks' | 'apiCalls' | 'users'): number {
    if (!this.usage) return 0;

    const limit = PLAN_LIMITS[this.currentPlan][resource];
    const current = this.usage[resource];

    // -1 means unlimited
    if (limit === -1) return 0;

    return Math.min(100, (current / limit) * 100);
  }

  needsUpgrade(resource: 'products' | 'stores' | 'orders' | 'aiTasks' | 'apiCalls' | 'users'): boolean {
    return this.getUsagePercentage(resource) >= 90;
  }

  getRecommendedPlan(): PlanTier {
    if (!this.usage) return 'starter';

    const tiers: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];
    const currentIndex = tiers.indexOf(this.currentPlan);

    // Check if we need to upgrade
    for (const resource of ['products', 'stores', 'orders'] as const) {
      if (this.getUsagePercentage(resource) >= 80) {
        // Try next tier
        const nextTier = tiers[currentIndex + 1];
        if (nextTier) return nextTier;
      }
    }

    return this.currentPlan;
  }

  async upgradePlan(newPlan: PlanTier, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ subscription_plan: newPlan })
        .eq('user_id', userId);

      if (error) throw error;

      this.currentPlan = newPlan;
      return true;
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
      return false;
    }
  }
}

// Singleton export
export const planService = PlanService.getInstance();
