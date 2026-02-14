import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPlatformLogo } from '@/utils/platformLogos'

interface Platform {
  id: string
  name: string
  subtitle: string
  description: string
  disabled?: boolean
}

interface PlatformGridSelectorProps {
  onSelect: (platform: string) => void
}

const platforms: Platform[] = [
  { id: 'shopify', name: 'Shopify', subtitle: 'La plateforme e-commerce du moment', description: 'Créer votre propre site web de commerce électronique n\'a jamais été aussi simple, rapide et évolutif.' },
  { id: 'woocommerce', name: 'WooCommerce', subtitle: 'La solution e-commerce open source n°1', description: 'Une plateforme de commerce électronique basée sur WordPress, vous permettant de créer une boutique en quelques minutes.' },
  { id: 'wix', name: 'Wix', subtitle: 'Un créateur de sites web de classe mondiale', description: 'La liberté de créer, concevoir, gérer et développer une boutique en ligne unique.' },
  { id: 'prestashop', name: 'PrestaShop', subtitle: 'La solution e-commerce française', description: 'Une plateforme open source puissante pour créer et gérer votre boutique en ligne professionnelle.' },
  { id: 'magento', name: 'Magento', subtitle: 'La plateforme e-commerce enterprise', description: 'Une solution robuste et flexible pour les entreprises ayant des besoins e-commerce avancés.' },
  { id: 'bigcommerce', name: 'BigCommerce', subtitle: 'Le commerce sans limites', description: 'Une plateforme SaaS complète pour développer votre activité en ligne à grande échelle.' },
  { id: 'squarespace', name: 'Squarespace', subtitle: 'Design et commerce réunis', description: 'Des templates élégants et des outils e-commerce intégrés pour une boutique au design soigné.' },
  { id: 'opencart', name: 'OpenCart', subtitle: 'E-commerce open source gratuit', description: 'Une solution légère et personnalisable pour lancer rapidement votre boutique en ligne.' },
  { id: 'ecwid', name: 'Ecwid', subtitle: 'Le e-commerce pour les petites entreprises', description: 'Des solutions e-commerce gratuites pour libérer le potentiel de votre boutique en quelques minutes.' },
  { id: 'amazon', name: 'Amazon Seller', subtitle: 'La marketplace mondiale n°1', description: 'Accédez à des millions de clients à travers le monde grâce à la plus grande place de marché.' },
  { id: 'ebay', name: 'eBay', subtitle: 'Le marché en ligne mondial', description: 'Créez facilement une boutique qui raconte une histoire et représente votre marque.' },
  { id: 'walmart', name: 'Walmart', subtitle: 'Le géant américain du retail', description: 'Le plus grand réseau omnicanal au monde, avec de grandes ambitions et un avenir prometteur.' },
  { id: 'etsy', name: 'Etsy', subtitle: 'La marketplace du fait-main', description: 'Vendez vos créations uniques et artisanales à une communauté de passionnés.' },
  { id: 'cdiscount', name: 'Cdiscount Pro', subtitle: 'La marketplace française', description: 'Touchez des millions d\'acheteurs français sur l\'une des plus grandes places de marché hexagonales.' },
  { id: 'facebook', name: 'Facebook Shop', subtitle: 'Le commerce social', description: 'Vendez directement sur Facebook et Instagram pour atteindre vos clients là où ils se trouvent.' },
  { id: 'rakuten', name: 'Rakuten France', subtitle: 'La marketplace cashback', description: 'Profitez d\'un programme de fidélité unique pour attirer et fidéliser vos clients.' },
  { id: 'fnac', name: 'Fnac Marketplace', subtitle: 'Culture, tech et plus', description: 'Accédez à une audience qualifiée et passionnée de culture, tech et loisirs.' },
  { id: 'aliexpress', name: 'AliExpress', subtitle: 'Le sourcing international', description: 'Connectez-vous à des fournisseurs du monde entier pour diversifier votre catalogue.' },
  { id: 'zalando', name: 'Zalando Partner', subtitle: 'La mode en ligne européenne', description: 'Rejoignez la première plateforme de mode en Europe et développez vos ventes.' },
]

export function PlatformGridSelector({ onSelect }: PlatformGridSelectorProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Sélectionnez votre canal de vente
        </h1>
        <p className="text-muted-foreground text-lg">
          Connectez votre boutique pour synchroniser vos produits, commandes et données
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {platforms.map((platform) => {
          const logo = getPlatformLogo(platform.id)
          return (
            <Card 
              key={platform.id}
              className={`transition-all border ${
                platform.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg hover:border-primary/30'
              }`}
            >
              <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                <div>
                  <div className="h-10 mb-4 flex items-center">
                    {logo ? (
                      <img 
                        src={logo} 
                        alt={platform.name} 
                        className="h-8 max-w-[160px] object-contain object-left"
                      />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {platform.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {platform.subtitle}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {platform.description}
                  </p>
                </div>
                <div>
                  <Button 
                    size="sm"
                    className="uppercase text-xs tracking-wide"
                    onClick={() => !platform.disabled && onSelect(platform.id)}
                    disabled={platform.disabled}
                  >
                    Magasin Connect
                  </Button>
                </div>
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
