/**
 * Page d'Intégrations style Channable - 100% Fonctionnelle et Complète
 * Design moderne avec hero section, filtres par catégories, grille d'intégrations
 * Section intégrations connectées avec actions rapides
 * Connectée au backend avec vrais connecteurs
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Globe,
  TrendingUp,
  ShoppingBag,
  Megaphone,
  BarChart3,
  Link2,
  Database,
  Zap,
  Settings,
  RefreshCw,
  TestTube,
  Trash2,
  AlertCircle,
  PlugZap,
  Clock,
  Plus,
  ExternalLink,
  Shield,
  Activity,
  CreditCard,
  Mail,
  Server,
  Webhook,
  FileSpreadsheet,
  Truck,
  MoreVertical,
  Play,
  Eye,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntegrationsUnified, UnifiedIntegration, IntegrationTemplate } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'
import { PlatformLogo } from '@/components/ui/platform-logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Types
interface IntegrationDefinition {
  id: string
  name: string
  logo: string
  category: 'marketplaces' | 'search_ppc' | 'social' | 'comparison' | 'affiliates' | 'data_import' | 'ecommerce' | 'payment' | 'marketing' | 'shipping' | 'other'
  popular?: boolean
  description?: string
  features?: string[]
  setupFields?: {
    name: string
    label: string
    type: 'text' | 'password' | 'url'
    placeholder?: string
    required?: boolean
  }[]
}

// Catégories d'intégrations style Channable
const categories = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
  { id: 'marketplaces', label: 'Marketplaces', icon: ShoppingBag },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
  { id: 'marketing', label: 'Marketing', icon: Mail },
  { id: 'search_ppc', label: 'Search/PPC', icon: TrendingUp },
  { id: 'social', label: 'Réseaux sociaux', icon: Megaphone },
  { id: 'shipping', label: 'Livraison', icon: Truck },
  { id: 'comparison', label: 'Comparateurs', icon: BarChart3 },
  { id: 'affiliates', label: 'Affiliés', icon: Link2 },
  { id: 'data_import', label: 'Import données', icon: Database },
  { id: 'other', label: 'Autres', icon: Zap },
]

// Liste complète des intégrations disponibles avec setup fields
const integrationDefinitions: IntegrationDefinition[] = [
  // E-commerce
  { 
    id: 'shopify', 
    name: 'Shopify', 
    logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7571.svg', 
    category: 'ecommerce', 
    popular: true,
    description: 'Synchronisez vos produits, commandes et stocks depuis votre boutique Shopify',
    features: ['Sync produits', 'Sync commandes', 'Sync stocks', 'Webhooks'],
    setupFields: [
      { name: 'shop_domain', label: 'Domaine de la boutique', type: 'text', placeholder: 'ma-boutique.myshopify.com', required: true },
      { name: 'access_token', label: "Token d'accès", type: 'password', placeholder: 'shpat_xxxxxxxxxxxxx', required: true }
    ]
  },
  { 
    id: 'woocommerce', 
    name: 'WooCommerce', 
    logo: 'https://woocommerce.com/wp-content/themes/flavor/flavor/images/woocommerce-icon.svg', 
    category: 'ecommerce', 
    popular: true,
    description: 'Connectez votre boutique WooCommerce/WordPress',
    features: ['Sync produits', 'Sync commandes', 'API REST'],
    setupFields: [
      { name: 'store_url', label: 'URL de la boutique', type: 'url', placeholder: 'https://monshop.com', required: true },
      { name: 'consumer_key', label: 'Consumer Key', type: 'password', required: true },
      { name: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true }
    ]
  },
  { 
    id: 'prestashop', 
    name: 'PrestaShop', 
    logo: 'https://www.prestashop.com/favicon.ico', 
    category: 'ecommerce',
    description: 'Intégrez votre boutique PrestaShop',
    features: ['Sync catalogue', 'Sync commandes'],
    setupFields: [
      { name: 'store_url', label: 'URL de la boutique', type: 'url', placeholder: 'https://monshop.com', required: true },
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },
  { 
    id: 'magento', 
    name: 'Magento', 
    logo: 'https://magento.com/favicon.ico', 
    category: 'ecommerce',
    description: 'Connectez votre boutique Magento 2',
    setupFields: [
      { name: 'store_url', label: 'URL Magento', type: 'url', required: true },
      { name: 'access_token', label: 'Access Token', type: 'password', required: true }
    ]
  },
  { 
    id: 'bigcommerce', 
    name: 'BigCommerce', 
    logo: 'https://www.bigcommerce.com/favicon.ico', 
    category: 'ecommerce',
    description: 'Intégration BigCommerce complète',
    setupFields: [
      { name: 'store_hash', label: 'Store Hash', type: 'text', required: true },
      { name: 'access_token', label: 'Access Token', type: 'password', required: true }
    ]
  },
  
  // Payment
  { 
    id: 'stripe', 
    name: 'Stripe', 
    logo: 'https://stripe.com/img/v3/home/twitter.png', 
    category: 'payment', 
    popular: true,
    description: 'Gérez vos paiements, abonnements et factures',
    features: ['Paiements', 'Abonnements', 'Factures', 'Webhooks'],
    setupFields: [
      { name: 'publishable_key', label: 'Clé publique', type: 'text', required: true },
      { name: 'secret_key', label: 'Clé secrète', type: 'password', required: true }
    ]
  },
  { 
    id: 'paypal', 
    name: 'PayPal', 
    logo: 'https://www.paypal.com/favicon.ico', 
    category: 'payment', 
    popular: true,
    description: 'Acceptez les paiements PayPal',
    features: ['Paiements', 'Remboursements'],
    setupFields: [
      { name: 'client_id', label: 'Client ID', type: 'text', required: true },
      { name: 'client_secret', label: 'Client Secret', type: 'password', required: true }
    ]
  },
  { 
    id: 'mollie', 
    name: 'Mollie', 
    logo: 'https://www.mollie.com/favicon.ico', 
    category: 'payment',
    description: 'Paiements européens simplifiés',
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },

  // Marketing
  { 
    id: 'mailchimp', 
    name: 'Mailchimp', 
    logo: 'https://mailchimp.com/favicon.ico', 
    category: 'marketing', 
    popular: true,
    description: 'Email marketing et automation',
    features: ['Listes', 'Campagnes', 'Automatisations'],
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true },
      { name: 'server_prefix', label: 'Préfixe serveur', type: 'text', placeholder: 'us1', required: true }
    ]
  },
  { 
    id: 'klaviyo', 
    name: 'Klaviyo', 
    logo: 'https://www.klaviyo.com/favicon.ico', 
    category: 'marketing', 
    popular: true,
    description: 'Marketing automation e-commerce',
    features: ['Email', 'SMS', 'Segments', 'Flows'],
    setupFields: [
      { name: 'public_api_key', label: 'Clé publique', type: 'text', required: true },
      { name: 'private_api_key', label: 'Clé privée', type: 'password', required: true }
    ]
  },
  { 
    id: 'sendgrid', 
    name: 'SendGrid', 
    logo: 'https://sendgrid.com/favicon.ico', 
    category: 'marketing',
    description: 'Emails transactionnels et marketing',
    features: ['Emails', 'Templates', 'Statistiques'],
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },
  { 
    id: 'brevo', 
    name: 'Brevo (Sendinblue)', 
    logo: 'https://www.brevo.com/favicon.ico', 
    category: 'marketing',
    description: 'Marketing automation tout-en-un',
    features: ['Email', 'SMS', 'Chat', 'CRM'],
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },
  
  // Marketplaces populaires
  { 
    id: 'amazon', 
    name: 'Amazon', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 
    category: 'marketplaces', 
    popular: true,
    description: 'Vendez sur Amazon avec synchronisation automatique',
    features: ['Listing produits', 'Gestion commandes', 'Fulfillment FBA'],
    setupFields: [
      { name: 'seller_id', label: 'Seller ID', type: 'text', required: true },
      { name: 'mws_auth_token', label: 'MWS Auth Token', type: 'password', required: true },
      { name: 'marketplace_id', label: 'Marketplace ID', type: 'text', placeholder: 'A13V1IB3VIYZZH (France)' }
    ]
  },
  { 
    id: 'ebay', 
    name: 'eBay', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg', 
    category: 'marketplaces', 
    popular: true,
    description: 'Gérez vos ventes eBay',
    setupFields: [
      { name: 'client_id', label: 'Client ID', type: 'text', required: true },
      { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { name: 'refresh_token', label: 'Refresh Token', type: 'password', required: true }
    ]
  },
  { 
    id: 'cdiscount', 
    name: 'Cdiscount', 
    logo: 'https://www.cdiscount.com/favicon.ico', 
    category: 'marketplaces', 
    popular: true,
    description: 'Marketplace française leader',
    setupFields: [
      { name: 'seller_id', label: 'Seller ID', type: 'text', required: true },
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },
  { id: 'fnac', name: 'Fnac', logo: 'https://www.fnac.com/favicon.ico', category: 'marketplaces', description: 'Fnac Marketplace', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { id: 'rakuten', name: 'Rakuten', logo: 'https://www.rakuten.fr/favicon.ico', category: 'marketplaces', description: 'Anciennement PriceMinister', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { 
    id: 'aliexpress', 
    name: 'AliExpress', 
    logo: 'https://ae01.alicdn.com/kf/S704f9f6bbe564b66a65dde13e15e10b5t.png', 
    category: 'marketplaces',
    description: 'Dropshipping depuis AliExpress',
    features: ['Import produits', 'Sync commandes', 'Suivi'],
    setupFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true },
      { name: 'app_secret', label: 'App Secret', type: 'password', required: true }
    ]
  },
  { id: 'etsy', name: 'Etsy', logo: 'https://www.etsy.com/favicon.ico', category: 'marketplaces', description: 'Marketplace créative', setupFields: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }] },
  { id: 'zalando', name: 'Zalando', logo: 'https://www.zalando.fr/favicon.ico', category: 'marketplaces', description: 'Mode et lifestyle', setupFields: [{ name: 'client_id', label: 'Client ID', type: 'text', required: true }] },
  { id: 'manomano', name: 'ManoMano', logo: 'https://www.manomano.fr/favicon.ico', category: 'marketplaces', description: 'Bricolage et jardinage', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { id: 'backmarket', name: 'Back Market', logo: 'https://www.backmarket.fr/favicon.ico', category: 'marketplaces', description: 'Produits reconditionnés', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },

  // Shipping
  { 
    id: 'colissimo', 
    name: 'Colissimo', 
    logo: 'https://www.laposte.fr/favicon.ico', 
    category: 'shipping', 
    popular: true,
    description: 'Expéditions La Poste',
    features: ['Étiquettes', 'Suivi', 'Points relais'],
    setupFields: [
      { name: 'contract_number', label: 'Numéro contrat', type: 'text', required: true },
      { name: 'password', label: 'Mot de passe', type: 'password', required: true }
    ]
  },
  { 
    id: 'chronopost', 
    name: 'Chronopost', 
    logo: 'https://www.chronopost.fr/favicon.ico', 
    category: 'shipping',
    description: 'Livraison express',
    setupFields: [
      { name: 'account_number', label: 'Numéro compte', type: 'text', required: true },
      { name: 'password', label: 'Mot de passe', type: 'password', required: true }
    ]
  },
  { 
    id: 'mondialrelay', 
    name: 'Mondial Relay', 
    logo: 'https://www.mondialrelay.fr/favicon.ico', 
    category: 'shipping',
    description: 'Points relais en Europe',
    setupFields: [
      { name: 'enseigne', label: 'Enseigne', type: 'text', required: true },
      { name: 'private_key', label: 'Clé privée', type: 'password', required: true }
    ]
  },
  { 
    id: 'dhl', 
    name: 'DHL', 
    logo: 'https://www.dhl.com/favicon.ico', 
    category: 'shipping',
    description: 'Livraison internationale',
    setupFields: [
      { name: 'account_number', label: 'Numéro compte', type: 'text', required: true },
      { name: 'api_key', label: 'Clé API', type: 'password', required: true }
    ]
  },
  { 
    id: 'ups', 
    name: 'UPS', 
    logo: 'https://www.ups.com/favicon.ico', 
    category: 'shipping',
    description: 'Transport mondial',
    setupFields: [
      { name: 'account_number', label: 'Numéro compte', type: 'text', required: true },
      { name: 'access_key', label: 'Access Key', type: 'password', required: true }
    ]
  },
  
  // Search/PPC
  { 
    id: 'google_ads', 
    name: 'Google Ads', 
    logo: 'https://www.gstatic.com/images/branding/product/2x/google_ads_512dp.png', 
    category: 'search_ppc', 
    popular: true,
    description: 'Gérez vos campagnes Google Ads',
    features: ['Campagnes', 'Enchères', 'Conversions'],
    setupFields: [
      { name: 'customer_id', label: 'Customer ID', type: 'text', required: true },
      { name: 'developer_token', label: 'Developer Token', type: 'password', required: true }
    ]
  },
  { 
    id: 'google_shopping', 
    name: 'Google Shopping', 
    logo: 'https://www.gstatic.com/shopping/shopping_product_v1_512.png', 
    category: 'search_ppc', 
    popular: true,
    description: 'Publiez vos produits sur Google Shopping',
    features: ['Catalogue', 'Promotions', 'Performance'],
    setupFields: [
      { name: 'merchant_id', label: 'Merchant Center ID', type: 'text', required: true },
      { name: 'service_account', label: 'Service Account JSON', type: 'password', required: true }
    ]
  },
  { id: 'microsoft_ads', name: 'Microsoft Ads', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', category: 'search_ppc', description: 'Publicité Bing', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { id: 'amazon_ads', name: 'Amazon Ads', logo: 'https://advertising.amazon.com/favicon.ico', category: 'search_ppc', description: 'Publicité Amazon', setupFields: [{ name: 'access_token', label: 'Access Token', type: 'password', required: true }] },
  { id: 'criteo', name: 'Criteo', logo: 'https://www.criteo.com/favicon.ico', category: 'search_ppc', description: 'Retargeting dynamique', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  
  // Social
  { 
    id: 'meta_catalog', 
    name: 'Meta Catalog', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', 
    category: 'social', 
    popular: true,
    description: 'Facebook & Instagram Shopping',
    features: ['Catalogue produits', 'Pixel tracking', 'Dynamic ads'],
    setupFields: [
      { name: 'business_id', label: 'Business ID', type: 'text', required: true },
      { name: 'access_token', label: 'Access Token', type: 'password', required: true },
      { name: 'catalog_id', label: 'Catalog ID', type: 'text' }
    ]
  },
  { 
    id: 'tiktok', 
    name: 'TikTok Shop', 
    logo: 'https://www.tiktok.com/favicon.ico', 
    category: 'social', 
    popular: true,
    description: 'Vendez sur TikTok Shop',
    features: ['Catalogue', 'Commandes', 'Analytics'],
    setupFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true },
      { name: 'app_secret', label: 'App Secret', type: 'password', required: true }
    ]
  },
  { id: 'pinterest', name: 'Pinterest', logo: 'https://www.pinterest.com/favicon.ico', category: 'social', description: 'Épingles shopping', setupFields: [{ name: 'access_token', label: 'Access Token', type: 'password', required: true }] },
  { id: 'snapchat', name: 'Snapchat', logo: 'https://www.snapchat.com/favicon.ico', category: 'social', description: 'Publicité Snapchat', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  
  // Comparateurs
  { 
    id: 'google_merchant', 
    name: 'Google Merchant', 
    logo: 'https://www.gstatic.com/shopping/shopping_product_v1_512.png', 
    category: 'comparison', 
    popular: true,
    description: 'Centre marchand Google',
    setupFields: [
      { name: 'merchant_id', label: 'Merchant Center ID', type: 'text', required: true }
    ]
  },
  { id: 'idealo', name: 'Idealo', logo: 'https://www.idealo.fr/favicon.ico', category: 'comparison', description: 'Comparateur européen', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { id: 'kelkoo', name: 'Kelkoo', logo: 'https://www.kelkoo.fr/favicon.ico', category: 'comparison', description: 'Comparateur de prix', setupFields: [{ name: 'merchant_id', label: 'Merchant ID', type: 'text', required: true }] },
  { id: 'leguide', name: 'LeGuide', logo: 'https://www.leguide.com/favicon.ico', category: 'comparison', description: 'Comparateur shopping', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  
  // Affiliés
  { id: 'awin', name: 'Awin', logo: 'https://www.awin.com/favicon.ico', category: 'affiliates', description: 'Réseau affiliation', setupFields: [{ name: 'api_token', label: 'API Token', type: 'password', required: true }] },
  { id: 'tradedoubler', name: 'Tradedoubler', logo: 'https://www.tradedoubler.com/favicon.ico', category: 'affiliates', description: 'Marketing affilié', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  { id: 'rakuten_advertising', name: 'Rakuten Advertising', logo: 'https://www.rakutenadvertising.com/favicon.ico', category: 'affiliates', description: 'Affiliation Rakuten', setupFields: [{ name: 'api_key', label: 'Clé API', type: 'password', required: true }] },
  
  // Import données
  { 
    id: 'csv_import', 
    name: 'Import CSV', 
    logo: '', 
    category: 'data_import',
    description: 'Importez vos données via fichiers CSV',
    features: ['Import produits', 'Import clients', 'Import commandes'],
    setupFields: []
  },
  { 
    id: 'google_sheets', 
    name: 'Google Sheets', 
    logo: 'https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png', 
    category: 'data_import',
    description: 'Synchronisation avec Google Sheets',
    features: ['Import', 'Export', 'Temps réel'],
    setupFields: [
      { name: 'sheet_id', label: 'ID du spreadsheet', type: 'text', required: true },
      { name: 'service_account', label: 'Service Account JSON', type: 'password', required: true }
    ]
  },
  { 
    id: 'api_custom', 
    name: 'API Personnalisée', 
    logo: '', 
    category: 'data_import',
    description: 'Connectez votre propre API',
    features: ['REST API', 'Webhooks'],
    setupFields: [
      { name: 'api_url', label: 'URL API', type: 'url', required: true },
      { name: 'api_key', label: 'Clé API', type: 'password' }
    ]
  },
  { 
    id: 'webhook', 
    name: 'Webhooks', 
    logo: '', 
    category: 'other',
    description: 'Recevez des données en temps réel via webhooks',
    features: ['Entrées', 'Sorties', 'Logs'],
    setupFields: []
  },
  { 
    id: 'zapier', 
    name: 'Zapier', 
    logo: 'https://zapier.com/favicon.ico', 
    category: 'other',
    description: 'Automatisez avec 5000+ apps',
    features: ['Zaps', 'Webhooks', 'Actions'],
    setupFields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true }
    ]
  },
  { 
    id: 'make', 
    name: 'Make (Integromat)', 
    logo: 'https://www.make.com/favicon.ico', 
    category: 'other',
    description: 'Scénarios d\'automatisation',
    setupFields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true }
    ]
  },
]

// Composant Hexagones animés pour le hero
function HeroHexagons() {
  const hexColors = [
    'from-pink-500 to-rose-500',
    'from-orange-400 to-amber-500',
    'from-yellow-400 to-yellow-500',
    'from-emerald-400 to-green-500',
    'from-cyan-400 to-blue-500',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-fuchsia-500 to-pink-500',
  ]

  return (
    <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none hidden lg:block">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" fill="none">
        <motion.path
          d="M100 200 L200 150 L300 180 L400 120"
          stroke="url(#lineGradient1)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.path
          d="M150 280 L250 250 L350 300 L420 250"
          stroke="url(#lineGradient2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
        />
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {[
        { x: 350, y: 80, size: 60, delay: 0, color: hexColors[6] },
        { x: 420, y: 140, size: 50, delay: 0.1, color: hexColors[0] },
        { x: 380, y: 200, size: 55, delay: 0.2, color: hexColors[1] },
        { x: 450, y: 220, size: 45, delay: 0.3, color: hexColors[5] },
        { x: 300, y: 160, size: 40, delay: 0.4, color: hexColors[2] },
        { x: 480, y: 300, size: 50, delay: 0.5, color: hexColors[4] },
        { x: 400, y: 320, size: 55, delay: 0.6, color: hexColors[3] },
        { x: 320, y: 280, size: 35, delay: 0.7, color: hexColors[7] },
      ].map((hex, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-xl bg-gradient-to-br shadow-lg", hex.color)}
          style={{
            left: hex.x - hex.size / 2,
            top: hex.y - hex.size / 2,
            width: hex.size,
            height: hex.size,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: hex.delay }}
        />
      ))}
    </div>
  )
}

// Composant Modal de configuration
function IntegrationSetupModal({ 
  definition, 
  existingIntegration,
  onClose 
}: { 
  definition: IntegrationDefinition
  existingIntegration?: UnifiedIntegration
  onClose: () => void 
}) {
  const { add, update, delete: deleteIntegration, testConnection, sync, isAdding, isTesting, isSyncing } = useIntegrationsUnified()
  const { toast } = useToast()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [syncFrequency, setSyncFrequency] = useState(existingIntegration?.sync_frequency || 'daily')
  const [isActive, setIsActive] = useState(existingIntegration?.is_active ?? true)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null)

  const isEditing = !!existingIntegration

  const handleSubmit = useCallback(async () => {
    try {
      const credentials: Record<string, string> = {}
      const config: Record<string, any> = {}

      definition.setupFields?.forEach(field => {
        if (formData[field.name]) {
          if (field.type === 'password') {
            credentials[field.name] = formData[field.name]
          } else {
            config[field.name] = formData[field.name]
          }
        }
      })

      if (isEditing && existingIntegration) {
        await update({ 
          id: existingIntegration.id, 
          updates: {
            sync_frequency: syncFrequency,
            is_active: isActive,
            config: { ...existingIntegration.config, ...config }
          } 
        })
      } else {
        await add({
          template: {
            id: definition.id,
            name: definition.name,
            description: definition.description || '',
            category: definition.category as any,
            status: 'available'
          },
          config: {
            store_url: config.store_url || config.shop_domain,
            store_id: config.seller_id || config.merchant_id,
            sync_frequency: syncFrequency,
            is_active: isActive,
            config
          },
          credentials: Object.keys(credentials).length > 0 ? credentials : undefined
        })
      }

      toast({
        title: isEditing ? "Mise à jour réussie" : "Intégration ajoutée",
        description: `${definition.name} a été ${isEditing ? 'mise à jour' : 'connectée'} avec succès`
      })
      onClose()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'intégration",
        variant: "destructive"
      })
    }
  }, [formData, syncFrequency, isActive, definition, existingIntegration, isEditing, add, update, toast, onClose])

  const handleTest = useCallback(async () => {
    if (!existingIntegration) {
      setTestResult({ success: false, message: "Sauvegardez d'abord l'intégration pour la tester" })
      return
    }
    
    try {
      await testConnection(existingIntegration.id)
      setTestResult({ success: true, message: "Connexion réussie !" })
    } catch {
      setTestResult({ success: false, message: "Échec de la connexion" })
    }
  }, [existingIntegration, testConnection])

  const handleSync = useCallback(async () => {
    if (existingIntegration) {
      await sync(existingIntegration.id)
    }
  }, [existingIntegration, sync])

  const handleDelete = useCallback(async () => {
    if (existingIntegration && confirm('Supprimer cette intégration ?')) {
      await deleteIntegration(existingIntegration.id)
      onClose()
    }
  }, [existingIntegration, deleteIntegration, onClose])

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <PlatformLogo platform={definition.name} size="lg" />
          {isEditing ? `Configurer ${definition.name}` : `Connecter ${definition.name}`}
        </DialogTitle>
        <DialogDescription>
          {definition.description || `Configurez votre intégration ${definition.name}`}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="connection" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connexion</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="advanced" disabled={!isEditing}>Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4 mt-4">
          {definition.setupFields && definition.setupFields.length > 0 ? (
            definition.setupFields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune configuration requise pour cette intégration</p>
            </div>
          )}

          {definition.features && definition.features.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="font-medium mb-2">Fonctionnalités incluses :</p>
              <div className="flex flex-wrap gap-2">
                {definition.features.map(feature => (
                  <Badge key={feature} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          )}

          {testResult && (
            <div className={cn(
              "p-3 rounded-lg border flex items-center gap-2",
              testResult.success 
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            )}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Fréquence de synchronisation</Label>
            <Select value={syncFrequency} onValueChange={setSyncFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Activer l'intégration</p>
              <p className="text-sm text-muted-foreground">Synchroniser automatiquement les données</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {isEditing && existingIntegration && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={isSyncing || existingIntegration.connection_status !== 'connected'}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                {isSyncing ? 'Sync en cours...' : 'Synchroniser'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={isTesting}
              >
                <TestTube className="w-4 h-4 mr-2" />
                {isTesting ? 'Test...' : 'Tester'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          {isEditing && existingIntegration && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono">{existingIntegration.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créée le</span>
                    <span>{new Date(existingIntegration.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {existingIntegration.last_sync_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernière sync</span>
                      <span>{new Date(existingIntegration.last_sync_at).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer l'intégration
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={isAdding}>
          {isAdding ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Connecter')}
        </Button>
      </div>
    </DialogContent>
  )
}

// Composant Card intégration connectée (section haute)
function ConnectedIntegrationCard({ 
  integration,
  definition,
  onConfigure,
  onSync,
  onTest,
  isSyncing,
  isTesting
}: { 
  integration: UnifiedIntegration
  definition?: IntegrationDefinition
  onConfigure: () => void
  onSync: () => void
  onTest: () => void
  isSyncing: boolean
  isTesting: boolean
}) {
  const [imageError, setImageError] = useState(false)
  const isConnected = integration.connection_status === 'connected'
  const hasError = integration.connection_status === 'error'
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      hasError ? "border-destructive/50 bg-destructive/5" : "border-success/30 bg-success/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center overflow-hidden">
              {definition?.logo && !imageError ? (
                <img
                  src={definition.logo}
                  alt={integration.platform_name}
                  className="w-8 h-8 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <PlatformLogo platform={integration.platform_name || integration.platform} size="md" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{integration.platform_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isConnected ? "default" : hasError ? "destructive" : "secondary"} className="text-xs">
                  {isConnected ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Connecté</>
                  ) : hasError ? (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Erreur</>
                  ) : (
                    'Déconnecté'
                  )}
                </Badge>
                {integration.is_active && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    Actif
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSync} disabled={!isConnected || isSyncing}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                Synchroniser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTest} disabled={isTesting}>
                <TestTube className="w-4 h-4 mr-2" />
                Tester connexion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Configurer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {integration.last_sync_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t">
            <Clock className="w-3 h-3" />
            Dernière sync: {new Date(integration.last_sync_at).toLocaleString('fr-FR')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Composant Carte d'intégration disponible (grille)
function IntegrationCard({ 
  definition, 
  connectedIntegration,
  onConfigure
}: { 
  definition: IntegrationDefinition
  connectedIntegration?: UnifiedIntegration
  onConfigure: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const isConnected = !!connectedIntegration && connectedIntegration.connection_status === 'connected'
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onClick={onConfigure}
      className={cn(
        "group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5 cursor-pointer",
        isConnected 
          ? "border-success/30 hover:border-success/50" 
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Badge connecté */}
      {isConnected && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-success/10 text-success border-success/30">
            <PlugZap className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        </div>
      )}

      {/* Badge erreur */}
      {connectedIntegration?.connection_status === 'error' && (
        <div className="absolute top-3 right-3">
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        </div>
      )}

      {/* Badge populaire */}
      {definition.popular && !connectedIntegration && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}

      {/* Logo */}
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden group-hover:scale-105 transition-transform">
        {definition.logo && !imageError ? (
          <img
            src={definition.logo}
            alt={definition.name}
            className="w-10 h-10 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <PlatformLogo platform={definition.name} size="lg" />
        )}
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {definition.name}
      </h3>

      {/* Description courte */}
      {definition.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {definition.description}
        </p>
      )}

      {/* Features */}
      {definition.features && definition.features.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {definition.features.slice(0, 2).map(feature => (
            <span key={feature} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {feature}
            </span>
          ))}
          {definition.features.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{definition.features.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Dernière sync */}
      {connectedIntegration?.last_sync_at && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-2 border-t border-dashed">
          <Clock className="w-3 h-3" />
          {new Date(connectedIntegration.last_sync_at).toLocaleDateString('fr-FR')}
        </div>
      )}

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  )
}

// Page principale
export default function ChannableStyleIntegrationsPage() {
  const navigate = useNavigate()
  const { 
    integrations, 
    connectedIntegrations, 
    stats, 
    isLoading,
    sync,
    testConnection,
    isSyncing,
    isTesting
  } = useIntegrationsUnified()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'connected'>('popular')
  const [selectedDefinition, setSelectedDefinition] = useState<IntegrationDefinition | null>(null)
  const [activeView, setActiveView] = useState<'all' | 'connected'>('all')

  // Trouver l'intégration connectée correspondant à une définition
  const findConnectedIntegration = useCallback((definitionId: string): UnifiedIntegration | undefined => {
    return integrations.find(i => 
      i.platform?.toLowerCase() === definitionId.toLowerCase() ||
      i.platform_name?.toLowerCase() === definitionId.toLowerCase() ||
      i.platform?.toLowerCase().includes(definitionId.toLowerCase())
    )
  }, [integrations])

  // Trouver la définition pour une intégration connectée
  const findDefinitionForIntegration = useCallback((integration: UnifiedIntegration): IntegrationDefinition | undefined => {
    return integrationDefinitions.find(def => 
      def.id.toLowerCase() === integration.platform?.toLowerCase() ||
      def.name.toLowerCase() === integration.platform_name?.toLowerCase()
    )
  }, [])

  // Filtrage et tri des intégrations
  const filteredIntegrations = useMemo(() => {
    let result = integrationDefinitions.filter(def => {
      const matchesSearch = def.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (def.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = activeCategory === 'all' || def.category === activeCategory
      return matchesSearch && matchesCategory
    })

    // Tri
    if (sortBy === 'connected') {
      result = result.sort((a, b) => {
        const aConnected = findConnectedIntegration(a.id) ? 1 : 0
        const bConnected = findConnectedIntegration(b.id) ? 1 : 0
        return bConnected - aConnected
      })
    } else if (sortBy === 'popular') {
      result = result.sort((a, b) => {
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        return a.name.localeCompare(b.name)
      })
    } else {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [searchTerm, activeCategory, sortBy, findConnectedIntegration])

  return (
    <>
      <Helmet>
        <title>Intégrations eCommerce | DropShipper</title>
        <meta name="description" content="Connectez tous vos canaux de vente en une seule plateforme. Plus de 50 intégrations disponibles." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-12 lg:py-16">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Hub d'Intégrations</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight"
              >
                Connectez tous vos{' '}
                <span className="text-primary">canaux de vente</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8"
              >
                Configurez vos intégrations depuis une seule plateforme.
                Plus de {integrationDefinitions.length} connecteurs disponibles.
              </motion.p>

              {/* Stats rapides */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <PlugZap className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.connected}</p>
                    <p className="text-xs text-muted-foreground">Connectées</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Actives</p>
                  </div>
                </div>
                {stats.error > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.error}</p>
                      <p className="text-xs text-muted-foreground">Erreurs</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{integrationDefinitions.length}</p>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <HeroHexagons />
        </section>

        {/* Section Intégrations Connectées */}
        {connectedIntegrations.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Vos intégrations</h2>
                <p className="text-sm text-muted-foreground">{connectedIntegrations.length} intégration(s) active(s)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveView(activeView === 'connected' ? 'all' : 'connected')}>
                {activeView === 'connected' ? 'Voir toutes' : 'Voir connectées'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedIntegrations.slice(0, activeView === 'connected' ? undefined : 3).map((integration) => (
                <ConnectedIntegrationCard
                  key={integration.id}
                  integration={integration}
                  definition={findDefinitionForIntegration(integration)}
                  onConfigure={() => {
                    const def = findDefinitionForIntegration(integration)
                    if (def) setSelectedDefinition(def)
                  }}
                  onSync={() => sync(integration.id)}
                  onTest={() => testConnection(integration.id)}
                  isSyncing={isSyncing}
                  isTesting={isTesting}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section recherche et filtres */}
        <section className="container mx-auto px-4 py-6">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une intégration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-11 text-base border-border"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-11 w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Plus populaires</SelectItem>
                  <SelectItem value="connected">Connectées d'abord</SelectItem>
                  <SelectItem value="name">Alphabétique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs de catégories */}
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-2 mb-6">
              {categories.map((category) => {
                const Icon = category.icon
                const isActive = activeCategory === category.id
                const count = category.id === 'all' 
                  ? integrationDefinitions.length 
                  : integrationDefinitions.filter(i => i.category === category.id).length
                
                if (count === 0 && category.id !== 'all') return null
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs h-5",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""
                      )}
                    >
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Titre de section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {activeCategory === 'all' 
                ? 'Toutes les intégrations' 
                : categories.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredIntegrations.length} intégration(s) disponible(s)
            </p>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Grille d'intégrations */}
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredIntegrations.map((definition) => (
                    <IntegrationCard 
                      key={definition.id} 
                      definition={definition}
                      connectedIntegration={findConnectedIntegration(definition.id)}
                      onConfigure={() => setSelectedDefinition(definition)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Message si aucun résultat */}
              {filteredIntegrations.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Aucune intégration trouvée
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez de modifier votre recherche ou vos filtres
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('')
                    setActiveCategory('all')
                  }}>
                    Réinitialiser les filtres
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {/* Section CTA bas de page */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 p-8 lg:p-12 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20"
          >
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Vous ne trouvez pas votre intégration ?
              </h2>
              <p className="text-muted-foreground mb-6">
                Contactez-nous pour discuter de vos besoins spécifiques. 
                Nous ajoutons régulièrement de nouvelles intégrations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/support')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Demander une intégration
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/api-docs')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation API
                </Button>
              </div>
            </div>
          </motion.section>
        </section>
      </div>

      {/* Modal de configuration */}
      <Dialog open={!!selectedDefinition} onOpenChange={(open) => !open && setSelectedDefinition(null)}>
        {selectedDefinition && (
          <IntegrationSetupModal
            definition={selectedDefinition}
            existingIntegration={findConnectedIntegration(selectedDefinition.id)}
            onClose={() => setSelectedDefinition(null)}
          />
        )}
      </Dialog>
    </>
  )
}
