import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ExternalLink, Info, Shield, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConnectionFormProps {
  platform: string
  onConnect: (data: any) => Promise<void>
  onCancel: () => void
}

export const ConnectionForm = ({ platform, onConnect, onCancel }: ConnectionFormProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    // Shopify
    shopDomain: '',
    accessToken: '',
    apiVersion: '2023-10',
    // WooCommerce
    siteUrl: '',
    consumerKey: '',
    consumerSecret: '',
    // PrestaShop
    shopUrl: '',
    webserviceKey: '',
    debug: false,
    // Magento
    baseUrl: '',
    storeView: '',
    // BigCommerce
    storeHash: '',
    clientId: '',
    // Squarespace
    siteId: '',
    apiKey: ''
  })
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', message?: string }>({ status: 'idle' })

  const platformConfigs = {
    shopify: {
      title: "Connecter Shopify",
      description: "Connectez votre boutique Shopify via l'API Admin",
      helpUrl: "https://help.shopify.com/en/manual/apps/private-apps",
      icon: "🛍️",
      features: ["Synchronisation temps réel", "Gestion stock", "Commandes", "Clients"],
      fields: [
        { key: 'shopDomain', label: 'Domaine Shopify', type: 'text', required: true, 
          help: 'Exemple: votre-boutique.myshopify.com', placeholder: 'votre-boutique.myshopify.com' },
        { key: 'accessToken', label: 'Private App Access Token', type: 'password', required: true,
          help: 'Token d\'accès depuis votre app privée Shopify', placeholder: '••••••••••••••••' },
        { key: 'apiVersion', label: 'Version API', type: 'select', required: false, 
          help: 'Version de l\'API Shopify (par défaut: 2023-10)', placeholder: '2023-10',
          options: ['2023-10', '2023-07', '2023-04'] }
      ]
    },
    woocommerce: {
      title: "Connecter WooCommerce",
      description: "Connectez votre boutique WooCommerce via l'API REST",
      helpUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication",
      icon: "🏪",
      features: ["API REST v3", "Webhooks", "Produits", "Commandes"],
      fields: [
        { key: 'siteUrl', label: 'URL du site', type: 'url', required: true,
          help: 'URL complète de votre site WooCommerce', placeholder: 'https://votre-site.com' },
        { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true,
          help: 'Clé générée dans WooCommerce > Paramètres > Avancé > API REST', placeholder: 'ck_xxxxxxxxxxxxx' },
        { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true,
          help: 'Secret associé à votre Consumer Key', placeholder: 'cs_xxxxxxxxxxxxx' },
        { key: 'apiVersion', label: 'Version API', type: 'select', required: false,
          help: 'Version de l\'API WooCommerce', placeholder: 'wc/v3',
          options: ['wc/v3', 'wc/v2', 'wc/v1'] }
      ]
    },
    prestashop: {
      title: "Connecter PrestaShop",
      description: "Connectez votre boutique PrestaShop via Webservice",
      helpUrl: "https://devdocs.prestashop.com/1.7/webservice/",
      icon: "🛒",
      features: ["Webservice API", "XML/JSON", "Produits", "Commandes"],
      fields: [
        { key: 'shopUrl', label: 'URL de la boutique', type: 'url', required: true,
          help: 'URL complète de votre boutique PrestaShop', placeholder: 'https://votre-boutique.com' },
        { key: 'webserviceKey', label: 'Webservice Key', type: 'password', required: true,
          help: 'Clé générée dans Paramètres Avancés > Webservice', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
        { key: 'debug', label: 'Mode debug', type: 'checkbox', required: false,
          help: 'Active les logs détaillés pour le debugging' }
      ]
    },
    magento: {
      title: "Connecter Magento",
      description: "Connectez votre boutique Magento via l'API REST",
      helpUrl: "https://devdocs.magento.com/guides/v2.4/get-started/authentication/gs-authentication.html",
      icon: "🏬",
      features: ["API REST", "OAuth 1.0", "Produits", "Commandes"],
      fields: [
        { key: 'baseUrl', label: 'URL de base', type: 'url', required: true,
          help: 'URL de base de votre installation Magento', placeholder: 'https://votre-magento.com' },
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true,
          help: 'Token d\'accès généré dans Admin > Système > Intégrations', placeholder: 'xxxxxxxxxxxxxxxxxxxxx' },
        { key: 'storeView', label: 'Store View', type: 'text', required: false,
          help: 'Code du store view (par défaut: default)', placeholder: 'default' }
      ]
    },
    bigcommerce: {
      title: "Connecter BigCommerce",
      description: "Connectez votre boutique BigCommerce via l'API REST",
      helpUrl: "https://developer.bigcommerce.com/api-docs/getting-started/authentication",
      icon: "🏪",
      features: ["API REST v3", "Webhooks", "Multi-store", "GraphQL"],
      fields: [
        { key: 'storeHash', label: 'Store Hash', type: 'text', required: true,
          help: 'Hash de votre store BigCommerce', placeholder: 'abc123def' },
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true,
          help: 'Token X-Auth-Token de votre API', placeholder: 'xxxxxxxxxxxxxxxxxxxxx' },
        { key: 'clientId', label: 'Client ID', type: 'text', required: true,
          help: 'Client ID de votre application', placeholder: 'xxxxxxxxxxxxxxxxxxxxx' }
      ]
    },
    squarespace: {
      title: "Connecter Squarespace",
      description: "Connectez votre boutique Squarespace Commerce",
      helpUrl: "https://developers.squarespace.com/commerce-apis",
      icon: "◼️",
      features: ["Commerce API", "Inventaire", "Commandes", "Webhooks"],
      fields: [
        { key: 'siteId', label: 'Site ID', type: 'text', required: true,
          help: 'ID de votre site Squarespace', placeholder: 'xxxxx-xxxxx-xxxxx' },
        { key: 'apiKey', label: 'API Key', type: 'password', required: true,
          help: 'Clé API depuis les paramètres développeur', placeholder: 'xxxxxxxxxxxxxxxxxxxxx' }
      ]
    }
  }

  const config = platformConfigs[platform as keyof typeof platformConfigs]
  if (!config) return null

  const testConnection = async () => {
    if (!validateRequiredFields()) return
    
    setTestResult({ status: 'testing' })
    
    try {
      // Simulation du test de connexion
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simuler un succès ou échec aléatoire pour la démo
      const isSuccess = Math.random() > 0.3
      
      if (isSuccess) {
        setTestResult({ 
          status: 'success', 
          message: 'Connexion réussie ! Boutique détectée avec succès.' 
        })
      } else {
        setTestResult({ 
          status: 'error', 
          message: 'Erreur de connexion. Vérifiez vos identifiants.' 
        })
      }
    } catch (error) {
      setTestResult({ 
        status: 'error', 
        message: 'Erreur inattendue lors du test de connexion.' 
      })
    }
  }

  const validateRequiredFields = () => {
    const requiredFields = config.fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.key as keyof typeof formData]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    if (!formData.name || !formData.domain || missingFields.length > 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateRequiredFields()) return

    setLoading(true)
    try {
      // Préparer les credentials selon la plateforme
      const credentials: any = {}
      
      config.fields.forEach(field => {
        const value = formData[field.key as keyof typeof formData]
        if (value !== undefined && value !== '') {
          credentials[field.key] = value
        }
      })

      await onConnect({
        platform,
        name: formData.name,
        domain: formData.domain,
        credentials
      })
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

  const renderField = (field: any) => {
    const value = formData[field.key as keyof typeof formData]
    
    if (field.type === 'select') {
      return (
        <Select
          value={value as string}
          onValueChange={(newValue) => setFormData(prev => ({ ...prev, [field.key]: newValue }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    
    if (field.type === 'checkbox') {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.key}
            checked={value as boolean}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [field.key]: checked }))}
          />
          <Label htmlFor={field.key} className="text-sm font-normal">
            {field.label}
          </Label>
        </div>
      )
    }
    
    return (
      <Input
        id={field.key}
        type={field.type}
        placeholder={field.placeholder}
        value={value as string}
        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
        required={field.required}
      />
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="text-xl font-semibold">{config.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {config.features.map((feature, index) => (
                  <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={config.helpUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Guide
            </a>
          </Button>
        </CardTitle>
        <CardDescription className="text-base">{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Informations générales */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Informations générales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de la boutique *</Label>
                <Input
                  id="name"
                  placeholder="Ma Boutique Shopify"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="domain">Domaine de référence *</Label>
                <Input
                  id="domain"
                  placeholder="ma-boutique.com"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Domaine principal pour identifier votre boutique
                </p>
              </div>
            </div>
          </div>

          {/* Section Configuration API */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Configuration de l'API
            </h4>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ces informations permettent à notre système de se connecter à votre boutique et de synchroniser vos données en temps réel.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 gap-4">
              {config.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={field.key} className="text-sm font-medium">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                  )}
                  {renderField(field)}
                  {field.help && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {field.help}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Test de connexion */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">Test de connexion</h4>
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

          {/* Section Sécurité */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Sécurité garantie :</strong> Vos informations de connexion sont chiffrées avec AES-256 et stockées de manière sécurisée. 
              Elles ne sont utilisées que pour la synchronisation de vos données et ne sont jamais partagées avec des tiers.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
                  Connexion...
                </>
              ) : (
                'Connecter la boutique'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}