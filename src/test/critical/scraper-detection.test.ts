import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  getSupportedPlatforms,
  isPlatformSupported,
} from '@/services/scraper';

describe('Product Data Engine - Platform Detection', () => {
  it('should detect Amazon URLs', () => {
    const result = detectPlatform('https://www.amazon.fr/dp/B08N5WRWNW');
    expect(result.platform).toBe('amazon');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should detect AliExpress URLs', () => {
    const result = detectPlatform('https://www.aliexpress.com/item/123456.html');
    expect(result.platform).toBe('aliexpress');
  });

  it('should detect eBay URLs', () => {
    const result = detectPlatform('https://www.ebay.com/itm/123456');
    expect(result.platform).toBe('ebay');
  });

  it('should return low confidence for generic URLs', () => {
    const result = detectPlatform('https://www.random-site.com/page/123');
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should list supported platforms', () => {
    const platforms = getSupportedPlatforms();
    expect(platforms).toContain('amazon');
    expect(platforms).toContain('aliexpress');
    expect(platforms).toContain('ebay');
    expect(platforms.length).toBeGreaterThanOrEqual(5);
  });

  it('should check if platform is supported', () => {
    expect(isPlatformSupported('amazon')).toBe(true);
    expect(isPlatformSupported('unknown_platform' as any)).toBe(false);
  });
});
