import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAdSpy } from '@/hooks/useAdSpy'
import {
  Search, Flame, TrendingUp, ShoppingCart, Target, 
  Star, Eye, Plus, ExternalLink, AlertTriangle,
  CheckCircle, XCircle, Sparkles, BarChart3, DollarSign
} from 'lucide-react'

export function WinningProducts() {
  const { trendingProducts, importProduct, isLoading } = useAdSpy()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'import':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Importer
          </Badge>
        )
      case 'watch':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Surveiller
          </Badge>
        )
      case 'avoid':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Éviter
          </Badge>
        )
      default:
        return null
    }
  }

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="text-green-500 border-green-500">Risque faible</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Risque moyen</Badge>
      case 'high':
        return <Badge variant="outline" className="text-red-500 border-red-500">Risque élevé</Badge>
      default:
        return null
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit gagnant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="decoration">Décoration</SelectItem>
                <SelectItem value="electronic">Électronique</SelectItem>
                <SelectItem value="beauty">Beauté</SelectItem>
                <SelectItem value="fashion">Mode</SelectItem>
                <SelectItem value="sport">Sport</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trendingProducts.length}</p>
              <p className="text-xs text-muted-foreground">Produits gagnants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">+156%</p>
              <p className="text-xs text-muted-foreground">Croissance moy.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">68%</p>
              <p className="text-xs text-muted-foreground">Marge moyenne</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">89%</p>
              <p className="text-xs text-muted-foreground">Score IA moyen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trendingProducts.map(product => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all group">
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {getRecommendationBadge(product.aiRecommendation)}
                {getRiskBadge(product.riskLevel)}
              </div>

              {/* Viral Score */}
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  🔥 {product.viralScore}
                </Badge>
              </div>

              {/* Platform Tags */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {product.platforms.map(platform => (
                  <Badge key={platform} variant="secondary" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Title & Price */}
              <div>
                <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-primary">{product.price}€</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}€
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{product.supplier}</p>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Trend Score</span>
                    <span className={`font-bold ${getScoreColor(product.trendScore)}`}>
                      {product.trendScore}%
                    </span>
                  </div>
                  <Progress value={product.trendScore} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Saturation</span>
                    <span className={`font-bold ${getScoreColor(100 - product.saturationScore)}`}>
                      {product.saturationScore}%
                    </span>
                  </div>
                  <Progress value={product.saturationScore} className="h-1.5" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-muted/50 rounded">
                  <ShoppingCart className="h-3 w-3 mx-auto mb-1" />
                  <p className="font-bold">{(product.estimatedSales / 1000).toFixed(1)}K</p>
                  <p className="text-muted-foreground">Ventes</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <TrendingUp className="h-3 w-3 mx-auto mb-1 text-green-500" />
                  <p className="font-bold text-green-500">+{product.salesGrowth}%</p>
                  <p className="text-muted-foreground">Croissance</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <Target className="h-3 w-3 mx-auto mb-1" />
                  <p className="font-bold">{product.competitorCount}</p>
                  <p className="text-muted-foreground">Concurrents</p>
                </div>
              </div>

              {/* Revenue Estimate */}
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revenu estimé</span>
                  <span className="text-lg font-bold text-primary">
                    {(product.revenueEstimate / 1000).toFixed(0)}K€
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 4).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => importProduct(product)}
                  disabled={isLoading}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Importer
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analyser
                </Button>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
