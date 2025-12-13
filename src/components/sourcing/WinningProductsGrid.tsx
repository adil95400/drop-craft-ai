import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingProduct } from '@/types/adspy'
import {
  Star, ShoppingCart, TrendingUp, AlertTriangle, Package, Plus,
  ExternalLink, BarChart3, Flame, Eye, DollarSign, Users,
  ChevronRight, Bookmark, CheckCircle
} from 'lucide-react'

// Enhanced mock winning products
const mockWinningProducts: TrendingProduct[] = [
  {
    id: '1',
    name: 'Smart LED Strip Lights 20m RGB WiFi',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    price: 12.99,
    originalPrice: 29.99,
    currency: 'USD',
    supplier: 'AliExpress',
    supplierUrl: 'https://aliexpress.com/item/123',
    platforms: ['tiktok', 'facebook', 'instagram'],
    primaryPlatform: 'tiktok',
    trendScore: 95,
    viralScore: 88,
    saturationScore: 35,
    profitPotential: 78,
    estimatedSales: 45000,
    salesGrowth: 234,
    revenueEstimate: 580000,
    adCount: 234,
    competitorCount: 89,
    averagePrice: 24.99,
    priceRange: { min: 15.99, max: 39.99 },
    category: 'Home Decor',
    subcategory: 'LED Lights',
    niche: 'Smart Home',
    tags: ['viral', 'trending', 'winner', 'tiktok'],
    firstDetected: '2024-10-15',
    lastUpdated: '2024-12-12',
    peakDate: '2024-11-28',
    aiSummary: 'Produit viral avec forte croissance. Faible saturation, marge élevée.',
    aiRecommendation: 'import',
    riskLevel: 'low'
  },
  {
    id: '2',
    name: 'Ice Roller Face Massager Pro',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    price: 4.50,
    originalPrice: 12.99,
    currency: 'USD',
    supplier: 'CJ Dropshipping',
    platforms: ['tiktok', 'instagram'],
    primaryPlatform: 'tiktok',
    trendScore: 92,
    viralScore: 95,
    saturationScore: 45,
    profitPotential: 85,
    estimatedSales: 78000,
    salesGrowth: 456,
    revenueEstimate: 1200000,
    adCount: 567,
    competitorCount: 145,
    averagePrice: 18.99,
    priceRange: { min: 9.99, max: 29.99 },
    category: 'Beauty',
    subcategory: 'Skincare Tools',
    niche: 'Beauty Gadgets',
    tags: ['beauty', 'viral', 'tiktok made me buy it'],
    firstDetected: '2024-09-20',
    lastUpdated: '2024-12-11',
    aiSummary: 'Excellente marge, très viral sur TikTok. Saturation modérée.',
    aiRecommendation: 'import',
    riskLevel: 'low'
  },
  {
    id: '3',
    name: 'Portable Blender USB Rechargeable 380ml',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
    price: 8.99,
    originalPrice: 19.99,
    currency: 'USD',
    supplier: 'BigBuy',
    platforms: ['facebook', 'instagram', 'pinterest'],
    primaryPlatform: 'facebook',
    trendScore: 78,
    viralScore: 65,
    saturationScore: 68,
    profitPotential: 62,
    estimatedSales: 23000,
    salesGrowth: 45,
    revenueEstimate: 340000,
    adCount: 890,
    competitorCount: 234,
    averagePrice: 24.99,
    priceRange: { min: 14.99, max: 34.99 },
    category: 'Kitchen',
    subcategory: 'Small Appliances',
    niche: 'Health & Fitness',
    tags: ['fitness', 'portable', 'kitchen'],
    firstDetected: '2024-06-10',
    lastUpdated: '2024-12-10',
    aiSummary: 'Marché saturé mais demande constante. Différenciation nécessaire.',
    aiRecommendation: 'watch',
    riskLevel: 'medium'
  },
  {
    id: '4',
    name: 'Magnetic Phone Mount 360° Rotation',
    image: 'https://images.unsplash.com/photo-1586953208270-767889fa9261?w=400',
    price: 3.20,
    originalPrice: 9.99,
    currency: 'USD',
    supplier: 'AliExpress',
    platforms: ['tiktok', 'facebook'],
    primaryPlatform: 'facebook',
    trendScore: 85,
    viralScore: 72,
    saturationScore: 52,
    profitPotential: 74,
    estimatedSales: 34000,
    salesGrowth: 123,
    revenueEstimate: 450000,
    adCount: 345,
    competitorCount: 112,
    averagePrice: 14.99,
    priceRange: { min: 7.99, max: 24.99 },
    category: 'Auto',
    subcategory: 'Phone Accessories',
    niche: 'Car Gadgets',
    tags: ['car', 'phone', 'accessory'],
    firstDetected: '2024-08-05',
    lastUpdated: '2024-12-12',
    aiSummary: 'Bonne marge et croissance stable. Saturation acceptable.',
    aiRecommendation: 'import',
    riskLevel: 'low'
  }
]

export function WinningProductsGrid() {
  const [savedProducts, setSavedProducts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const toggleSave = (id: string) => {
    setSavedProducts(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'import':
        return { label: '✅ Importer', className: 'bg-green-500 text-white' }
      case 'watch':
        return { label: '👀 Surveiller', className: 'bg-yellow-500 text-white' }
      case 'avoid':
        return { label: '⚠️ Éviter', className: 'bg-red-500 text-white' }
      default:
        return { label: '📊 Analyser', className: 'bg-muted text-foreground' }
    }
  }

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'low':
        return { label: 'Risque faible', className: 'text-green-500 bg-green-500/10' }
      case 'medium':
        return { label: 'Risque modéré', className: 'text-yellow-500 bg-yellow-500/10' }
      case 'high':
        return { label: 'Risque élevé', className: 'text-red-500 bg-red-500/10' }
      default:
        return { label: 'Non évalué', className: 'text-muted-foreground bg-muted' }
    }
  }

  const getSaturationIndicator = (score: number) => {
    if (score <= 30) return { label: 'Faible', color: 'text-green-500', bg: 'bg-green-500' }
    if (score <= 60) return { label: 'Modérée', color: 'text-yellow-500', bg: 'bg-yellow-500' }
    return { label: 'Élevée', color: 'text-red-500', bg: 'bg-red-500' }
  }

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {mockWinningProducts.map(product => {
          const recBadge = getRecommendationBadge(product.aiRecommendation)
          const riskBadge = getRiskBadge(product.riskLevel)
          const saturation = getSaturationIndicator(product.saturationScore)
          const isSaved = savedProducts.includes(product.id)
          const margin = ((product.averagePrice - product.price) / product.averagePrice * 100).toFixed(0)

          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all group">
              {/* Image */}
              <div className="relative aspect-square bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Flame className="h-3 w-3 mr-1" />
                    {product.trendScore}
                  </Badge>
                  {product.salesGrowth > 100 && (
                    <Badge className="bg-green-500 text-white">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{product.salesGrowth}%
                    </Badge>
                  )}
                </div>

                <div className="absolute top-2 right-2">
                  <Badge className={recBadge.className}>
                    {recBadge.label}
                  </Badge>
                </div>

                {/* Platform badges */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {product.platforms.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs px-2">
                      {p === 'tiktok' ? '🎵' : p === 'facebook' ? '📘' : p === 'instagram' ? '📷' : '📌'}
                    </Badge>
                  ))}
                </div>

                {/* Save button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute bottom-2 right-2 ${isSaved ? 'text-primary' : 'text-white'} bg-black/20 hover:bg-black/40`}
                  onClick={() => toggleSave(product.id)}
                >
                  <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>

                {/* Price & Margin */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">${product.price}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    +{margin}% marge
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-bold">{(product.estimatedSales / 1000).toFixed(0)}K</p>
                    <p className="text-muted-foreground">Ventes</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-bold">{product.adCount}</p>
                    <p className="text-muted-foreground">Pubs</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-bold">{product.competitorCount}</p>
                    <p className="text-muted-foreground">Vendeurs</p>
                  </div>
                </div>

                {/* Saturation & Risk */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Saturation:</span>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${saturation.bg}`} />
                      <span className={saturation.color}>{saturation.label}</span>
                    </div>
                  </div>
                  <Badge className={riskBadge.className}>
                    {riskBadge.label}
                  </Badge>
                </div>

                {/* Score Bars */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Potentiel Profit</span>
                      <span className="font-bold">{product.profitPotential}%</span>
                    </div>
                    <Progress value={product.profitPotential} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Score Viral</span>
                      <span className="font-bold">{product.viralScore}%</span>
                    </div>
                    <Progress value={product.viralScore} className="h-1.5" />
                  </div>
                </div>

                {/* AI Summary */}
                {product.aiSummary && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                    {product.aiSummary}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 gap-1">
                    <Plus className="h-3 w-3" />
                    Importer
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
