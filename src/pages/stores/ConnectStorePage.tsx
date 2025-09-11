import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useStores } from '@/hooks/useStores'
import { PlatformSelector } from './components/PlatformSelector'

const ConnectStorePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { connectStore } = useStores()
  
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
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
      shopify: ['apiKey', 'apiSecret'],
      woocommerce: ['apiKey', 'apiSecret'],
      prestashop: ['apiKey'],
      magento: ['accessToken']
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

    setLoading(true)
    try {
      // Préparer les credentials selon la plateforme
      let credentials = {}
      
      if (selectedPlatform === 'shopify') {
        credentials = {
          shop_domain: formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          access_token: formData.apiKey,
          api_secret: formData.apiSecret
        }
      } else if (selectedPlatform === 'woocommerce') {
        credentials = {
          shop_domain: formData.domain.startsWith('http') ? formData.domain : `https://${formData.domain}`,
          consumer_key: formData.apiKey,
          consumer_secret: formData.apiSecret
        }
      } else if (selectedPlatform === 'prestashop') {
        credentials = {
          shop_domain: formData.domain.startsWith('http') ? formData.domain : `https://${formData.domain}`,
          webservice_key: formData.apiKey
        }
      } else if (selectedPlatform === 'magento') {
        credentials = {
          shop_domain: formData.domain.startsWith('http') ? formData.domain : `https://${formData.domain}`,
          access_token: formData.accessToken
        }
      }

      await connectStore({
        name: formData.name,
        platform: selectedPlatform as any,
        domain: formData.domain,
        credentials
      })

      toast({
        title: "Succès",
        description: "Boutique connectée avec succès"
      })

      navigate('/stores')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de connecter la boutique",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderPlatformForm = () => {
    if (!selectedPlatform) return null

    const platformConfig = {
      shopify: {
        title: "Connecter Shopify",
        description: "Connectez votre boutique Shopify en utilisant l'API",
        fields: [
          { key: 'apiKey', label: 'API Key', placeholder: 'Votre clé API Shopify', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'Votre secret API Shopify', required: true }
        ]
      },
      woocommerce: {
        title: "Connecter WooCommerce",
        description: "Connectez votre boutique WooCommerce via l'API REST",
        fields: [
          { key: 'apiKey', label: 'Consumer Key', placeholder: 'Votre Consumer Key', required: true },
          { key: 'apiSecret', label: 'Consumer Secret', placeholder: 'Votre Consumer Secret', required: true }
        ]
      },
      prestashop: {
        title: "Connecter PrestaShop",
        description: "Connectez votre boutique PrestaShop via Webservice",
        fields: [
          { key: 'apiKey', label: 'Webservice Key', placeholder: 'Votre clé Webservice', required: true }
        ]
      },
      magento: {
        title: "Connecter Magento",
        description: "Connectez votre boutique Magento via l'API REST",
        fields: [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Votre token d\'accès', required: true }
        ]
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
                placeholder="Mon e-commerce"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="domain">Domaine *</Label>
              <Input
                id="domain"
                placeholder="mon-site.com"
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
              <Input
                id={field.key}
                type={field.key.includes('secret') ? 'password' : 'text'}
                placeholder={field.placeholder}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
              />
            </div>
          ))}

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
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connecter la boutique
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/stores')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Connecter une boutique</h1>
          <p className="text-muted-foreground">
            Choisissez votre plateforme e-commerce et configurez la connexion
          </p>
        </div>
      </div>

      {/* Sélection de plateforme */}
      {!selectedPlatform && (
        <PlatformSelector
          selectedPlatform={selectedPlatform}
          onSelect={setSelectedPlatform}
        />
      )}

      {/* Formulaire de configuration */}
      {renderPlatformForm()}
    </div>
  )
}

export default ConnectStorePage