import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useStoreConnection } from '@/hooks/useStoreConnection'
import { PlatformGridSelector } from './components/PlatformGridSelector'
import { CredentialInput } from '@/components/common/CredentialInput'
import { ConnectionTestStatus } from '@/components/stores/connection/ConnectionTestStatus'
import { BackButton } from '@/components/navigation/BackButton'

const ConnectStorePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { connectStore, loading } = useStoreConnection()
  
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    storeHash: '',
    storeId: '',
    accountId: '',
    environment: 'sandbox',
    marketplaceId: 'ATVPDKIKX0DER',
    // Fonctionnalités activées (stockées comme strings pour la compatibilité)
    autoSync: 'true',
    importProducts: 'true',
    trackOrders: 'true'
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConnect = async () => {
    if (!selectedPlatform || !formData.name || !formData.domain) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    // Validation des credentials selon la plateforme
    const requiredFields = {
      shopify: ['accessToken'],
      woocommerce: ['apiKey', 'apiSecret'],
      prestashop: ['apiKey'],
      magento: ['accessToken'],
      bigcommerce: ['storeHash', 'accessToken'],
      opencart: ['accessToken'],
      squarespace: ['accessToken'],
      etsy: ['apiKey', 'accessToken'],
      square: ['accessToken'],
      ecwid: ['storeId', 'accessToken'],
      wix: ['accessToken'],
      amazon: ['accessToken'],
      lightspeed: ['accountId', 'apiKey', 'apiSecret'],
      cdiscount: ['apiKey', 'accessToken']
    }

    const required = requiredFields[selectedPlatform as keyof typeof requiredFields] || []
    const missingFields = required.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs API obligatoires",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Préparer les credentials selon la plateforme
      let credentials = {}
      
      if (selectedPlatform === 'shopify') {
        credentials = {
          shop_domain: formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          access_token: formData.accessToken,
          features: {
            auto_sync: formData.autoSync === 'true',
            import_products: formData.importProducts === 'true',
            track_orders: formData.trackOrders === 'true'
          }
        }
      } else if (selectedPlatform === 'woocommerce') {
        credentials = {
          consumer_key: formData.apiKey,
          consumer_secret: formData.apiSecret
        }
      } else if (selectedPlatform === 'prestashop') {
        credentials = {
          webservice_key: formData.apiKey
        }
      } else if (selectedPlatform === 'magento') {
        credentials = {
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'bigcommerce') {
        credentials = {
          store_hash: formData.storeHash,
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'opencart') {
        credentials = {
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'squarespace') {
        credentials = {
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'etsy') {
        credentials = {
          api_key: formData.apiKey,
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'square') {
        credentials = {
          access_token: formData.accessToken,
          environment: formData.environment || 'sandbox'
        }
      } else if (selectedPlatform === 'ecwid') {
        credentials = {
          store_id: formData.storeId,
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'wix') {
        credentials = {
          access_token: formData.accessToken
        }
      } else if (selectedPlatform === 'amazon') {
        credentials = {
          access_token: formData.accessToken,
          marketplace_id: formData.marketplaceId || 'ATVPDKIKX0DER'
        }
      } else if (selectedPlatform === 'lightspeed') {
        credentials = {
          account_id: formData.accountId,
          api_key: formData.apiKey,
          api_secret: formData.apiSecret
        }
      } else if (selectedPlatform === 'cdiscount') {
        credentials = {
          api_key: formData.apiKey,
          access_token: formData.accessToken
        }
      }

      await connectStore({
        name: formData.name,
        platform: selectedPlatform as any,
        domain: formData.domain,
        credentials
      })

      navigate('/dashboard/stores')
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsLoading(false)
    }
  }

  const renderPlatformForm = () => {
    if (!selectedPlatform) return null

    const platformConfig = {
      shopify: {
        title: "Connecter Shopify",
        description: "Ces informations nous permettront de nous connecter à votre boutique et de synchroniser vos données.",
        fields: [
          { key: 'accessToken', label: 'Access Token Privé', placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxx', required: true }
        ],
        features: [
          { key: 'autoSync', label: 'Synchronisation automatique', description: 'Synchronise automatiquement vos données' },
          { key: 'importProducts', label: 'Import des produits', description: 'Importe vos produits depuis Shopify' },
          { key: 'trackOrders', label: 'Suivi des commandes', description: 'Suit vos commandes en temps réel' }
        ]
      },
      woocommerce: {
        title: "Connecter WooCommerce",
        description: "Connectez votre boutique WooCommerce via l'API REST",
        fields: [
          { key: 'apiKey', label: 'Consumer Key', placeholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxx', required: true },
          { key: 'apiSecret', label: 'Consumer Secret', placeholder: 'cs_xxxxxxxxxxxxxxxxxxxxxxxx', required: true }
        ],
        features: []
      },
      prestashop: {
        title: "Connecter PrestaShop",
        description: "Connectez votre boutique PrestaShop via Webservice",
        fields: [
          { key: 'apiKey', label: 'Webservice Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', required: true }
        ],
        features: []
      },
      magento: {
        title: "Connecter Magento",
        description: "Connectez votre boutique Magento via l'API REST",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès', required: true }
        ],
        features: []
      },
      bigcommerce: {
        title: "Connecter BigCommerce",
        description: "Connectez votre boutique BigCommerce via l'API REST",
        fields: [
          { key: 'storeHash', label: 'Store Hash', placeholder: 'abc123', required: true },
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès', required: true }
        ],
        features: []
      },
      opencart: {
        title: "Connecter OpenCart",
        description: "Connectez votre boutique OpenCart",
        fields: [
          { key: 'accessToken', label: 'API Token', placeholder: 'Votre token API', required: true }
        ],
        features: []
      },
      squarespace: {
        title: "Connecter Squarespace",
        description: "Connectez votre boutique Squarespace via OAuth",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token OAuth', required: true }
        ],
        features: []
      },
      etsy: {
        title: "Connecter Etsy",
        description: "Connectez votre boutique Etsy via l'API",
        fields: [
          { key: 'apiKey', label: 'API Key', placeholder: 'Votre clé API Etsy', required: true },
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès', required: true }
        ],
        features: []
      },
      square: {
        title: "Connecter Square Online",
        description: "Connectez votre boutique Square via l'API",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token Square', required: true }
        ],
        features: []
      },
      ecwid: {
        title: "Connecter Ecwid",
        description: "Connectez votre boutique Ecwid via l'API",
        fields: [
          { key: 'storeId', label: 'Store ID', placeholder: '12345', required: true },
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès', required: true }
        ],
        features: []
      },
      wix: {
        title: "Connecter Wix eCommerce",
        description: "Connectez votre boutique Wix via l'API",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès Wix', required: true }
        ],
        features: []
      },
      amazon: {
        title: "Connecter Amazon Seller",
        description: "Connectez votre compte Amazon Seller via l'API",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token Amazon SP-API', required: true }
        ],
        features: []
      },
      lightspeed: {
        title: "Connecter Lightspeed",
        description: "Connectez votre POS Lightspeed via l'API",
        fields: [
          { key: 'accountId', label: 'Account ID', placeholder: '12345', required: true },
          { key: 'apiKey', label: 'API Key', placeholder: 'Votre clé API', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'Votre secret API', required: true }
        ],
        features: []
      },
      cdiscount: {
        title: "Connecter Cdiscount Pro",
        description: "Connectez votre compte marchand Cdiscount via l'API",
        fields: [
          { key: 'apiKey', label: 'API Key', placeholder: 'Votre clé API Cdiscount', required: true },
          { key: 'accessToken', label: 'Token', placeholder: 'Votre token d\'authentification', required: true }
        ],
        features: []
      }
    }

    const config = platformConfig[selectedPlatform as keyof typeof platformConfig]
    if (!config) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {config.title}
          </CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Champs obligatoires */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de la boutique *</Label>
              <Input
                id="name"
                placeholder="Ma boutique en ligne"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="domain">Domaine de la boutique *</Label>
              <Input
                id="domain"
                placeholder="monsite.com ou monsite.myshopify.com"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
              />
            </div>
          </div>

          {/* Champs spécifiques à la plateforme */}
          {config.fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {field.label} {field.required && '*'}
              </Label>
              {field.key.includes('Token') || field.key.includes('secret') || field.key.includes('Secret') ? (
                <CredentialInput
                  id={field.key}
                  label=""
                  value={formData[field.key as keyof typeof formData] as string}
                  onChange={(value) => handleInputChange(field.key, value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : (
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {/* Test de connexion */}
          {selectedPlatform && formData.domain && (
            <ConnectionTestStatus
              platform={selectedPlatform}
              domain={formData.domain}
              credentials={(() => {
                if (selectedPlatform === 'shopify') {
                  return { access_token: formData.accessToken };
                } else if (selectedPlatform === 'woocommerce') {
                  return { consumer_key: formData.apiKey, consumer_secret: formData.apiSecret };
                } else if (selectedPlatform === 'prestashop') {
                  return { webservice_key: formData.apiKey };
                } else if (selectedPlatform === 'magento') {
                  return { access_token: formData.accessToken };
                }
                return {};
              })()}
              onTestComplete={(success, data) => {
                if (success && data) {
                  console.log('Connection test successful:', data);
                }
              }}
            />
          )}

          {/* Fonctionnalités activées - seulement pour Shopify */}
          {selectedPlatform === 'shopify' && config.features && config.features.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">⚡</div>
                <h3 className="text-lg font-semibold">Fonctionnalités activées</h3>
              </div>
              <div className="grid gap-4">
                {config.features.map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{feature.label}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={feature.key}
                        checked={Boolean(formData[feature.key as keyof typeof formData])}
                        onChange={(e) => handleInputChange(feature.key, e.target.checked.toString())}
                        className="sr-only"
                      />
                      <label
                        htmlFor={feature.key}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
                          Boolean(formData[feature.key as keyof typeof formData]) ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            Boolean(formData[feature.key as keyof typeof formData]) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setSelectedPlatform(null)}
              variant="outline"
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isLoading || loading}
              className="flex-1"
            >
              {(isLoading || loading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connecter la boutique
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <BackButton to="/dashboard/stores" label="Retour aux boutiques" />
      </div>
      {/* Sélection de plateforme */}
      {!selectedPlatform ? (
        <PlatformGridSelector
          onSelect={setSelectedPlatform}
        />
      ) : (
        <div className="mb-6">
          <BackButton 
            onClick={() => setSelectedPlatform(null)}
            label="Retour à la sélection"
          />
        </div>
      )}

      {/* Formulaire de configuration */}
      {renderPlatformForm()}
    </div>
  )
}

export default ConnectStorePage