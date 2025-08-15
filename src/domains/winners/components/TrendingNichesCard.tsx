import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'
import { TrendingNiche } from '../types'

interface TrendingNichesCardProps {
  niches?: TrendingNiche[]
  onNicheClick?: (niche: TrendingNiche) => void
}

// Données statiques améliorées avec plus de niches
const DEFAULT_NICHES: TrendingNiche[] = [
  {
    id: 1,
    name: "Gaming Accessories",
    growth: "+156%",
    avgPrice: "€35",
    competition: "Moyenne",
    opportunity: "Élevée",
    category: "Electronics",
    tags: ["gaming", "accessories", "tech"]
  },
  {
    id: 2,
    name: "Home Fitness",
    growth: "+134%",
    avgPrice: "€67",
    competition: "Faible",
    opportunity: "Très Élevée",
    category: "Sports",
    tags: ["fitness", "home", "health"]
  },
  {
    id: 3,
    name: "Smart Home",
    growth: "+98%",
    avgPrice: "€45",
    competition: "Élevée",
    opportunity: "Moyenne",
    category: "Electronics",
    tags: ["smart", "home", "automation"]
  },
  {
    id: 4,
    name: "Pet Tech",
    growth: "+89%",
    avgPrice: "€28",
    competition: "Faible",
    opportunity: "Élevée",
    category: "Pets",
    tags: ["pets", "technology", "care"]
  },
  {
    id: 5,
    name: "Eco Products",
    growth: "+76%",
    avgPrice: "€52",
    competition: "Moyenne",
    opportunity: "Très Élevée",
    category: "Lifestyle",
    tags: ["eco", "sustainable", "green"]
  }
]

export const TrendingNichesCard = ({ 
  niches = DEFAULT_NICHES, 
  onNicheClick 
}: TrendingNichesCardProps) => {
  const getOpportunityVariant = (opportunity: string) => {
    if (opportunity === "Très Élevée") return "default"
    if (opportunity === "Élevée") return "secondary"
    return "outline"
  }

  const getGrowthColor = (growth: string) => {
    const percentage = parseInt(growth.replace('+', '').replace('%', ''))
    if (percentage >= 100) return "text-green-600"
    if (percentage >= 50) return "text-orange-500"
    return "text-blue-500"
  }

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case "Faible": return "text-green-600 bg-green-50"
      case "Moyenne": return "text-orange-600 bg-orange-50"
      case "Élevée": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Niches Tendance
          <Badge variant="outline" className="ml-auto">
            {niches.length} niches
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {niches.map((niche) => (
            <div 
              key={niche.id} 
              className={`p-4 border rounded-lg space-y-3 transition-all ${
                onNicheClick 
                  ? 'cursor-pointer hover:bg-accent hover:border-accent-foreground/20' 
                  : ''
              }`}
              onClick={() => onNicheClick?.(niche)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm">{niche.name}</h3>
                  {niche.category && (
                    <p className="text-xs text-muted-foreground">{niche.category}</p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={getGrowthColor(niche.growth)}
                >
                  {niche.growth}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Prix moyen:</span>
                  <div className="font-medium">{niche.avgPrice}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Concurrence:</span>
                  <div className="font-medium">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCompetitionColor(niche.competition)}`}
                    >
                      {niche.competition}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Opportunité:</span>
                <Badge variant={getOpportunityVariant(niche.opportunity)}>
                  {niche.opportunity}
                </Badge>
              </div>
              
              {niche.tags && (
                <div className="flex flex-wrap gap-1">
                  {niche.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}