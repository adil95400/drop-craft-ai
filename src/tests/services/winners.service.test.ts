/**
 * Winners Service - Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();
const mockGetUser = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      insert: (data: any) => mockInsert(data),
    }),
  },
}));

import { WinnersService, winnersService } from '@/domains/winners/services/winnersService';

describe('WinnersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    winnersService.clearCache();
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      expect(WinnersService.getInstance()).toBe(WinnersService.getInstance());
    });
  });

  describe('searchWinners', () => {
    it('should call edge function with correct params', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { products: [{ id: '1', title: 'Test' }], meta: { total: 1 } },
        error: null,
      });

      const result = await winnersService.searchWinners({
        query: 'earbuds',
        category: 'electronics',
        limit: 10,
        sources: ['trends'],
      });

      expect(mockInvoke).toHaveBeenCalledWith('winners-aggregator', {
        body: {
          q: 'earbuds',
          category: 'electronics',
          limit: 10,
          sources: ['trends'],
          min_score: undefined,
          max_price: undefined,
        },
      });
      expect(result.products).toHaveLength(1);
    });

    it('should return cached data on second call', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { products: [], meta: { total: 0 } },
        error: null,
      });

      const params = { query: 'test', limit: 5 };
      await winnersService.searchWinners(params);
      await winnersService.searchWinners(params);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should throw on edge function error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });

      await expect(winnersService.searchWinners({ query: 'x' })).rejects.toThrow();
    });
  });

  describe('analyzeTrends', () => {
    it('should invoke winners-trends', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { trends: [] }, error: null });

      const result = await winnersService.analyzeTrends('shoes');
      expect(mockInvoke).toHaveBeenCalledWith('winners-trends', {
        body: { q: 'shoes', limit: 10 },
      });
    });
  });

  describe('importProduct', () => {
    it('should insert product for authenticated user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'new-1' }, error: null }),
        }),
      });

      const product = {
        id: 'w1',
        title: 'Winner Product',
        price: 29.99,
        currency: 'USD',
        image: 'https://img.test/1.jpg',
        source: 'ebay',
        url: 'https://ebay.com/item/1',
        trending_score: 85,
        market_demand: 90,
      };

      const result = await winnersService.importProduct(product);
      expect(result.id).toBe('new-1');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'u1',
            title: 'Winner Product',
            price: 29.99,
          }),
        ])
      );
    });

    it('should throw when user not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(
        winnersService.importProduct({
          id: 'x', title: 'T', price: 10, currency: 'USD',
          image: '', source: '', url: '', trending_score: 0, market_demand: 0,
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Cache', () => {
    it('should clear cache', () => {
      winnersService.clearCache();
      const stats = winnersService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});
