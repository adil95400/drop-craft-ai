/**
 * Configuration Stripe centralisée
 * Prix réels configurés dans Stripe Dashboard (29€/49€/99€)
 */

export type StripePlanType = 'standard' | 'pro' | 'ultra_pro';

export interface StripePlanLimits {
  products: number;
  integrations: number;
  imports_per_month: number;
  auto_orders_per_day: number;
  ai_credits_per_month: number;
}

export interface StripePlan {
  name: string;
  priceId: string;
  productId: string;
  price: number;
  currency: string;
  interval: string;
  popular?: boolean;
  features: string[];
  limits: StripePlanLimits;
}

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  plans: {
    standard: {
      name: 'Standard',
      priceId: 'price_1SwUB8FdyZLEbAYasNL2RWyn',
      productId: 'prod_TuImodwMnB71NS',
      price: 29,
      currency: 'EUR',
      interval: 'month',
      features: [
        '1 000 produits max',
        '3 intégrations',
        '100 imports/mois',
        '10 commandes auto/jour',
        'Support email'
      ],
      limits: {
        products: 1000,
        integrations: 3,
        imports_per_month: 100,
        auto_orders_per_day: 10,
        ai_credits_per_month: 50
      }
    } as StripePlan,
    pro: {
      name: 'Pro',
      priceId: 'price_1SwUBEFdyZLEbAYaBInbPnb7',
      productId: 'prod_TuImFSanPs0svj',
      price: 49,
      currency: 'EUR',
      interval: 'month',
      popular: true,
      features: [
        '10 000 produits max',
        'Intégrations illimitées',
        '1 000 imports/mois',
        '100 commandes auto/jour',
        'Analytics avancés',
        'IA avancée',
        'Support prioritaire'
      ],
      limits: {
        products: 10000,
        integrations: -1, // unlimited
        imports_per_month: 1000,
        auto_orders_per_day: 100,
        ai_credits_per_month: 500
      }
    } as StripePlan,
    ultra_pro: {
      name: 'Ultra Pro',
      priceId: 'price_1S7KaNFdyZLEbAYaovKWFgc4',
      productId: 'prod_T3RTMipVwUA7Ud',
      price: 99,
      currency: 'EUR',
      interval: 'month',
      features: [
        'Produits illimités',
        'Tout illimité',
        'White-label',
        'IA premium illimitée',
        'API complète',
        'Support dédié 24/7',
        'Onboarding personnalisé'
      ],
      limits: {
        products: -1, // unlimited
        integrations: -1,
        imports_per_month: -1,
        auto_orders_per_day: -1,
        ai_credits_per_month: -1
      }
    } as StripePlan
  } as Record<StripePlanType, StripePlan>,
  // Product to plan mapping for subscription checks
  productToPlan: {
    'prod_TuImodwMnB71NS': 'standard',
    'prod_TuImFSanPs0svj': 'pro',
    'prod_T3RTMipVwUA7Ud': 'ultra_pro'
  } as Record<string, StripePlanType>
};

// Helper to get plan from product ID
export function getPlanFromProductId(productId: string): StripePlanType {
  return STRIPE_CONFIG.productToPlan[productId] || 'standard';
}

// Helper to get plan limits
export function getPlanLimits(planType: StripePlanType): StripePlanLimits {
  return STRIPE_CONFIG.plans[planType].limits;
}

// Check if limit is unlimited (-1)
export function isUnlimited(value: number): boolean {
  return value === -1;
}
