/**
 * Command Center V3 - Shared Calculation Utilities
 * Centralized financial and business logic calculations
 */

// === MARGIN CALCULATIONS ===

export function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}

export function calculateProfit(price?: number, costPrice?: number, quantity?: number): number {
  if (!price || !costPrice || !quantity) return 0
  return (price - costPrice) * quantity
}

export function calculateStockValue(price?: number, quantity?: number): number {
  return (price ?? 0) * (quantity ?? 0)
}

// === CURRENCY FORMATTING ===

export function formatCurrency(value: number, currency = '€'): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M${currency}`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K${currency}`
  return `${value.toFixed(0)}${currency}`
}

export function formatPercentage(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

// === TREND HELPERS ===

export type TrendDirection = 'up' | 'down' | 'stable'

export function getTrendDirection(current: number, previous: number, threshold = 0.5): TrendDirection {
  const change = ((current - previous) / Math.max(previous, 1)) * 100
  if (change > threshold) return 'up'
  if (change < -threshold) return 'down'
  return 'stable'
}

// === PRODUCT KPI AGGREGATIONS ===

export interface ProductKPIInput {
  id: string
  price?: number
  cost_price?: number
  profit_margin?: number
  stock_quantity?: number
}

export interface AggregatedKPIs {
  avgMargin: number
  stockValue: number
  potentialProfit: number
  profitableProducts: number
  totalProducts: number
  totalCost: number
  totalRevenue: number
}

export function aggregateProductKPIs(
  products: ProductKPIInput[],
  profitableThreshold = 20
): AggregatedKPIs {
  let totalMargin = 0
  let stockValue = 0
  let potentialProfit = 0
  let profitableProducts = 0
  let totalCost = 0
  let totalRevenue = 0

  for (const product of products) {
    const price = product.price ?? 0
    const cost = product.cost_price ?? 0
    const stock = product.stock_quantity ?? 0
    const margin = product.profit_margin ?? calculateMargin(price, cost)

    totalMargin += margin
    stockValue += price * stock
    potentialProfit += (price * margin / 100) * stock
    totalCost += cost * stock
    totalRevenue += price * stock

    if (margin >= profitableThreshold) {
      profitableProducts++
    }
  }

  return {
    avgMargin: totalMargin / Math.max(products.length, 1),
    stockValue,
    potentialProfit,
    profitableProducts,
    totalProducts: products.length,
    totalCost,
    totalRevenue
  }
}

// === TIME UTILITIES ===

export function getHoursSinceUpdate(updatedAt?: string): number {
  if (!updatedAt) return Infinity
  const now = Date.now()
  const lastUpdate = new Date(updatedAt).getTime()
  return (now - lastUpdate) / (1000 * 60 * 60)
}

export function isStale(updatedAt?: string, thresholdHours = 24): boolean {
  return getHoursSinceUpdate(updatedAt) > thresholdHours
}
