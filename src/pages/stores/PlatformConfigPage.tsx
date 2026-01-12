import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { ArrowLeft, Settings, Globe, Key, Link as LinkIcon } from 'lucide-react'

interface PlatformConfig {
  platform: string
  displayName: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'password' | 'select' | 'url'
    required: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string }>
  }>
  helpText?: string
}

const platformConfigs: Record<string, PlatformConfig> = {
  shopify: {
    platform: 'shopify',
    displayName: 'Shopify',
    fields: [
      { key: 'shop_domain', label: 'Nom de la boutique', type: 'text', required: true, placeholder: 'monshop.myshopify.com' },
      { key: 'access_token', label: 'Token d\'accès privé', type: 'password', required: true }
    ],
    helpText: 'Créez une application privée dans votre admin Shopify pour obtenir le token d\'accès.'
  },
  amazon: {
    platform: 'amazon',
    displayName: 'Amazon Seller Central',
    fields: [
      { 
        key: 'marketplace', 
        label: 'Marché', 
        type: 'select', 
        required: true,
        options: [
          { value: 'FR', label: 'France' },
          { value: 'ES', label: 'Espagne' },
          { value: 'IT', label: 'Italie' },
          { value: 'DE', label: 'Allemagne' },
          { value: 'UK', label: 'Royaume-Uni' },
          { value: 'US', label: 'États-Unis' }
        ]
      },
      { key: 'access_token', label: 'LWA Access Token', type: 'password', required: true },
      { key: 'refresh_token', label: 'LWA Refresh Token', type: 'password', required: true }
    ],
    helpText: 'Utilisez l\'API SP (Selling Partner) d\'Amazon pour connecter votre compte vendeur.'
  },
  woocommerce: {
    platform: 'woocommerce',
    displayName: 'WooCommerce',
    fields: [
      { key: 'platform_url', label: 'URL de la boutique', type: 'url', required: true, placeholder: 'https://monsite.com' },
      { key: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true }
    ],
    helpText: 'Créez des clés API dans WooCommerce > Paramètres > Avancé > API REST.'
  },
  prestashop: {
    platform: 'prestashop',
    displayName: 'PrestaShop',
    fields: [
      { key: 'platform_url', label: 'URL de la boutique', type: 'url', required: true, placeholder: 'https://monsite.com' },
      { key: 'webservice_key', label: 'Clé de webservice', type: 'password', required: true }
    ],
    helpText: 'Activez les webservices dans Paramètres avancés > Webservice et créez une clé d\'accès.'
  },
  magento: {
    platform: 'magento',
    displayName: 'Magento',
    fields: [
      { key: 'platform_url', label: 'URL de la boutique', type: 'url', required: true, placeholder: 'https://monsite.com' },
      { key: 'access_token', label: 'Token d\'accès', type: 'password', required: true }
    ],
    helpText: 'Créez un token d\'intégration dans Système > Extensions > Intégrations.'
  },
  etsy: {
    platform: 'etsy',
    displayName: 'Etsy',
    fields: [
      { key: 'api_key', label: 'Clé API', type: 'password', required: true },
      { key: 'access_token', label: 'Token d\'accès', type: 'password', required: true }
    ],
    helpText: 'Créez une application sur Etsy Developers pour obtenir vos clés API.'
  },
  rakuten: {
    platform: 'rakuten',
    displayName: 'Rakuten France',
    fields: [
      { key: 'access_token', label: 'Token d\'accès', type: 'password', required: true }
    ],
    helpText: 'Contactez Rakuten pour obtenir l\'accès à leur API partenaire.'
  },
  fnac: {
    platform: 'fnac',
    displayName: 'Fnac Marketplace',
    fields: [
      { key: 'access_token', label: 'Token d\'accès', type: 'password', required: true }
    ],
    helpText: 'Demandez l\'accès à l\'API Fnac Marketplace via votre compte vendeur.'
  },
  cdiscount: {
    platform: 'cdiscount',
    displayName: 'Cdiscount Pro',
    fields: [
      { key: 'api_key', label: 'Clé API', type: 'password', required: true },
      { key: 'access_token', label: 'Token', type: 'password', required: true }
    ],
    helpText: 'Obtenez vos identifiants API depuis votre espace vendeur Cdiscount Pro.'
  }
}

export function PlatformConfigPage() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const config = platform ? platformConfigs[platform] : null

  useEffect(() => {
    if (!config) {
      navigate('/stores-channels/connect')
    }
  }, [config, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setLoading(true)

    try {
      // Créer l'intégration - utiliser les champs disponibles
      const { data, error } = await (supabase
        .from('integrations') as any)
        .insert({
          platform: config.platform,
          platform_name: config.displayName,
          store_url: formData.platform_url || formData.shop_domain || null,
          config: { 
            platform: config.platform,
            shop_name: formData.shop_domain || formData.platform_url || config.displayName,
            credentials: formData
          },
          connection_status: 'disconnected',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Test the connection
      const { data: testResult, error: testError } = await supabase.functions.invoke('store-connection-test', {
        body: {
          platform: config.platform,
          ...formData
        }
      })

      if (testError) throw testError

      // Update the status
      await supabase
        .from('integrations')
        .update({
          connection_status: testResult.success ? 'connected' : 'error',
          store_config: testResult.shop_info || {}
        })
        .eq('id', data.id)

      toast({
        title: testResult.success ? "Connection successful" : "Connection failed",
        description: testResult.success ? 
          `${config.displayName} has been connected successfully` : 
          "Check your credentials and try again",
        variant: testResult.success ? "default" : "destructive"
      })

      if (testResult.success) {
        navigate('/stores-channels/integrations')
      }

    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: "Connection error",
        description: "Unable to connect the platform",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!config) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/stores-channels/connect')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configurer {config.displayName}
          </h1>
          <p className="text-gray-600 mt-2">
            Connectez votre boutique {config.displayName}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configuration de {config.displayName}
            </CardTitle>
            {config.helpText && (
              <p className="text-sm text-gray-600 mt-2">
                {config.helpText}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {config.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.type === 'select' ? (
                    <Select
                      value={formData[field.key] || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
                      required={field.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/stores-channels/connect')}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connecter
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}