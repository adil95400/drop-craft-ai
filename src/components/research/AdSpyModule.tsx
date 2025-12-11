import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Search, TrendingUp, Eye, ShoppingCart, Heart, Share2,
  Filter, Download, Plus, ExternalLink, Flame, Star,
  BarChart3, Globe, DollarSign, Package, Loader2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface TrendingProduct {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  supplier: string
  platform: string
  engagementScore: number
  salesEstimate: number
  growthRate: number
  category: string
  tags: string[]
  adCount: number
  competitors: number
}

const MOCK_TRENDING: TrendingProduct[] = [
  {
    id: '1',
    name: 'Lampe LED Sunset Projection',
    image: '/placeholder.svg',
    price: 12.99,
    originalPrice: 29.99,
    supplier: 'AliExpress',
    platform: 'TikTok',
    engagementScore: 94,
    salesEstimate: 15420,
    growthRate: 234,
    category: 'Décoration',
    tags: ['viral', 'tiktok', 'aesthetic'],
    adCount: 847,
    competitors: 23
  },
  {
    id: '2',
    name: 'Organisateur Cable Management',
    image: '/placeholder.svg',
    price: 8.49,
    supplier: 'CJ Dropshipping',
    platform: 'Facebook',
    engagementScore: 87,
    salesEstimate: 8930,
    growthRate: 156,
    category: 'Bureau',
    tags: ['office', 'organisation', 'tech'],
    adCount: 412,
    competitors: 45
  },
  {
    id: '3',
    name: 'Mini Aspirateur Clavier USB',
    image: '/placeholder.svg',
    price: 15.99,
    originalPrice: 34.99,
    supplier: 'BigBuy',
    platform: 'Instagram',
    engagementScore: 82,
    salesEstimate: 6780,
    growthRate: 89,
    category: 'Électronique',
    tags: ['gadget', 'clean', 'useful'],
    adCount: 256,
    competitors: 67
  },
  {
    id: '4',
    name: 'Support Téléphone Flexible',
    image: '/placeholder.svg',
    price: 6.99,
    supplier: 'AliExpress',
    platform: 'TikTok',
    engagementScore: 91,
    salesEstimate: 12340,
    growthRate: 178,
    category: 'Accessoires',
    tags: ['phone', 'lazy', 'bed'],
    adCount: 623,
    competitors: 89
  },
]

const PLATFORMS = ['Tous', 'TikTok', 'Facebook', 'Instagram', 'Google', 'Pinterest']
const CATEGORIES = ['Toutes', 'Décoration', 'Bureau', 'Électronique', 'Beauté', 'Mode', 'Sport', 'Cuisine']

export function AdSpyModule() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('Tous')
  const [selectedCategory, setSelectedCategory] = useState('Toutes')
  const [minEngagement, setMinEngagement] = useState([60])
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<TrendingProduct[]>(MOCK_TRENDING)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500))
    setIsLoading(false)
    toast.success('Recherche terminée')
  }

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleImport = (product: TrendingProduct) => {
    toast.success(`${product.name} ajouté à votre catalogue`)
  }

  const filteredProducts = products.filter(p => {
    if (selectedPlatform !== 'Tous' && p.platform !== selectedPlatform) return false
    if (selectedCategory !== 'Toutes' && p.category !== selectedCategory) return false
    if (p.engagementScore < minEngagement[0]) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary" />
            AdSpy - Produits Tendances
          </h1>
          <p className="text-muted-foreground">
            Découvrez les produits viraux et gagnants du moment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyse IA
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit, niche, mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <Label className="text-sm whitespace-nowrap">Score min:</Label>
            <Slider
              value={minEngagement}
              onValueChange={setMinEngagement}
              max={100}
              min={0}
              step={5}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm font-medium w-12">{minEngagement}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredProducts.length}</p>
                <p className="text-xs text-muted-foreground">Produits tendances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+156%</p>
                <p className="text-xs text-muted-foreground">Croissance moy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2.3K</p>
                <p className="text-xs text-muted-foreground">Pubs analysées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.size}</p>
                <p className="text-xs text-muted-foreground">Favoris</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid">Grille</TabsTrigger>
            <TabsTrigger value="list">Liste</TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} résultats
          </p>
        </div>

        <TabsContent value="grid" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className="bg-primary">{product.platform}</Badge>
                    {product.growthRate > 100 && (
                      <Badge className="bg-green-500">
                        <Flame className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.supplier}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{product.price}€</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.originalPrice}€
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>+{product.growthRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{product.salesEstimate.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{product.adCount} ads</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Score:</span>
                    <Progress value={product.engagementScore} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{product.engagementScore}%</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => handleImport(product)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Importer
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <ScrollArea className="h-[600px]">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="flex items-center gap-4 p-4 border-b hover:bg-muted/50"
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{product.platform}</Badge>
                      <Badge variant="outline">{product.category}</Badge>
                      <span className="text-xs text-muted-foreground">{product.supplier}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.price}€</p>
                    <p className="text-xs text-green-500">+{product.growthRate}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={product.engagementScore} className="w-20 h-2" />
                    <span className="text-sm">{product.engagementScore}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleImport(product)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleFavorite(product.id)}>
                      <Heart className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
