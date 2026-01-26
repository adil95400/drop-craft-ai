/**
 * Page de connexion de canal - Style Channable Premium
 * Design épuré avec catégories, recherche et flux guidé
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Store, ArrowLeft, ArrowRight, CheckCircle2, Settings, Link2,
  ShoppingCart, Loader2, AlertCircle, ExternalLink, Package, Zap,
  Globe, Shield, RefreshCw, HelpCircle, Key, Search, Sparkles,
  ShoppingBag, Tag, TrendingUp, X, Check, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { PlatformLogo } from '@/components/ui/platform-logo'

// Platform categories
const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: Globe },
  { id: 'store', label: 'Boutiques', icon: Store },
  { id: 'marketplace', label: 'Marketplaces', icon: ShoppingBag },
  { id: 'advertising', label: 'Publicité', icon: TrendingUp },
] as const

// All platforms configuration
const PLATFORMS_CONFIG: Record<string, PlatformConfig> = {
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    color: '#95BF47',
    category: 'store',
    description: 'Boutique e-commerce complète',
    longDescription: 'Synchronisez automatiquement vos produits, commandes et inventaire avec Shopify.',
    fields: [
      { key: 'shop_domain', label: 'Domaine de la boutique', placeholder: 'votre-boutique.myshopify.com', required: true },
      { key: 'access_token', label: 'Token d\'accès API', placeholder: 'shpat_xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://help.shopify.com/fr/manual/apps/custom-apps',
    features: ['Sync bidirectionnelle', 'Webhooks temps réel', 'Gestion multi-boutiques'],
    popular: true,
  },
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    color: '#96588A',
    category: 'store',
    description: 'WordPress e-commerce',
    longDescription: 'Connectez votre boutique WordPress/WooCommerce pour une synchronisation complète.',
    fields: [
      { key: 'shop_url', label: 'URL de votre boutique', placeholder: 'https://votre-site.com', required: true },
      { key: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_xxxxx', required: true, secret: true },
      { key: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://woocommerce.com/document/woocommerce-rest-api/',
    features: ['REST API', 'Catégories & attributs', 'Variations produits'],
    popular: true,
  },
  prestashop: {
    id: 'prestashop',
    name: 'PrestaShop',
    color: '#DF0067',
    category: 'store',
    description: 'Solution e-commerce open source',
    longDescription: 'Intégrez PrestaShop pour gérer vos produits et commandes depuis ShopOpti.',
    fields: [
      { key: 'shop_url', label: 'URL de votre boutique', placeholder: 'https://votre-boutique.com', required: true },
      { key: 'api_key', label: 'Clé API Webservice', placeholder: 'XXXXXXXXXXXXX', required: true, secret: true },
    ],
    helpUrl: 'https://doc.prestashop.com/display/PS17/Webservice',
    features: ['Webservice API', 'Multi-boutiques', 'Catégories'],
  },
  magento: {
    id: 'magento',
    name: 'Magento',
    color: '#EE672F',
    category: 'store',
    description: 'E-commerce entreprise',
    longDescription: 'Puissante intégration Magento pour les grandes entreprises.',
    fields: [
      { key: 'shop_url', label: 'URL Magento', placeholder: 'https://votre-boutique.com', required: true },
      { key: 'access_token', label: 'Token d\'accès', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://devdocs.magento.com/',
    features: ['REST API', 'Multi-stores', 'B2B Support'],
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    color: '#FF9900',
    category: 'marketplace',
    description: 'Leader mondial e-commerce',
    longDescription: 'Vendez sur Amazon avec synchronisation automatique des stocks et commandes.',
    fields: [
      { key: 'seller_id', label: 'ID Vendeur', placeholder: 'A1XXXXXXXXX', required: true },
      { key: 'mws_auth_token', label: 'Token MWS', placeholder: 'amzn.mws.xxxxx', required: true, secret: true },
      { key: 'marketplace_id', label: 'ID Marketplace', placeholder: 'A13V1IB3VIYZZH', required: true },
    ],
    helpUrl: 'https://sellercentral.amazon.fr/',
    features: ['SP-API', 'FBA Support', 'Multi-marchés'],
    popular: true,
  },
  ebay: {
    id: 'ebay',
    name: 'eBay',
    color: '#E53238',
    category: 'marketplace',
    description: 'Marketplace mondiale',
    longDescription: 'Publiez et gérez vos annonces eBay directement depuis ShopOpti.',
    fields: [
      { key: 'app_id', label: 'App ID (Client ID)', placeholder: 'Votre-App-ID', required: true },
      { key: 'cert_id', label: 'Cert ID', placeholder: 'Votre-Cert-ID', required: true, secret: true },
      { key: 'dev_id', label: 'Dev ID', placeholder: 'Votre-Dev-ID', required: true },
      { key: 'oauth_token', label: 'Token OAuth', placeholder: 'v^1.1#xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://developer.ebay.com/',
    features: ['Trading API', 'Promotions', 'Enchères'],
    popular: true,
  },
  etsy: {
    id: 'etsy',
    name: 'Etsy',
    color: '#F56400',
    category: 'marketplace',
    description: 'Artisanat & créations',
    longDescription: 'Synchronisez votre boutique Etsy pour les produits faits main et vintage.',
    fields: [
      { key: 'shop_id', label: 'ID Boutique Etsy', placeholder: 'votre-boutique', required: true },
      { key: 'api_key', label: 'Clé API', placeholder: 'xxxxx', required: true, secret: true },
      { key: 'shared_secret', label: 'Shared Secret', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://www.etsy.com/developers/',
    features: ['OAuth 2.0', 'Listings', 'Reviews'],
  },
  google: {
    id: 'google',
    name: 'Google Shopping',
    color: '#4285F4',
    category: 'advertising',
    description: 'Google Merchant Center',
    longDescription: 'Publiez vos produits sur Google Shopping pour plus de visibilité.',
    fields: [
      { key: 'merchant_id', label: 'ID Marchand', placeholder: '123456789', required: true },
      { key: 'service_account', label: 'Compte de service (JSON)', placeholder: '{"type": "service_account"...}', required: true, secret: true, multiline: true },
    ],
    helpUrl: 'https://merchants.google.com/',
    features: ['Content API', 'Free Listings', 'Shopping Ads'],
    popular: true,
  },
  facebook: {
    id: 'facebook',
    name: 'Meta Commerce',
    color: '#1877F2',
    category: 'advertising',
    description: 'Facebook & Instagram Shops',
    longDescription: 'Vendez directement sur Facebook et Instagram avec catalogue synchronisé.',
    fields: [
      { key: 'page_id', label: 'ID Page Facebook', placeholder: '123456789', required: true },
      { key: 'access_token', label: 'Token d\'accès', placeholder: 'EAAxxxxx', required: true, secret: true },
      { key: 'catalog_id', label: 'ID Catalogue', placeholder: '987654321', required: true },
    ],
    helpUrl: 'https://business.facebook.com/',
    features: ['Catalog API', 'Instagram Shopping', 'Dynamic Ads'],
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop',
    color: '#000000',
    category: 'marketplace',
    description: 'Social commerce',
    longDescription: 'Vendez directement sur TikTok avec Live Shopping et affiliés.',
    fields: [
      { key: 'shop_id', label: 'ID Boutique TikTok', placeholder: 'xxxxx', required: true },
      { key: 'app_key', label: 'App Key', placeholder: 'xxxxx', required: true, secret: true },
      { key: 'app_secret', label: 'App Secret', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://seller.tiktokglobalshop.com/',
    features: ['Open API', 'Live Shopping', 'Affiliates'],
  },
  cdiscount: {
    id: 'cdiscount',
    name: 'Cdiscount',
    color: '#C4161C',
    category: 'marketplace',
    description: 'Marketplace française',
    longDescription: 'Vendez sur Cdiscount, le leader français du e-commerce.',
    fields: [
      { key: 'seller_id', label: 'ID Vendeur', placeholder: 'xxxxx', required: true },
      { key: 'api_key', label: 'Clé API', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://marketplace.cdiscount.com/',
    features: ['Seller API', 'Fulfilment', 'Analytics'],
  },
  fnac: {
    id: 'fnac',
    name: 'Fnac',
    color: '#E1A925',
    category: 'marketplace',
    description: 'Culture & high-tech',
    longDescription: 'Marketplace Fnac Darty pour électronique et culture.',
    fields: [
      { key: 'shop_id', label: 'ID Vendeur', placeholder: 'xxxxx', required: true },
      { key: 'api_key', label: 'Clé API', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://vendeur.fnac.com/',
    features: ['Mirakl API', 'Retours', 'Fulfillment'],
  },
  rakuten: {
    id: 'rakuten',
    name: 'Rakuten',
    color: '#BF0000',
    category: 'marketplace',
    description: 'Cashback & marketplace',
    longDescription: 'Vendez sur Rakuten France avec programme de fidélité.',
    fields: [
      { key: 'seller_id', label: 'ID Vendeur', placeholder: 'xxxxx', required: true },
      { key: 'api_token', label: 'Token API', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://fr.shopping.rakuten.com/',
    features: ['REST API', 'Super Points', 'Analytics'],
  },
}

interface PlatformConfig {
  id: string
  name: string
  color: string
  category: 'store' | 'marketplace' | 'advertising'
  description: string
  longDescription: string
  fields: Array<{
    key: string
    label: string
    placeholder: string
    required: boolean
    secret?: boolean
    multiline?: boolean
  }>
  helpUrl: string
  features: string[]
  popular?: boolean
}

type Step = 'select' | 'credentials' | 'configure' | 'confirm'

export default function ChannelConnectPage() {
  const { platform: platformId } = useParams<{ platform?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>(platformId ? 'credentials' : 'select')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(
    platformId ? PLATFORMS_CONFIG[platformId] || null : null
  )
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState({
    auto_sync: true,
    sync_products: true,
    sync_orders: true,
    sync_inventory: true,
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null)
  const [testDetails, setTestDetails] = useState<{ shopInfo?: any; error?: string } | null>(null)

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get('type') || 'all'
  )

  // Filtered platforms
  const filteredPlatforms = useMemo(() => {
    return Object.values(PLATFORMS_CONFIG).filter(platform => {
      const matchesCategory = activeCategory === 'all' || platform.category === activeCategory
      const matchesSearch = !searchQuery || 
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  // Popular platforms
  const popularPlatforms = useMemo(() => 
    Object.values(PLATFORMS_CONFIG).filter(p => p.popular),
    []
  )

  // Connection mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlatform) throw new Error('Aucune plateforme sélectionnée')
      
      const { data, error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: selectedPlatform.id,
          credentials: credentials,
          config: {},
          sync_settings: settings
        }
      })
      
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Échec de la connexion')
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections'] })
      toast({
        title: 'Connexion réussie !',
        description: data?.shop_info?.name 
          ? `${selectedPlatform?.name} (${data.shop_info.name}) connecté`
          : `${selectedPlatform?.name} connecté avec succès`,
      })
      navigate('/stores-channels')
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Impossible de connecter la plateforme',
        variant: 'destructive'
      })
    }
  })

  // Test connection
  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    setTestDetails(null)
    
    const missingFields = selectedPlatform?.fields.filter(
      f => f.required && !credentials[f.key]
    )
    
    if (missingFields && missingFields.length > 0) {
      setConnectionTestResult('error')
      setTestDetails({ error: `Champs manquants: ${missingFields.map(f => f.label).join(', ')}` })
      setIsTestingConnection(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-marketplace-connection', {
        body: {
          platform: selectedPlatform?.id,
          credentials: credentials
        }
      })

      if (error) throw error

      if (data?.success) {
        setConnectionTestResult('success')
        setTestDetails({ shopInfo: data.shopInfo })
      } else {
        setConnectionTestResult('error')
        setTestDetails({ error: data?.error || 'Échec de la connexion' })
      }
    } catch (err: any) {
      setConnectionTestResult('error')
      setTestDetails({ error: err.message || 'Erreur de connexion' })
    }
    
    setIsTestingConnection(false)
  }

  const handlePlatformSelect = (platform: PlatformConfig) => {
    setSelectedPlatform(platform)
    setCredentials({})
    setConnectionTestResult(null)
    setTestDetails(null)
    setStep('credentials')
  }

  const handleNext = () => {
    if (step === 'credentials') setStep('configure')
    else if (step === 'configure') setStep('confirm')
    else if (step === 'confirm') connectMutation.mutate()
  }

  const handleBack = () => {
    if (step === 'credentials') {
      setSelectedPlatform(null)
      setStep('select')
    } else if (step === 'configure') setStep('credentials')
    else if (step === 'confirm') setStep('configure')
  }

  const canProceed = useMemo(() => {
    if (step === 'credentials') {
      return selectedPlatform?.fields.every(
        f => !f.required || credentials[f.key]?.trim()
      )
    }
    return true
  }, [step, selectedPlatform, credentials])

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une plateforme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-card border-border/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "gap-2 transition-all",
                      activeCategory === cat.id && "shadow-md"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                )
              })}
            </div>

            {/* Popular Section */}
            {activeCategory === 'all' && !searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Populaires
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {popularPlatforms.map(platform => (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      compact
                      onClick={() => handlePlatformSelect(platform)}
                    />
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* All Platforms Grid */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                {filteredPlatforms.length} plateforme{filteredPlatforms.length !== 1 ? 's' : ''} disponible{filteredPlatforms.length !== 1 ? 's' : ''}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlatforms.map(platform => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    onClick={() => handlePlatformSelect(platform)}
                  />
                ))}
              </div>
              
              {filteredPlatforms.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Aucune plateforme trouvée</p>
                  <Button variant="link" onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('all')
                  }}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          </div>
        )

      case 'credentials':
        return (
          <div className="space-y-6">
            {/* Platform Header */}
            <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border">
              <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center p-2">
                <PlatformLogo platform={selectedPlatform!.id} size="xl" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{selectedPlatform?.name}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {selectedPlatform?.longDescription}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPlatform?.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Credentials Form */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4 text-primary" />
                  Identifiants API
                </div>
                
                {selectedPlatform?.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.multiline ? (
                      <textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm font-mono resize-y"
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.secret ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="font-mono"
                      />
                    )}
                  </div>
                ))}

                {/* Test Connection */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTestingConnection || !canProceed}
                    className="w-full"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Tester la connexion
                      </>
                    )}
                  </Button>

                  {connectionTestResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-4 p-4 rounded-lg flex items-start gap-3",
                        connectionTestResult === 'success' 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      )}
                    >
                      {connectionTestResult === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">
                          {connectionTestResult === 'success' ? 'Connexion réussie !' : 'Échec de la connexion'}
                        </p>
                        {testDetails?.shopInfo?.name && (
                          <p className="text-sm opacity-80">Boutique: {testDetails.shopInfo.name}</p>
                        )}
                        {testDetails?.error && (
                          <p className="text-sm opacity-80">{testDetails.error}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Help Link */}
                <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                  <a href={selectedPlatform?.helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Comment obtenir ces identifiants ?
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'configure':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-primary" />
                  Paramètres de synchronisation
                </div>

                <div className="space-y-4">
                  <SettingToggle
                    label="Synchronisation automatique"
                    description="Synchroniser automatiquement toutes les 15 minutes"
                    checked={settings.auto_sync}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_sync: checked }))}
                    icon={RefreshCw}
                  />
                  <SettingToggle
                    label="Synchroniser les produits"
                    description="Importer et exporter les produits"
                    checked={settings.sync_products}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sync_products: checked }))}
                    icon={Package}
                  />
                  <SettingToggle
                    label="Synchroniser les commandes"
                    description="Recevoir les nouvelles commandes"
                    checked={settings.sync_orders}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sync_orders: checked }))}
                    icon={ShoppingCart}
                  />
                  <SettingToggle
                    label="Synchroniser l'inventaire"
                    description="Mettre à jour les stocks en temps réel"
                    checked={settings.sync_inventory}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sync_inventory: checked }))}
                    icon={Tag}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center p-2">
                    <PlatformLogo platform={selectedPlatform!.id} size="lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPlatform?.name}</h3>
                    <p className="text-sm text-muted-foreground">Prêt à connecter</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Résumé de configuration</h4>
                  
                  <div className="grid gap-2">
                    {Object.entries(settings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        {value ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <Check className="h-3 w-3 mr-1" /> Activé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <X className="h-3 w-3 mr-1" /> Désactivé
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {testDetails?.shopInfo && (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">Boutique détectée</p>
                    <p className="font-medium">{testDetails.shopInfo.name}</p>
                    {testDetails.shopInfo.domain && (
                      <p className="text-sm text-muted-foreground">{testDetails.shopInfo.domain}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <Shield className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Vos identifiants sont chiffrés et stockés de manière sécurisée.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <Helmet>
        <title>Connecter un canal - ShopOpti</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => step === 'select' ? navigate('/stores-channels') : handleBack()} 
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 'select' ? 'Retour' : 'Étape précédente'}
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <Link2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {step === 'select' && 'Connecter un canal'}
                  {step === 'credentials' && `Configurer ${selectedPlatform?.name}`}
                  {step === 'configure' && 'Paramètres de synchronisation'}
                  {step === 'confirm' && 'Confirmer la connexion'}
                </h1>
                <p className="text-muted-foreground">
                  {step === 'select' && 'Choisissez une plateforme pour commencer'}
                  {step === 'credentials' && 'Entrez vos identifiants API'}
                  {step === 'configure' && 'Personnalisez vos options de sync'}
                  {step === 'confirm' && 'Vérifiez et finalisez'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps (only show when not on select) */}
          {step !== 'select' && (
            <div className="mb-8">
              <div className="flex items-center gap-2">
                {['credentials', 'configure', 'confirm'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      step === s && "bg-primary text-primary-foreground",
                      ['credentials', 'configure', 'confirm'].indexOf(step) > i 
                        ? "bg-primary/20 text-primary" 
                        : step !== s && "bg-muted text-muted-foreground"
                    )}>
                      {['credentials', 'configure', 'confirm'].indexOf(step) > i ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 2 && (
                      <div className={cn(
                        "w-12 h-0.5 mx-2",
                        ['credentials', 'configure', 'confirm'].indexOf(step) > i 
                          ? "bg-primary" 
                          : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step !== 'select' && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!canProceed || connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : step === 'confirm' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Connecter
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Platform Card Component
function PlatformCard({ 
  platform, 
  compact, 
  onClick 
}: { 
  platform: PlatformConfig
  compact?: boolean
  onClick: () => void 
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group overflow-hidden",
        compact && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className={cn(
          "flex items-center gap-3",
          !compact && "flex-col text-center sm:flex-row sm:text-left"
        )}>
          <div className={cn(
            "rounded-xl bg-white shadow-sm flex items-center justify-center p-2 group-hover:shadow-md transition-shadow",
            compact ? "w-10 h-10" : "w-12 h-12"
          )}>
            <PlatformLogo platform={platform.id} size={compact ? "md" : "lg"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {platform.name}
              </h3>
              {platform.popular && !compact && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  Top
                </Badge>
              )}
            </div>
            {!compact && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {platform.description}
              </p>
            )}
          </div>
          {!compact && (
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Setting Toggle Component  
function SettingToggle({ 
  label, 
  description, 
  checked, 
  onCheckedChange,
  icon: Icon 
}: { 
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
