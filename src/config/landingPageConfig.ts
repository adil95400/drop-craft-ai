/**
 * Landing Page Configuration
 * All dynamic data for Index.tsx — single source of truth
 */

// ─── PRICING ─────────────────────────────────────────────────────────────────
export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  contactSales?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    name: "Standard",
    monthlyPrice: 29,
    annualPrice: 23,
    desc: "For new merchants getting started",
    features: [
      "1,000 products",
      "3 integrations",
      "AI optimization",
      "Email support",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 39,
    desc: "For growing stores ready to scale",
    features: [
      "10,000 products",
      "Unlimited integrations",
      "Advanced AI + Predictive Analytics",
      "Priority support 24/7",
      "Marketing automation",
      "Competitor tracking",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Ultra Pro",
    monthlyPrice: 99,
    annualPrice: 79,
    desc: "For power sellers & agencies",
    features: [
      "Unlimited products",
      "Multi-tenant dashboard",
      "Dedicated REST API",
      "Account manager",
      "Custom integrations",
      "White-label options",
    ],
    cta: "Contact Sales",
    popular: false,
    contactSales: true,
  },
];

// ─── SOCIAL PROOF METRICS ────────────────────────────────────────────────────
export const SOCIAL_PROOF = {
  merchantCount: "2,000+",
  timeSaved: "20h+",
  supplierCount: "99+",
  rating: "4.8/5",
  reviewCount: 247,
};

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
  metric: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "ShopOpti+ saved me 20 hours a week. My revenue went up 40% in just 2 months — I wish I'd started sooner.",
    author: "Marie D.",
    role: "Shopify merchant, €50K/mo",
    avatar: "M",
    metric: "+40% revenue",
  },
  {
    quote: "The AI pricing alone paid for itself in the first week. It automatically adjusts my margins based on demand. Game changer.",
    author: "Thomas M.",
    role: "Dropshipping pro, 3 stores",
    avatar: "T",
    metric: "3x ROI in 7 days",
  },
  {
    quote: "We manage 30+ client stores through ShopOpti+. The multi-tenant setup and API are enterprise-grade. Best tool in our stack.",
    author: "Sophie L.",
    role: "CEO, E-commerce Agency",
    avatar: "S",
    metric: "30+ stores managed",
  },
];

// ─── INTEGRATIONS ────────────────────────────────────────────────────────────
export interface IntegrationCategory {
  label: string;
  platforms: string[];
}

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    label: "Marketplaces",
    platforms: ["Shopify", "WooCommerce", "Amazon", "eBay", "Etsy", "TikTok Shop", "Cdiscount", "Fnac"],
  },
  {
    label: "Suppliers",
    platforms: ["AliExpress", "CJ Dropshipping", "BigBuy", "Spocket", "Printify", "1688", "Temu"],
  },
  {
    label: "Marketing",
    platforms: ["Google Shopping", "Meta Ads", "TikTok Ads", "Klaviyo", "Mailchimp"],
  },
  {
    label: "Logistics",
    platforms: ["DHL", "FedEx", "UPS", "La Poste", "Colissimo", "17Track"],
  },
];

export const ALL_PLATFORMS = INTEGRATION_CATEGORIES.flatMap(c => c.platforms);
export const TOTAL_INTEGRATIONS = 99;

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export const FAQ_DATA = [
  {
    q: "What is ShopOpti+ and how does it work?",
    a: "ShopOpti+ is an AI-powered Shopify automation platform that helps merchants find winning products, automate pricing, inventory management, and order fulfillment. Connect your store in 2 minutes and let AI handle the heavy lifting while you focus on growth.",
  },
  {
    q: "How much time can I save with ShopOpti+?",
    a: "Our merchants save an average of 20+ hours per week by automating repetitive tasks like price updates, inventory syncing, order processing, and SEO optimization. That's over 80 hours per month you can reinvest in growing your business.",
  },
  {
    q: "Does ShopOpti+ work with my existing Shopify store?",
    a: "Yes! ShopOpti+ integrates seamlessly with any Shopify store, plus WooCommerce, PrestaShop, and 24+ other platforms. It connects with 99+ suppliers including AliExpress, Amazon, CJ Dropshipping, Spocket, and BigBuy.",
  },
  {
    q: "Is there a free trial? Do I need a credit card?",
    a: "Yes, we offer a full-featured 14-day free trial with no credit card required. You get access to all Pro features during your trial so you can experience the full power of ShopOpti+ before committing.",
  },
  {
    q: "How does the AI product research work?",
    a: "Our AI analyzes market trends, competitor pricing, supplier reliability, and profit margins across 99+ suppliers to score and rank products. It identifies trending items with high demand and healthy margins, giving you a competitive edge in product selection.",
  },
  {
    q: "Can I manage multiple stores with ShopOpti+?",
    a: "Absolutely. Our Pro plan supports unlimited stores, and our Ultra Pro plan includes multi-tenant capabilities perfect for agencies managing 30+ client stores. All stores sync in real-time through a single dashboard.",
  },
  {
    q: "What kind of support do you offer?",
    a: "We offer email support on Basic, priority 24/7 support on Pro, and a dedicated account manager on Ultra Pro. All plans include access to our documentation, academy, and help center.",
  },
  {
    q: "Is my data secure with ShopOpti+?",
    a: "Yes. We use enterprise-grade encryption (AES-256), GDPR-compliant data handling, and SOC 2-aligned security practices. Your store data and API keys are always encrypted at rest and in transit.",
  },
];
