/**
 * Page Fournisseurs style Channable - 100% Fonctionnelle et Complète
 * Design moderne avec hero section, filtres par catégories, grille de fournisseurs
 * Section fournisseurs connectés avec actions rapides
 * 50+ fournisseurs dropshipping internationaux
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
  Package,
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
  Star,
  MapPin,
  Truck,
  MoreVertical,
  Play,
  Eye,
  ChevronRight,
  Crown,
  Factory,
  Warehouse,
  Ship,
  Building2,
  DollarSign,
  Users,
  Timer,
  Box,
  Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealSuppliers, Supplier } from '@/hooks/useRealSuppliers'
import { ALL_SUPPLIERS, SUPPLIER_CATEGORIES, COUNTRIES, getSupplierStats, searchSuppliers, UnifiedSupplier } from '@/data/allSuppliers'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { SupplierLogo } from '@/components/suppliers/SupplierLogo'
import { AdvancedSupplierAnalytics } from '@/components/suppliers/AdvancedSupplierAnalytics'
import { SupplierConnectionDialog } from '@/components/suppliers/SupplierConnectionDialog'
import { SupplierSyncManager } from '@/components/suppliers/SupplierSyncManager'
import { useSupplierRealtime } from '@/hooks/useSupplierRealtime'
import { Bell, BarChart2, RefreshCcw, Link as LinkIcon } from 'lucide-react'

// Types
interface SupplierDefinition {
  id: string
  name: string
  logo: string
  category: 'general' | 'fashion' | 'electronics' | 'home' | 'beauty' | 'sports' | 'toys' | 'food' | 'pets' | 'automotive' | 'print_on_demand' | 'wholesale'
  country: string
  shippingZones?: ('europe' | 'usa' | 'asia' | 'worldwide' | 'uk' | 'australia' | 'canada' | 'south_america')[]
  popular?: boolean
  premium?: boolean
  description?: string
  features?: string[]
  minOrder?: number
  shippingTime?: string
  rating?: number
  productsCount?: number
  setupFields?: {
    name: string
    label: string
    type: 'text' | 'password' | 'url'
    placeholder?: string
    required?: boolean
  }[]
}

// Zones d'expédition
const shippingZones = [
  { id: 'all', label: 'Toutes zones', icon: Globe },
  { id: 'europe', label: 'Europe', icon: Ship },
  { id: 'usa', label: 'États-Unis', icon: Ship },
  { id: 'asia', label: 'Asie', icon: Ship },
  { id: 'worldwide', label: 'Mondial', icon: Globe },
  { id: 'uk', label: 'Royaume-Uni', icon: Ship },
  { id: 'canada', label: 'Canada', icon: Ship },
  { id: 'australia', label: 'Australie', icon: Ship },
]

// Liste des pays disponibles
const countryOptions = [
  { id: 'all', label: 'Tous les pays' },
  { id: 'CN', label: '🇨🇳 Chine' },
  { id: 'US', label: '🇺🇸 États-Unis' },
  { id: 'FR', label: '🇫🇷 France' },
  { id: 'DE', label: '🇩🇪 Allemagne' },
  { id: 'UK', label: '🇬🇧 Royaume-Uni' },
  { id: 'IT', label: '🇮🇹 Italie' },
  { id: 'ES', label: '🇪🇸 Espagne' },
  { id: 'NL', label: '🇳🇱 Pays-Bas' },
  { id: 'PL', label: '🇵🇱 Pologne' },
  { id: 'AU', label: '🇦🇺 Australie' },
  { id: 'CA', label: '🇨🇦 Canada' },
  { id: 'IN', label: '🇮🇳 Inde' },
  { id: 'JP', label: '🇯🇵 Japon' },
  { id: 'KR', label: '🇰🇷 Corée du Sud' },
  { id: 'TR', label: '🇹🇷 Turquie' },
  { id: 'BR', label: '🇧🇷 Brésil' },
  { id: 'MX', label: '🇲🇽 Mexique' },
  { id: 'LT', label: '🇱🇹 Lituanie' },
  { id: 'LV', label: '🇱🇻 Lettonie' },
  { id: 'EE', label: '🇪🇪 Estonie' },
  { id: 'RO', label: '🇷🇴 Roumanie' },
  { id: 'CZ', label: '🇨🇿 République Tchèque' },
  { id: 'FI', label: '🇫🇮 Finlande' },
  { id: 'SE', label: '🇸🇪 Suède' },
  { id: 'HU', label: '🇭🇺 Hongrie' },
  { id: 'BE', label: '🇧🇪 Belgique' },
  { id: 'AT', label: '🇦🇹 Autriche' },
  { id: 'PT', label: '🇵🇹 Portugal' },
  { id: 'GR', label: '🇬🇷 Grèce' },
  { id: 'DK', label: '🇩🇰 Danemark' },
  { id: 'NO', label: '🇳🇴 Norvège' },
  { id: 'CH', label: '🇨🇭 Suisse' },
  { id: 'IE', label: '🇮🇪 Irlande' },
]

// Catégories de fournisseurs
const categories = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'general', label: 'Généraliste', icon: ShoppingBag },
  { id: 'fashion', label: 'Mode', icon: Heart },
  { id: 'electronics', label: 'Électronique', icon: Zap },
  { id: 'home', label: 'Maison', icon: Building2 },
  { id: 'beauty', label: 'Beauté', icon: Sparkles },
  { id: 'sports', label: 'Sport', icon: Activity },
  { id: 'toys', label: 'Jouets', icon: Box },
  { id: 'print_on_demand', label: 'Print on Demand', icon: Factory },
  { id: 'wholesale', label: 'Grossiste', icon: Warehouse },
  { id: 'pets', label: 'Animaux', icon: Heart },
  { id: 'food', label: 'Alimentaire', icon: Package },
  { id: 'automotive', label: 'Automobile', icon: Truck },
  { id: 'lighting', label: 'Éclairage', icon: Zap },
  { id: 'garden', label: 'Jardin', icon: Heart },
  { id: 'gaming', label: 'Gaming', icon: Box },
  { id: 'fragrances', label: 'Parfums', icon: Sparkles },
  { id: 'workwear', label: 'Vêtements Pro', icon: Factory },
  { id: 'plumbing', label: 'Plomberie', icon: Building2 },
  { id: 'it', label: 'IT & Mobile', icon: Zap },
]

// Mapper les catégories Wise2Sync vers les catégories internes
const mapWise2SyncCategory = (category: string): SupplierDefinition['category'] => {
  const mapping: Record<string, SupplierDefinition['category']> = {
    'Dropshipping Premium': 'general',
    'Marketplace Française': 'general',
    'Mobilier & Jardin': 'home',
    'Mode & Chaussures': 'fashion',
    'Chaussures & Mode': 'fashion',
    'Mode Homme/Femme': 'fashion',
    'Sport & Outdoor': 'sports',
    'Jouets & Enfants': 'toys',
    'Électronique & Gadgets': 'electronics',
    'IT & Mobile': 'electronics',
    'IT & Électronique': 'electronics',
    'Automobile & Pièces': 'automotive',
    'Éclairage & LED': 'electronics',
    'Plomberie & Sanitaire': 'home',
    'Jardin & Piscines': 'home',
    'Parfums & Cosmétiques': 'beauty',
    'Gaming & Accessoires': 'electronics',
    'Électroménager': 'home',
    'Vêtements de Travail': 'fashion',
    'Généraliste': 'general',
    'IT & Composants': 'electronics',
    'Électronique & Tech': 'electronics',
    'Sport & Fitness': 'sports',
    'Meubles & Décoration': 'home',
    'Outdoor & Camping': 'sports',
    'Bricolage & Outils': 'home',
    'Éclairage': 'home',
  }
  return mapping[category] || 'general'
}

// Extraire le code pays des régions Wise2Sync
const extractCountryCode = (regions: string[]): string => {
  const countryMapping: Record<string, string> = {
    'PL': 'PL', 'LT': 'LT', 'LV': 'LV', 'EE': 'EE', 'DE': 'DE',
    'CZ': 'CZ', 'RO': 'RO', 'ES': 'ES', 'FI': 'FI', 'SE': 'SE',
    'EU': 'EU', 'US': 'US', 'Global': 'CN', 'FR': 'FR', 'NL': 'NL',
    'IT': 'IT', 'UK': 'UK', 'HU': 'HU', 'BE': 'BE', 'AT': 'AT',
    'PT': 'PT', 'GR': 'GR', 'DK': 'DK', 'NO': 'NO', 'CH': 'CH', 'IE': 'IE'
  }
  for (const region of regions) {
    if (countryMapping[region]) {
      return countryMapping[region]
    }
  }
  return 'EU'
}

// Convertir ALL_SUPPLIERS au format SupplierDefinition
const convertAllSuppliers = (): SupplierDefinition[] => {
  return ALL_SUPPLIERS.map(supplier => ({
    id: supplier.id,
    name: supplier.name,
    logo: supplier.logo || supplier.icon || '',
    category: (supplier.category as SupplierDefinition['category']) || 'general',
    country: supplier.country,
    popular: supplier.isPopular || false,
    premium: supplier.isPremium || false,
    description: supplier.description,
    features: supplier.features,
    rating: supplier.rating || 4.0,
    productsCount: supplier.productsCount || 10000,
    shippingTime: supplier.shippingTime || '3-10 jours',
    setupFields: supplier.requiresAuth ? [
      { name: 'api_key', label: 'API Key', type: 'password' as const, required: true }
    ] : []
  }))
}


// Liste complète des fournisseurs dropshipping
const supplierDefinitions: SupplierDefinition[] = [
  // Généralistes populaires
  { 
    id: 'aliexpress', 
    name: 'AliExpress', 
    logo: 'https://ae01.alicdn.com/kf/S704f9f6bbe564b66a65dde13e15e10b5t.png', 
    category: 'general', 
    country: 'CN',
    popular: true,
    description: 'Le plus grand marketplace dropshipping au monde avec millions de produits',
    features: ['Millions de produits', 'Prix ultra-compétitifs', 'ePacket disponible', 'Centre des vendeurs'],
    rating: 4.3,
    productsCount: 100000000,
    shippingTime: '15-45 jours',
    setupFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true },
      { name: 'app_secret', label: 'App Secret', type: 'password', required: true }
    ]
  },
  { 
    id: 'cjdropshipping', 
    name: 'CJ Dropshipping', 
    logo: 'https://cjdropshipping.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    popular: true,
    description: 'Agent dropshipping tout-en-un avec warehouses US/EU et sourcing gratuit',
    features: ['Entrepôts US/EU', 'Sourcing gratuit', 'Branding personnalisé', 'POD intégré'],
    rating: 4.5,
    productsCount: 400000,
    shippingTime: '7-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'email', label: 'Email compte', type: 'text', required: true }
    ]
  },
  { 
    id: 'spocket', 
    name: 'Spocket', 
    logo: 'https://spocket.co/favicon.ico', 
    category: 'general', 
    country: 'US',
    popular: true,
    premium: true,
    description: 'Fournisseurs US/EU vérifiés avec livraison rapide et produits premium',
    features: ['Fournisseurs US/EU', 'Livraison 2-5 jours', 'Produits de qualité', 'Factures brandées'],
    rating: 4.6,
    productsCount: 100000,
    shippingTime: '2-7 jours',
    minOrder: 0,
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'dsers', 
    name: 'DSers', 
    logo: 'https://www.dsers.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    popular: true,
    description: 'Partenaire officiel AliExpress pour automatiser votre dropshipping',
    features: ['Intégration AliExpress', 'Commandes en masse', 'Suivi automatique', 'Règles de pricing'],
    rating: 4.4,
    productsCount: 500000,
    shippingTime: '15-45 jours',
    setupFields: [
      { name: 'api_token', label: 'Token API', type: 'password', required: true }
    ]
  },
  { 
    id: 'bigbuy', 
    name: 'BigBuy', 
    logo: 'https://www.bigbuy.eu/favicon.ico', 
    category: 'general', 
    country: 'ES',
    popular: true,
    description: 'Grossiste européen leader avec catalogue de 100K+ produits',
    features: ['Entrepôt européen', 'Livraison 24-72h', 'API complète', 'Dropshipping blindé'],
    rating: 4.4,
    productsCount: 100000,
    shippingTime: '24-72 heures',
    setupFields: [
      { name: 'api_key', label: 'Clé API', type: 'password', required: true },
      { name: 'api_secret', label: 'Secret API', type: 'password', required: true }
    ]
  },
  { 
    id: 'syncee', 
    name: 'Syncee', 
    logo: 'https://syncee.com/favicon.ico', 
    category: 'general', 
    country: 'HU',
    popular: true,
    description: 'Marketplace B2B avec fournisseurs globaux et sync automatique',
    features: ['Fournisseurs vérifiés', 'Sync automatique', 'Prix actualisés', 'Multi-plateformes'],
    rating: 4.3,
    productsCount: 4000000,
    shippingTime: '3-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'zendrop', 
    name: 'Zendrop', 
    logo: 'https://zendrop.com/favicon.ico', 
    category: 'general', 
    country: 'US',
    popular: true,
    description: 'Plateforme dropshipping US avec livraison express et branding',
    features: ['Livraison US rapide', 'Custom branding', 'Bundle products', 'Auto-fulfillment'],
    rating: 4.2,
    productsCount: 1000000,
    shippingTime: '5-12 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'modalyst', 
    name: 'Modalyst', 
    logo: 'https://modalyst.co/favicon.ico', 
    category: 'fashion', 
    country: 'US',
    popular: true,
    description: 'Marketplace mode avec marques indépendantes et livraison US/EU',
    features: ['Marques indépendantes', 'Produits uniques', 'Livraison rapide', 'Prix transparents'],
    rating: 4.1,
    productsCount: 400000,
    shippingTime: '5-14 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'salehoo', 
    name: 'SaleHoo', 
    logo: 'https://www.salehoo.com/favicon.ico', 
    category: 'wholesale', 
    country: 'NZ',
    description: 'Annuaire de 8000+ fournisseurs vérifiés et grossistes',
    features: ['8000+ fournisseurs', 'Vérification stricte', 'Support dédié', 'Market research'],
    rating: 4.5,
    productsCount: 2500000,
    shippingTime: 'Variable',
    setupFields: [
      { name: 'member_id', label: 'Member ID', type: 'text', required: true }
    ]
  },
  { 
    id: 'doba', 
    name: 'Doba', 
    logo: 'https://doba.com/favicon.ico', 
    category: 'general', 
    country: 'US',
    description: 'Plateforme dropshipping américaine avec millions de produits',
    features: ['Fournisseurs US', 'Fulfillment automatique', 'Catalogue varié', 'Prix compétitifs'],
    rating: 4.0,
    productsCount: 2000000,
    shippingTime: '5-10 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'wholesale2b', 
    name: 'Wholesale2B', 
    logo: 'https://wholesale2b.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    description: 'Plus de 100 fournisseurs US avec 1M+ produits dropshipping',
    features: ['100+ fournisseurs', 'Intégrations multiples', 'Feeds automatiques', 'Support US'],
    rating: 4.0,
    productsCount: 1000000,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Chine - Agents et plateformes
  { 
    id: 'temu', 
    name: 'Temu', 
    logo: 'https://www.temu.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    popular: true,
    description: 'Nouveau marketplace ultra-compétitif avec prix imbattables',
    features: ['Prix ultra-bas', 'Grande variété', 'Livraison gratuite', 'Protection acheteur'],
    rating: 4.0,
    productsCount: 5000000,
    shippingTime: '10-20 jours',
    setupFields: []
  },
  { 
    id: 'alibaba', 
    name: 'Alibaba', 
    logo: 'https://www.alibaba.com/favicon.ico', 
    category: 'wholesale', 
    country: 'CN',
    popular: true,
    description: 'Plateforme B2B leader pour sourcing et fabrication sur mesure',
    features: ['Fabrication OEM', 'Prix usine', 'MOQ négociables', 'Trade Assurance'],
    rating: 4.3,
    productsCount: 200000000,
    shippingTime: '20-45 jours',
    minOrder: 10,
    setupFields: [
      { name: 'app_key', label: 'App Key', type: 'text', required: true }
    ]
  },
  { 
    id: 'dhgate', 
    name: 'DHgate', 
    logo: 'https://www.dhgate.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Marketplace B2B chinois avec petites quantités acceptées',
    features: ['Petites quantités', 'Large catalogue', 'Prix grossiste', 'Protection acheteur'],
    rating: 4.0,
    productsCount: 30000000,
    shippingTime: '15-35 jours',
    setupFields: []
  },
  { 
    id: 'made-in-china', 
    name: 'Made-in-China', 
    logo: 'https://www.made-in-china.com/favicon.ico', 
    category: 'wholesale', 
    country: 'CN',
    description: 'Plateforme B2B avec usines chinoises certifiées',
    features: ['Usines vérifiées', 'OEM/ODM', 'Prix direct usine', 'Échantillons'],
    rating: 4.1,
    productsCount: 50000000,
    shippingTime: '20-45 jours',
    setupFields: []
  },
  { 
    id: '1688', 
    name: '1688.com', 
    logo: 'https://www.1688.com/favicon.ico', 
    category: 'wholesale', 
    country: 'CN',
    description: 'Alibaba chinois avec les meilleurs prix usine (nécessite agent)',
    features: ['Prix usine', 'Fournisseurs locaux', 'Achats groupés', 'Nécessite agent'],
    rating: 4.2,
    productsCount: 100000000,
    shippingTime: '15-30 jours',
    minOrder: 1,
    setupFields: []
  },
  { 
    id: 'banggood', 
    name: 'Banggood', 
    logo: 'https://www.banggood.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    description: 'Spécialiste électronique et gadgets avec entrepôts mondiaux',
    features: ['Électronique', 'Entrepôts EU/US', 'Gadgets uniques', 'Programme affiliate'],
    rating: 4.1,
    productsCount: 500000,
    shippingTime: '7-25 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'gearbest', 
    name: 'Gearbest', 
    logo: 'https://www.gearbest.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    description: 'Tech et gadgets avec programme dropshipping dédié',
    features: ['Gadgets tech', 'Prix bas', 'Entrepôts globaux', 'Programme DS'],
    rating: 4.0,
    productsCount: 300000,
    shippingTime: '10-30 jours',
    setupFields: []
  },
  { 
    id: 'lightinthebox', 
    name: 'LightInTheBox', 
    logo: 'https://www.lightinthebox.com/favicon.ico', 
    category: 'fashion', 
    country: 'CN',
    description: 'Mode, mariage et lifestyle avec expédition mondiale',
    features: ['Mode femme', 'Robes de mariée', 'Costumes', 'Custom sizes'],
    rating: 3.9,
    productsCount: 200000,
    shippingTime: '15-30 jours',
    setupFields: []
  },
  
  // Print on Demand
  { 
    id: 'printful', 
    name: 'Printful', 
    logo: 'https://www.printful.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    popular: true,
    premium: true,
    description: 'Leader du Print on Demand avec qualité premium et fulfillment mondial',
    features: ['Qualité premium', 'Fulfillment US/EU', 'Mockup generator', 'Branding avancé'],
    rating: 4.7,
    productsCount: 500,
    shippingTime: '2-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'printify', 
    name: 'Printify', 
    logo: 'https://printify.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    popular: true,
    description: 'Réseau de 90+ fournisseurs POD avec meilleurs prix',
    features: ['90+ partenaires', 'Prix compétitifs', 'Réseau global', 'Intégrations multiples'],
    rating: 4.5,
    productsCount: 800,
    shippingTime: '2-8 jours',
    setupFields: [
      { name: 'api_token', label: 'API Token', type: 'password', required: true }
    ]
  },
  { 
    id: 'gooten', 
    name: 'Gooten', 
    logo: 'https://gooten.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD avec réseau de fabrication global et API puissante',
    features: ['Réseau global', 'API robuste', 'Qualité constante', 'Personnalisation'],
    rating: 4.3,
    productsCount: 350,
    shippingTime: '3-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'gelato', 
    name: 'Gelato', 
    logo: 'https://www.gelato.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'NO',
    description: 'POD éco-responsable avec production locale dans 30+ pays',
    features: ['Production locale', 'Éco-responsable', '30+ pays', 'Wall art'],
    rating: 4.4,
    productsCount: 250,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'teespring', 
    name: 'Spring (Teespring)', 
    logo: 'https://teespring.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'Plateforme créateur avec intégration YouTube et social',
    features: ['Intégration sociale', 'Storefront gratuit', 'Créateurs', 'Merch'],
    rating: 4.1,
    productsCount: 200,
    shippingTime: '5-15 jours',
    setupFields: []
  },
  { 
    id: 'redbubble', 
    name: 'Redbubble', 
    logo: 'https://www.redbubble.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'AU',
    description: 'Marketplace créatif pour artistes avec POD intégré',
    features: ['Marketplace artistes', 'Produits uniques', 'Communauté créative', 'Stickers populaires'],
    rating: 4.0,
    productsCount: 150,
    shippingTime: '7-14 jours',
    setupFields: []
  },
  { 
    id: 'teepublic', 
    name: 'TeePublic', 
    logo: 'https://www.teepublic.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD axé designs et t-shirts avec marketplace intégré',
    features: ['T-shirts design', 'Prix accessibles', 'Marketplace actif', 'Fan art'],
    rating: 4.0,
    productsCount: 120,
    shippingTime: '7-14 jours',
    setupFields: []
  },

  // Europe
  { 
    id: 'brandsdistribution', 
    name: 'BrandsDistribution', 
    logo: 'https://www.brandsdistribution.com/favicon.ico', 
    category: 'fashion', 
    country: 'IT',
    popular: true,
    description: 'Grossiste mode italien avec 120+ marques premium',
    features: ['Marques premium', 'Mode italienne', 'Livraison EU', 'B2B vérifié'],
    rating: 4.4,
    productsCount: 150000,
    shippingTime: '48-72 heures',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'vidaxl', 
    name: 'vidaXL', 
    logo: 'https://www.vidaxl.fr/favicon.ico', 
    category: 'home', 
    country: 'NL',
    popular: true,
    description: 'Leader européen du dropshipping maison et jardin',
    features: ['Maison & Jardin', 'Entrepôt EU', 'Livraison gratuite', '90K+ produits'],
    rating: 4.3,
    productsCount: 90000,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'griffati', 
    name: 'Griffati', 
    logo: 'https://www.griffati.it/favicon.ico', 
    category: 'fashion', 
    country: 'IT',
    description: 'Grossiste mode italien avec marques de créateurs',
    features: ['Mode italienne', 'Marques créateurs', 'Prix grossiste', 'EU shipping'],
    rating: 4.2,
    productsCount: 25000,
    shippingTime: '48-96 heures',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'matterhorn', 
    name: 'Matterhorn', 
    logo: 'https://b2b.mfrocks.com/favicon.ico', 
    category: 'fashion', 
    country: 'PL',
    description: 'Grossiste mode polonais avec prix ultra-compétitifs',
    features: ['Prix bas', 'Mode tendance', 'Livraison EU', 'B2B'],
    rating: 4.0,
    productsCount: 50000,
    shippingTime: '3-5 jours',
    setupFields: []
  },
  { 
    id: 'costway', 
    name: 'Costway', 
    logo: 'https://www.costway.com/favicon.ico', 
    category: 'home', 
    country: 'US',
    description: 'Maison, jardin et sport avec entrepôts US/EU',
    features: ['Entrepôts US/EU', 'Maison & Sport', 'Gros volumes', 'Prix compétitifs'],
    rating: 4.1,
    productsCount: 10000,
    shippingTime: '3-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'kontimport', 
    name: 'Kontimport', 
    logo: 'https://kontimport.com/favicon.ico', 
    category: 'general', 
    country: 'ES',
    description: 'Grossiste espagnol généraliste avec dropshipping EU',
    features: ['Généraliste', 'Entrepôt espagnol', 'Livraison EU', 'Prix grossiste'],
    rating: 4.0,
    productsCount: 30000,
    shippingTime: '48-72 heures',
    setupFields: []
  },
  { 
    id: 'serravalle', 
    name: 'Serravalle Outlet', 
    logo: 'https://serravalle.it/favicon.ico', 
    category: 'fashion', 
    country: 'IT',
    description: 'Outlet italien avec marques de luxe déstockées',
    features: ['Marques luxe', 'Prix outlet', 'Italie', 'B2B'],
    rating: 4.1,
    productsCount: 15000,
    shippingTime: '3-5 jours',
    setupFields: []
  },
  
  // Beauté & Cosmétiques
  { 
    id: 'beautyjoint', 
    name: 'Beauty Joint', 
    logo: 'https://www.beautyjoint.com/favicon.ico', 
    category: 'beauty', 
    country: 'US',
    description: 'Grossiste cosmétiques US avec marques populaires',
    features: ['Cosmétiques US', 'Marques connues', 'Prix grossiste', 'Dropshipping'],
    rating: 4.2,
    productsCount: 8000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'fragrancenet', 
    name: 'FragranceNet', 
    logo: 'https://www.fragrancenet.com/favicon.ico', 
    category: 'beauty', 
    country: 'US',
    description: 'Parfums et cosmétiques de marque à prix réduits',
    features: ['Parfums de marque', 'Cosmétiques', 'Prix réduits', 'Livraison mondiale'],
    rating: 4.3,
    productsCount: 35000,
    shippingTime: '7-14 jours',
    setupFields: []
  },
  
  // Électronique
  { 
    id: 'megagoods', 
    name: 'MegaGoods', 
    logo: 'https://megagoods.com/favicon.ico', 
    category: 'electronics', 
    country: 'US',
    description: 'Électronique et accessoires avec fulfillment US rapide',
    features: ['Électronique', 'Fulfillment rapide', 'Prix compétitifs', 'Dropship US'],
    rating: 4.0,
    productsCount: 2000,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'petra', 
    name: 'Petra Industries', 
    logo: 'https://petra.com/favicon.ico', 
    category: 'electronics', 
    country: 'US',
    description: 'Distributeur électronique majeur aux États-Unis',
    features: ['Électronique', 'Audio/Vidéo', 'B2B', 'Dropship certifié'],
    rating: 4.1,
    productsCount: 3500,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  
  // Sport & Outdoor
  { 
    id: 'essentiahome', 
    name: 'Essentia Home', 
    logo: 'https://essentiahome.com/favicon.ico', 
    category: 'home', 
    country: 'US',
    description: 'Articles maison et décoration avec dropshipping US',
    features: ['Décoration', 'Articles maison', 'Prix grossiste', 'Dropship'],
    rating: 4.0,
    productsCount: 5000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  
  // Animaux
  { 
    id: 'petdropshipper', 
    name: 'Pet Dropshipper', 
    logo: 'https://petdropshipper.com/favicon.ico', 
    category: 'pets', 
    country: 'US',
    description: 'Spécialiste produits pour animaux avec dropshipping US',
    features: ['Produits animaux', 'Accessoires', 'Nourriture', 'US dropship'],
    rating: 4.0,
    productsCount: 3000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  
  // Produits personnalisés
  { 
    id: 'customcat', 
    name: 'CustomCat', 
    logo: 'https://customcat.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD spécialisé avec catalogue étendu et prix bas',
    features: ['Catalogue étendu', 'Prix compétitifs', 'Fulfillment US', 'Personnalisation'],
    rating: 4.2,
    productsCount: 550,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Agents et services
  { 
    id: 'wiio', 
    name: 'Wiio', 
    logo: 'https://wiio.io/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Agent fulfillment chinois avec entrepôts US et branding',
    features: ['Agent Chine', 'Entrepôts US', 'Branding', 'Sourcing'],
    rating: 4.3,
    productsCount: 500000,
    shippingTime: '8-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'hypersku', 
    name: 'HyperSKU', 
    logo: 'https://hypersku.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Plateforme dropshipping avec sourcing et fulfillment',
    features: ['Sourcing', 'Fulfillment', 'Branding', 'Agent dédié'],
    rating: 4.1,
    productsCount: 100000,
    shippingTime: '7-12 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'udroppship', 
    name: 'uDropship', 
    logo: 'https://udropship.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Agent dropshipping tout-en-un avec sourcing et QC',
    features: ['Sourcing', 'Quality Control', 'Branding', 'Agent personnel'],
    rating: 4.0,
    productsCount: 200000,
    shippingTime: '8-18 jours',
    setupFields: []
  },
  { 
    id: 'yakkyofy', 
    name: 'Yakkyofy', 
    logo: 'https://yakkyofy.com/favicon.ico', 
    category: 'general', 
    country: 'IT',
    description: 'Automatisation dropshipping avec sourcing et fulfillment',
    features: ['Automatisation', 'Sourcing IA', 'Multi-stores', 'Virtual warehouse'],
    rating: 4.2,
    productsCount: 150000,
    shippingTime: '7-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Autres marchés
  { 
    id: 'chinabrands', 
    name: 'ChinaBrands', 
    logo: 'https://www.chinabrands.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Grossiste chinois avec 500K+ produits et prix usine',
    features: ['500K+ produits', 'Prix usine', 'Entrepôts globaux', 'Multi-langues'],
    rating: 4.0,
    productsCount: 500000,
    shippingTime: '10-25 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'sunsky', 
    name: 'Sunsky Online', 
    logo: 'https://www.sunsky-online.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    description: 'Électronique et accessoires avec prix grossiste',
    features: ['Accessoires phone', 'Électronique', 'Prix grossiste', 'Expédition rapide'],
    rating: 4.1,
    productsCount: 100000,
    shippingTime: '10-20 jours',
    setupFields: []
  },

  // ========== NOUVEAUX FOURNISSEURS ==========
  
  // Mode & Vêtements
  { 
    id: 'fashiongo', 
    name: 'FashionGo', 
    logo: 'https://www.fashiongo.net/favicon.ico', 
    category: 'fashion', 
    country: 'US',
    popular: true,
    description: 'Marketplace B2B mode avec 2000+ marques de mode en gros',
    features: ['2000+ marques', 'Mode féminine', 'Tendances actuelles', 'US based'],
    rating: 4.4,
    productsCount: 800000,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'faire', 
    name: 'Faire', 
    logo: 'https://www.faire.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    popular: true,
    premium: true,
    description: 'Marketplace wholesale premium avec marques artisanales et indépendantes',
    features: ['Marques artisanales', 'Net 60 paiement', 'Retours gratuits', 'Qualité premium'],
    rating: 4.7,
    productsCount: 600000,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'tundra', 
    name: 'Tundra', 
    logo: 'https://www.tundra.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    description: 'Wholesale marketplace sans frais avec paiement différé',
    features: ['Pas de frais', 'Net 60', 'Marques émergentes', 'US shipping'],
    rating: 4.3,
    productsCount: 150000,
    shippingTime: '3-8 jours',
    setupFields: []
  },
  { 
    id: 'abound', 
    name: 'Abound', 
    logo: 'https://helloabound.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    description: 'Marketplace B2B pour produits artisanaux et uniques',
    features: ['Produits artisanaux', 'Marques indépendantes', 'Curation qualité', 'Support dédié'],
    rating: 4.2,
    productsCount: 100000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'shein', 
    name: 'SHEIN', 
    logo: 'https://www.shein.com/favicon.ico', 
    category: 'fashion', 
    country: 'CN',
    popular: true,
    description: 'Fast fashion leader mondial avec prix ultra-compétitifs',
    features: ['Prix ultra-bas', 'Nouvelles tendances', 'Mode femme', 'Livraison mondiale'],
    rating: 4.0,
    productsCount: 600000,
    shippingTime: '10-20 jours',
    setupFields: []
  },
  { 
    id: 'zaful', 
    name: 'Zaful', 
    logo: 'https://www.zaful.com/favicon.ico', 
    category: 'fashion', 
    country: 'CN',
    description: 'Mode jeune et tendance avec maillots de bain et streetwear',
    features: ['Maillots de bain', 'Streetwear', 'Mode jeune', 'Prix accessibles'],
    rating: 3.9,
    productsCount: 100000,
    shippingTime: '15-25 jours',
    setupFields: []
  },
  { 
    id: 'romwe', 
    name: 'Romwe', 
    logo: 'https://www.romwe.com/favicon.ico', 
    category: 'fashion', 
    country: 'CN',
    description: 'Mode tendance et streetwear à prix abordables',
    features: ['Streetwear', 'Mode ado', 'Prix bas', 'Nouvelles arrivées quotidiennes'],
    rating: 3.8,
    productsCount: 200000,
    shippingTime: '12-25 jours',
    setupFields: []
  },
  
  // Bijoux & Accessoires
  { 
    id: 'nihaojewelry', 
    name: 'Nihao Jewelry', 
    logo: 'https://www.nihaojewelry.com/favicon.ico', 
    category: 'fashion', 
    country: 'CN',
    popular: true,
    description: 'Grossiste bijoux et accessoires avec des millions de produits',
    features: ['Bijoux fantaisie', 'Accessoires cheveux', 'MOQ bas', 'Prix usine'],
    rating: 4.2,
    productsCount: 1500000,
    shippingTime: '10-20 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'jewelrybase', 
    name: 'JewelryBase', 
    logo: 'https://jewelrybase.com/favicon.ico', 
    category: 'fashion', 
    country: 'US',
    description: 'Bijoux en gros américains avec dropshipping',
    features: ['Bijoux argent', 'Pierres semi-précieuses', 'US based', 'Dropship'],
    rating: 4.1,
    productsCount: 15000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  
  // Maison & Décoration
  { 
    id: 'wayfair', 
    name: 'Wayfair', 
    logo: 'https://www.wayfair.com/favicon.ico', 
    category: 'home', 
    country: 'US',
    popular: true,
    premium: true,
    description: 'Leader US de la décoration et du mobilier avec programme partenaire',
    features: ['Mobilier', 'Décoration', 'Programme partenaire', 'Qualité premium'],
    rating: 4.5,
    productsCount: 22000000,
    shippingTime: '3-10 jours',
    setupFields: [
      { name: 'partner_id', label: 'Partner ID', type: 'text', required: true },
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'overstock', 
    name: 'Overstock', 
    logo: 'https://www.overstock.com/favicon.ico', 
    category: 'home', 
    country: 'US',
    description: 'Maison et décoration avec programme affiliate et dropship',
    features: ['Décoration maison', 'Mobilier', 'Prix réduits', 'US shipping'],
    rating: 4.2,
    productsCount: 1000000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'aspire', 
    name: 'Aspire Home Accents', 
    logo: 'https://aspirehomeaccents.com/favicon.ico', 
    category: 'home', 
    country: 'US',
    description: 'Décoration intérieure et accents maison en gros',
    features: ['Décoration murale', 'Miroirs', 'Accents', 'Wholesale US'],
    rating: 4.0,
    productsCount: 5000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  
  // Sport & Fitness
  { 
    id: 'alphalete', 
    name: 'Alphalete', 
    logo: 'https://alphalete.com/favicon.ico', 
    category: 'sports', 
    country: 'US',
    description: 'Vêtements sport et fitness premium',
    features: ['Sportswear premium', 'Fitness', 'Qualité gym', 'US brand'],
    rating: 4.4,
    productsCount: 500,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'gymshark', 
    name: 'Gymshark', 
    logo: 'https://gymshark.com/favicon.ico', 
    category: 'sports', 
    country: 'UK',
    premium: true,
    description: 'Marque fitness leader avec programme ambassadeur',
    features: ['Fitness premium', 'Programme ambassadeur', 'Qualité UK', 'Tendance'],
    rating: 4.6,
    productsCount: 300,
    shippingTime: '5-12 jours',
    setupFields: []
  },
  { 
    id: 'ssactivewear', 
    name: 'S&S Activewear', 
    logo: 'https://ssactivewear.com/favicon.ico', 
    category: 'sports', 
    country: 'US',
    description: 'Distributeur vêtements sport et activewear US',
    features: ['Activewear', 'Marques multiples', 'Wholesale US', 'Fulfillment rapide'],
    rating: 4.3,
    productsCount: 150000,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Électronique & Tech
  { 
    id: 'anker', 
    name: 'Anker', 
    logo: 'https://www.anker.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    popular: true,
    description: 'Leader accessoires tech et chargeurs avec qualité premium',
    features: ['Chargeurs', 'Accessoires tech', 'Qualité premium', 'Garantie'],
    rating: 4.6,
    productsCount: 500,
    shippingTime: '5-15 jours',
    setupFields: []
  },
  { 
    id: 'focalprice', 
    name: 'Focalprice', 
    logo: 'https://www.focalprice.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    shippingZones: ['worldwide', 'asia'],
    description: 'Gadgets et électronique avec programme dropship',
    features: ['Gadgets', 'Électronique', 'Prix bas', 'Dropship'],
    rating: 3.9,
    productsCount: 50000,
    shippingTime: '15-30 jours',
    setupFields: []
  },
  { 
    id: 'chinavasion', 
    name: 'Chinavasion', 
    logo: 'https://www.chinavasion.com/favicon.ico', 
    category: 'electronics', 
    country: 'CN',
    description: 'Électronique et gadgets chinois avec dropshipping intégré',
    features: ['Électronique', 'Gadgets uniques', 'Prix usine', 'Dropship programme'],
    rating: 4.0,
    productsCount: 25000,
    shippingTime: '10-25 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Beauté & Cosmétiques
  { 
    id: 'bsquared', 
    name: 'BSquared Beauty', 
    logo: 'https://bsquaredbeauty.com/favicon.ico', 
    category: 'beauty', 
    country: 'US',
    description: 'Produits beauté et cosmétiques avec dropshipping US',
    features: ['Cosmétiques', 'Soins peau', 'US dropship', 'Marques variées'],
    rating: 4.1,
    productsCount: 10000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'cosmeticsupply', 
    name: 'Cosmetic Supply', 
    logo: 'https://cosmeticsupply.com/favicon.ico', 
    category: 'beauty', 
    country: 'US',
    description: 'Grossiste cosmétiques professionnels',
    features: ['Cosmétiques pro', 'Soins', 'Wholesale', 'US based'],
    rating: 4.0,
    productsCount: 8000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'sephora', 
    name: 'Sephora Wholesale', 
    logo: 'https://www.sephora.com/favicon.ico', 
    category: 'beauty', 
    country: 'FR',
    premium: true,
    description: 'Programme partenaire avec marques beauté premium',
    features: ['Marques luxe', 'Cosmétiques premium', 'Programme partenaire', 'EU/US'],
    rating: 4.7,
    productsCount: 45000,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'partner_id', label: 'Partner ID', type: 'text', required: true }
    ]
  },
  
  // Animaux
  { 
    id: 'petstore', 
    name: 'Pet Store Global', 
    logo: 'https://petstores.com/favicon.ico', 
    category: 'pets', 
    country: 'US',
    description: 'Produits animaux en gros avec programme dropship',
    features: ['Animaux', 'Accessoires', 'Nourriture', 'Wholesale US'],
    rating: 4.1,
    productsCount: 25000,
    shippingTime: '3-8 jours',
    setupFields: []
  },
  { 
    id: 'pawsource', 
    name: 'PawSource', 
    logo: 'https://pawsource.com/favicon.ico', 
    category: 'pets', 
    country: 'US',
    description: 'Fournisseur spécialisé produits animaux premium',
    features: ['Produits premium', 'Chiens/Chats', 'US dropship', 'Qualité'],
    rating: 4.2,
    productsCount: 5000,
    shippingTime: '3-6 jours',
    setupFields: []
  },
  
  // Jouets & Enfants
  { 
    id: 'toyworld', 
    name: 'Toy World Inc', 
    logo: 'https://toyworldinc.com/favicon.ico', 
    category: 'toys', 
    country: 'US',
    description: 'Distributeur jouets en gros avec dropshipping',
    features: ['Jouets', 'Jeux', 'Wholesale US', 'Dropship'],
    rating: 4.0,
    productsCount: 15000,
    shippingTime: '4-8 jours',
    setupFields: []
  },
  { 
    id: 'funko', 
    name: 'Funko', 
    logo: 'https://funko.com/favicon.ico', 
    category: 'toys', 
    country: 'US',
    popular: true,
    description: 'Figurines Pop! et collectibles avec programme partenaire',
    features: ['Funko Pop!', 'Collectibles', 'Marque forte', 'Programme partenaire'],
    rating: 4.5,
    productsCount: 10000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'hasbro', 
    name: 'Hasbro', 
    logo: 'https://hasbro.com/favicon.ico', 
    category: 'toys', 
    country: 'US',
    premium: true,
    description: 'Marques jouets iconiques (Monopoly, Transformers, Nerf)',
    features: ['Marques iconiques', 'Qualité premium', 'Programme distributeur', 'Global'],
    rating: 4.6,
    productsCount: 5000,
    shippingTime: '5-12 jours',
    setupFields: []
  },
  
  // Automotive
  { 
    id: 'autopartswarehouse', 
    name: 'Auto Parts Warehouse', 
    logo: 'https://autopartswarehouse.com/favicon.ico', 
    category: 'automotive', 
    country: 'US',
    description: 'Pièces auto et accessoires avec dropshipping US',
    features: ['Pièces auto', 'Accessoires voiture', 'US dropship', 'Large catalogue'],
    rating: 4.1,
    productsCount: 500000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'carid', 
    name: 'CARiD', 
    logo: 'https://www.carid.com/favicon.ico', 
    category: 'automotive', 
    country: 'US',
    description: 'Pièces et accessoires auto premium avec programme partenaire',
    features: ['Pièces premium', 'Accessoires', 'Programme partenaire', 'US based'],
    rating: 4.2,
    productsCount: 1000000,
    shippingTime: '3-10 jours',
    setupFields: []
  },
  
  // Alimentaire
  { 
    id: 'gourmetfoodworld', 
    name: 'Gourmet Food World', 
    logo: 'https://gourmetfoodworld.com/favicon.ico', 
    category: 'food', 
    country: 'US',
    description: 'Produits alimentaires gourmet et spécialités',
    features: ['Gourmet', 'Spécialités', 'Produits fins', 'US shipping'],
    rating: 4.3,
    productsCount: 3000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'webstaurant', 
    name: 'WebstaurantStore', 
    logo: 'https://www.webstaurantstore.com/favicon.ico', 
    category: 'food', 
    country: 'US',
    description: 'Fournitures restaurant et alimentaire en gros',
    features: ['Équipement restaurant', 'Alimentaire', 'Wholesale', 'US dropship'],
    rating: 4.4,
    productsCount: 500000,
    shippingTime: '3-8 jours',
    setupFields: []
  },
  
  // Print on Demand additionnels
  { 
    id: 'scalablepress', 
    name: 'Scalable Press', 
    logo: 'https://scalablepress.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD industriel avec grands volumes et prix compétitifs',
    features: ['Grands volumes', 'Prix industriels', 'API robuste', 'US fulfillment'],
    rating: 4.2,
    productsCount: 400,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'printaura', 
    name: 'Print Aura', 
    logo: 'https://printaura.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD avec white label complet et branding personnalisé',
    features: ['White label', 'Branding complet', 'Pas de minimum', 'US based'],
    rating: 4.1,
    productsCount: 200,
    shippingTime: '4-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'subliminator', 
    name: 'Subliminator', 
    logo: 'https://subliminator.app/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'Spécialiste sublimation all-over print',
    features: ['Sublimation', 'All-over print', 'Qualité premium', 'Mockups'],
    rating: 4.3,
    productsCount: 150,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'apliiq', 
    name: 'Apliiq', 
    logo: 'https://www.apliiq.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    description: 'POD avec cut & sew et personnalisation avancée',
    features: ['Cut & Sew', 'Custom labels', 'Personnalisation poussée', 'Premium'],
    rating: 4.4,
    productsCount: 100,
    shippingTime: '7-14 jours',
    setupFields: []
  },
  
  // Agents supplémentaires
  { 
    id: 'sourcify', 
    name: 'Sourcify', 
    logo: 'https://sourcify.com/favicon.ico', 
    category: 'wholesale', 
    country: 'CN',
    premium: true,
    description: 'Plateforme sourcing premium avec usines vérifiées',
    features: ['Usines vérifiées', 'Sourcing premium', 'QC inclus', 'Account manager'],
    rating: 4.5,
    productsCount: 1000000,
    shippingTime: '20-40 jours',
    setupFields: []
  },
  { 
    id: 'leeline', 
    name: 'Leeline Sourcing', 
    logo: 'https://leelinesourcing.com/favicon.ico', 
    category: 'wholesale', 
    country: 'CN',
    description: 'Agent sourcing Chine avec services complets',
    features: ['Sourcing complet', 'QC', 'Négociation', 'Shipping management'],
    rating: 4.2,
    productsCount: 500000,
    shippingTime: '15-35 jours',
    setupFields: []
  },
  { 
    id: 'supplyia', 
    name: 'Supplyia', 
    logo: 'https://supplyia.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    description: 'Agent dropshipping intelligent avec IA',
    features: ['IA sourcing', 'Automatisation', 'Multi-sources', 'Analytics'],
    rating: 4.0,
    productsCount: 300000,
    shippingTime: '8-20 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  
  // Europe additionnels
  { 
    id: 'dropshippingeurope', 
    name: 'Dropshipping Europe', 
    logo: 'https://dropshipping-europe.eu/favicon.ico', 
    category: 'general', 
    country: 'DE',
    description: 'Réseau de fournisseurs européens avec livraison rapide',
    features: ['Fournisseurs EU', 'Livraison 24-72h', 'Multi-catégories', 'Support FR'],
    rating: 4.1,
    productsCount: 50000,
    shippingTime: '24-72 heures',
    setupFields: []
  },
  { 
    id: 'zentrada', 
    name: 'Zentrada', 
    logo: 'https://www.zentrada.eu/favicon.ico', 
    category: 'wholesale', 
    country: 'DE',
    popular: true,
    description: 'Marketplace B2B européen avec 400+ fournisseurs',
    features: ['400+ fournisseurs', 'EU based', 'Multi-catégories', 'B2B vérifié'],
    rating: 4.3,
    productsCount: 200000,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'orderchamp', 
    name: 'Orderchamp', 
    logo: 'https://www.orderchamp.com/favicon.ico', 
    category: 'wholesale', 
    country: 'NL',
    description: 'Marketplace wholesale européen avec marques émergentes',
    features: ['Marques émergentes', 'EU shipping', 'Paiement différé', 'Curation'],
    rating: 4.4,
    productsCount: 100000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'ankorstore', 
    name: 'Ankorstore', 
    logo: 'https://www.ankorstore.com/favicon.ico', 
    category: 'wholesale', 
    country: 'FR',
    shippingZones: ['europe', 'uk'],
    popular: true,
    premium: true,
    description: 'Marketplace B2B français avec marques créatives européennes',
    features: ['Marques françaises', 'Net 60 paiement', 'EU shipping', 'Qualité curatée'],
    rating: 4.5,
    productsCount: 300000,
    shippingTime: '3-7 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },

  // ========== NOUVEAUX FOURNISSEURS 2024 ==========
  
  // Turquie - Mode & Textile
  { 
    id: 'trendyol', 
    name: 'Trendyol', 
    logo: 'https://www.trendyol.com/favicon.ico', 
    category: 'fashion', 
    country: 'TR',
    shippingZones: ['europe', 'asia', 'worldwide'],
    popular: true,
    description: 'Plus grande marketplace turque avec mode et lifestyle',
    features: ['Mode turque', 'Prix compétitifs', 'Expédition rapide', 'Large catalogue'],
    rating: 4.3,
    productsCount: 30000000,
    shippingTime: '5-15 jours',
    setupFields: []
  },
  { 
    id: 'hepsiburada', 
    name: 'Hepsiburada', 
    logo: 'https://www.hepsiburada.com/favicon.ico', 
    category: 'general', 
    country: 'TR',
    shippingZones: ['europe', 'asia'],
    description: 'Marketplace turc généraliste avec millions de produits',
    features: ['Généraliste', 'Électronique', 'Mode', 'Maison'],
    rating: 4.2,
    productsCount: 40000000,
    shippingTime: '7-20 jours',
    setupFields: []
  },
  { 
    id: 'n11', 
    name: 'N11', 
    logo: 'https://www.n11.com/favicon.ico', 
    category: 'general', 
    country: 'TR',
    shippingZones: ['europe'],
    description: 'Plateforme e-commerce turque avec produits variés',
    features: ['Multi-catégories', 'Mode', 'Tech', 'Maison'],
    rating: 4.0,
    productsCount: 25000000,
    shippingTime: '7-18 jours',
    setupFields: []
  },

  // Inde - Textile & Artisanat
  { 
    id: 'indiamart', 
    name: 'IndiaMart', 
    logo: 'https://www.indiamart.com/favicon.ico', 
    category: 'wholesale', 
    country: 'IN',
    shippingZones: ['worldwide', 'asia'],
    popular: true,
    description: 'Plus grande marketplace B2B indienne avec fabricants',
    features: ['Fabricants indiens', 'Prix usine', 'Artisanat', 'Textile'],
    rating: 4.1,
    productsCount: 75000000,
    shippingTime: '15-35 jours',
    setupFields: []
  },
  { 
    id: 'tradeindia', 
    name: 'TradeIndia', 
    logo: 'https://www.tradeindia.com/favicon.ico', 
    category: 'wholesale', 
    country: 'IN',
    shippingZones: ['worldwide', 'asia'],
    description: 'Plateforme B2B indienne avec fournisseurs vérifiés',
    features: ['Fournisseurs vérifiés', 'Artisanat', 'Textile', 'Bijoux'],
    rating: 4.0,
    productsCount: 10000000,
    shippingTime: '15-30 jours',
    setupFields: []
  },
  { 
    id: 'exportersindia', 
    name: 'ExportersIndia', 
    logo: 'https://www.exportersindia.com/favicon.ico', 
    category: 'wholesale', 
    country: 'IN',
    shippingZones: ['worldwide'],
    description: 'Exportateurs indiens avec produits artisanaux',
    features: ['Export ready', 'Artisanat', 'Bijoux', 'Textiles'],
    rating: 3.9,
    productsCount: 5000000,
    shippingTime: '15-35 jours',
    setupFields: []
  },

  // Japon & Corée - Tech & Beauté
  { 
    id: 'rakuten', 
    name: 'Rakuten Japan', 
    logo: 'https://www.rakuten.co.jp/favicon.ico', 
    category: 'general', 
    country: 'JP',
    shippingZones: ['asia', 'worldwide'],
    popular: true,
    description: 'Plus grande marketplace japonaise avec produits exclusifs',
    features: ['Produits japonais', 'Tech', 'Beauté', 'Anime/Manga'],
    rating: 4.4,
    productsCount: 250000000,
    shippingTime: '7-20 jours',
    setupFields: []
  },
  { 
    id: 'yahoo-japan', 
    name: 'Yahoo! Japan Shopping', 
    logo: 'https://shopping.yahoo.co.jp/favicon.ico', 
    category: 'general', 
    country: 'JP',
    shippingZones: ['asia', 'worldwide'],
    description: 'Marketplace japonais avec produits authentiques',
    features: ['Produits authentiques', 'Électronique', 'Mode japonaise', 'Cosmétiques'],
    rating: 4.2,
    productsCount: 100000000,
    shippingTime: '7-21 jours',
    setupFields: []
  },
  { 
    id: 'gmarket', 
    name: 'Gmarket', 
    logo: 'https://www.gmarket.co.kr/favicon.ico', 
    category: 'general', 
    country: 'KR',
    shippingZones: ['asia', 'worldwide'],
    popular: true,
    description: 'Plus grande marketplace coréenne avec K-beauty et K-fashion',
    features: ['K-beauty', 'K-fashion', 'Électronique', 'K-pop merch'],
    rating: 4.3,
    productsCount: 150000000,
    shippingTime: '7-18 jours',
    setupFields: []
  },
  { 
    id: 'coupang', 
    name: 'Coupang', 
    logo: 'https://www.coupang.com/favicon.ico', 
    category: 'general', 
    country: 'KR',
    shippingZones: ['asia'],
    description: 'Amazon coréen avec livraison ultra-rapide',
    features: ['Livraison rapide', 'K-beauty', 'Tech', 'Mode coréenne'],
    rating: 4.5,
    productsCount: 200000000,
    shippingTime: '5-15 jours',
    setupFields: []
  },
  { 
    id: '11street', 
    name: '11Street', 
    logo: 'https://www.11st.co.kr/favicon.ico', 
    category: 'general', 
    country: 'KR',
    shippingZones: ['asia', 'worldwide'],
    description: 'Marketplace coréen avec produits lifestyle',
    features: ['Lifestyle coréen', 'Beauté', 'Mode', 'Électronique'],
    rating: 4.1,
    productsCount: 50000000,
    shippingTime: '7-20 jours',
    setupFields: []
  },

  // Amérique Latine
  { 
    id: 'mercadolibre', 
    name: 'MercadoLibre', 
    logo: 'https://www.mercadolibre.com/favicon.ico', 
    category: 'general', 
    country: 'MX',
    shippingZones: ['south_america', 'usa'],
    popular: true,
    description: 'Plus grande marketplace d\'Amérique Latine',
    features: ['Amérique Latine', 'Multi-catégories', 'Paiements locaux', 'Logistique intégrée'],
    rating: 4.4,
    productsCount: 300000000,
    shippingTime: '5-20 jours',
    setupFields: []
  },
  { 
    id: 'americanas', 
    name: 'Americanas', 
    logo: 'https://www.americanas.com.br/favicon.ico', 
    category: 'general', 
    country: 'BR',
    shippingZones: ['south_america'],
    description: 'Grande marketplace brésilienne',
    features: ['Brésil', 'Électronique', 'Mode', 'Maison'],
    rating: 4.0,
    productsCount: 50000000,
    shippingTime: '7-25 jours',
    setupFields: []
  },
  { 
    id: 'buscape', 
    name: 'Buscapé', 
    logo: 'https://www.buscape.com.br/favicon.ico', 
    category: 'general', 
    country: 'BR',
    shippingZones: ['south_america'],
    description: 'Comparateur et marketplace brésilien',
    features: ['Comparateur prix', 'Multi-vendeurs', 'Brésil', 'Electronics'],
    rating: 3.9,
    productsCount: 20000000,
    shippingTime: '7-20 jours',
    setupFields: []
  },

  // Asie du Sud-Est
  { 
    id: 'shopee', 
    name: 'Shopee', 
    logo: 'https://shopee.com/favicon.ico', 
    category: 'general', 
    country: 'SG',
    shippingZones: ['asia', 'worldwide'],
    popular: true,
    description: 'Leader du e-commerce en Asie du Sud-Est',
    features: ['Asie du Sud-Est', 'Prix bas', 'Multi-catégories', 'Livraison gratuite'],
    rating: 4.3,
    productsCount: 400000000,
    shippingTime: '10-25 jours',
    setupFields: []
  },
  { 
    id: 'lazada', 
    name: 'Lazada', 
    logo: 'https://www.lazada.com/favicon.ico', 
    category: 'general', 
    country: 'SG',
    shippingZones: ['asia'],
    popular: true,
    description: 'Marketplace Alibaba pour Asie du Sud-Est',
    features: ['Alibaba Group', 'Asie du Sud-Est', 'Multi-catégories', 'Fulfillment'],
    rating: 4.2,
    productsCount: 300000000,
    shippingTime: '10-20 jours',
    setupFields: []
  },
  { 
    id: 'tokopedia', 
    name: 'Tokopedia', 
    logo: 'https://www.tokopedia.com/favicon.ico', 
    category: 'general', 
    country: 'ID',
    shippingZones: ['asia'],
    description: 'Plus grande marketplace indonésienne',
    features: ['Indonésie', 'Multi-catégories', 'Artisanat local', 'Prix bas'],
    rating: 4.1,
    productsCount: 150000000,
    shippingTime: '10-25 jours',
    setupFields: []
  },

  // Royaume-Uni & Australie
  { 
    id: 'asos-marketplace', 
    name: 'ASOS Marketplace', 
    logo: 'https://marketplace.asos.com/favicon.ico', 
    category: 'fashion', 
    country: 'UK',
    shippingZones: ['uk', 'europe', 'worldwide'],
    popular: true,
    description: 'Marketplace mode vintage et designers indépendants',
    features: ['Mode vintage', 'Designers indie', 'UK based', 'Mode durable'],
    rating: 4.3,
    productsCount: 500000,
    shippingTime: '3-10 jours',
    setupFields: []
  },
  { 
    id: 'notonthehighstreet', 
    name: 'notonthehighstreet', 
    logo: 'https://www.notonthehighstreet.com/favicon.ico', 
    category: 'home', 
    country: 'UK',
    shippingZones: ['uk', 'europe'],
    description: 'Marketplace artisanal britannique avec produits uniques',
    features: ['Artisanat UK', 'Cadeaux uniques', 'Personnalisation', 'Fait main'],
    rating: 4.4,
    productsCount: 200000,
    shippingTime: '3-8 jours',
    setupFields: []
  },
  { 
    id: 'catch', 
    name: 'Catch.com.au', 
    logo: 'https://www.catch.com.au/favicon.ico', 
    category: 'general', 
    country: 'AU',
    shippingZones: ['australia'],
    popular: true,
    description: 'Leader australien du e-commerce discount',
    features: ['Australie', 'Deals quotidiens', 'Multi-catégories', 'Prix réduits'],
    rating: 4.2,
    productsCount: 2000000,
    shippingTime: '3-10 jours',
    setupFields: []
  },
  { 
    id: 'kogan', 
    name: 'Kogan', 
    logo: 'https://www.kogan.com/favicon.ico', 
    category: 'electronics', 
    country: 'AU',
    shippingZones: ['australia', 'worldwide'],
    description: 'Marketplace tech et électronique australien',
    features: ['Électronique', 'Prix bas', 'Marque propre', 'Australie'],
    rating: 4.0,
    productsCount: 500000,
    shippingTime: '5-15 jours',
    setupFields: []
  },

  // Canada
  { 
    id: 'canadianTire', 
    name: 'Canadian Tire', 
    logo: 'https://www.canadiantire.ca/favicon.ico', 
    category: 'home', 
    country: 'CA',
    shippingZones: ['canada', 'usa'],
    description: 'Grande enseigne canadienne multi-catégories',
    features: ['Canada', 'Auto', 'Maison', 'Sport'],
    rating: 4.1,
    productsCount: 150000,
    shippingTime: '3-10 jours',
    setupFields: []
  },
  { 
    id: 'bestbuy-ca', 
    name: 'Best Buy Canada', 
    logo: 'https://www.bestbuy.ca/favicon.ico', 
    category: 'electronics', 
    country: 'CA',
    shippingZones: ['canada'],
    description: 'Leader électronique au Canada',
    features: ['Électronique', 'Tech', 'Gaming', 'Canada'],
    rating: 4.3,
    productsCount: 200000,
    shippingTime: '2-7 jours',
    setupFields: []
  },

  // Dropshipping spécialisés supplémentaires
  { 
    id: 'eprolo', 
    name: 'Eprolo', 
    logo: 'https://www.eprolo.com/favicon.ico', 
    category: 'general', 
    country: 'CN',
    shippingZones: ['worldwide', 'usa', 'europe'],
    popular: true,
    description: 'Plateforme dropshipping gratuite avec branding',
    features: ['100% gratuit', 'Branding', 'Entrepôts US/EU', 'POD intégré'],
    rating: 4.3,
    productsCount: 300000,
    shippingTime: '7-15 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'dropified', 
    name: 'Dropified', 
    logo: 'https://www.dropified.com/favicon.ico', 
    category: 'general', 
    country: 'US',
    shippingZones: ['usa', 'worldwide'],
    description: 'Automatisation dropshipping avancée',
    features: ['Automatisation', 'Multi-sources', 'Import en 1 clic', 'Règles de pricing'],
    rating: 4.2,
    productsCount: 1000000,
    shippingTime: '5-20 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'inventory-source', 
    name: 'Inventory Source', 
    logo: 'https://www.inventorysource.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    shippingZones: ['usa', 'canada'],
    description: 'Automatisation avec 230+ fournisseurs intégrés',
    features: ['230+ fournisseurs', 'Sync automatique', 'US based', 'Multi-canaux'],
    rating: 4.1,
    productsCount: 2000000,
    shippingTime: '3-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'sunrise-wholesale', 
    name: 'Sunrise Wholesale', 
    logo: 'https://www.sunrisewholesalemerchandise.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    shippingZones: ['usa'],
    description: 'Grossiste US avec 30K+ produits et dropshipping intégré',
    features: ['30K+ produits', 'US fulfillment', 'Électronique', 'Maison'],
    rating: 4.0,
    productsCount: 30000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'worldwide-brands', 
    name: 'Worldwide Brands', 
    logo: 'https://www.worldwidebrands.com/favicon.ico', 
    category: 'wholesale', 
    country: 'US',
    shippingZones: ['worldwide'],
    premium: true,
    description: 'Annuaire premium de grossistes certifiés',
    features: ['Grossistes certifiés', '16M+ produits', 'Accès à vie', 'Support dédié'],
    rating: 4.4,
    productsCount: 16000000,
    shippingTime: 'Variable',
    setupFields: []
  },

  // Print on Demand supplémentaires
  { 
    id: 'tshirtgang', 
    name: 'T-Shirt Gang', 
    logo: 'https://tshirtgang.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    shippingZones: ['usa', 'worldwide'],
    description: 'POD spécialisé t-shirts avec fulfillment US rapide',
    features: ['T-shirts', 'Fulfillment rapide', 'Prix bas', 'US based'],
    rating: 4.1,
    productsCount: 100,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'mww', 
    name: 'MWW On Demand', 
    logo: 'https://mwwondemand.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    shippingZones: ['usa', 'worldwide'],
    description: 'POD premium avec produits maison et décoration',
    features: ['Décoration maison', 'Qualité premium', 'Custom packaging', 'US based'],
    rating: 4.3,
    productsCount: 300,
    shippingTime: '4-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'prodigi', 
    name: 'Prodigi', 
    logo: 'https://www.prodigi.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'UK',
    shippingZones: ['uk', 'europe', 'worldwide'],
    popular: true,
    description: 'POD global avec réseau de production dans 50+ pays',
    features: ['50+ pays', 'Éco-responsable', 'API puissante', 'Wall art'],
    rating: 4.5,
    productsCount: 400,
    shippingTime: '3-8 jours',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'sanmar', 
    name: 'SanMar', 
    logo: 'https://www.sanmar.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'US',
    shippingZones: ['usa', 'canada'],
    description: 'Distributeur vêtements blancs pour impression',
    features: ['Vêtements blancs', 'Marques premium', 'US based', 'B2B'],
    rating: 4.4,
    productsCount: 50000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Niche spécialisés
  { 
    id: 'oberlo', 
    name: 'Oberlo', 
    logo: 'https://oberlo.com/favicon.ico', 
    category: 'general', 
    country: 'US',
    shippingZones: ['worldwide'],
    description: 'App Shopify historique pour dropshipping (acquis par Shopify)',
    features: ['Intégration Shopify', 'Import facile', 'Produits tendance', 'Automatisation'],
    rating: 4.0,
    productsCount: 500000,
    shippingTime: '10-30 jours',
    setupFields: []
  },
  { 
    id: 'dser', 
    name: 'Dropship.io', 
    logo: 'https://dropship.io/favicon.ico', 
    category: 'general', 
    country: 'US',
    shippingZones: ['worldwide'],
    description: 'Outil de recherche produits winning avec données réelles',
    features: ['Produits winning', 'Analyse concurrence', 'Données ventes', 'Trends'],
    rating: 4.2,
    productsCount: 1000000,
    shippingTime: 'Variable',
    setupFields: []
  },
  { 
    id: 'sell-the-trend', 
    name: 'Sell The Trend', 
    logo: 'https://www.sellthetrend.com/favicon.ico', 
    category: 'general', 
    country: 'US',
    shippingZones: ['worldwide'],
    description: 'Plateforme all-in-one avec IA pour trouver produits gagnants',
    features: ['IA produits', 'Analyse tendances', 'Import automatique', 'Store builder'],
    rating: 4.3,
    productsCount: 2000000,
    shippingTime: 'Variable',
    setupFields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },

  // Européens supplémentaires
  { 
    id: 'allegro', 
    name: 'Allegro', 
    logo: 'https://allegro.pl/favicon.ico', 
    category: 'general', 
    country: 'PL',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace polonaise et d\'Europe Centrale',
    features: ['Pologne', 'Multi-catégories', 'Fulfillment', 'B2C/C2C'],
    rating: 4.4,
    productsCount: 135000000,
    shippingTime: '2-7 jours',
    setupFields: []
  },
  { 
    id: 'otto', 
    name: 'Otto', 
    logo: 'https://www.otto.de/favicon.ico', 
    category: 'general', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Deuxième plus grande marketplace allemande',
    features: ['Allemagne', 'Mode', 'Maison', 'Électronique'],
    rating: 4.3,
    productsCount: 10000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'kaufland', 
    name: 'Kaufland Marketplace', 
    logo: 'https://www.kaufland.de/favicon.ico', 
    category: 'general', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Marketplace du géant allemand de la distribution',
    features: ['Allemagne', 'Multi-catégories', 'Fulfillment', 'Base clients massive'],
    rating: 4.1,
    productsCount: 30000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'bol', 
    name: 'Bol.com', 
    logo: 'https://www.bol.com/favicon.ico', 
    category: 'general', 
    country: 'NL',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace du Benelux',
    features: ['Pays-Bas', 'Belgique', 'Fulfillment', 'Multi-catégories'],
    rating: 4.5,
    productsCount: 35000000,
    shippingTime: '1-3 jours',
    setupFields: []
  },
  { 
    id: 'cdiscount', 
    name: 'Cdiscount', 
    logo: 'https://www.cdiscount.com/favicon.ico', 
    category: 'general', 
    country: 'FR',
    shippingZones: ['europe'],
    popular: true,
    description: 'Deuxième marketplace français après Amazon',
    features: ['France', 'Prix bas', 'Multi-catégories', 'Fulfillment'],
    rating: 4.1,
    productsCount: 100000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'fnac', 
    name: 'Fnac Marketplace', 
    logo: 'https://www.fnac.com/favicon.ico', 
    category: 'electronics', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Marketplace tech et culture français',
    features: ['France', 'Tech', 'Culture', 'Livres'],
    rating: 4.2,
    productsCount: 20000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'manomano', 
    name: 'ManoMano', 
    logo: 'https://www.manomano.fr/favicon.ico', 
    category: 'home', 
    country: 'FR',
    shippingZones: ['europe'],
    popular: true,
    description: 'Spécialiste bricolage et maison en Europe',
    features: ['Bricolage', 'Jardin', 'Maison', 'Europe'],
    rating: 4.3,
    productsCount: 16000000,
    shippingTime: '3-7 jours',
    setupFields: []
  },

  // ========== FOURNISSEURS EUROPÉENS SUPPLÉMENTAIRES ==========
  
  // Suisse
  { 
    id: 'galaxus', 
    name: 'Galaxus', 
    logo: 'https://www.galaxus.ch/favicon.ico', 
    category: 'general', 
    country: 'CH',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace suisse avec qualité premium',
    features: ['Suisse', 'Qualité premium', 'Électronique', 'Multi-catégories'],
    rating: 4.6,
    productsCount: 6000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'digitec', 
    name: 'Digitec', 
    logo: 'https://www.digitec.ch/favicon.ico', 
    category: 'electronics', 
    country: 'CH',
    shippingZones: ['europe'],
    description: 'Leader tech et électronique en Suisse',
    features: ['Tech', 'Gaming', 'IT', 'Suisse'],
    rating: 4.7,
    productsCount: 500000,
    shippingTime: '1-3 jours',
    setupFields: []
  },

  // Autriche
  { 
    id: 'willhaben', 
    name: 'Willhaben', 
    logo: 'https://www.willhaben.at/favicon.ico', 
    category: 'general', 
    country: 'AT',
    shippingZones: ['europe'],
    description: 'Plus grande marketplace autrichienne',
    features: ['Autriche', 'Multi-catégories', 'Occasion & Neuf', 'Local'],
    rating: 4.2,
    productsCount: 8000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Belgique
  { 
    id: 'vanden-borre', 
    name: 'Vanden Borre', 
    logo: 'https://www.vandenborre.be/favicon.ico', 
    category: 'electronics', 
    country: 'BE',
    shippingZones: ['europe'],
    description: 'Leader électronique belge avec service premium',
    features: ['Électronique', 'Électroménager', 'Belgique', 'Installation'],
    rating: 4.3,
    productsCount: 50000,
    shippingTime: '1-3 jours',
    setupFields: []
  },
  { 
    id: 'coolblue', 
    name: 'Coolblue', 
    logo: 'https://www.coolblue.be/favicon.ico', 
    category: 'electronics', 
    country: 'BE',
    shippingZones: ['europe'],
    popular: true,
    description: 'E-commerce tech avec service client exceptionnel',
    features: ['Électronique', 'Service premium', 'Livraison rapide', 'Benelux'],
    rating: 4.7,
    productsCount: 100000,
    shippingTime: '1-2 jours',
    setupFields: []
  },

  // Scandinavie
  { 
    id: 'cdon', 
    name: 'CDON', 
    logo: 'https://cdon.com/favicon.ico', 
    category: 'general', 
    country: 'SE',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace nordique',
    features: ['Scandinavie', 'Multi-catégories', 'Mode', 'Électronique'],
    rating: 4.2,
    productsCount: 8000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'elgiganten', 
    name: 'Elgiganten', 
    logo: 'https://www.elgiganten.se/favicon.ico', 
    category: 'electronics', 
    country: 'SE',
    shippingZones: ['europe'],
    description: 'Leader électronique scandinave',
    features: ['Électronique', 'Suède', 'Danemark', 'Tech'],
    rating: 4.4,
    productsCount: 80000,
    shippingTime: '1-4 jours',
    setupFields: []
  },
  { 
    id: 'komplett', 
    name: 'Komplett', 
    logo: 'https://www.komplett.no/favicon.ico', 
    category: 'electronics', 
    country: 'NO',
    shippingZones: ['europe'],
    description: 'Leader e-commerce norvégien tech et gaming',
    features: ['Norvège', 'Gaming', 'IT', 'Électronique'],
    rating: 4.5,
    productsCount: 150000,
    shippingTime: '1-4 jours',
    setupFields: []
  },
  { 
    id: 'proshop', 
    name: 'Proshop', 
    logo: 'https://www.proshop.dk/favicon.ico', 
    category: 'electronics', 
    country: 'DK',
    shippingZones: ['europe'],
    description: 'Spécialiste tech et hardware danois',
    features: ['Danemark', 'Hardware', 'Gaming', 'Tech'],
    rating: 4.3,
    productsCount: 100000,
    shippingTime: '1-4 jours',
    setupFields: []
  },

  // Portugal
  { 
    id: 'worten', 
    name: 'Worten', 
    logo: 'https://www.worten.pt/favicon.ico', 
    category: 'electronics', 
    country: 'PT',
    shippingZones: ['europe'],
    description: 'Leader électronique portugais',
    features: ['Portugal', 'Électronique', 'Électroménager', 'Tech'],
    rating: 4.1,
    productsCount: 100000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'kuantokusta', 
    name: 'KuantoKusta', 
    logo: 'https://www.kuantokusta.pt/favicon.ico', 
    category: 'general', 
    country: 'PT',
    shippingZones: ['europe'],
    description: 'Comparateur et marketplace portugais',
    features: ['Portugal', 'Comparateur prix', 'Multi-catégories', 'Local'],
    rating: 4.0,
    productsCount: 5000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Irlande
  { 
    id: 'adverts', 
    name: 'Adverts.ie', 
    logo: 'https://www.adverts.ie/favicon.ico', 
    category: 'general', 
    country: 'IE',
    shippingZones: ['europe', 'uk'],
    description: 'Plus grande marketplace irlandaise',
    features: ['Irlande', 'Multi-catégories', 'Local', 'C2C/B2C'],
    rating: 4.0,
    productsCount: 2000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'currys-ie', 
    name: 'Currys Ireland', 
    logo: 'https://www.currys.ie/favicon.ico', 
    category: 'electronics', 
    country: 'IE',
    shippingZones: ['europe', 'uk'],
    description: 'Leader électronique irlandais',
    features: ['Irlande', 'Électronique', 'Électroménager', 'Tech'],
    rating: 4.2,
    productsCount: 50000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Grèce & Chypre
  { 
    id: 'skroutz', 
    name: 'Skroutz', 
    logo: 'https://www.skroutz.gr/favicon.ico', 
    category: 'general', 
    country: 'GR',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace grecque',
    features: ['Grèce', 'Comparateur', 'Multi-catégories', 'Chypre'],
    rating: 4.4,
    productsCount: 10000000,
    shippingTime: '2-6 jours',
    setupFields: []
  },

  // Europe de l'Est
  { 
    id: 'emag', 
    name: 'eMAG', 
    logo: 'https://www.emag.ro/favicon.ico', 
    category: 'general', 
    country: 'RO',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader e-commerce Europe de l\'Est (Roumanie, Hongrie, Bulgarie)',
    features: ['Europe Est', 'Multi-catégories', 'Fulfillment', 'Tech'],
    rating: 4.3,
    productsCount: 6000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'alza', 
    name: 'Alza', 
    logo: 'https://www.alza.cz/favicon.ico', 
    category: 'electronics', 
    country: 'CZ',
    shippingZones: ['europe'],
    popular: true,
    description: 'Plus grande marketplace tchèque spécialisée tech',
    features: ['Tchéquie', 'Slovaquie', 'Tech', 'Gaming'],
    rating: 4.5,
    productsCount: 1000000,
    shippingTime: '1-3 jours',
    setupFields: []
  },
  { 
    id: 'heureka', 
    name: 'Heureka', 
    logo: 'https://www.heureka.cz/favicon.ico', 
    category: 'general', 
    country: 'CZ',
    shippingZones: ['europe'],
    description: 'Comparateur et marketplace tchèque',
    features: ['Tchéquie', 'Slovaquie', 'Comparateur', 'Multi-catégories'],
    rating: 4.2,
    productsCount: 15000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'mall', 
    name: 'Mall.cz', 
    logo: 'https://www.mall.cz/favicon.ico', 
    category: 'general', 
    country: 'CZ',
    shippingZones: ['europe'],
    description: 'Marketplace généraliste tchèque',
    features: ['Tchéquie', 'Multi-catégories', 'Électronique', 'Maison'],
    rating: 4.1,
    productsCount: 2000000,
    shippingTime: '2-4 jours',
    setupFields: []
  },

  // Grossistes mode européens
  { 
    id: 'brandalley', 
    name: 'BrandAlley', 
    logo: 'https://www.brandalley.fr/favicon.ico', 
    category: 'fashion', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Ventes privées mode et maison en France',
    features: ['Ventes privées', 'Mode', 'Marques', 'France'],
    rating: 4.2,
    productsCount: 500000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'veepee', 
    name: 'Veepee', 
    logo: 'https://www.veepee.fr/favicon.ico', 
    category: 'fashion', 
    country: 'FR',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader européen des ventes privées',
    features: ['Ventes privées', 'Marques premium', 'Mode', 'Maison'],
    rating: 4.3,
    productsCount: 3000000,
    shippingTime: '5-12 jours',
    setupFields: []
  },
  { 
    id: 'showroomprive', 
    name: 'Showroomprivé', 
    logo: 'https://www.showroomprive.com/favicon.ico', 
    category: 'fashion', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Ventes flash mode et déco',
    features: ['Ventes flash', 'Mode', 'Déco', 'Marques'],
    rating: 4.1,
    productsCount: 1000000,
    shippingTime: '5-10 jours',
    setupFields: []
  },
  { 
    id: 'zalando', 
    name: 'Zalando Partner Program', 
    logo: 'https://www.zalando.fr/favicon.ico', 
    category: 'fashion', 
    country: 'DE',
    shippingZones: ['europe'],
    popular: true,
    premium: true,
    description: 'Leader mode européen avec programme partenaire',
    features: ['Mode', 'Chaussures', '25+ pays', 'Fulfillment'],
    rating: 4.6,
    productsCount: 500000,
    shippingTime: '2-5 jours',
    setupFields: [
      { name: 'partner_id', label: 'Partner ID', type: 'text', required: true },
      { name: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  { 
    id: 'aboutyou', 
    name: 'About You', 
    logo: 'https://www.aboutyou.de/favicon.ico', 
    category: 'fashion', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Marketplace mode allemand en croissance',
    features: ['Mode jeune', 'Allemagne', 'Europe', 'Tendances'],
    rating: 4.3,
    productsCount: 600000,
    shippingTime: '3-6 jours',
    setupFields: []
  },

  // Grossistes maison européens
  { 
    id: 'wayfair-eu', 
    name: 'Wayfair Europe', 
    logo: 'https://www.wayfair.de/favicon.ico', 
    category: 'home', 
    country: 'DE',
    shippingZones: ['europe', 'uk'],
    description: 'Wayfair pour le marché européen',
    features: ['Mobilier', 'Décoration', 'UK', 'Allemagne'],
    rating: 4.4,
    productsCount: 15000000,
    shippingTime: '3-10 jours',
    setupFields: []
  },
  { 
    id: 'home24', 
    name: 'Home24', 
    logo: 'https://www.home24.de/favicon.ico', 
    category: 'home', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Spécialiste mobilier et décoration allemand',
    features: ['Mobilier', 'Décoration', 'Allemagne', 'France'],
    rating: 4.2,
    productsCount: 400000,
    shippingTime: '3-8 jours',
    setupFields: []
  },
  { 
    id: 'westwing', 
    name: 'Westwing', 
    logo: 'https://www.westwing.fr/favicon.ico', 
    category: 'home', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Club shopping décoration et lifestyle',
    features: ['Décoration', 'Lifestyle', 'Ventes privées', 'Premium'],
    rating: 4.4,
    productsCount: 200000,
    shippingTime: '5-12 jours',
    setupFields: []
  },

  // Dropshipping spécialisé Europe
  { 
    id: 'printdeal', 
    name: 'Printdeal', 
    logo: 'https://www.printdeal.be/favicon.ico', 
    category: 'print_on_demand', 
    country: 'BE',
    shippingZones: ['europe'],
    description: 'Imprimerie en ligne pour produits marketing',
    features: ['Print', 'Marketing', 'Benelux', 'B2B'],
    rating: 4.1,
    productsCount: 5000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'flyeralarm', 
    name: 'Flyeralarm', 
    logo: 'https://www.flyeralarm.com/favicon.ico', 
    category: 'print_on_demand', 
    country: 'DE',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader imprimerie en ligne européen',
    features: ['Imprimerie', 'Marketing', 'Europe', 'Prix bas'],
    rating: 4.3,
    productsCount: 10000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'vistaprint-eu', 
    name: 'Vistaprint Europe', 
    logo: 'https://www.vistaprint.fr/favicon.ico', 
    category: 'print_on_demand', 
    country: 'NL',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader mondial impression personnalisée',
    features: ['Personnalisation', 'Marketing', 'Europe', 'Large catalogue'],
    rating: 4.2,
    productsCount: 8000,
    shippingTime: '3-8 jours',
    setupFields: []
  },

  // Sport & Outdoor Europe
  { 
    id: 'decathlon', 
    name: 'Decathlon Marketplace', 
    logo: 'https://www.decathlon.fr/favicon.ico', 
    category: 'sports', 
    country: 'FR',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader sport européen avec marketplace partenaire',
    features: ['Sport', 'Outdoor', 'Europe', 'Marques propres'],
    rating: 4.5,
    productsCount: 80000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'alltricks', 
    name: 'Alltricks', 
    logo: 'https://www.alltricks.fr/favicon.ico', 
    category: 'sports', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Spécialiste vélo et outdoor en Europe',
    features: ['Vélo', 'Running', 'Outdoor', 'Europe'],
    rating: 4.4,
    productsCount: 150000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'sportsdirect', 
    name: 'Sports Direct', 
    logo: 'https://www.sportsdirect.com/favicon.ico', 
    category: 'sports', 
    country: 'UK',
    shippingZones: ['europe', 'uk'],
    description: 'Géant du sport discount UK',
    features: ['Sport discount', 'Marques', 'UK', 'Europe'],
    rating: 4.0,
    productsCount: 500000,
    shippingTime: '3-7 jours',
    setupFields: []
  },

  // Tech & Électronique Europe
  { 
    id: 'mediamarkt', 
    name: 'MediaMarkt Marketplace', 
    logo: 'https://www.mediamarkt.de/favicon.ico', 
    category: 'electronics', 
    country: 'DE',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader électronique européen avec marketplace',
    features: ['Électronique', 'Allemagne', 'Espagne', 'Italie'],
    rating: 4.3,
    productsCount: 2000000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'saturn', 
    name: 'Saturn', 
    logo: 'https://www.saturn.de/favicon.ico', 
    category: 'electronics', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Chaîne électronique allemande (groupe MediaMarkt)',
    features: ['Électronique', 'Tech', 'Allemagne', 'Autriche'],
    rating: 4.2,
    productsCount: 500000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'boulanger', 
    name: 'Boulanger', 
    logo: 'https://www.boulanger.com/favicon.ico', 
    category: 'electronics', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Leader électroménager français',
    features: ['Électroménager', 'Tech', 'France', 'Service'],
    rating: 4.4,
    productsCount: 100000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'darty', 
    name: 'Darty Marketplace', 
    logo: 'https://www.darty.com/favicon.ico', 
    category: 'electronics', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Marketplace électronique et électroménager',
    features: ['Électronique', 'Électroménager', 'France', 'SAV'],
    rating: 4.2,
    productsCount: 3000000,
    shippingTime: '2-6 jours',
    setupFields: []
  },
  { 
    id: 'conrad', 
    name: 'Conrad Electronic', 
    logo: 'https://www.conrad.fr/favicon.ico', 
    category: 'electronics', 
    country: 'DE',
    shippingZones: ['europe'],
    description: 'Spécialiste composants électroniques et tech B2B',
    features: ['Composants', 'Tech', 'B2B', 'Allemagne'],
    rating: 4.3,
    productsCount: 750000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Beauté Europe
  { 
    id: 'lookfantastic', 
    name: 'Lookfantastic', 
    logo: 'https://www.lookfantastic.fr/favicon.ico', 
    category: 'beauty', 
    country: 'UK',
    shippingZones: ['europe', 'uk', 'worldwide'],
    popular: true,
    description: 'Leader beauté en ligne européen',
    features: ['Beauté', 'Cosmétiques', 'Marques premium', 'Europe'],
    rating: 4.5,
    productsCount: 22000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'feelunique', 
    name: 'Feelunique', 
    logo: 'https://www.feelunique.com/favicon.ico', 
    category: 'beauty', 
    country: 'UK',
    shippingZones: ['europe', 'uk'],
    description: 'Retailer beauté premium UK',
    features: ['Beauté premium', 'Parfums', 'Soins', 'UK'],
    rating: 4.3,
    productsCount: 35000,
    shippingTime: '3-7 jours',
    setupFields: []
  },
  { 
    id: 'nocibe', 
    name: 'Nocibé', 
    logo: 'https://www.nocibe.fr/favicon.ico', 
    category: 'beauty', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Chaîne parfumerie française',
    features: ['Parfumerie', 'Cosmétiques', 'France', 'Marques'],
    rating: 4.1,
    productsCount: 20000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
  { 
    id: 'douglas', 
    name: 'Douglas', 
    logo: 'https://www.douglas.de/favicon.ico', 
    category: 'beauty', 
    country: 'DE',
    shippingZones: ['europe'],
    popular: true,
    description: 'Leader parfumerie et beauté en Europe',
    features: ['Parfumerie', 'Beauté', 'Allemagne', 'Europe'],
    rating: 4.4,
    productsCount: 50000,
    shippingTime: '2-5 jours',
    setupFields: []
  },

  // Alimentaire & Épicerie Europe
  { 
    id: 'kazidomi', 
    name: 'Kazidomi', 
    logo: 'https://www.kazidomi.com/favicon.ico', 
    category: 'food', 
    country: 'BE',
    shippingZones: ['europe'],
    description: 'Épicerie bio et healthy en ligne',
    features: ['Bio', 'Healthy', 'Belgique', 'France'],
    rating: 4.3,
    productsCount: 4000,
    shippingTime: '3-5 jours',
    setupFields: []
  },
  { 
    id: 'greenweez', 
    name: 'Greenweez', 
    logo: 'https://www.greenweez.com/favicon.ico', 
    category: 'food', 
    country: 'FR',
    shippingZones: ['europe'],
    description: 'Leader e-commerce bio en France',
    features: ['Bio', 'Éco-responsable', 'France', 'Large catalogue'],
    rating: 4.4,
    productsCount: 30000,
    shippingTime: '2-5 jours',
    setupFields: []
  },
]

// Utiliser ALL_SUPPLIERS comme source unique (plus de doublons)
const wise2syncConverted = convertAllSuppliers()

// Dédupliquer uniquement les VRAIS doublons (même fournisseur), sans fusionner des marketplaces
// qui partagent le même nom (ex: eMAG par pays / variante).
const deduplicateSuppliers = (suppliers: SupplierDefinition[]): SupplierDefinition[] => {
  const scoreSupplier = (s: SupplierDefinition) => {
    const rating = typeof s.rating === 'number' ? s.rating : 0
    const products = typeof s.productsCount === 'number' ? s.productsCount : 0
    const descLen = s.description?.length ?? 0
    const featuresLen = s.features?.length ?? 0

    return (
      (s.popular ? 20 : 0) +
      (s.premium ? 10 : 0) +
      rating * 5 +
      Math.min(products / 100000, 10) +
      Math.min(descLen / 80, 5) +
      Math.min(featuresLen, 10)
    )
  }

  // Clé = id normalisé + pays (évite de supprimer des variantes par pays)
  const seen = new Map<string, SupplierDefinition>()

  for (const supplier of suppliers) {
    const normalizedId = supplier.id.toLowerCase().replace(/[-_\s]/g, '')
    const normalizedCountry = supplier.country?.toLowerCase().trim() || 'xx'
    const key = `${normalizedId}|${normalizedCountry}`

    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, supplier)
      continue
    }

    // Garder la “meilleure” fiche quand on détecte un vrai doublon
    if (scoreSupplier(supplier) > scoreSupplier(existing)) {
      seen.set(key, supplier)
    }
  }

  return Array.from(seen.values())
}

// Fusionner et dédupliquer
const mergedSuppliers = [...supplierDefinitions, ...wise2syncConverted]
const allSupplierDefinitions: SupplierDefinition[] = deduplicateSuppliers(mergedSuppliers)

// Mapping pays vers drapeaux emoji
const countryFlags: Record<string, string> = {
  'CN': '🇨🇳',
  'US': '🇺🇸',
  'ES': '🇪🇸',
  'IT': '🇮🇹',
  'NL': '🇳🇱',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'UK': '🇬🇧',
  'GB': '🇬🇧',
  'PL': '🇵🇱',
  'HU': '🇭🇺',
  'NZ': '🇳🇿',
  'AU': '🇦🇺',
  'NO': '🇳🇴',
  'CA': '🇨🇦',
  'JP': '🇯🇵',
  'KR': '🇰🇷',
  'BR': '🇧🇷',
  'MX': '🇲🇽',
  'IN': '🇮🇳',
  'SG': '🇸🇬',
  'HK': '🇭🇰',
  'TW': '🇹🇼',
  'SE': '🇸🇪',
  'DK': '🇩🇰',
  'BE': '🇧🇪',
  'AT': '🇦🇹',
  'CH': '🇨🇭',
  'PT': '🇵🇹',
  'IE': '🇮🇪',
  'GR': '🇬🇷',
  'RO': '🇷🇴',
  'CZ': '🇨🇿',
  'ID': '🇮🇩',
  'MY': '🇲🇾',
  'TH': '🇹🇭',
  'VN': '🇻🇳',
  'PH': '🇵🇭',
  'TR': '🇹🇷',
  'FI': '🇫🇮',
  'SK': '🇸🇰',
  'HR': '🇭🇷',
  'BG': '🇧🇬',
  'SI': '🇸🇮',
  'LT': '🇱🇹',
  'LV': '🇱🇻',
  'EE': '🇪🇪',
  'LU': '🇱🇺',
}

// Composant Modal de configuration
function SupplierConfigModal({ 
  definition, 
  existingSupplier,
  onClose,
  onConnect,
  isConnecting
}: { 
  definition: SupplierDefinition
  existingSupplier?: Supplier
  onClose: () => void
  onConnect: (data: any) => void
  isConnecting: boolean
}) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(true)
  const isEditing = !!existingSupplier
  const handleSubmit = useCallback(() => {
    onConnect({
      name: definition.name,
      website: `https://${definition.id}.com`,
      country: definition.country,
      status: isActive ? 'active' : 'inactive',
      rating: definition.rating,
      credentials: formData
    })
  }, [definition, formData, isActive, onConnect])

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <SupplierLogo 
            name={definition.name}
            logo={definition.logo}
            country={definition.country}
            size="md"
          />
          {isEditing ? `Configurer ${definition.name}` : `Connecter ${definition.name}`}
          {definition.premium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          {definition.description}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="connection" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Connexion</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
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
              <p className="font-medium">Connexion manuelle requise</p>
              <p className="text-sm mt-2">Visitez le site du fournisseur pour créer un compte et obtenir vos identifiants API.</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href={`https://${definition.id}.com`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visiter {definition.name}
                </a>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="font-medium">Activer le fournisseur</p>
              <p className="text-sm text-muted-foreground">Synchroniser automatiquement les produits</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </TabsContent>

        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Pays
                </div>
                <p className="font-medium">{countryFlags[definition.country]} {definition.country}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Star className="w-4 h-4" />
                  Note
                </div>
                <p className="font-medium">{definition.rating?.toFixed(1) || 'N/A'} / 5</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  Produits
                </div>
                <p className="font-medium">{definition.productsCount?.toLocaleString() || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Truck className="w-4 h-4" />
                  Livraison
                </div>
                <p className="font-medium">{definition.shippingTime || 'Variable'}</p>
              </CardContent>
            </Card>
          </div>

          {definition.features && definition.features.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-3">Fonctionnalités incluses :</p>
              <div className="flex flex-wrap gap-2">
                {definition.features.map(feature => (
                  <Badge key={feature} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          )}

          {definition.minOrder !== undefined && definition.minOrder > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                Quantité minimum de commande : {definition.minOrder} unités
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={isConnecting}>
          {isConnecting ? 'Connexion...' : (isEditing ? 'Mettre à jour' : 'Connecter')}
        </Button>
      </div>
    </DialogContent>
  )
}

// Composant Card fournisseur connecté
function ConnectedSupplierCard({ 
  supplier,
  definition,
  onConfigure,
  onSync,
  onDelete,
  isSyncing
}: { 
  supplier: Supplier
  definition?: SupplierDefinition
  onConfigure: () => void
  onSync: () => void
  onDelete: () => void
  isSyncing: boolean
}) {
  const isActive = supplier.status === 'active'
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isActive ? "border-green-500/30 bg-green-500/5" : "border-muted"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <SupplierLogo 
              name={supplier.name || definition?.name || 'Unknown'}
              logo={definition?.logo}
              country={supplier.country || definition?.country}
              size="lg"
              className="border"
            />
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {supplier.name}
                {countryFlags[supplier.country || '']}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? 'Actif' : 'Inactif'}
                </Badge>
                {supplier.rating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {supplier.rating}
                  </span>
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
              <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                Synchroniser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Configurer
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={supplier.website || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visiter le site
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {definition?.features && (
          <div className="flex flex-wrap gap-1 mt-3">
            {definition.features.slice(0, 3).map(feature => (
              <span key={feature} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {feature}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Composant Card fournisseur disponible
function SupplierCard({ 
  definition, 
  isConnected,
  onClick 
}: { 
  definition: SupplierDefinition
  isConnected: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer rounded-xl border bg-card p-4 transition-all",
        "hover:shadow-lg hover:border-primary/50",
        isConnected && "ring-2 ring-green-500/50 bg-green-500/5"
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-1">
        {isConnected && (
          <Badge className="bg-green-600 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connecté
          </Badge>
        )}
        {definition.popular && !isConnected && (
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Populaire
          </Badge>
        )}
        {definition.premium && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>

      {/* Logo et nom */}
      <div className="flex items-center gap-3 mb-3">
        <SupplierLogo 
          name={definition.name}
          logo={definition.logo}
          country={definition.country}
          size="lg"
        />
        <div>
          <h3 className="font-medium">{definition.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{countryFlags[definition.country]}</span>
            {definition.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {definition.rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {definition.description}
      </p>

      {/* Infos rapides */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {definition.productsCount && (
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {definition.productsCount >= 1000000 
              ? `${(definition.productsCount / 1000000).toFixed(0)}M+` 
              : definition.productsCount >= 1000 
                ? `${(definition.productsCount / 1000).toFixed(0)}K+`
                : definition.productsCount}
          </span>
        )}
        {definition.shippingTime && (
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {definition.shippingTime}
          </span>
        )}
      </div>

      {/* Features */}
      {definition.features && (
        <div className="flex flex-wrap gap-1">
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

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  )
}

// Page principale
export default function ChannableStyleSuppliersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const prefersReducedMotion = useReducedMotion()
  const { 
    suppliers, 
    stats, 
    isLoading,
    addSupplier,
    deleteSupplier,
    isAdding,
    isDeleting
  } = useRealSuppliers()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedShippingZone, setSelectedShippingZone] = useState('all')
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'rating' | 'products'>('popular')
  const [selectedDefinition, setSelectedDefinition] = useState<SupplierDefinition | null>(null)
  const [activeView, setActiveView] = useState<'all' | 'connected'>('all')
  
  // Nouveaux états pour les composants avancés
  const [activeTab, setActiveTab] = useState<'catalog' | 'analytics' | 'sync'>('catalog')
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [selectedSupplierForConnection, setSelectedSupplierForConnection] = useState<{ id: string; name: string } | null>(null)
  const [selectedSupplierForSync, setSelectedSupplierForSync] = useState<{ id: string; name: string } | null>(null)
  
  // Hook realtime pour notifications
  const { activeJobs, unreadNotifications, markAllAsRead, getSyncStatus } = useSupplierRealtime()
  const activeSyncJobs = Array.from(activeJobs.values())

  // Trouver le fournisseur connecté correspondant à une définition
  const findConnectedSupplier = useCallback((definitionId: string): Supplier | undefined => {
    return suppliers.find(s => 
      s.name?.toLowerCase() === definitionId.toLowerCase() ||
      s.name?.toLowerCase().includes(definitionId.toLowerCase()) ||
      s.website?.toLowerCase().includes(definitionId.toLowerCase())
    )
  }, [suppliers])

  // Trouver la définition pour un fournisseur connecté
  const findDefinitionForSupplier = useCallback((supplier: Supplier): SupplierDefinition | undefined => {
    return allSupplierDefinitions.find(def => 
      def.id.toLowerCase() === supplier.name?.toLowerCase() ||
      def.name.toLowerCase() === supplier.name?.toLowerCase() ||
      supplier.website?.toLowerCase().includes(def.id.toLowerCase())
    )
  }, [])

  // Filtrage et tri
  const filteredSuppliers = useMemo(() => {
    let result = allSupplierDefinitions.filter(def => {
      const matchesSearch = def.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (def.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           def.country.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory === 'all' || def.category === activeCategory
      const matchesCountry = selectedCountry === 'all' || def.country === selectedCountry
      const matchesShippingZone = selectedShippingZone === 'all' || 
                                  def.shippingZones?.includes(selectedShippingZone as any) ||
                                  (selectedShippingZone === 'worldwide' && !def.shippingZones)
      return matchesSearch && matchesCategory && matchesCountry && matchesShippingZone
    })

    // Tri
    if (sortBy === 'popular') {
      result = result.sort((a, b) => {
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        return (b.rating || 0) - (a.rating || 0)
      })
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'rating') {
      result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'products') {
      result = result.sort((a, b) => (b.productsCount || 0) - (a.productsCount || 0))
    }

    return result
  }, [searchTerm, activeCategory, selectedCountry, selectedShippingZone, sortBy])

  // Compteurs pour les filtres
  const uniqueCountries = useMemo(() => {
    const countries = new Set(allSupplierDefinitions.map(d => d.country))
    return Array.from(countries).sort()
  }, [])

  const handleConnect = useCallback((data: any) => {
    addSupplier(data)
    setSelectedDefinition(null)
  }, [addSupplier])

  const handleSync = useCallback((supplierId: string, supplierName?: string) => {
    // Ouvrir le gestionnaire de sync avec le fournisseur sélectionné
    setSelectedSupplierForSync({ id: supplierId, name: supplierName || 'Fournisseur' })
    setActiveTab('sync')
  }, [])
  
  const handleOpenConnection = useCallback((supplierId: string, supplierName: string) => {
    setSelectedSupplierForConnection({ id: supplierId, name: supplierName })
    setConnectionDialogOpen(true)
  }, [])

  const handleDelete = useCallback((supplierId: string) => {
    deleteSupplier(supplierId)
  }, [deleteSupplier])

  // Unique countries count for stats
  const countriesCount = uniqueCountries.length

  // Total products estimation
  const totalProducts = useMemo(() => {
    return allSupplierDefinitions.reduce((acc, def) => acc + (def.productsCount || 0), 0)
  }, [])

  return (
    <ChannablePageLayout
      title="Fournisseurs Dropshipping"
      metaTitle="Fournisseurs Dropshipping"
      metaDescription="Découvrez 150+ fournisseurs dropshipping vérifiés. AliExpress, CJ Dropshipping, Spocket, BigBuy et bien plus."
      showBackButton={false}
      maxWidth="2xl"
      padding="md"
    >
      <ChannableHeroSection
        badge={{ label: `${allSupplierDefinitions.length}+ Fournisseurs Vérifiés`, icon: Sparkles }}
        title="Fournisseurs Dropshipping"
        subtitle="Connectez-vous aux meilleurs fournisseurs dropshipping du monde. Import automatique, sync en temps réel, livraison rapide."
        stats={[
          { label: 'Fournisseurs', value: allSupplierDefinitions.length.toString(), icon: Package },
          { label: 'Pays', value: `${countriesCount}+`, icon: Globe },
          { label: 'Connectés', value: stats.active.toString(), icon: CheckCircle2 },
          { label: 'Produits', value: totalProducts >= 1000000000 ? `${(totalProducts / 1000000000).toFixed(0)}B+` : `${(totalProducts / 1000000).toFixed(0)}M+`, icon: Star }
        ]}
        primaryAction={{
          label: "Ajouter un fournisseur",
          onClick: () => setActiveCategory('all'),
          icon: Plus
        }}
        secondaryAction={{
          label: "Gérer mes fournisseurs",
          onClick: () => navigate('/suppliers/my')
        }}
      />
      
      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Catalogue</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2 relative">
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Synchronisation</span>
            {activeSyncJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Indicateur de notifications */}
        {unreadNotifications > 0 && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{unreadNotifications} nouvelle{unreadNotifications > 1 ? 's' : ''} notification{unreadNotifications > 1 ? 's' : ''}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          </div>
        )}
        
        <TabsContent value="catalog" className="mt-6">

      <div className="space-y-8">
          {/* Connected Suppliers Section */}
          {suppliers.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PlugZap className="w-5 h-5 text-green-500" />
                  Vos Fournisseurs ({suppliers.length})
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/suppliers/my')}>
                  Gérer tout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suppliers.slice(0, 4).map(supplier => (
                  <ConnectedSupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    definition={findDefinitionForSupplier(supplier)}
                    onConfigure={() => {
                      const def = findDefinitionForSupplier(supplier)
                      if (def) setSelectedDefinition(def)
                    }}
                    onSync={() => handleSync(supplier.id)}
                    onDelete={() => handleDelete(supplier.id)}
                    isSyncing={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Country Filter */}
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Shipping Zone Filter */}
            <Select value={selectedShippingZone} onValueChange={setSelectedShippingZone}>
              <SelectTrigger className="w-48">
                <Ship className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Zone d'expédition" />
              </SelectTrigger>
              <SelectContent>
                {shippingZones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    <span className="flex items-center gap-2">
                      <zone.icon className="w-4 h-4" />
                      {zone.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="rating">Meilleures notes</SelectItem>
                <SelectItem value="products">Plus de produits</SelectItem>
                <SelectItem value="name">Alphabétique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(selectedCountry !== 'all' || selectedShippingZone !== 'all' || activeCategory !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              {activeCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === activeCategory)?.label}
                  <button 
                    onClick={() => setActiveCategory('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCountry !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {countryOptions.find(c => c.id === selectedCountry)?.label}
                  <button 
                    onClick={() => setSelectedCountry('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedShippingZone !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {shippingZones.find(z => z.id === selectedShippingZone)?.label}
                  <button 
                    onClick={() => setSelectedShippingZone('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setActiveCategory('all')
                  setSelectedCountry('all')
                  setSelectedShippingZone('all')
                }}
              >
                Réinitialiser
              </Button>
            </div>
          )}

          {/* Categories */}
          <ScrollArea className="w-full pb-4 mb-6">
            <div className="flex gap-2">
              {categories.map(category => {
                const Icon = category.icon
                const isActive = activeCategory === category.id
                const count = category.id === 'all' 
                  ? allSupplierDefinitions.length 
                  : allSupplierDefinitions.filter(d => d.category === category.id).length
                
                return (
                  <Button
                    key={category.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "whitespace-nowrap gap-2",
                      isActive && "shadow-md"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                    <Badge variant={isActive ? "secondary" : "outline"} className="ml-1 text-xs">
                      {count}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''} trouvé{filteredSuppliers.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Suppliers Grid */}
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredSuppliers.map(definition => (
                <SupplierCard
                  key={definition.id}
                  definition={definition}
                  isConnected={!!findConnectedSupplier(definition.id)}
                  onClick={() => setSelectedDefinition(definition)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun fournisseur trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>

        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <AdvancedSupplierAnalytics />
        </TabsContent>
        
        <TabsContent value="sync" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Liste des fournisseurs connectés pour sync */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlugZap className="w-5 h-5 text-green-500" />
                  Fournisseurs Connectés
                </CardTitle>
                <CardDescription>
                  Sélectionnez un fournisseur pour gérer sa synchronisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun fournisseur connecté</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('catalog')}
                    >
                      Parcourir le catalogue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suppliers.map(supplier => {
                      const isSelected = selectedSupplierForSync?.id === supplier.id
                      const hasActiveSync = activeSyncJobs.some(
                        job => job.supplier_id === supplier.id && job.status === 'running'
                      )
                      
                      return (
                        <div
                          key={supplier.id}
                          onClick={() => setSelectedSupplierForSync({ id: supplier.id, name: supplier.name || 'Fournisseur' })}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium">{supplier.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasActiveSync && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                  <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                                  Sync
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenConnection(supplier.id, supplier.name || '')
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Gestionnaire de sync pour le fournisseur sélectionné */}
            {selectedSupplierForSync ? (
              <SupplierSyncManager 
                supplierId={selectedSupplierForSync.id}
                supplierName={selectedSupplierForSync.name}
              />
            ) : (
              <Card className="flex items-center justify-center min-h-[300px]">
                <div className="text-center text-muted-foreground">
                  <RefreshCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sélectionnez un fournisseur pour gérer sa synchronisation</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Config Modal */}
      <Dialog open={!!selectedDefinition} onOpenChange={() => setSelectedDefinition(null)}>
        {selectedDefinition && (
          <SupplierConfigModal
            definition={selectedDefinition}
            existingSupplier={findConnectedSupplier(selectedDefinition.id)}
            onClose={() => setSelectedDefinition(null)}
            onConnect={handleConnect}
            isConnecting={isAdding}
          />
        )}
      </Dialog>
      
      {/* Dialog de connexion API */}
      {selectedSupplierForConnection && (
        <SupplierConnectionDialog
          open={connectionDialogOpen}
          onOpenChange={setConnectionDialogOpen}
          supplier={{
            id: selectedSupplierForConnection.id,
            name: selectedSupplierForConnection.name
          }}
        />
      )}
    </ChannablePageLayout>
  )
}
