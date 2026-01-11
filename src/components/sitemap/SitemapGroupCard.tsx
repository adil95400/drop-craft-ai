/**
 * Carte de groupe pour le Sitemap
 */
import { memo, useState, useCallback, useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SitemapModuleItem } from './SitemapModuleItem'
import type { NavGroupConfig, ModuleConfig } from '@/config/modules'
import type { PlanType } from '@/lib/unified-plan-system'
import * as Icons from 'lucide-react'

interface SitemapGroupCardProps {
  group: NavGroupConfig
  modules: ModuleConfig[]
  currentPlan: PlanType
  searchQuery?: string
  defaultExpanded?: boolean
}

const getIcon = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName]
  return IconComponent || Icons.Folder
}

const groupColors: Record<string, string> = {
  home: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
  sources: 'from-green-500/20 to-green-600/10 border-green-500/20',
  catalog: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  channels: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
  orders: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
  insights: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
  settings: 'from-slate-500/20 to-slate-600/10 border-slate-500/20',
}

export const SitemapGroupCard = memo<SitemapGroupCardProps>(({
  group,
  modules,
  currentPlan,
  searchQuery = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !!searchQuery)
  const Icon = getIcon(group.icon)
  
  const totalSubModules = useMemo(() => 
    modules.reduce((acc, m) => acc + (m.subModules?.length || 0), 0),
    [modules]
  )

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const colorClass = groupColors[group.id] || groupColors.settings

  return (
    <Card className={cn(
      "overflow-hidden border transition-all duration-200",
      "hover:shadow-md",
      isExpanded && "ring-1 ring-primary/20"
    )}>
      <CardHeader 
        className={cn(
          "p-4 cursor-pointer bg-gradient-to-br border-b",
          colorClass
        )}
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/80 shadow-sm">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{group.label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {modules.length} modules
                </Badge>
                {totalSubModules > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {totalSubModules} sous-modules
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-3 space-y-1 bg-card/50">
          {modules
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <SitemapModuleItem
                key={module.id}
                module={module}
                isAccessible={true}
                currentPlan={currentPlan}
                searchQuery={searchQuery}
                defaultExpanded={!!searchQuery}
              />
            ))}
        </CardContent>
      )}
    </Card>
  )
})

SitemapGroupCard.displayName = 'SitemapGroupCard'
