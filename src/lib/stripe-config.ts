/**
 * Configuration Stripe centralisée
 */

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  plans: {
    standard: {
      name: 'Standard',
      priceId: import.meta.env.VITE_STRIPE_PRICE_STANDARD || '',
      price: 0,
      features: ['Fonctionnalités de base', 'Support email']
    },
    pro: {
      name: 'Pro',
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
      price: 29,
      features: ['Toutes les fonctionnalités Standard', 'Analytics avancées', 'Support prioritaire']
    },
    ultra_pro: {
      name: 'Ultra Pro',
      priceId: import.meta.env.VITE_STRIPE_PRICE_ULTRA || '',
      price: 99,
      features: ['Toutes les fonctionnalités Pro', 'IA illimitée', 'Support dédié']
    }
  }
} as const;

export type StripePlanType = keyof typeof STRIPE_CONFIG.plans;
