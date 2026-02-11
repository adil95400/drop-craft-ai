/**
 * Winning Products Feed - Flux quotidien de produits gagnants avec scoring
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Trophy, TrendingUp, Star, Flame, Search, Filter, RefreshCw,
  ShoppingCart, DollarSign, BarChart3, Eye, Heart, ExternalLink,
  Sparkles, ArrowUpRight, Package, Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WinningProduct {
  id: string
  name: string
  image: string
  score: number
  category: string
  price: { min: number, max: number }
  margin: number
  demandScore: number
  competitionScore: number
  trendScore: number
  orders30d: number
  searchVolume: number
  trend: 'rising' | 'stable' | 'declining'
  source: string
  addedAt: string
}

const mockProducts: WinningProduct[] = [
  { id: '1', name: 'Mini Projecteur Portable LED', image: '', score: 94, category: 'Électronique', price: { min: 12, max: 45 }, margin: 68, demandScore: 96, competitionScore: 88, trendScore: 98, orders30d: 12400, searchVolume: 89000, trend: 'rising', source: 'AliExpress', addedAt: "Aujourd'hui" },
  { id: '2', name: 'Lampe Coucher de Soleil RGB', image: '', score: 91, category: 'Maison', price: { min: 5, max: 25 }, margin: 72, demandScore: 93, competitionScore: 85, trendScore: 95, orders30d: 28000, searchVolume: 124000, trend: 'rising', source: 'CJ Dropshipping', addedAt: "Aujourd'hui" },
  { id: '3', name: 'Sac à Dos Antivol USB', image: '', score: 87, category: 'Mode', price: { min: 8, max: 35 }, margin: 65, demandScore: 88, competitionScore: 82, trendScore: 91, orders30d: 8900, searchVolume: 67000, trend: 'stable', source: 'AliExpress', addedAt: 'Hier' },
  { id: '4', name: 'Écouteurs Sans Fil Sport', image: '', score: 85, category: 'Électronique', price: { min: 4, max: 22 }, margin: 70, demandScore: 90, competitionScore: 78, trendScore: 87, orders30d: 45000, searchVolume: 210000, trend: 'stable', source: 'AliExpress', addedAt: 'Hier' },
  { id: '5', name: 'Organisateur Câbles Magnétique', image: '', score: 82, category: 'Bureau', price: { min: 1, max: 8 }, margin: 80, demandScore: 84, competitionScore: 90, trendScore: 72, orders30d: 15000, searchVolume: 42000, trend: 'rising', source: 'CJ Dropshipping', addedAt: 'Il y a 2j' },
  { id: '6', name: 'Masseur Cervical Électrique', image: '', score: 79, category: 'Santé', price: { min: 10, max: 40 }, margin: 62, demandScore: 82, competitionScore: 74, trendScore: 81, orders30d: 6200, searchVolume: 53000, trend: 'rising', source: 'AliExpress', addedAt: 'Il y a 2j' },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : score >= 80 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' : 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold ${color}`}>{score}</span>
}

export default function WinningProductsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const filteredProducts = mockProducts.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (category !== 'all' && p.category !== category) return false
    return true
  })

  const refreshFeed = () => {
    setRefreshing(true)
    toast({ title: 'Actualisation', description: 'Recherche de nouveaux produits gagnants...' })
    setTimeout(() => setRefreshing(false), 2000)
  }

  return (
    <ChannablePageWrapper
      title="Winning Products"
      description="Découvrez les produits les plus performants du jour avec scoring IA basé sur la demande, la concurrence et les marges."
      heroImage="research"
      badge={{ label: 'Winning Products', icon: Trophy }}
      actions={
        <>
          <Button onClick={refreshFeed} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser le feed'}
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Flame className="h-4 w-4 text-orange-500" /> Produits trending
            </div>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-green-600 mt-1">+8 aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Star className="h-4 w-4 text-yellow-500" /> Score moyen
            </div>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-muted-foreground mt-1">sur 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" /> Marge moy.
            </div>
            <div className="text-2xl font-bold text-green-600">69%</div>
            <p className="text-xs text-muted-foreground mt-1">potentielle</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Sparkles className="h-4 w-4 text-primary" /> Catégories
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">analysées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="Électronique">Électronique</SelectItem>
            <SelectItem value="Maison">Maison</SelectItem>
            <SelectItem value="Mode">Mode</SelectItem>
            <SelectItem value="Bureau">Bureau</SelectItem>
            <SelectItem value="Santé">Santé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ScoreBadge score={product.score} />
                    <Badge variant={product.trend === 'rising' ? 'default' : 'secondary'} className="text-xs">
                      {product.trend === 'rising' && <TrendingUp className="mr-1 h-3 w-3" />}
                      {product.trend === 'rising' ? 'En hausse' : product.trend === 'stable' ? 'Stable' : 'En baisse'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{product.category} · {product.source}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              {/* Price & Margin */}
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">Prix fournisseur</p>
                  <p className="font-bold">{product.price.min}€ - {product.price.max}€</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Marge potentielle</p>
                  <p className="font-bold text-green-600">{product.margin}%</p>
                </div>
              </div>

              {/* Scores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Demande</span>
                  <span className="font-medium">{product.demandScore}/100</span>
                </div>
                <Progress value={product.demandScore} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Concurrence (faible = bien)</span>
                  <span className="font-medium">{product.competitionScore}/100</span>
                </div>
                <Progress value={product.competitionScore} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tendance</span>
                  <span className="font-medium">{product.trendScore}/100</span>
                </div>
                <Progress value={product.trendScore} className="h-1.5" />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> {product.orders30d.toLocaleString()} cmd/30j</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(product.searchVolume / 1000).toFixed(0)}K rech.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" onClick={() => toast({ title: 'Produit importé', description: `${product.name} ajouté à votre catalogue.` })}>
                  <Package className="mr-1 h-3 w-3" /> Importer
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast({ title: 'Analyse détaillée', description: 'Module en cours de développement.' })}>
                  <BarChart3 className="mr-1 h-3 w-3" /> Analyser
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">Ajouté : {product.addedAt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  )
}
