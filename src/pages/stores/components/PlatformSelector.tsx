import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface Platform {
  id: 'shopify' | 'woocommerce' | 'prestashop' | 'magento'
  name: string
  description: string
  logo: string
  color: string
  features: string[]
  popular?: boolean
}

interface PlatformSelectorProps {
  selectedPlatform: string | null
  onSelect: (platform: string) => void
}

const platforms: Platform[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'La plateforme e-commerce leader mondial',
    logo: 'https://via.placeholder.com/48x48/10b981/ffffff?text=SH',
    color: 'bg-green-500',
    features: ['Facile à utiliser', 'Plus de 6000 apps', 'Hébergement inclus', 'Thèmes responsive'],
    popular: true
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Solution e-commerce pour WordPress',
    logo: 'https://via.placeholder.com/48x48/7c3aed/ffffff?text=WC',
    color: 'bg-purple-500',
    features: ['Open source', 'Très flexible', 'Grande communauté', 'Extensions nombreuses']
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    description: 'Solution française open source',
    logo: 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=PS',
    color: 'bg-blue-500',
    features: ['Gratuit', 'Multilingue', 'Modules nombreux', 'Support français']
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Plateforme enterprise robuste',
    logo: 'https://via.placeholder.com/48x48/f97316/ffffff?text=MG',
    color: 'bg-orange-500',
    features: ['Très puissant', 'Multi-boutiques', 'B2B et B2C', 'Haute performance']
  }
]

export function PlatformSelector({ selectedPlatform, onSelect }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {platforms.map((platform) => (
        <Card 
          key={platform.id}
          className={`cursor-pointer transition-smooth hover:shadow-card ${
            selectedPlatform === platform.id 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/30'
          }`}
          onClick={() => onSelect(platform.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
                  <img 
                    src={platform.logo} 
                    alt={platform.name}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{platform.name}</h3>
                    {platform.popular && (
                      <Badge className="bg-primary text-primary-foreground">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {platform.description}
                  </p>
                </div>
              </div>
              
              {selectedPlatform === platform.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {platform.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}