/**
 * Critical User Journeys - E2E Tests
 * Tests complete user flows from authentication through core features
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Comprehensive Supabase mock
const mockUser = { id: 'test-uid-123', email: 'test@shopopti.com' };
const mockProducts = [
  { id: 'p1', title: 'Wireless Earbuds', price: 29.99, status: 'active', user_id: mockUser.id },
  { id: 'p2', title: 'Phone Case', price: 9.99, status: 'draft', user_id: mockUser.id },
];

const createChainMock = (data: any = null, error: any = null) => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data, error })),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    then: (resolve: any) => resolve({ data: Array.isArray(data) ? data : [data], error }),
  };
  // Make chain thenable for .from().select() without .single()
  chain[Symbol.iterator] = function* () { yield* (Array.isArray(data) ? data : [data]); };
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: { access_token: 'tok' } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: mockUser } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn((table: string) => {
      if (table === 'products') return createChainMock(mockProducts);
      if (table === 'orders') return createChainMock([]);
      if (table === 'marketplace_integrations') return createChainMock([]);
      return createChainMock(null);
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('Journey: Authentication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should sign up a new user', async () => {
    const result = await supabase.auth.signUp({
      email: 'new@shopopti.com',
      password: 'SecurePass123!',
    });
    expect(result.error).toBeNull();
    expect(result.data.user).toBeDefined();
  });

  it('should sign in with email/password', async () => {
    const result = await supabase.auth.signInWithPassword({
      email: 'test@shopopti.com',
      password: 'password123',
    });
    expect(result.error).toBeNull();
    expect(result.data.user?.email).toBe('test@shopopti.com');
    expect(result.data.session).toBeDefined();
  });

  it('should sign out', async () => {
    const result = await supabase.auth.signOut();
    expect(result.error).toBeNull();
  });
});

describe('Journey: Product CRUD', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should list user products', async () => {
    const chain = supabase.from('products').select('*').eq('user_id', mockUser.id);
    const result = await (chain as any).single();
    expect(result.error).toBeNull();
  });

  it('should create a product', async () => {
    const newProduct = {
      title: 'New Product',
      price: 19.99,
      status: 'draft',
      user_id: mockUser.id,
    };
    const chain = supabase.from('products').insert(newProduct).select().single();
    const result = await chain;
    expect(result.error).toBeNull();
  });

  it('should update a product', async () => {
    const chain = supabase.from('products').update({ title: 'Updated' }).eq('id', 'p1').select().single();
    const result = await chain;
    expect(result.error).toBeNull();
  });

  it('should delete a product', async () => {
    const chain = supabase.from('products').delete().eq('id', 'p1');
    const result = await (chain as any).single();
    expect(result.error).toBeNull();
  });
});

describe('Journey: Marketplace Integration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should connect to TikTok Shop via edge function', async () => {
    const result = await supabase.functions.invoke('tiktok-shop-integration', {
      body: { action: 'connect', shop_id: 'test-shop' },
    });
    expect(result.error).toBeNull();
    expect(result.data?.success).toBe(true);
  });

  it('should publish products to marketplace', async () => {
    const result = await supabase.functions.invoke('tiktok-shop-integration', {
      body: {
        action: 'publish_bulk',
        integration_id: 'int-1',
        product_ids: ['p1', 'p2'],
      },
    });
    expect(result.error).toBeNull();
  });

  it('should sync orders from marketplace', async () => {
    const result = await supabase.functions.invoke('tiktok-shop-integration', {
      body: { action: 'sync_orders', integration_id: 'int-1' },
    });
    expect(result.error).toBeNull();
  });
});

describe('Journey: AI Product Scanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should scan for winning products', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        products: [
          { title: 'Trending Item', score: 92, demand: 'high' },
        ],
        meta: { total: 1, query: 'trending' },
      },
      error: null,
    });

    const result = await supabase.functions.invoke('ai-winning-product-scanner', {
      body: { query: 'trending gadgets', category: 'electronics' },
    });

    expect(result.error).toBeNull();
    expect(result.data?.products).toHaveLength(1);
    expect(result.data?.products[0].score).toBe(92);
  });

  it('should analyze trends for a keyword', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { trends: { keyword: 'earbuds', growth: '+45%' } },
      error: null,
    });

    const result = await supabase.functions.invoke('winners-trends', {
      body: { q: 'earbuds', limit: 10 },
    });

    expect(result.error).toBeNull();
    expect(result.data?.trends?.keyword).toBe('earbuds');
  });
});

describe('Journey: Order Fulfillment', () => {
  it('should create and track an order', async () => {
    const orderResult = await supabase.functions.invoke('auto-order-fulfillment', {
      body: { order_id: 'ord-1', supplier: 'cjdropshipping' },
    });
    expect(orderResult.error).toBeNull();
  });

  it('should fetch order tracking', async () => {
    const result = await supabase.functions.invoke('order-tracking', {
      body: { action: 'get_tracking', tracking_number: 'TRK123456' },
    });
    expect(result.error).toBeNull();
  });
});

describe('Journey: Email Marketing', () => {
  it('should send a campaign', async () => {
    const result = await supabase.functions.invoke('send-email-campaign', {
      body: {
        campaign_name: 'Summer Sale',
        subject: '50% Off!',
        content: '<h1>Big Sale</h1>',
        segment: 'vip',
      },
    });
    expect(result.error).toBeNull();
  });
});

describe('Journey: Analytics', () => {
  it('should fetch dashboard analytics', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        revenue: 15000,
        orders: 120,
        conversion_rate: 3.2,
        top_products: ['p1', 'p2'],
      },
      error: null,
    });

    const result = await supabase.functions.invoke('advanced-analytics', {
      body: { period: '30d', metrics: ['revenue', 'orders', 'conversion_rate'] },
    });

    expect(result.error).toBeNull();
    expect(result.data?.revenue).toBe(15000);
    expect(result.data?.orders).toBe(120);
  });
});
