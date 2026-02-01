/**
 * Supplier Reliability Tests
 * Unit tests for reliability scoring logic
 */

import { describe, it, expect } from 'vitest';

// Test reliability score calculation logic
describe('Reliability Score Calculation', () => {
  const calculateOverallScore = (metrics: {
    delivery: number;
    quality: number;
    communication: number;
    pricing: number;
    stockAccuracy: number;
  }) => {
    // Weighted average: Delivery 25%, Quality 30%, Communication 15%, Pricing 15%, Stock 15%
    return (
      metrics.delivery * 0.25 +
      metrics.quality * 0.30 +
      metrics.communication * 0.15 +
      metrics.pricing * 0.15 +
      metrics.stockAccuracy * 0.15
    );
  };

  it('should calculate overall score correctly', () => {
    const metrics = {
      delivery: 0.8,
      quality: 0.9,
      communication: 0.7,
      pricing: 0.85,
      stockAccuracy: 0.75,
    };

    const score = calculateOverallScore(metrics);
    
    // Expected: 0.8*0.25 + 0.9*0.30 + 0.7*0.15 + 0.85*0.15 + 0.75*0.15
    // = 0.2 + 0.27 + 0.105 + 0.1275 + 0.1125 = 0.815
    expect(score).toBeCloseTo(0.815, 2);
  });

  it('should return 1.0 for perfect scores', () => {
    const metrics = {
      delivery: 1.0,
      quality: 1.0,
      communication: 1.0,
      pricing: 1.0,
      stockAccuracy: 1.0,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(1.0);
  });

  it('should return 0.0 for zero scores', () => {
    const metrics = {
      delivery: 0,
      quality: 0,
      communication: 0,
      pricing: 0,
      stockAccuracy: 0,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(0);
  });
});

describe('Recommendation Classification', () => {
  const getRecommendation = (score: number): string => {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.75) return 'good';
    if (score >= 0.5) return 'fair';
    if (score >= 0.3) return 'caution';
    return 'avoid';
  };

  it('should classify excellent suppliers correctly', () => {
    expect(getRecommendation(0.95)).toBe('excellent');
    expect(getRecommendation(0.90)).toBe('excellent');
  });

  it('should classify good suppliers correctly', () => {
    expect(getRecommendation(0.89)).toBe('good');
    expect(getRecommendation(0.75)).toBe('good');
  });

  it('should classify fair suppliers correctly', () => {
    expect(getRecommendation(0.74)).toBe('fair');
    expect(getRecommendation(0.50)).toBe('fair');
  });

  it('should classify caution suppliers correctly', () => {
    expect(getRecommendation(0.49)).toBe('caution');
    expect(getRecommendation(0.30)).toBe('caution');
  });

  it('should classify avoid suppliers correctly', () => {
    expect(getRecommendation(0.29)).toBe('avoid');
    expect(getRecommendation(0.0)).toBe('avoid');
  });
});

describe('Margin Calculation', () => {
  const calculateMargin = (
    sellingPrice: number,
    supplierPrice: number,
    shippingCost: number,
    platformFee: number = 0.029, // Stripe
    transactionFee: number = 0.30, // Stripe fixed
    vatRate: number = 0.20 // 20% VAT
  ) => {
    const totalCost = supplierPrice + shippingCost;
    const fees = sellingPrice * platformFee + transactionFee;
    const vat = sellingPrice * vatRate;
    const netProfit = sellingPrice - totalCost - fees - vat;
    const marginPercent = (netProfit / sellingPrice) * 100;

    return { netProfit, marginPercent, totalCost };
  };

  it('should calculate margin correctly', () => {
    const result = calculateMargin(50, 15, 5);
    
    // totalCost = 15 + 5 = 20
    // fees = 50 * 0.029 + 0.30 = 1.45 + 0.30 = 1.75
    // vat = 50 * 0.20 = 10
    // netProfit = 50 - 20 - 1.75 - 10 = 18.25
    expect(result.totalCost).toBe(20);
    expect(result.netProfit).toBeCloseTo(18.25, 2);
    expect(result.marginPercent).toBeCloseTo(36.5, 1);
  });

  it('should handle negative margin', () => {
    const result = calculateMargin(20, 25, 5);
    expect(result.netProfit).toBeLessThan(0);
  });
});

describe('Shipping Time Parsing', () => {
  const parseShippingTime = (timeStr: string): { min: number; max: number } | null => {
    // Parse formats: "15-45 jours", "7-15 days", "24-72 heures"
    const match = timeStr.match(/(\d+)-?(\d+)?\s*(jours?|days?|heures?|hours?)/i);
    if (!match) return null;

    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    const unit = match[3].toLowerCase();

    // Convert hours to days
    if (unit.startsWith('heure') || unit.startsWith('hour')) {
      return { min: min / 24, max: max / 24 };
    }

    return { min, max };
  };

  it('should parse "15-45 jours"', () => {
    const result = parseShippingTime('15-45 jours');
    expect(result).toEqual({ min: 15, max: 45 });
  });

  it('should parse "7-15 days"', () => {
    const result = parseShippingTime('7-15 days');
    expect(result).toEqual({ min: 7, max: 15 });
  });

  it('should parse "24-72 heures"', () => {
    const result = parseShippingTime('24-72 heures');
    expect(result).toEqual({ min: 1, max: 3 });
  });

  it('should handle single value "5 jours"', () => {
    const result = parseShippingTime('5 jours');
    expect(result).toEqual({ min: 5, max: 5 });
  });
});
