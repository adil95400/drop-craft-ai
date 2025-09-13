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
    id: 'ebay',
    name: 'eBay',
    color: 'bg-blue-600',
    disabled: true
  },
  {
    id: 'amazon',
    name: 'Amazon',
    color: 'bg-orange-400',
    disabled: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-500',
    disabled: true
  },
  {
    id: 'wix',
    name: 'Wix',
    color: 'bg-gray-800',
    disabled: true
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    color: 'bg-purple-600'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    color: 'bg-orange-500',
    disabled: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'bg-black',
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
                {platform.id === 'etsy' && (
                  <div className="text-white font-bold text-lg">Etsy</div>
                )}
                {platform.id === 'tiktok' && (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
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