/**
 * Cockpit Business - Vue de pilotage stratégique
 * KPIs, alertes stock, ROI, priorités IA, répartition catégories
 * Aucune gestion opérationnelle ici (→ /products)
 */
import { Skeleton } from '@/components/ui/skeleton'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useCockpitData } from '@/hooks/useCockpitData'
import { CockpitKPIGrid } from '@/components/cockpit/CockpitKPIGrid'
import { CatalogHealthCard } from '@/components/cockpit/CatalogHealthCard'
import { ROIAnalysisCard } from '@/components/cockpit/ROIAnalysisCard'
import { StockAlertsCard } from '@/components/cockpit/StockAlertsCard'
import { AIPrioritiesCard } from '@/components/cockpit/AIPrioritiesCard'
import { CategoryBreakdownChart } from '@/components/cockpit/CategoryBreakdownChart'
import { Gauge, BarChart3 } from 'lucide-react'

export default function ProductCockpitPage() {
  const {
    mainKPIs,
    catalogHealth,
    roiAnalysis,
    aiPriorities,
    criticalAlerts,
    stockStats,
    products,
    isLoading,
  } = useCockpitData()

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title="Cockpit Business"
        subtitle="Pilotage"
        description="Vue stratégique de votre catalogue produits."
        heroImage="analytics"
        badge={{ label: 'Chargement...', icon: Gauge }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Cockpit Business"
      subtitle="Pilotage"
      description="Analysez les performances, identifiez les opportunités et prenez des décisions éclairées."
      heroImage="analytics"
      badge={{ label: `${products.length} produits`, icon: BarChart3 }}
    >
      <div className="space-y-6">
        {/* KPIs principaux */}
        <CockpitKPIGrid kpis={mainKPIs} />

        {/* Row 2: Santé + ROI + Alertes stock */}
        <div className="grid gap-4 md:grid-cols-3">
          <CatalogHealthCard health={catalogHealth} />
          <ROIAnalysisCard roi={roiAnalysis} />
          <StockAlertsCard alerts={criticalAlerts} stats={stockStats} />
        </div>

        {/* Row 3: Priorités IA */}
        <AIPrioritiesCard priorities={aiPriorities} />

        {/* Row 4: Graphique catégories */}
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryBreakdownChart products={products} />
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
