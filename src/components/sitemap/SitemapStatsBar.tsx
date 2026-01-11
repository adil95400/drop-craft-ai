/**
 * Barre de statistiques du Sitemap
 */
import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Package, Layers, Sparkles, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SitemapStats {
  totalModules: number
  totalSubModules: number
  proModules: number
  ultraModules: number
}

interface SitemapStatsBarProps {
  stats: SitemapStats
}

export const SitemapStatsBar = memo<SitemapStatsBarProps>(({ stats }) => {
  const statItems = [
    {
      label: 'Modules',
      value: stats.totalModules,
      icon: Package,
      color: 'text-primary bg-primary/10'
    },
    {
      label: 'Sous-modules',
      value: stats.totalSubModules,
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      label: 'Pro',
      value: stats.proModules,
      icon: Sparkles,
      color: 'text-primary bg-primary/10'
    },
    {
      label: 'Ultra',
      value: stats.ultraModules,
      icon: Crown,
      color: 'text-warning bg-warning/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item) => (
        <Card 
          key={item.label}
          className="p-3 flex items-center gap-3 border-border/50 bg-card/50"
        >
          <div className={cn("p-2 rounded-lg", item.color)}>
            <item.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </Card>
      ))}
    </div>
  )
})

SitemapStatsBar.displayName = 'SitemapStatsBar'
