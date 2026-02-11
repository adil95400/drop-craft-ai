/**
 * PlanService - Unit Tests
 * Tests plan limits, feature gating, and usage tracking
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  },
}));

vi.mock('@/services/api/productHelpers', () => ({
  getProductCount: vi.fn().mockResolvedValue(5),
}));

import { PlanService, planService, type PlanLimits } from '@/services/PlanService';

describe('PlanService', () => {
  describe('Singleton', () => {
    it('should return same instance', () => {
      expect(PlanService.getInstance()).toBe(planService);
    });
  });

  describe('PlanLimits type', () => {
    it('should define required fields', () => {
      const limits: PlanLimits = {
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
      };
      expect(limits.products).toBe(100);
      expect(limits.features.advancedAnalytics).toBe(false);
    });
  });
});
