/**
 * TikTok Shop Service - Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Import after mock
import { TikTokShopService, tiktokShopService } from '@/services/tiktok-shop.service';

describe('TikTokShopService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton', () => {
    it('should return the same instance', () => {
      const a = TikTokShopService.getInstance();
      const b = TikTokShopService.getInstance();
      expect(a).toBe(b);
    });

    it('should export a default instance', () => {
      expect(tiktokShopService).toBeDefined();
    });
  });

  describe('publishProduct', () => {
    it('should call edge function with correct params', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await tiktokShopService.publishProduct('int-1', 'prod-1', {
        auto_sync_inventory: true,
      });

      expect(mockInvoke).toHaveBeenCalledWith('tiktok-shop-integration', {
        body: {
          action: 'publish_product',
          integration_id: 'int-1',
          product_id: 'prod-1',
          options: { auto_sync_inventory: true },
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw on edge function error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Unauthorized' } });

      await expect(
        tiktokShopService.publishProduct('int-1', 'prod-1')
      ).rejects.toThrow('Failed to publish to TikTok Shop');
    });
  });

  describe('publishBulkProducts', () => {
    it('should send bulk publish request', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { success_count: 3, total: 3 },
        error: null,
      });

      const result = await tiktokShopService.publishBulkProducts('int-1', ['p1', 'p2', 'p3']);

      expect(mockInvoke).toHaveBeenCalledWith('tiktok-shop-integration', {
        body: {
          action: 'publish_bulk',
          integration_id: 'int-1',
          product_ids: ['p1', 'p2', 'p3'],
          options: {},
        },
      });
      expect(result.success_count).toBe(3);
    });
  });

  describe('syncProducts', () => {
    it('should sync products for integration', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { synced_count: 5 }, error: null });

      const result = await tiktokShopService.syncProducts('int-1');
      expect(result.synced_count).toBe(5);
    });
  });

  describe('syncOrders', () => {
    it('should sync orders for integration', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { synced_count: 10 }, error: null });

      const result = await tiktokShopService.syncOrders('int-1');
      expect(result.synced_count).toBe(10);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory quantity', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { updated: true }, error: null });

      const result = await tiktokShopService.updateInventory('int-1', 'prod-1', 50);

      expect(mockInvoke).toHaveBeenCalledWith('tiktok-shop-integration', {
        body: {
          action: 'update_inventory',
          integration_id: 'int-1',
          product_id: 'prod-1',
          quantity: 50,
        },
      });
      expect(result.updated).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return categories array', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { categories: [{ id: '1', name: 'Electronics' }] },
        error: null,
      });

      const result = await tiktokShopService.getCategories('int-1');
      expect(result).toEqual([{ id: '1', name: 'Electronics' }]);
    });

    it('should return empty array when no categories', async () => {
      mockInvoke.mockResolvedValueOnce({ data: {}, error: null });

      const result = await tiktokShopService.getCategories('int-1');
      expect(result).toEqual([]);
    });
  });

  describe('getIntegrationStats', () => {
    it('should aggregate stats from published products and orders', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: '1', status: 'active' },
              { id: '2', status: 'inactive' },
            ],
          }),
        }),
      });
      const mockOrderSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [
              { total_amount: 100 },
              { total_amount: 200 },
            ],
          }),
        }),
      });

      // First call = published_products, second = orders
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'published_products') {
          return { select: mockSelect };
        }
        return { select: mockOrderSelect };
      });

      const stats = await tiktokShopService.getIntegrationStats('int-1');

      expect(stats.total_products).toBe(2);
      expect(stats.active_products).toBe(1);
      expect(stats.total_orders).toBe(2);
      expect(stats.total_revenue).toBe(300);
      expect(stats.avg_order_value).toBe(150);
    });

    it('should return zeros on error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB error');
      });

      const stats = await tiktokShopService.getIntegrationStats('int-1');
      expect(stats.total_products).toBe(0);
      expect(stats.total_revenue).toBe(0);
    });
  });
});
