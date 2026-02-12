import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
    },
  },
});

describe('API V1 Client — Contract Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should construct correct base URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], meta: { page: 1, per_page: 20, total: 0 } }),
    });

    // Dynamic import after mocking
    const { api } = await import('@/services/api/client');
    await api.get('/products');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/functions/v1/api-v1/v1/products');
  });

  it('should include authorization header when session exists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { api } = await import('@/services/api/client');
    await api.get('/products');

    const headers = mockFetch.mock.calls[0][1]?.headers;
    expect(headers).toHaveProperty('Authorization');
    expect(headers['Authorization']).toContain('Bearer');
  });

  it('should include apikey header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { api } = await import('@/services/api/client');
    await api.get('/products');

    const headers = mockFetch.mock.calls[0][1]?.headers;
    expect(headers).toHaveProperty('apikey');
  });

  it('should throw on non-OK responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }),
    });

    const { api } = await import('@/services/api/client');
    await expect(api.get('/products')).rejects.toThrow('Not authenticated');
  });

  it('should send POST body as JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123' }),
    });

    const { api } = await import('@/services/api/client');
    const body = { name: 'Test Product', price: 29.99 };
    await api.post('/products', body);

    const fetchOptions = mockFetch.mock.calls[0][1];
    expect(fetchOptions.method).toBe('POST');
    expect(fetchOptions.body).toBe(JSON.stringify(body));
  });

  it('should append query params to URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { api } = await import('@/services/api/client');
    await api.get('/products', { page: 2, per_page: 10, status: 'active' });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('per_page=10');
    expect(calledUrl).toContain('status=active');
  });

  it('should skip undefined params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const { api } = await import('@/services/api/client');
    await api.get('/products', { page: 1, status: undefined });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).not.toContain('status');
  });
});

describe('API V1 Module Exports', () => {
  it('should export all required API modules', async () => {
    const client = await import('@/services/api/client');
    
    // Core modules
    expect(client.productsApi).toBeDefined();
    expect(client.ordersApi).toBeDefined();
    
    // Phase 3-6 modules
    expect(client.conversionApi).toBeDefined();
    expect(client.advancedAnalyticsApi).toBeDefined();
    expect(client.promotionsApi).toBeDefined();
    expect(client.behaviorApi).toBeDefined();
    expect(client.trackingApi).toBeDefined();
    expect(client.financeApi).toBeDefined();
    expect(client.crmApi).toBeDefined();
    expect(client.pricingApi).toBeDefined();
    expect(client.marketingApi).toBeDefined();
  });

  it('conversionApi should have all expected methods', async () => {
    const { conversionApi } = await import('@/services/api/client');
    
    expect(conversionApi.listBundles).toBeTypeOf('function');
    expect(conversionApi.createBundle).toBeTypeOf('function');
    expect(conversionApi.listUpsells).toBeTypeOf('function');
    expect(conversionApi.listDiscounts).toBeTypeOf('function');
    expect(conversionApi.listTimers).toBeTypeOf('function');
    expect(conversionApi.listSocialProof).toBeTypeOf('function');
    expect(conversionApi.trackEvent).toBeTypeOf('function');
    expect(conversionApi.analytics).toBeTypeOf('function');
  });

  it('promotionsApi should have all expected methods', async () => {
    const { promotionsApi } = await import('@/services/api/client');
    
    expect(promotionsApi.listCampaigns).toBeTypeOf('function');
    expect(promotionsApi.createCampaign).toBeTypeOf('function');
    expect(promotionsApi.updateCampaign).toBeTypeOf('function');
    expect(promotionsApi.deleteCampaign).toBeTypeOf('function');
    expect(promotionsApi.listRules).toBeTypeOf('function');
    expect(promotionsApi.toggleRule).toBeTypeOf('function');
    expect(promotionsApi.stats).toBeTypeOf('function');
  });
});
