import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPlatformLogo } from '@/utils/platformLogos'

interface Platform {
  id: string
  name: string
  disabled?: boolean
}

interface PlatformGridSelectorProps {
  onSelect: (platform: string) => void
}

const platforms: Platform[] = [
  { id: 'shopify', name: 'Shopify' },
  { id: 'woocommerce', name: 'WooCommerce' },
  { id: 'prestashop', name: 'PrestaShop' },
  { id: 'magento', name: 'Magento' },
  { id: 'bigcommerce', name: 'BigCommerce' },
  { id: 'opencart', name: 'OpenCart' },
  { id: 'squarespace', name: 'Squarespace' },
  { id: 'etsy', name: 'Etsy' },
  { id: 'ecwid', name: 'Ecwid' },
  { id: 'wix', name: 'Wix eCommerce' },
  { id: 'amazon', name: 'Amazon Seller' },
  { id: 'ebay', name: 'eBay' },
  { id: 'cdiscount', name: 'Cdiscount Pro' },
  { id: 'facebook', name: 'Facebook Shop' },
  { id: 'rakuten', name: 'Rakuten France' },
  { id: 'fnac', name: 'Fnac Marketplace' },
  { id: 'aliexpress', name: 'AliExpress' },
  { id: 'zalando', name: 'Zalando Partner' },
  { id: 'walmart', name: 'Walmart' },
]

export function PlatformGridSelector({ onSelect }: PlatformGridSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Sélectionnez votre canal de vente
        </h1>
        <p className="text-muted-foreground text-lg">
          Connectez votre boutique pour synchroniser vos produits, commandes et données
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platforms.map((platform) => {
          const logo = getPlatformLogo(platform.id)
          return (
            <Card 
              key={platform.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                platform.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105'
              }`}
              onClick={() => !platform.disabled && onSelect(platform.id)}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted/50 flex items-center justify-center p-2">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt={platform.name} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {platform.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {platform.name}
                </h3>
                
                {platform.disabled && (
                  <div className="text-sm text-muted-foreground">
                    Bientôt disponible
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-muted-foreground text-sm">
        <p>Pas sur la liste ? 
          <Button variant="link" className="text-primary hover:underline p-0 ml-1">
            Contactez-nous
          </Button>
        </p>
      </div>
    </div>
  )
}
