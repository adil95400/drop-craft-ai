/**
 * Liste des sous-modules pour le Sitemap
 */
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubModule } from '@/config/modules'
import * as Icons from 'lucide-react'

interface SitemapSubModuleListProps {
  subModules: SubModule[]
  searchQuery?: string
}

const getIcon = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName]
  return IconComponent || Icons.Circle
}

export const SitemapSubModuleList = memo<SitemapSubModuleListProps>(({ 
  subModules, 
  searchQuery = '' 
}) => {
  const filteredSubModules = searchQuery
    ? subModules.filter(sub => 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : subModules

  if (filteredSubModules.length === 0) return null

  return (
    <div className="pl-6 mt-2 space-y-1 border-l-2 border-border/50 ml-3">
      {filteredSubModules.map((sub) => {
        const Icon = getIcon(sub.icon)
        
        return (
          <Link
            key={sub.id}
            to={sub.route}
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-md",
              "text-sm text-muted-foreground hover:text-foreground",
              "hover:bg-accent/50 transition-colors group"
            )}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{sub.name}</span>
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )
      })}
    </div>
  )
})

SitemapSubModuleList.displayName = 'SitemapSubModuleList'
