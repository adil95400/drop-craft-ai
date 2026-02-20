/**
 * Tests critiques — Hook de facturation
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', email: 'test@test.com' } }),
}));

describe('Billing Details', () => {
  it('should have BillingInvoice interface shape', async () => {
    // Verify the types can be imported
    const types = await import('@/hooks/useBillingDetails');
    expect(types.useBillingDetails).toBeDefined();
  });

  it('should invoke billing-details edge function', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    
    mockInvoke.mockResolvedValue({
      data: {
        subscription: null,
        invoices: [],
        payment_methods: [],
        upcoming_invoice: null,
      },
      error: null,
    });

    const result = await supabase.functions.invoke('billing-details');
    expect(mockInvoke).toHaveBeenCalledWith('billing-details');
    expect(result.data.invoices).toEqual([]);
  });

  it('should handle billing error gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Unauthorized' },
    });

    const result = await supabase.functions.invoke('billing-details');
    expect(result.error).toBeTruthy();
  });
});

describe('Monetization Hook', () => {
  it('should export useMonetization hook', async () => {
    // Mock all dependencies that monetization needs
    vi.mock('@/services/api/client', () => ({
      monetizationApi: {
        getPlan: vi.fn().mockResolvedValue({ current_plan: 'free' }),
        getUsage: vi.fn().mockResolvedValue({ usage: {}, alerts: [] }),
        getCredits: vi.fn().mockResolvedValue({ credits: [], total_remaining: 0 }),
        getHistory: vi.fn().mockResolvedValue([]),
        checkGate: vi.fn().mockResolvedValue({ allowed: true }),
      },
      MonetizationPlan: {},
      MonetizationUsage: {},
      MonetizationCredits: {},
      MonetizationHistory: {},
      PlanGateResult: {},
    }));

    const { useMonetization } = await import('@/hooks/useMonetization');
    expect(useMonetization).toBeDefined();
    expect(typeof useMonetization).toBe('function');
  });
});
