import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { WinnersStats } from '../types'

interface WinnersStatsCardsProps {
  stats: WinnersStats
  totalSources?: number
  isLoading?: boolean
}

export const WinnersStatsCards = ({ 
  stats, 
  totalSources = 0, 
  isLoading = false 
}: WinnersStatsCardsProps) => {
  const navigate = useNavigate();

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    className = "",
    href
  }: {
    title: string
    value: string | number
    subtitle: string
    icon: any
    className?: string
    href?: string
  }) => (
    <Card 
      className={cn(
        className,
        href && "cursor-pointer transition-all hover:shadow-lg hover:scale-105"
      )}
      onClick={() => href && navigate(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            typeof value === 'number' ? value.toLocaleString() : value
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Produits Analysés"
        value={stats.totalAnalyzed}
        subtitle={`${totalSources} sources actives`}
        icon={BarChart3}
        href="/products"
      />
      
      <StatCard
        title="Winners Détectés"
        value={stats.winnersDetected}
        subtitle="Score > 70"
        icon={TrendingUp}
        className="border-green-200 bg-green-50/50"
        href="/winners"
      />
      
      <StatCard
        title="Score Moyen"
        value={Math.round(stats.averageScore)}
        subtitle="Sur 100 points"
        icon={Target}
        href="/analytics"
      />
      
      <StatCard
        title="Précision IA"
        value={`${stats.successRate}%`}
        subtitle="Taux de succès"
        icon={Star}
        className="border-blue-200 bg-blue-50/50"
        href="/automation/ai-hub"
      />
    </div>
  )
}