/**
 * Page de connexion de canal - Style Channable (étapes)
 * Connexion > Configuration > Mapping > Confirmation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Store, ArrowLeft, ArrowRight, CheckCircle2, Settings, Link2, Play,
  ShoppingCart, Loader2, AlertCircle, ExternalLink, Package, Zap,
  Globe, Shield, RefreshCw, HelpCircle, Key, Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// All platforms configuration
const PLATFORMS_CONFIG: Record<string, PlatformConfig> = {
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    color: '#95BF47',
    category: 'store',
    description: 'Connectez votre boutique Shopify pour synchroniser produits et commandes',
    fields: [
      { key: 'shop_domain', label: 'Domaine de la boutique', placeholder: 'votre-boutique.myshopify.com', required: true },
      { key: 'access_token', label: 'Token d\'accès API', placeholder: 'shpat_xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://help.shopify.com/fr/manual/apps/custom-apps',
    features: ['Sync produits', 'Sync commandes', 'Webhooks', 'Inventaire temps réel'],
  },
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    color: '#96588A',
    category: 'store',
    description: 'Intégrez votre boutique WordPress/WooCommerce',
    fields: [
      { key: 'shop_url', label: 'URL de votre boutique', placeholder: 'https://votre-site.com', required: true },
      { key: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_xxxxx', required: true, secret: true },
      { key: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://woocommerce.com/document/woocommerce-rest-api/',
    features: ['Sync produits', 'Sync commandes', 'Catégories', 'Attributs'],
  },
  prestashop: {
    id: 'prestashop',
    name: 'PrestaShop',
    color: '#DF0067',
    category: 'store',
    description: 'Connectez votre boutique PrestaShop',
    fields: [
      { key: 'shop_url', label: 'URL de votre boutique', placeholder: 'https://votre-boutique.com', required: true },
      { key: 'api_key', label: 'Clé API Webservice', placeholder: 'XXXXXXXXXXXXX', required: true, secret: true },
    ],
    helpUrl: 'https://doc.prestashop.com/display/PS17/Webservice',
    features: ['Sync produits', 'Sync commandes', 'Catégories', 'Stock'],
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon Seller',
    color: '#FF9900',
    category: 'marketplace',
    description: 'Vendez sur Amazon avec votre compte Seller Central',
    fields: [
      { key: 'seller_id', label: 'ID Vendeur', placeholder: 'A1XXXXXXXXX', required: true },
      { key: 'mws_auth_token', label: 'Token MWS', placeholder: 'amzn.mws.xxxxx', required: true, secret: true },
      { key: 'marketplace_id', label: 'ID Marketplace', placeholder: 'A13V1IB3VIYZZH', required: true },
    ],
    helpUrl: 'https://sellercentral.amazon.fr/',
    features: ['Publication produits', 'Gestion stock', 'Commandes', 'FBA'],
  },
  ebay: {
    id: 'ebay',
    name: 'eBay',
    color: '#E53238',
    category: 'marketplace',
    description: 'Publiez vos produits sur eBay',
    fields: [
      { key: 'app_id', label: 'App ID (Client ID)', placeholder: 'Votre-App-ID', required: true },
      { key: 'cert_id', label: 'Cert ID (Client Secret)', placeholder: 'Votre-Cert-ID', required: true, secret: true },
      { key: 'dev_id', label: 'Dev ID', placeholder: 'Votre-Dev-ID', required: true },
      { key: 'oauth_token', label: 'Token OAuth', placeholder: 'v^1.1#xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://developer.ebay.com/',
    features: ['Publication', 'Gestion stock', 'Commandes', 'Promotions'],
  },
  etsy: {
    id: 'etsy',
    name: 'Etsy',
    color: '#F56400',
    category: 'marketplace',
    description: 'Synchronisez votre boutique Etsy',
    fields: [
      { key: 'shop_id', label: 'ID Boutique Etsy', placeholder: 'votre-boutique', required: true },
      { key: 'api_key', label: 'Clé API', placeholder: 'xxxxx', required: true, secret: true },
      { key: 'shared_secret', label: 'Shared Secret', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://www.etsy.com/developers/',
    features: ['Sync listings', 'Commandes', 'Avis', 'Messages'],
  },
  google: {
    id: 'google',
    name: 'Google Merchant',
    color: '#4285F4',
    category: 'marketplace',
    description: 'Publiez vos produits sur Google Shopping',
    fields: [
      { key: 'merchant_id', label: 'ID Marchand', placeholder: '123456789', required: true },
      { key: 'service_account', label: 'Compte de service (JSON)', placeholder: '{"type": "service_account"...}', required: true, secret: true, multiline: true },
    ],
    helpUrl: 'https://merchants.google.com/',
    features: ['Google Shopping', 'Promotions', 'Inventaire local', 'Analytics'],
  },
  facebook: {
    id: 'facebook',
    name: 'Meta Commerce',
    color: '#1877F2',
    category: 'marketplace',
    description: 'Vendez sur Facebook et Instagram',
    fields: [
      { key: 'page_id', label: 'ID Page Facebook', placeholder: '123456789', required: true },
      { key: 'access_token', label: 'Token d\'accès', placeholder: 'EAAxxxxx', required: true, secret: true },
      { key: 'catalog_id', label: 'ID Catalogue', placeholder: '987654321', required: true },
    ],
    helpUrl: 'https://business.facebook.com/',
    features: ['Facebook Shop', 'Instagram Shopping', 'Catalogue', 'Publicités'],
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop',
    color: '#000000',
    category: 'marketplace',
    description: 'Vendez directement sur TikTok',
    fields: [
      { key: 'shop_id', label: 'ID Boutique TikTok', placeholder: 'xxxxx', required: true },
      { key: 'app_key', label: 'App Key', placeholder: 'xxxxx', required: true, secret: true },
      { key: 'app_secret', label: 'App Secret', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://seller.tiktokglobalshop.com/',
    features: ['Catalogue', 'Live Shopping', 'Affiliés', 'Analytics'],
  },
  cdiscount: {
    id: 'cdiscount',
    name: 'Cdiscount',
    color: '#C4161C',
    category: 'marketplace',
    description: 'Marketplace leader en France',
    fields: [
      { key: 'seller_id', label: 'ID Vendeur', placeholder: 'xxxxx', required: true },
      { key: 'api_key', label: 'Clé API', placeholder: 'xxxxx', required: true, secret: true },
    ],
    helpUrl: 'https://marketplace.cdiscount.com/',
    features: ['Publication', 'Commandes', 'Fulfilment Cdiscount', 'Analytics'],
  },
}

interface PlatformConfig {
  id: string
  name: string
  color: string
  category: 'store' | 'marketplace'
  description: string
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

  // Select type filter
  const typeFilter = searchParams.get('type') as 'store' | 'marketplace' | null
  const filteredPlatforms = Object.values(PLATFORMS_CONFIG).filter(p => 
    !typeFilter || p.category === typeFilter
  )

  // Connection mutation - calls real edge function
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlatform) throw new Error('Aucune plateforme sélectionnée')
      
      // Call real marketplace-connect edge function
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
          ? `${selectedPlatform?.name} (${data.shop_info.name}) a été connecté`
          : `${selectedPlatform?.name} a été connecté avec succès`,
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

  const [testDetails, setTestDetails] = useState<{ shopInfo?: any; error?: string } | null>(null)

  // Test connection - calls real edge function
  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    setTestDetails(null)
    
    // Basic validation first
    const missingFields = selectedPlatform?.fields.filter(
      f => f.required && !credentials[f.key]
    )
    
    if (missingFields && missingFields.length > 0) {
      setConnectionTestResult('error')
      setTestDetails({ error: `Champs manquants: ${missingFields.map(f => f.label).join(', ')}` })
      toast({
        title: 'Champs manquants',
        description: `Veuillez remplir: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      })
      setIsTestingConnection(false)
      return
    }

    try {
      // Call real edge function to test connection
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
        toast({
          title: 'Connexion réussie !',
          description: data.shopInfo?.name 
            ? `Connecté à ${data.shopInfo.name}` 
            : 'Les identifiants sont valides',
        })
      } else {
        setConnectionTestResult('error')
        setTestDetails({ error: data?.error || 'Échec de la connexion' })
        toast({
          title: 'Échec de la connexion',
          description: data?.error || 'Vérifiez vos identifiants',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      console.error('[TEST-CONNECTION] Error:', err)
      setConnectionTestResult('error')
      setTestDetails({ error: err.message || 'Erreur de connexion' })
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de tester la connexion',
        variant: 'destructive'
      })
    }
    
    setIsTestingConnection(false)
  }

  const handlePlatformSelect = (platform: PlatformConfig) => {
    setSelectedPlatform(platform)
    setStep('credentials')
  }

  const handleNext = () => {
    if (step === 'credentials') {
      setStep('configure')
    } else if (step === 'configure') {
      setStep('confirm')
    } else if (step === 'confirm') {
      connectMutation.mutate()
    }
  }

  const handleBack = () => {
    if (step === 'credentials') {
      setSelectedPlatform(null)
      setStep('select')
    } else if (step === 'configure') {
      setStep('credentials')
    } else if (step === 'confirm') {
      setStep('configure')
    }
  }

  const steps = [
    { id: 'select', label: 'Plateforme', icon: Store },
    { id: 'credentials', label: 'Identifiants', icon: Key },
    { id: 'configure', label: 'Configuration', icon: Settings },
    { id: 'confirm', label: 'Confirmation', icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  return (
    <>
      <Helmet>
        <title>Connecter un canal - ShopOpti</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/stores-channels')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            Connecter un canal
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 'select' && 'Choisissez la plateforme à connecter'}
            {step === 'credentials' && `Configurez ${selectedPlatform?.name}`}
            {step === 'configure' && 'Paramètres de synchronisation'}
            {step === 'confirm' && 'Vérifiez et confirmez'}
          </p>
        </div>

        {/* Steps Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = i === currentStepIndex
              const isCompleted = i < currentStepIndex
              
              return (
                <div key={s.id} className="flex flex-col items-center relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 font-medium",
                    (isActive || isCompleted) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Select Platform */}
            {step === 'select' && (
              <div className="space-y-6">
                {typeFilter && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-sm">
                      {typeFilter === 'store' ? 'Boutiques' : 'Marketplaces'}
                    </Badge>
                    <Button variant="link" size="sm" onClick={() => navigate('/channels/connect')}>
                      Voir tout
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredPlatforms.map(platform => (
                    <Card 
                      key={platform.id}
                      className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
                      onClick={() => handlePlatformSelect(platform)}
                    >
                      <CardContent className="p-6 text-center">
                        <div 
                          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.name.charAt(0)}
                        </div>
                        <h3 className="font-semibold mb-1">{platform.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {platform.category === 'store' ? 'Boutique' : 'Marketplace'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 'credentials' && selectedPlatform && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ backgroundColor: selectedPlatform.color }}
                    >
                      {selectedPlatform.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle>{selectedPlatform.name}</CardTitle>
                      <CardDescription>{selectedPlatform.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {selectedPlatform.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Credential Fields */}
                  <div className="space-y-4">
                    {selectedPlatform.fields.map(field => (
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
                            className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.secret ? 'password' : 'text'}
                            placeholder={field.placeholder}
                            value={credentials[field.key] || ''}
                            onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Test Connection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                      <Button 
                        variant="outline" 
                        onClick={testConnection}
                        disabled={isTestingConnection}
                        className="gap-2"
                      >
                        {isTestingConnection ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Tester la connexion
                      </Button>
                      {connectionTestResult === 'success' && (
                        <Badge className="bg-green-500/20 text-green-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connexion réussie
                        </Badge>
                      )}
                      {connectionTestResult === 'error' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Échec
                        </Badge>
                      )}
                    </div>

                    {/* Test Results Details */}
                    {testDetails && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={cn(
                          "p-4 rounded-lg border text-sm",
                          connectionTestResult === 'success' 
                            ? "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
                            : "bg-destructive/10 border-destructive/30 text-destructive"
                        )}
                      >
                        {connectionTestResult === 'success' && testDetails.shopInfo && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Connecté à <strong>{testDetails.shopInfo.name || testDetails.shopInfo.shop_name || selectedPlatform?.name}</strong>
                              {testDetails.shopInfo.domain && ` (${testDetails.shopInfo.domain})`}
                              {testDetails.shopInfo.version && ` - v${testDetails.shopInfo.version}`}
                            </span>
                          </div>
                        )}
                        {connectionTestResult === 'error' && testDetails.error && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{testDetails.error}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Help Link */}
                  <a 
                    href={selectedPlatform.helpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Comment obtenir ces identifiants ?
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleNext}>
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 3: Configure */}
            {step === 'configure' && selectedPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration de la synchronisation
                  </CardTitle>
                  <CardDescription>
                    Personnalisez comment vos données seront synchronisées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Synchronisation automatique</p>
                          <p className="text-sm text-muted-foreground">Synchroniser automatiquement toutes les heures</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.auto_sync}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, auto_sync: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Synchroniser les produits</p>
                          <p className="text-sm text-muted-foreground">Importer/exporter le catalogue produit</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.sync_products}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, sync_products: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Synchroniser les commandes</p>
                          <p className="text-sm text-muted-foreground">Récupérer les nouvelles commandes</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.sync_orders}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, sync_orders: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Synchroniser l'inventaire</p>
                          <p className="text-sm text-muted-foreground">Mettre à jour les stocks en temps réel</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.sync_inventory}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, sync_inventory: v }))}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleNext}>
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && selectedPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Confirmation
                  </CardTitle>
                  <CardDescription>
                    Vérifiez vos paramètres avant de finaliser la connexion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: selectedPlatform.color }}
                      >
                        {selectedPlatform.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedPlatform.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {credentials.shop_domain || credentials.shop_url || 'Configuration prête'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {settings.auto_sync ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Sync automatique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.sync_products ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Produits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.sync_orders ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Commandes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.sync_inventory ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Inventaire</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-500/10 border-green-500/20">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">Connexion sécurisée</p>
                      <p className="text-sm text-green-600">
                        Vos identifiants sont chiffrés et stockés de manière sécurisée
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={connectMutation.isPending}
                    className="gap-2"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Connecter
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
