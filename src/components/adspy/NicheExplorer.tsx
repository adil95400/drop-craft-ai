import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAdSpy } from '@/hooks/useAdSpy'
import {
  Search, Globe, TrendingUp, Flame, Star, Target,
  ChevronRight, Sparkles, Zap, BarChart3, Eye
} from 'lucide-react'

interface Niche {
  id: string
  name: string
  category: string
  trendScore: number
  saturation: number
  profitPotential: number
  adCount: number
  productsCount: number
  growthRate: number
  topPlatforms: string[]
  keywords: string[]
  status: 'rising' | 'stable' | 'declining' | 'emerging'
}

const DEMO_NICHES: Niche[] = [
  {
    id: '1',
    name: 'Aesthetic Room Decor',
    category: 'Décoration',
    trendScore: 94,
    saturation: 35,
    profitPotential: 85,
    adCount: 3420,
    productsCount: 890,
    growthRate: 234,
    topPlatforms: ['TikTok', 'Instagram', 'Pinterest'],
    keywords: ['aesthetic', 'room decor', 'led lights', 'cozy'],
    status: 'rising'
  },
  {
    id: '2',
    name: 'Smart Home Gadgets',
    category: 'Électronique',
    trendScore: 88,
    saturation: 55,
    profitPotential: 72,
    adCount: 4560,
    productsCount: 1234,
    growthRate: 156,
    topPlatforms: ['Facebook', 'YouTube', 'TikTok'],
    keywords: ['smart home', 'gadgets', 'automation', 'tech'],
    status: 'stable'
  },
  {
    id: '3',
    name: 'Skincare Tools',
    category: 'Beauté',
    trendScore: 91,
    saturation: 42,
    profitPotential: 78,
    adCount: 2890,
    productsCount: 567,
    growthRate: 189,
    topPlatforms: ['Instagram', 'TikTok', 'Facebook'],
    keywords: ['skincare', 'glow', 'beauty tools', 'self care'],
    status: 'rising'
  },
  {
    id: '4',
    name: 'Fitness Accessories',
    category: 'Sport',
    trendScore: 82,
    saturation: 48,
    profitPotential: 68,
    adCount: 1890,
    productsCount: 456,
    growthRate: 78,
    topPlatforms: ['Facebook', 'Instagram'],
    keywords: ['fitness', 'workout', 'home gym', 'health'],
    status: 'stable'
  },
  {
    id: '5',
    name: 'Pet Accessories',
    category: 'Animaux',
    trendScore: 96,
    saturation: 28,
    profitPotential: 88,
    adCount: 1560,
    productsCount: 345,
    growthRate: 312,
    topPlatforms: ['TikTok', 'Facebook', 'Instagram'],
    keywords: ['pets', 'dog', 'cat', 'cute', 'accessories'],
    status: 'emerging'
  },
  {
    id: '6',
    name: 'Kitchen Gadgets',
    category: 'Cuisine',
    trendScore: 79,
    saturation: 62,
    profitPotential: 58,
    adCount: 5670,
    productsCount: 1567,
    growthRate: 45,
    topPlatforms: ['Facebook', 'Pinterest'],
    keywords: ['kitchen', 'cooking', 'gadgets', 'food'],
    status: 'declining'
  }
]

export function NicheExplorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [niches] = useState<Niche[]>(DEMO_NICHES)
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'emerging':
        return <Badge className="bg-purple-500"><Sparkles className="h-3 w-3 mr-1" /> Émergent</Badge>
      case 'rising':
        return <Badge className="bg-green-500"><TrendingUp className="h-3 w-3 mr-1" /> En hausse</Badge>
      case 'stable':
        return <Badge className="bg-blue-500"><Target className="h-3 w-3 mr-1" /> Stable</Badge>
      case 'declining':
        return <Badge className="bg-orange-500"><BarChart3 className="h-3 w-3 mr-1" /> En baisse</Badge>
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
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Explorateur de Niches
          </CardTitle>
          <CardDescription>
            Découvrez les niches rentables et les opportunités de marché
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une niche, catégorie, mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Découvrir IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Globe className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{niches.length}</p>
              <p className="text-xs text-muted-foreground">Niches analysées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {niches.filter(n => n.status === 'emerging' || n.status === 'rising').length}
              </p>
              <p className="text-xs text-muted-foreground">En croissance</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.max(...niches.map(n => n.trendScore))}%
              </p>
              <p className="text-xs text-muted-foreground">Top score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Star className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round(niches.reduce((sum, n) => sum + n.profitPotential, 0) / niches.length)}%
              </p>
              <p className="text-xs text-muted-foreground">Potentiel moyen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Niches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {niches.map(niche => (
          <Card 
            key={niche.id} 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              selectedNiche?.id === niche.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedNiche(niche)}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{niche.name}</h3>
                  <Badge variant="outline" className="mt-1">{niche.category}</Badge>
                </div>
                {getStatusBadge(niche.status)}
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Trend</span>
                    <span className={`font-bold ${getScoreColor(niche.trendScore)}`}>
                      {niche.trendScore}%
                    </span>
                  </div>
                  <Progress value={niche.trendScore} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Saturation</span>
                    <span className={`font-bold ${getScoreColor(100 - niche.saturation)}`}>
                      {niche.saturation}%
                    </span>
                  </div>
                  <Progress value={niche.saturation} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Profit</span>
                    <span className={`font-bold ${getScoreColor(niche.profitPotential)}`}>
                      {niche.profitPotential}%
                    </span>
                  </div>
                  <Progress value={niche.profitPotential} className="h-2" />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{niche.adCount} ads</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>+{niche.growthRate}%</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {niche.topPlatforms.slice(0, 2).map(platform => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1">
                {niche.keywords.slice(0, 4).map(keyword => (
                  <Badge key={keyword} variant="outline" className="text-xs">
                    #{keyword}
                  </Badge>
                ))}
              </div>

              {/* Action */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {niche.productsCount} produits détectés
                </span>
                <Button size="sm" variant="ghost">
                  Explorer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
