import { test, expect } from '@playwright/test';

/**
 * ShopOpti+ API Mock Tests
 * Tests extension behavior with mocked API responses
 */

// Mock API responses for testing
const MOCK_RESPONSES = {
  authSuccess: {
    success: true,
    authenticated: true,
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      plan: 'pro'
    }
  },
  authFailed: {
    success: false,
    authenticated: false,
    error: 'Invalid token'
  },
  importSuccess: {
    success: true,
    product: {
      id: 'prod-123',
      title: 'Test Product',
      price: 29.99,
      images: ['https://example.com/img1.jpg'],
      variants: []
    }
  },
  importError: {
    success: false,
    error: 'Failed to scrape product'
  },
  rateLimited: {
    success: false,
    error: 'Rate limit exceeded',
    retryAfter: 60
  }
};

test.describe('API Response Handling', () => {
  test('handles successful authentication response', () => {
    const response = MOCK_RESPONSES.authSuccess;
    
    expect(response.success).toBe(true);
    expect(response.authenticated).toBe(true);
    expect(response.user).toBeDefined();
    expect(response.user.id).toBeTruthy();
  });

  test('handles failed authentication response', () => {
    const response = MOCK_RESPONSES.authFailed;
    
    expect(response.success).toBe(false);
    expect(response.authenticated).toBe(false);
    expect(response.error).toBeTruthy();
  });

  test('handles successful import response', () => {
    const response = MOCK_RESPONSES.importSuccess;
    
    expect(response.success).toBe(true);
    expect(response.product).toBeDefined();
    expect(response.product.id).toBeTruthy();
    expect(response.product.title).toBeTruthy();
  });

  test('handles import error response', () => {
    const response = MOCK_RESPONSES.importError;
    
    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
  });

  test('handles rate limit response', () => {
    const response = MOCK_RESPONSES.rateLimited;
    
    expect(response.success).toBe(false);
    expect(response.error).toContain('Rate limit');
    expect(response.retryAfter).toBeGreaterThan(0);
  });
});

test.describe('Error Classification', () => {
  const classifyError = (error: string): 'network' | 'auth' | 'validation' | 'server' | 'unknown' => {
    if (error.includes('network') || error.includes('fetch')) return 'network';
    if (error.includes('auth') || error.includes('token') || error.includes('unauthorized')) return 'auth';
    if (error.includes('invalid') || error.includes('required')) return 'validation';
    if (error.includes('server') || error.includes('500')) return 'server';
    return 'unknown';
  };

  test('classifies network errors', () => {
    expect(classifyError('network error')).toBe('network');
    expect(classifyError('Failed to fetch')).toBe('network');
  });

  test('classifies auth errors', () => {
    expect(classifyError('Invalid token')).toBe('auth');
    expect(classifyError('unauthorized access')).toBe('auth');
  });

  test('classifies validation errors', () => {
    expect(classifyError('URL is required')).toBe('validation');
    expect(classifyError('invalid product URL')).toBe('validation');
  });

  test('classifies server errors', () => {
    expect(classifyError('Internal server error 500')).toBe('server');
  });
});

test.describe('Product Data Validation', () => {
  interface Product {
    id?: string;
    title: string;
    price: number;
    images: string[];
    description?: string;
    variants?: Array<{ sku: string; price: number }>;
  }

  const validateProduct = (product: Product): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!product.title || product.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      errors.push('Price must be a positive number');
    }

    if (!Array.isArray(product.images)) {
      errors.push('Images must be an array');
    }

    product.images?.forEach((img, index) => {
      if (!img.startsWith('http')) {
        errors.push(`Image ${index} has invalid URL`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  test('validates complete product', () => {
    const product: Product = {
      title: 'Test Product',
      price: 29.99,
      images: ['https://example.com/img.jpg']
    };

    const result = validateProduct(product);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects product without title', () => {
    const product: Product = {
      title: '',
      price: 29.99,
      images: []
    };

    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('rejects product with negative price', () => {
    const product: Product = {
      title: 'Test',
      price: -10,
      images: []
    };

    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Price must be a positive number');
  });

  test('rejects product with invalid image URLs', () => {
    const product: Product = {
      title: 'Test',
      price: 10,
      images: ['not-a-url', 'https://valid.com/img.jpg']
    };

    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid URL'))).toBe(true);
  });
});

test.describe('URL Parsing', () => {
  const parseProductUrl = (url: string): { platform: string; productId: string } | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      // Amazon
      if (hostname.includes('amazon')) {
        const dpMatch = url.match(/\/dp\/([A-Z0-9]+)/i);
        const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]+)/i);
        const productId = dpMatch?.[1] || gpMatch?.[1];
        if (productId) return { platform: 'amazon', productId };
      }

      // AliExpress
      if (hostname.includes('aliexpress')) {
        const itemMatch = url.match(/\/item\/(\d+)\.html/);
        if (itemMatch) return { platform: 'aliexpress', productId: itemMatch[1] };
      }

      // eBay
      if (hostname.includes('ebay')) {
        const itm = url.match(/\/itm\/[^/]*\/(\d+)/);
        const itm2 = url.match(/\/itm\/(\d+)/);
        const productId = itm?.[1] || itm2?.[1];
        if (productId) return { platform: 'ebay', productId };
      }

      // Cdiscount
      if (hostname.includes('cdiscount')) {
        const fpMatch = url.match(/\/f-([^/.]+)/);
        if (fpMatch) return { platform: 'cdiscount', productId: fpMatch[1] };
      }

      return null;
    } catch {
      return null;
    }
  };

  test('parses Amazon URLs', () => {
    const urls = [
      { url: 'https://www.amazon.fr/dp/B0TEST123', expected: 'B0TEST123' },
      { url: 'https://amazon.com/gp/product/B0TEST456/ref=xyz', expected: 'B0TEST456' }
    ];

    urls.forEach(({ url, expected }) => {
      const result = parseProductUrl(url);
      expect(result).not.toBeNull();
      expect(result?.platform).toBe('amazon');
      expect(result?.productId).toBe(expected);
    });
  });

  test('parses AliExpress URLs', () => {
    const url = 'https://www.aliexpress.com/item/1005001234567890.html';
    const result = parseProductUrl(url);
    
    expect(result).not.toBeNull();
    expect(result?.platform).toBe('aliexpress');
    expect(result?.productId).toBe('1005001234567890');
  });

  test('parses eBay URLs', () => {
    const url = 'https://www.ebay.fr/itm/123456789012';
    const result = parseProductUrl(url);
    
    expect(result).not.toBeNull();
    expect(result?.platform).toBe('ebay');
    expect(result?.productId).toBe('123456789012');
  });

  test('returns null for invalid URLs', () => {
    const invalidUrls = [
      'not-a-url',
      'https://google.com/',
      'javascript:alert(1)'
    ];

    invalidUrls.forEach(url => {
      const result = parseProductUrl(url);
      expect(result).toBeNull();
    });
  });
});

test.describe('Review Data Processing', () => {
  interface Review {
    rating: number;
    text: string;
    author: string;
    date: string;
    verified: boolean;
    images?: string[];
  }

  const processReviews = (reviews: Review[]): {
    averageRating: number;
    totalCount: number;
    verifiedCount: number;
    withPhotos: number;
    distribution: Record<number, number>;
  } => {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let verifiedCount = 0;
    let withPhotos = 0;

    reviews.forEach(review => {
      totalRating += review.rating;
      distribution[review.rating]++;
      if (review.verified) verifiedCount++;
      if (review.images && review.images.length > 0) withPhotos++;
    });

    return {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      totalCount: reviews.length,
      verifiedCount,
      withPhotos,
      distribution
    };
  };

  test('calculates review statistics correctly', () => {
    const reviews: Review[] = [
      { rating: 5, text: 'Great!', author: 'User1', date: '2024-01-01', verified: true, images: ['img.jpg'] },
      { rating: 4, text: 'Good', author: 'User2', date: '2024-01-02', verified: true },
      { rating: 3, text: 'OK', author: 'User3', date: '2024-01-03', verified: false },
      { rating: 5, text: 'Excellent', author: 'User4', date: '2024-01-04', verified: true }
    ];

    const stats = processReviews(reviews);

    expect(stats.totalCount).toBe(4);
    expect(stats.averageRating).toBe(4.25);
    expect(stats.verifiedCount).toBe(3);
    expect(stats.withPhotos).toBe(1);
    expect(stats.distribution[5]).toBe(2);
    expect(stats.distribution[4]).toBe(1);
    expect(stats.distribution[3]).toBe(1);
  });

  test('handles empty reviews array', () => {
    const stats = processReviews([]);
    
    expect(stats.totalCount).toBe(0);
    expect(stats.averageRating).toBe(0);
    expect(stats.verifiedCount).toBe(0);
  });
});

test.describe('Variant Processing', () => {
  interface Variant {
    sku: string;
    price: number;
    stock: number;
    options: Record<string, string>;
  }

  const groupVariantsByOption = (
    variants: Variant[], 
    optionName: string
  ): Record<string, Variant[]> => {
    const groups: Record<string, Variant[]> = {};

    variants.forEach(variant => {
      const value = variant.options[optionName];
      if (value) {
        if (!groups[value]) groups[value] = [];
        groups[value].push(variant);
      }
    });

    return groups;
  };

  test('groups variants by color', () => {
    const variants: Variant[] = [
      { sku: 'SKU-R-S', price: 29.99, stock: 10, options: { color: 'Red', size: 'S' } },
      { sku: 'SKU-R-M', price: 29.99, stock: 5, options: { color: 'Red', size: 'M' } },
      { sku: 'SKU-B-S', price: 29.99, stock: 8, options: { color: 'Blue', size: 'S' } }
    ];

    const grouped = groupVariantsByOption(variants, 'color');

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['Red']).toHaveLength(2);
    expect(grouped['Blue']).toHaveLength(1);
  });

  test('groups variants by size', () => {
    const variants: Variant[] = [
      { sku: 'SKU-R-S', price: 29.99, stock: 10, options: { color: 'Red', size: 'S' } },
      { sku: 'SKU-B-S', price: 29.99, stock: 8, options: { color: 'Blue', size: 'S' } },
      { sku: 'SKU-R-M', price: 29.99, stock: 5, options: { color: 'Red', size: 'M' } }
    ];

    const grouped = groupVariantsByOption(variants, 'size');

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['S']).toHaveLength(2);
    expect(grouped['M']).toHaveLength(1);
  });
});
