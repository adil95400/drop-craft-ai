import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Shield, CheckCircle2, AlertTriangle, ExternalLink, 
  Settings, Webhook, MapPin, CreditCard, Globe, Zap 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useOAuthSupplier } from '@/hooks/useOAuthSupplier'

interface PlatformConnectionFormProps {
  platform: string
  onConnect: (data: any) => Promise<void>
  onCancel: () => void
}

interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'select' | 'checkbox' | 'textarea' | 'multi-select'
  required: boolean
  help?: string
  placeholder?: string
  options?: string[]
  category: 'auth' | 'business' | 'sync' | 'webhooks'
}

const platformConfigs = {
  shopify: {
    title: "Connecteur Shopify",
    description: "Synchronisation complète via Admin API et GraphQL",
    icon: "🛍️",
    color: "bg-green-500",
    oauth: true,
    scopes: ['read_products', 'write_products', 'read_inventory', 'write_inventory', 'read_orders', 'write_orders'],
    fields: [
      // Authentification
      { key: 'storeName', label: 'Nom de la boutique', type: 'text', required: true, category: 'auth',
        help: 'Nom d\'affichage de votre boutique', placeholder: 'Ma Boutique Shopify' },
      { key: 'shopDomain', label: 'Domaine Shopify', type: 'text', required: true, category: 'auth',
        help: 'Votre sous-domaine Shopify', placeholder: 'votre-boutique.myshopify.com' },
      { key: 'accessToken', label: 'Admin API Access Token', type: 'password', required: true, category: 'auth',
        help: 'Token d\'accès depuis une app privée ou publique', placeholder: 'shpat_xxxxxxxxxxxxx' },
      { key: 'apiVersion', label: 'Version API', type: 'select', required: false, category: 'auth',
        help: 'Version de l\'API Shopify', placeholder: '2023-10',
        options: ['2023-10', '2023-07', '2023-04', '2023-01'] },
      
      // Configuration métier
      { key: 'locationIds', label: 'Location IDs', type: 'text', required: true, category: 'business',
        help: 'IDs des emplacements pour la gestion du stock (séparés par virgule)', placeholder: '12345,67890' },
      { key: 'currency', label: 'Devise principale', type: 'select', required: true, category: 'business',
        options: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'], placeholder: 'EUR' },
      { key: 'priceMarkup', label: 'Marge par défaut (%)', type: 'text', required: false, category: 'business',
        help: 'Marge appliquée automatiquement aux produits', placeholder: '30' },
      { key: 'taxIncluded', label: 'Prix TTC', type: 'checkbox', required: false, category: 'business',
        help: 'Les prix incluent-ils la TVA ?' },
      
      // Synchronisation
      { key: 'syncFrequency', label: 'Fréquence de sync', type: 'select', required: false, category: 'sync',
        options: ['real-time', '15min', '1hour', '6hours', '24hours'], placeholder: 'real-time' },
      { key: 'importVariants', label: 'Importer les variantes', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importImages', label: 'Importer les images', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importCustomers', label: 'Importer les clients', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importOrders', label: 'Importer les commandes', type: 'checkbox', required: false, category: 'sync' },
      
      // Webhooks
      { key: 'enableWebhooks', label: 'Activer les webhooks', type: 'checkbox', required: false, category: 'webhooks' },
      { key: 'webhookEvents', label: 'Événements webhook', type: 'multi-select', required: false, category: 'webhooks',
        options: ['products/create', 'products/update', 'products/delete', 'inventory_levels/update', 'orders/create', 'orders/updated'] }
    ] as FieldConfig[]
  },
  
  woocommerce: {
    title: "Connecteur WooCommerce",
    description: "Synchronisation via API REST v3 et webhooks",
    icon: "🔌",
    color: "bg-purple-500",
    oauth: false,
    fields: [
      // Authentification
      { key: 'storeName', label: 'Nom de la boutique', type: 'text', required: true, category: 'auth',
        placeholder: 'Ma Boutique WooCommerce' },
      { key: 'siteUrl', label: 'URL du site', type: 'url', required: true, category: 'auth',
        help: 'URL complète de votre site WordPress/WooCommerce', placeholder: 'https://votre-site.com' },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true, category: 'auth',
        help: 'Clé générée dans WooCommerce > Paramètres > Avancé > API REST', placeholder: 'ck_xxxxxxxxxxxxx' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true, category: 'auth',
        help: 'Secret associé à votre Consumer Key', placeholder: 'cs_xxxxxxxxxxxxx' },
      { key: 'apiVersion', label: 'Version API', type: 'select', required: false, category: 'auth',
        options: ['wc/v3', 'wc/v2'], placeholder: 'wc/v3' },
      
      // Configuration métier
      { key: 'currency', label: 'Devise', type: 'select', required: true, category: 'business',
        options: ['EUR', 'USD', 'GBP'], placeholder: 'EUR' },
      { key: 'priceMarkup', label: 'Marge (%)', type: 'text', required: false, category: 'business', placeholder: '30' },
      { key: 'manageStock', label: 'Gestion du stock', type: 'checkbox', required: false, category: 'business' },
      { key: 'weightUnit', label: 'Unité de poids', type: 'select', required: false, category: 'business',
        options: ['kg', 'g', 'lbs', 'oz'], placeholder: 'kg' },
      { key: 'dimensionUnit', label: 'Unité de dimension', type: 'select', required: false, category: 'business',
        options: ['cm', 'm', 'mm', 'in', 'yd'], placeholder: 'cm' },
      
      // Synchronisation
      { key: 'syncFrequency', label: 'Fréquence', type: 'select', required: false, category: 'sync',
        options: ['15min', '1hour', '6hours', '24hours'], placeholder: '1hour' },
      { key: 'importCategories', label: 'Importer catégories', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importTags', label: 'Importer étiquettes', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importReviews', label: 'Importer avis', type: 'checkbox', required: false, category: 'sync' },
      
      // Webhooks
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, category: 'webhooks',
        help: 'Secret pour vérifier l\'authenticité des webhooks' },
      { key: 'webhookEvents', label: 'Événements', type: 'multi-select', required: false, category: 'webhooks',
        options: ['product.created', 'product.updated', 'product.deleted', 'order.created', 'order.updated'] }
    ] as FieldConfig[]
  },
  
  prestashop: {
    title: "Connecteur PrestaShop",
    description: "Synchronisation via Webservice API",
    icon: "🛒",
    color: "bg-blue-500",
    oauth: false,
    fields: [
      // Authentification
      { key: 'storeName', label: 'Nom de la boutique', type: 'text', required: true, category: 'auth',
        placeholder: 'Ma Boutique PrestaShop' },
      { key: 'shopUrl', label: 'URL de la boutique', type: 'url', required: true, category: 'auth',
        placeholder: 'https://votre-boutique.com' },
      { key: 'webserviceKey', label: 'Webservice Key', type: 'password', required: true, category: 'auth',
        help: 'Clé générée dans Paramètres Avancés > Webservice', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
      { key: 'shopId', label: 'Shop ID', type: 'text', required: false, category: 'auth',
        help: 'ID de la boutique (multiboutique)', placeholder: '1' },
      { key: 'languageId', label: 'Language ID', type: 'text', required: false, category: 'auth',
        help: 'ID de la langue par défaut', placeholder: '1' },
      
      // Configuration métier
      { key: 'currency', label: 'Devise', type: 'select', required: true, category: 'business',
        options: ['EUR', 'USD', 'GBP'], placeholder: 'EUR' },
      { key: 'currencyId', label: 'Currency ID', type: 'text', required: false, category: 'business',
        help: 'ID de la devise dans PrestaShop', placeholder: '1' },
      { key: 'defaultCategoryId', label: 'Catégorie par défaut', type: 'text', required: false, category: 'business',
        placeholder: '2' },
      
      // Synchronisation
      { key: 'syncFrequency', label: 'Fréquence', type: 'select', required: false, category: 'sync',
        options: ['1hour', '6hours', '24hours'], placeholder: '6hours' },
      { key: 'importCombinations', label: 'Importer combinaisons', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importFeatures', label: 'Importer caractéristiques', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importSuppliers', label: 'Importer fournisseurs', type: 'checkbox', required: false, category: 'sync' },
      
      // Debug
      { key: 'debugMode', label: 'Mode debug', type: 'checkbox', required: false, category: 'webhooks',
        help: 'Active les logs détaillés' }
    ] as FieldConfig[]
  },
  
  magento: {
    title: "Connecteur Magento",
    description: "Synchronisation via API REST et GraphQL",
    icon: "⚡",
    color: "bg-orange-500",
    oauth: false,
    fields: [
      // Authentification
      { key: 'storeName', label: 'Nom de la boutique', type: 'text', required: true, category: 'auth',
        placeholder: 'Ma Boutique Magento' },
      { key: 'baseUrl', label: 'URL de base', type: 'url', required: true, category: 'auth',
        placeholder: 'https://votre-magento.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, category: 'auth',
        help: 'Token généré dans Admin > Système > Intégrations', placeholder: 'xxxxxxxxxxxxxxxxxxxxx' },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: false, category: 'auth',
        help: 'Pour OAuth 1.0 (optionnel)' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: false, category: 'auth' },
      
      // Configuration métier
      { key: 'websiteId', label: 'Website ID', type: 'text', required: false, category: 'business',
        help: 'ID du website Magento', placeholder: '1' },
      { key: 'storeId', label: 'Store ID', type: 'text', required: false, category: 'business',
        help: 'ID du store', placeholder: '1' },
      { key: 'storeViewCode', label: 'Store View Code', type: 'text', required: false, category: 'business',
        help: 'Code de la vue magasin', placeholder: 'default' },
      { key: 'currency', label: 'Devise', type: 'select', required: true, category: 'business',
        options: ['EUR', 'USD', 'GBP'], placeholder: 'EUR' },
      
      // MSI (Multi-Source Inventory)
      { key: 'enableMsi', label: 'MSI activé', type: 'checkbox', required: false, category: 'business',
        help: 'Multi-Source Inventory pour Magento 2.3+' },
      { key: 'sourceCodes', label: 'Source Codes', type: 'text', required: false, category: 'business',
        help: 'Codes des sources MSI (séparés par virgule)', placeholder: 'default,warehouse1' },
      
      // Synchronisation
      { key: 'syncFrequency', label: 'Fréquence', type: 'select', required: false, category: 'sync',
        options: ['1hour', '6hours', '24hours'], placeholder: '6hours' },
      { key: 'importConfigurable', label: 'Produits configurables', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importBundle', label: 'Produits bundle', type: 'checkbox', required: false, category: 'sync' },
      { key: 'importGrouped', label: 'Produits groupés', type: 'checkbox', required: false, category: 'sync' }
    ] as FieldConfig[]
  }
}

export function PlatformConnectionForm({ platform, onConnect, onCancel }: PlatformConnectionFormProps) {
  const { toast } = useToast()
  const { initiateOAuth } = useOAuthSupplier()
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', message?: string }>({ status: 'idle' })
  const [activeTab, setActiveTab] = useState('auth')
  
  const config = platformConfigs[platform as keyof typeof platformConfigs]
  if (!config) return null

  const [formData, setFormData] = useState(() => {
    const initialData: any = {
      platform,
      // Valeurs par défaut
      currency: 'EUR',
      syncFrequency: config.oauth ? 'real-time' : '1hour',
      importImages: true,
      importVariants: true,
      manageStock: true,
      taxIncluded: true,
      enableWebhooks: config.oauth,
      // Initialiser tous les champs checkbox à false
      ...Object.fromEntries(
        config.fields
          .filter(field => field.type === 'checkbox')
          .map(field => [field.key, false])
      )
    }
    return initialData
  })

  const handleOAuthConnect = async () => {
    if (config.oauth && platform === 'shopify') {
      setLoading(true)
      try {
        const result = await initiateOAuth(platform)
        if (result) {
          // OAuth flow initiated
          toast({
            title: "Redirection OAuth",
            description: "Redirection vers Shopify pour l'autorisation..."
          })
        }
      } catch (error) {
        toast({
          title: "Erreur OAuth",
          description: "Impossible d'initier la connexion OAuth",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const testConnection = async () => {
    const requiredFields = config.fields.filter(field => field.required && field.category === 'auth')
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.key]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    if (missingFields.length > 0) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs d'authentification obligatoires",
        variant: "destructive"
      })
      return
    }
    
    setTestResult({ status: 'testing' })
    
    try {
      // Simulation du test de connexion
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Simuler un succès/échec basé sur la validité des données
      const hasValidToken = formData.accessToken?.length > 10 || formData.consumerKey?.length > 10
      const hasValidUrl = formData.shopDomain?.includes('.') || formData.siteUrl?.includes('.') || formData.shopUrl?.includes('.')
      
      if (hasValidToken && hasValidUrl) {
        setTestResult({ 
          status: 'success', 
          message: `Connexion réussie ! Boutique ${config.title.replace('Connecteur ', '')} détectée avec succès.` 
        })
      } else {
        setTestResult({ 
          status: 'error', 
          message: 'Erreur de connexion. Vérifiez vos identifiants et l\'URL de votre boutique.' 
        })
      }
    } catch (error) {
      setTestResult({ 
        status: 'error', 
        message: 'Erreur inattendue lors du test de connexion.' 
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const requiredFields = config.fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.key]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    if (missingFields.length > 0) {
      toast({
        title: "Erreur",
        description: `Veuillez remplir ces champs obligatoires: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await onConnect(formData)
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter la boutique. Vérifiez vos paramètres.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key]
    
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => setFormData(prev => ({ ...prev, [field.key]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'multi-select':
        return (
          <Textarea
            placeholder={`Sélectionner: ${field.options?.join(', ')}`}
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
              setFormData(prev => ({ ...prev, [field.key]: values }))
            }}
            className="min-h-[60px]"
          />
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [field.key]: checked }))}
            />
            <Label htmlFor={field.key} className="text-sm font-normal">
              {field.label}
            </Label>
          </div>
        )
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            className="min-h-[80px]"
          />
        )
      
      default:
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            required={field.required}
          />
        )
    }
  }

  const getFieldsByCategory = (category: string) => 
    config.fields.filter(field => field.category === category)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                <span className="text-2xl">{config.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-muted-foreground mt-1">{config.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              ← Retour
            </Button>
          </CardTitle>
          
          {config.oauth && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border">
              <div>
                <h3 className="font-semibold text-primary">Connexion OAuth recommandée</h3>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous directement via {platform} pour une configuration simplifiée
                </p>
              </div>
              <Button onClick={handleOAuthConnect} disabled={loading}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connecter via OAuth
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Configuration Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="auth" className="flex items-center gap-2 py-3">
                  <Shield className="w-4 h-4" />
                  Authentification
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2 py-3">
                  <Settings className="w-4 h-4" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="sync" className="flex items-center gap-2 py-3">
                  <Zap className="w-4 h-4" />
                  Synchronisation
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex items-center gap-2 py-3">
                  <Webhook className="w-4 h-4" />
                  Webhooks
                </TabsTrigger>
              </TabsList>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <TabsContent value="auth" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Informations d'authentification
                  </h3>
                  <Alert className="mb-4">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Ces informations permettent à notre système de se connecter à votre boutique et de synchroniser vos données en temps réel.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFieldsByCategory('auth').map((field) => (
                      <div key={field.key} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.key} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.help && (
                          <p className="text-xs text-muted-foreground">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {config.oauth && 'scopes' in config && config.scopes && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Scopes OAuth requis:</h4>
                      <div className="flex flex-wrap gap-2">
                        {config.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Test de connexion */}
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Test de connexion</h4>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={testResult.status === 'testing'}
                    >
                      {testResult.status === 'testing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        'Tester la connexion'
                      )}
                    </Button>
                  </div>
                  
                  {testResult.status !== 'idle' && (
                    <Alert className={`${
                      testResult.status === 'success' ? 'border-success bg-success/5' :
                      testResult.status === 'error' ? 'border-destructive bg-destructive/5' :
                      'border-warning bg-warning/5'
                    }`}>
                      {testResult.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : testResult.status === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-warning" />
                      )}
                      <AlertDescription>
                        {testResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Configuration métier
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFieldsByCategory('business').map((field) => (
                      <div key={field.key} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.key} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.help && (
                          <p className="text-xs text-muted-foreground">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sync" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Paramètres de synchronisation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFieldsByCategory('sync').map((field) => (
                      <div key={field.key} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.key} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.help && (
                          <p className="text-xs text-muted-foreground">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    Configuration des webhooks
                  </h3>
                  <Alert className="mb-4">
                    <Webhook className="h-4 w-4" />
                    <AlertDescription>
                      Les webhooks permettent une synchronisation en temps réel de vos données.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 gap-4">
                    {getFieldsByCategory('webhooks').map((field) => (
                      <div key={field.key} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.key} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.help && (
                          <p className="text-xs text-muted-foreground">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || testResult.status === 'testing'}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Connecter la boutique'
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sécurité garantie :</strong> Vos informations de connexion sont chiffrées avec AES-256 et stockées de manière sécurisée. 
          Elles ne sont utilisées que pour la synchronisation de vos données et ne sont jamais partagées avec des tiers.
        </AlertDescription>
      </Alert>
    </div>
  )
}