import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Info } from 'lucide-react'
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
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    webserviceKey: ''
  })

  const platformConfigs = {
    shopify: {
      title: "Connecter Shopify",
      description: "Connectez votre boutique Shopify via l'API Admin",
      helpUrl: "https://help.shopify.com/en/manual/apps/private-apps",
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'text', required: true, 
          help: 'Trouvez votre clé API dans Paramètres > Applications > Applications privées' },
        { key: 'apiSecret', label: 'API Secret', type: 'password', required: true,
          help: 'Le mot de passe de votre application privée' },
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true,
          help: 'Token d\'accès généré pour votre application' }
      ]
    },
    woocommerce: {
      title: "Connecter WooCommerce",
      description: "Connectez votre boutique WooCommerce via l'API REST",
      helpUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication",
      fields: [
        { key: 'apiKey', label: 'Consumer Key', type: 'text', required: true,
          help: 'Générez vos clés dans WooCommerce > Paramètres > Avancé > API REST' },
        { key: 'apiSecret', label: 'Consumer Secret', type: 'password', required: true,
          help: 'Secret associé à votre Consumer Key' }
      ]
    },
    prestashop: {
      title: "Connecter PrestaShop",
      description: "Connectez votre boutique PrestaShop via Webservice",
      helpUrl: "https://devdocs.prestashop.com/1.7/webservice/",
      fields: [
        { key: 'webserviceKey', label: 'Webservice Key', type: 'password', required: true,
          help: 'Activez et générez une clé dans Paramètres Avancés > Webservice' }
      ]
    },
    magento: {
      title: "Connecter Magento",
      description: "Connectez votre boutique Magento via l'API REST",
      helpUrl: "https://devdocs.magento.com/guides/v2.4/get-started/authentication/gs-authentication.html",
      fields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true,
          help: 'Token d\'accès généré dans Admin > Système > Intégrations' }
      ]
    }
  }

  const config = platformConfigs[platform as keyof typeof platformConfigs]
  if (!config) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const requiredFields = config.fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => !formData[field.key as keyof typeof formData])
    
    if (!formData.name || !formData.domain || missingFields.length > 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await onConnect({
        platform,
        name: formData.name,
        domain: formData.domain,
        credentials: {
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          accessToken: formData.accessToken,
          webserviceKey: formData.webserviceKey
        }
      })
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {config.title}
          <Button variant="outline" size="sm" asChild>
            <a href={config.helpUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </a>
          </Button>
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de la boutique *</Label>
              <Input
                id="name"
                placeholder="Ma Boutique"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="domain">Domaine *</Label>
              <Input
                id="domain"
                placeholder="ma-boutique.com"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                required
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
                type={field.type}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  [field.key]: e.target.value 
                }))}
                required={field.required}
              />
              {field.help && (
                <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {field.help}
                </p>
              )}
            </div>
          ))}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Vos informations de connexion sont chiffrées et stockées de manière sécurisée. 
              Elles ne sont utilisées que pour synchroniser vos données.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connecter
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}