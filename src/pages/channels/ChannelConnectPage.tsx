/**
 * Channel Connect Page - Channable Premium Design
 * Professional multi-step connection wizard with glassmorphism
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Link2, Loader2, Package,
  Globe, Search, Sparkles, ShoppingBag, Tag, TrendingUp, X, Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  PlatformCard, 
  PlatformCardCompact,
  PlatformConfig,
  StepIndicator,
  CredentialsForm,
  ConfigurationStep,
  ConfirmationStep
} from '@/components/channels/connect'

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
      { key: 'access_token', label: 'Token d\'accès API', placeholder: '••••••••••••••••', required: true, secret: true },
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
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
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

  // Get step titles
  const getStepInfo = () => {
    switch (step) {
      case 'select':
        return { title: 'Connecter un canal', subtitle: 'Choisissez une plateforme pour commencer' }
      case 'credentials':
        return { title: `Configurer ${selectedPlatform?.name}`, subtitle: 'Entrez vos identifiants API sécurisés' }
      case 'configure':
        return { title: 'Paramètres de synchronisation', subtitle: 'Personnalisez vos options de sync' }
      case 'confirm':
        return { title: 'Confirmer la connexion', subtitle: 'Vérifiez et finalisez votre intégration' }
    }
  }

  const stepInfo = getStepInfo()

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            {/* Search Bar with glassmorphism */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une plateforme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base backdrop-blur-xl bg-card/80 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Pills */}
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
                      "gap-2 transition-all backdrop-blur-sm",
                      activeCategory === cat.id 
                        ? "shadow-lg shadow-primary/20" 
                        : "bg-card/80 border-border/50 hover:bg-muted/80"
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
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Plateformes populaires
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {popularPlatforms.map((platform, index) => (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PlatformCardCompact
                        platform={platform}
                        onClick={() => handlePlatformSelect(platform)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <Separator className="bg-border/50" />

            {/* All Platforms Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {filteredPlatforms.length} plateforme{filteredPlatforms.length !== 1 ? 's' : ''} disponible{filteredPlatforms.length !== 1 ? 's' : ''}
                </span>
                {activeCategory !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCategory('all')}
                    className="text-xs h-7"
                  >
                    Voir tout
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlatforms.map((platform, index) => (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <PlatformCard
                      platform={platform}
                      onClick={() => handlePlatformSelect(platform)}
                    />
                  </motion.div>
                ))}
              </div>
              
              {filteredPlatforms.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">Aucune plateforme trouvée</p>
                  <Button variant="link" onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('all')
                  }}>
                    Réinitialiser les filtres
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )

      case 'credentials':
        return (
          <CredentialsForm
            platform={selectedPlatform!}
            credentials={credentials}
            setCredentials={setCredentials}
            isTestingConnection={isTestingConnection}
            connectionTestResult={connectionTestResult}
            testDetails={testDetails}
            onTestConnection={testConnection}
            canProceed={!!canProceed}
          />
        )

      case 'configure':
        return (
          <ConfigurationStep
            settings={settings}
            setSettings={setSettings}
          />
        )

      case 'confirm':
        return (
          <ConfirmationStep
            platform={selectedPlatform!}
            settings={settings}
            testDetails={testDetails}
          />
        )
    }
  }

  return (
    <>
      <Helmet>
        <title>Connecter un canal - ShopOpti+</title>
      </Helmet>

      <ChannablePageWrapper
        title={stepInfo.title}
        subtitle={stepInfo.subtitle}
        heroImage="integrations"
        badge={{
          label: step === 'select' ? 'Intégrations' : `Étape ${['credentials', 'configure', 'confirm'].indexOf(step) + 1}/3`,
          icon: Link2
        }}
        actions={
          step === 'select' ? undefined : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBack}
              className="backdrop-blur-sm bg-background/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Étape précédente
            </Button>
          )
        }
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step Indicator (only when not on select) */}
          {step !== 'select' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6"
            >
              <StepIndicator currentStep={step} />
            </motion.div>
          )}

          {/* Back button for select step */}
          {step === 'select' && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/stores-channels')} 
              className="-ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux canaux
            </Button>
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
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between pt-4 border-t border-border/50"
            >
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="backdrop-blur-sm bg-card/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={!canProceed || connectMutation.isPending}
                className="min-w-[140px] shadow-lg shadow-primary/20"
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
            </motion.div>
          )}
        </div>
      </ChannablePageWrapper>
    </>
  )
}
