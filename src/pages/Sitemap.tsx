/**
 * Page Sitemap - Vue complète des fonctionnalités
 */
import { useState, useMemo, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  SitemapHeader, 
  SitemapStatsBar, 
  SitemapGroupCard 
} from '@/components/sitemap'
import { NAV_GROUPS, MODULE_REGISTRY } from '@/config/modules'
import { useUnifiedPlan, type PlanType } from '@/lib/unified-plan-system'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Sitemap() {
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all')
  const [allExpanded, setAllExpanded] = useState(false)
  const { effectivePlan } = useUnifiedPlan()
  const currentPlan = effectivePlan || 'standard'

  // Get all modules as array
  const allModules = useMemo(() => Object.values(MODULE_REGISTRY), [])

  // Filter modules based on search and plan
  const filteredModules = useMemo(() => {
    return allModules.filter(module => {
      // Plan filter
      if (planFilter !== 'all' && module.minPlan !== planFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesModule = 
          module.name.toLowerCase().includes(query) ||
          module.description.toLowerCase().includes(query)
        const matchesSubModule = module.subModules?.some(sub =>
          sub.name.toLowerCase().includes(query) ||
          sub.description.toLowerCase().includes(query)
        )
        return matchesModule || matchesSubModule
      }

      return true
    })
  }, [allModules, searchQuery, planFilter])

  // Group filtered modules by groupId
  const modulesByGroup = useMemo(() => {
    const grouped: Record<string, typeof allModules> = {}
    filteredModules.forEach(module => {
      if (!grouped[module.groupId]) {
        grouped[module.groupId] = []
      }
      grouped[module.groupId].push(module)
    })
    return grouped
  }, [filteredModules])

  // Calculate stats
  const stats = useMemo(() => {
    const totalSubModules = allModules.reduce(
      (acc, m) => acc + (m.subModules?.length || 0), 
      0
    )
    const proModules = allModules.filter(m => m.minPlan === 'pro').length
    const ultraModules = allModules.filter(m => m.minPlan === 'ultra_pro').length

    return {
      totalModules: allModules.length,
      totalSubModules,
      proModules,
      ultraModules
    }
  }, [allModules])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    if (query) setAllExpanded(true)
  }, [])

  const toggleAllExpanded = useCallback(() => {
    setAllExpanded(prev => !prev)
  }, [])

  // Filter groups that have modules
  const activeGroups = useMemo(() => 
    NAV_GROUPS.filter(group => modulesByGroup[group.id]?.length > 0)
      .sort((a, b) => a.order - b.order),
    [modulesByGroup]
  )

  return (
    <>
      <Helmet>
        <title>Plan du Site | DropSkills</title>
        <meta name="description" content="Explorez toutes les fonctionnalités disponibles dans DropSkills par catégorie." />
      </Helmet>

      <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <SitemapHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          planFilter={planFilter}
          onPlanFilterChange={setPlanFilter}
        />

        {/* Stats */}
        <SitemapStatsBar stats={stats} />

        {/* Expand/Collapse All */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllExpanded}
            className="gap-2"
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Tout réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Tout développer
              </>
            )}
          </Button>
        </div>

        {/* Groups Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {activeGroups.map(group => (
            <SitemapGroupCard
              key={group.id}
              group={group}
              modules={modulesByGroup[group.id] || []}
              currentPlan={currentPlan as PlanType}
              searchQuery={searchQuery}
              defaultExpanded={allExpanded || !!searchQuery}
            />
          ))}
        </div>

        {/* Empty state */}
        {activeGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun module trouvé pour votre recherche.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery('')
                setPlanFilter('all')
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
