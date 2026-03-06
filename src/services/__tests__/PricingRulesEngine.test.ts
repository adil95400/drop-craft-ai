import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the engine
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

import { PricingRulesEngine, type PricingRule } from '../PricingRulesEngine'

function makeRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: '1',
    name: 'Test Rule',
    description: null,
    rule_type: 'margin',
    conditions: {},
    actions: {},
    calculation: null,
    min_price: null,
    max_price: null,
    target_margin: 30,
    margin_protection: 15,
    rounding_strategy: 'nearest_99',
    competitor_strategy: null,
    competitor_offset: null,
    apply_to: 'all',
    apply_filter: null,
    is_active: true,
    priority: 1,
    products_affected: 0,
    execution_count: 0,
    last_executed_at: null,
    ...overrides,
  }
}

describe('PricingRulesEngine', () => {
  let engine: PricingRulesEngine

  beforeEach(() => {
    engine = PricingRulesEngine.getInstance()
  })

  describe('calculatePrice', () => {
    it('returns cost price when no rules', () => {
      const result = engine.calculatePrice(10, [])
      expect(result.originalPrice).toBe(10)
      expect(result.calculatedPrice).toBe(10)
      expect(result.roundedPrice).toBe(10)
      expect(result.margin).toBe(0)
      expect(result.ruleApplied).toBe('none')
    })

    it('returns cost price when cost is zero', () => {
      const result = engine.calculatePrice(0, [makeRule()])
      expect(result.roundedPrice).toBe(0)
    })

    it('applies margin rule correctly', () => {
      // cost=10, target_margin=30% → price = 10 / (1 - 0.30) = 14.2857
      const rule = makeRule({ target_margin: 30, rounding_strategy: 'none' })
      const result = engine.calculatePrice(10, [rule])
      expect(result.calculatedPrice).toBeCloseTo(14.29, 1)
      expect(result.ruleApplied).toBe('Test Rule')
    })

    it('applies markup rule correctly', () => {
      const rule = makeRule({
        rule_type: 'markup',
        calculation: { markup_percent: 50 },
        rounding_strategy: 'none',
      })
      // cost=20, markup 50% → 30
      const result = engine.calculatePrice(20, [rule])
      expect(result.calculatedPrice).toBe(30)
    })

    it('applies fixed amount rule', () => {
      const rule = makeRule({
        rule_type: 'fixed',
        calculation: { fixed_amount: 5 },
        rounding_strategy: 'none',
      })
      const result = engine.calculatePrice(10, [rule])
      expect(result.calculatedPrice).toBe(15)
    })

    it('applies nearest_99 rounding', () => {
      const rule = makeRule({ target_margin: 30, rounding_strategy: 'nearest_99' })
      const result = engine.calculatePrice(10, [rule])
      // 14.2857 → floor(14.2857) + 0.99 = 14.99
      expect(result.roundedPrice).toBe(14.99)
    })

    it('applies nearest_50 rounding', () => {
      const rule = makeRule({ target_margin: 30, rounding_strategy: 'nearest_50' })
      const result = engine.calculatePrice(10, [rule])
      // 14.2857 → round(14.2857 * 2) / 2 = round(28.5714) / 2 = 29/2 = 14.5
      expect(result.roundedPrice).toBe(14.5)
    })

    it('applies round_up rounding', () => {
      const rule = makeRule({ target_margin: 30, rounding_strategy: 'round_up' })
      const result = engine.calculatePrice(10, [rule])
      expect(result.roundedPrice).toBe(15)
    })

    it('enforces margin protection', () => {
      // Rule with very low margin target but 15% margin_protection
      const rule = makeRule({
        rule_type: 'fixed',
        calculation: { fixed_amount: 0.5 },
        margin_protection: 15,
        rounding_strategy: 'none',
      })
      // cost=10, fixed price = 10.50
      // min allowed = 10 / (1 - 0.15) = 11.76
      // price should be bumped to 11.76
      const result = engine.calculatePrice(10, [rule])
      expect(result.marginProtected).toBe(true)
      expect(result.calculatedPrice).toBeCloseTo(11.76, 1)
    })

    it('enforces min_price bound', () => {
      const rule = makeRule({
        rule_type: 'fixed',
        calculation: { fixed_amount: 1 },
        min_price: 20,
        rounding_strategy: 'none',
        margin_protection: 0,
      })
      const result = engine.calculatePrice(10, [rule])
      // fixed = 11, but min = 20
      expect(result.roundedPrice).toBe(20)
    })

    it('enforces max_price bound', () => {
      const rule = makeRule({
        target_margin: 80,
        max_price: 25,
        rounding_strategy: 'none',
        margin_protection: 0,
      })
      const result = engine.calculatePrice(10, [rule])
      // margin 80% → price = 50, but max = 25
      expect(result.roundedPrice).toBe(25)
    })

    it('skips inactive rules', () => {
      const rule = makeRule({ is_active: false })
      const result = engine.calculatePrice(10, [rule])
      expect(result.ruleApplied).toBe('none')
    })

    it('applies rules in priority order', () => {
      const lowPriority = makeRule({
        name: 'Low',
        priority: 10,
        target_margin: 50,
        rounding_strategy: 'none',
        margin_protection: 0,
      })
      const highPriority = makeRule({
        name: 'High',
        priority: 1,
        target_margin: 20,
        rounding_strategy: 'none',
        margin_protection: 0,
      })
      // Both are margin rules — the last applied wins since both run sequentially
      const result = engine.calculatePrice(10, [lowPriority, highPriority])
      // High priority (1) runs first after sort, Low (10) runs last → Low wins
      expect(result.ruleApplied).toBe('Low')
    })

    it('computes margin correctly', () => {
      const rule = makeRule({
        target_margin: 30,
        rounding_strategy: 'none',
        margin_protection: 0,
      })
      const result = engine.calculatePrice(10, [rule])
      // margin = (price - cost) / price * 100
      expect(result.margin).toBeCloseTo(30, 0)
    })
  })

  describe('singleton', () => {
    it('returns same instance', () => {
      const a = PricingRulesEngine.getInstance()
      const b = PricingRulesEngine.getInstance()
      expect(a).toBe(b)
    })
  })
})
