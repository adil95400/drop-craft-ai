import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Platform {
  id: string
  name: string
  logo?: string
  color?: string
  disabled?: boolean
}

interface PlatformGridSelectorProps {
  onSelect: (platform: string) => void
}

const platforms: Platform[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    color: 'bg-green-500'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    color: 'bg-purple-600'
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    color: 'bg-blue-500'
  },
  {
    id: 'magento',
    name: 'Magento',
    color: 'bg-orange-600'
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    color: 'bg-red-500'
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    color: 'bg-teal-500'
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    color: 'bg-gray-900'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    color: 'bg-orange-500'
  },
  {
    id: 'square',
    name: 'Square Online',
    color: 'bg-indigo-600'
  },
  {
    id: 'ecwid',
    name: 'Ecwid',
    color: 'bg-cyan-600'
  },
  {
    id: 'wix',
    name: 'Wix eCommerce',
    color: 'bg-gray-800'
  },
  {
    id: 'amazon',
    name: 'Amazon Seller',
    color: 'bg-orange-400'
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    color: 'bg-emerald-600'
  },
  {
    id: 'cdiscount',
    name: 'Cdiscount Pro',
    color: 'bg-red-600'
  },
  {
    id: 'ebay',
    name: 'eBay',
    color: 'bg-blue-600',
    disabled: true
  },
  {
    id: 'facebook',
    name: 'Facebook Shop',
    color: 'bg-blue-500',
    disabled: true
  }
]

export function PlatformGridSelector({ onSelect }: PlatformGridSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Sélectionnez votre canal de vente
        </h1>
        <p className="text-gray-600 text-lg">
          Connectez votre boutique pour synchroniser vos produits, commandes et données
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platforms.map((platform) => (
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
              {/* Logo placeholder - we'll use platform icons */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-lg ${platform.color} flex items-center justify-center`}>
                {/* Platform-specific icons */}
                {platform.id === 'shopify' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M15.337 2.368c-.066-.054-.133-.054-.199-.054-.066 0-.133 0-.199.054L12.2 4.049l-.801-.534c-.066-.054-.133-.054-.199-.054s-.133 0-.199.054l-2.739 1.681C8.196 5.249 8.13 5.303 8.13 5.357v10.018c0 .054.066.108.132.162l2.739 1.681c.066.054.133.054.199.054s.133 0 .199-.054L12.2 15.537l.801.534c.066.054.133.054.199.054s.133 0 .199-.054l2.739-1.681c.066-.054.132-.108.132-.162V4.21c0-.054-.066-.108-.132-.162l-2.801-1.68zm-2.802 11.82l-1.869-1.249V7.795l1.869 1.249v5.144zm3.336-2.23l-1.869 1.249V7.063l1.869-1.249v6.144z"/>
                  </svg>
                )}
                {platform.id === 'ebay' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M7.869 4.17c-1.68 0-2.869.84-2.869 2.11 0 1.05.63 1.68 1.68 1.68s1.68-.63 1.68-1.68c0-1.27-1.19-2.11-2.49-2.11zm9.03 0c-1.68 0-2.869.84-2.869 2.11 0 1.05.63 1.68 1.68 1.68s1.68-.63 1.68-1.68c0-1.27-1.19-2.11-2.49-2.11z"/>
                  </svg>
                )}
                {platform.id === 'amazon' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.348-.046.365.13-.006.088-.046.133-.116.14-.065.013-.185.067-.356.16-.888.49-2.537 1.12-4.944 1.884-2.407.765-4.71 1.147-6.91 1.147-2.513 0-5.008-.633-7.486-1.9l-3.94-2.22c-.16-.09-.24-.18-.24-.27s.033-.18.098-.27c.065-.09.156-.18.27-.27z"/>
                  </svg>
                )}
                {platform.id === 'facebook' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                {platform.id === 'wix' && (
                  <div className="text-white font-bold text-xl">Wix</div>
                )}
                {platform.id === 'woocommerce' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M23.547 15.256c-.44 0-.793.354-.793.793 0 .44.354.793.793.793.44 0 .793-.354.793-.793 0-.44-.354-.793-.793-.793z"/>
                  </svg>
                )}
                {platform.id === 'prestashop' && (
                  <div className="text-white font-bold text-xs">PS</div>
                )}
                {platform.id === 'magento' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M12 .007L8.6 2.73v4.355L12 4.36l3.4 2.725V2.73L12 .007zm-3.4 7.832v8.048L12 18.61l3.4-2.723V7.839L12 10.564 8.6 7.839zm0 9.322v4.355L12 23.993l3.4-2.477v-4.355L12 19.883l-3.4-2.722z"/>
                  </svg>
                )}
                {platform.id === 'bigcommerce' && (
                  <div className="text-white font-bold text-xs">BC</div>
                )}
                {platform.id === 'opencart' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM6.5 8.5L12 6l5.5 2.5L12 11 6.5 8.5zm0 7L12 18l5.5-2.5v-3L12 15l-5.5-2.5v3z"/>
                  </svg>
                )}
                {platform.id === 'squarespace' && (
                  <div className="text-white font-bold text-xs">SS</div>
                )}
                {platform.id === 'etsy' && (
                  <div className="text-white font-bold text-lg">Etsy</div>
                )}
                {platform.id === 'square' && (
                  <div className="text-white font-bold text-xs">SQ</div>
                )}
                {platform.id === 'ecwid' && (
                  <div className="text-white font-bold text-xs">EC</div>
                )}
                {platform.id === 'lightspeed' && (
                  <div className="text-white font-bold text-xs">LS</div>
                )}
                {platform.id === 'cdiscount' && (
                  <div className="text-white font-bold text-xs">CD</div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {platform.name}
              </h3>
              
              {platform.disabled && (
                <div className="text-sm text-gray-500">
                  Bientôt disponible
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-gray-500 text-sm">
        <p>Pas sur la liste ? 
          <Button variant="link" className="text-blue-600 hover:underline p-0 ml-1">
            Déconnexion
          </Button>
        </p>
      </div>
    </div>
  )
}