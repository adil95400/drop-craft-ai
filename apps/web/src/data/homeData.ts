import { ShoppingCart, Package, BarChart3, Zap, Users, TrendingUp, Clock, Shield } from 'lucide-react';

export interface Feature {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export interface Tool {
  name: string;
  description: string;
  popular?: boolean;
}

export interface Testimonial {
  name: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const features: Feature[] = [
  {
    icon: ShoppingCart,
    title: 'E-commerce Management',
    description: 'Manage your online store with powerful tools and integrations.'
  },
  {
    icon: Package,
    title: 'Product Import',
    description: 'Import products from multiple suppliers and marketplaces.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Get detailed analytics and insights about your business.'
  },
  {
    icon: Zap,
    title: 'Automation',
    description: 'Automate your workflows and save time on repetitive tasks.'
  }
];

export const stats: Stat[] = [
  {
    value: '10k+',
    label: 'Active Merchants',
    icon: Users
  },
  {
    value: '€2M+',
    label: 'Revenue Generated',
    icon: TrendingUp
  },
  {
    value: '24/7',
    label: 'Support Available',
    icon: Clock
  },
  {
    value: '99.9%',
    label: 'Uptime Guarantee',
    icon: Shield
  }
];

export const tools: Tool[] = [
  {
    name: 'Shopify Integration',
    description: 'Connect your Shopify store seamlessly',
    popular: true
  },
  {
    name: 'BigBuy Dropshipping',
    description: 'Access thousands of products from BigBuy'
  },
  {
    name: 'Price Monitoring',
    description: 'Track competitor prices automatically'
  },
  {
    name: 'Inventory Sync',
    description: 'Keep stock levels synchronized'
  }
];

export const testimonials: Testimonial[] = [
  {
    name: 'Marie Dubois',
    company: 'Fashion Store Paris',
    content: 'ShopOpti a transformé notre façon de gérer notre boutique en ligne. Les outils d\'automatisation nous font gagner 10h par semaine !',
    rating: 5,
    avatar: '/images/avatar-1.jpg'
  },
  {
    name: 'Jean Martin',
    company: 'Tech Gadgets Pro',
    content: 'L\'intégration avec nos fournisseurs est parfaite. Nous avons doublé notre catalogue en quelques clics.',
    rating: 5,
    avatar: '/images/avatar-2.jpg'
  },
  {
    name: 'Sophie Chen',
    company: 'Home & Garden',
    content: 'Les analytics détaillés nous permettent de prendre de meilleures décisions commerciales. ROI impressionnant !',
    rating: 5,
    avatar: '/images/avatar-3.jpg'
  }
];

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '29',
    period: '/mois',
    description: 'Parfait pour commencer votre activité e-commerce',
    features: [
      'Jusqu\'à 100 produits',
      'Intégration Shopify',
      'Support email',
      'Analytics de base'
    ],
    cta: 'Commencer maintenant'
  },
  {
    name: 'Professional',
    price: '79',
    period: '/mois',
    description: 'Pour les entreprises en croissance',
    features: [
      'Jusqu\'à 1000 produits',
      'Toutes les intégrations',
      'Support prioritaire',
      'Analytics avancés',
      'Automatisation',
      'Multi-boutiques'
    ],
    popular: true,
    cta: 'Essai gratuit 14 jours'
  },
  {
    name: 'Enterprise',
    price: 'Sur mesure',
    period: '',
    description: 'Solution personnalisée pour les grandes entreprises',
    features: [
      'Produits illimités',
      'Intégrations custom',
      'Support dédié',
      'SLA garantie',
      'Formation équipe',
      'API complète'
    ],
    cta: 'Nous contacter'
  }
];

export const faqs: FAQ[] = [
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'Vous bénéficiez de 14 jours d\'essai gratuit sans engagement. Aucune carte bancaire n\'est requise pour commencer. Vous avez accès à toutes les fonctionnalités du plan Professional.'
  },
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et la facturation est ajustée au prorata.'
  },
  {
    question: 'Quelles plateformes e-commerce sont supportées ?',
    answer: 'Nous supportons Shopify, WooCommerce, Magento, PrestaShop et de nombreuses autres plateformes. Notre équipe peut également développer des intégrations personnalisées.'
  },
  {
    question: 'Vos données sont-elles sécurisées ?',
    answer: 'Absolument. Nous utilisons un chiffrement de niveau bancaire (SSL 256-bit) et respectons le RGPD. Vos données sont hébergées en Europe sur des serveurs certifiés ISO 27001.'
  },
  {
    question: 'Proposez-vous une formation ?',
    answer: 'Oui, nous offrons une formation complète via des webinaires, tutoriels vidéo et documentation. Les clients Enterprise bénéficient d\'une formation personnalisée sur site.'
  },
  {
    question: 'Comment fonctionne le support client ?',
    answer: 'Notre support est disponible par email, chat et téléphone. Les clients Professional et Enterprise bénéficient d\'un support prioritaire avec des temps de réponse garantis.'
  }
];