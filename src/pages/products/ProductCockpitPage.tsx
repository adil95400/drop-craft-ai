/**
 * Cockpit Business - Vue de pilotage stratégique
 * Migré sur le socle PageLayout + StatCard
 */
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout, StatCard } from '@/components/shared'
import { useCockpitData, CockpitKPI } from '@/hooks/useCockpitData'
import { CatalogHealthCard } from '@/components/cockpit/CatalogHealthCard'
import { ROIAnalysisCard } from '@/components/cockpit/ROIAnalysisCard'
import { StockAlertsCard } from '@/components/cockpit/StockAlertsCard'
import { AIPrioritiesCard } from '@/components/cockpit/AIPrioritiesCard'
import { CategoryBreakdownChart } from '@/components/cockpit/CategoryBreakdownChart'
import { Package, DollarSign, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react'

const KPI_ICONS = [Package, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, ShieldAlert] as const
const KPI_COLORS = ['primary', 'info', 'success', 'warning', 'destructive', 'destructive'] as const

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
      <PageLayout title="Cockpit Business" subtitle="Chargement…">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[90px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Cockpit Business"
      subtitle={`${products.length} produits — Analysez les performances et identifiez les opportunités`}
    >
      <div className="space-y-6">
        {/* KPIs — StatCard socle */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {mainKPIs.map((kpi: CockpitKPI, i: number) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              icon={KPI_ICONS[i] || Package}
              color={KPI_COLORS[i] || 'primary'}
            />
          ))}
        </div>

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
    </PageLayout>
  )
}
