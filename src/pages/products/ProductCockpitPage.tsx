/**
 * Cockpit Business - Vue de pilotage stratégique
 */
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useCockpitData, CockpitKPI } from '@/hooks/useCockpitData'
import { CatalogHealthCard } from '@/components/cockpit/CatalogHealthCard'
import { ROIAnalysisCard } from '@/components/cockpit/ROIAnalysisCard'
import { StockAlertsCard } from '@/components/cockpit/StockAlertsCard'
import { AIPrioritiesCard } from '@/components/cockpit/AIPrioritiesCard'
import { TopProductsCard } from '@/components/cockpit/TopProductsCard'
import { MarginLossCard } from '@/components/cockpit/MarginLossCard'
import { CategoryBreakdownChart } from '@/components/cockpit/CategoryBreakdownChart'
import { Package, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react'

const KPI_ICONS = [Package, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, ShieldAlert] as const
const KPI_COLORS = ['primary', 'info', 'success', 'warning', 'destructive', 'destructive'] as const

export default function ProductCockpitPage() {
  const navigate = useNavigate()
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
      <ChannablePageWrapper title="Cockpit Business" description="Chargement…" heroImage="analytics" badge={{ label: 'Cockpit', icon: TrendingUp }}>
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
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Cockpit Business"
      description={`${products.length} produits — Analysez les performances et identifiez les opportunités`}
      heroImage="analytics"
      badge={{ label: 'Cockpit', icon: TrendingUp }}
    >
      <div className="space-y-6">
        {/* Navigation croisée */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" />
            Catalogue Produits
          </Button>
        </div>

        {/* KPIs principaux */}
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

        {/* Row 1: Santé + ROI + Alertes stock */}
        <div className="grid gap-4 md:grid-cols-3">
          <CatalogHealthCard health={catalogHealth} />
          <ROIAnalysisCard roi={roiAnalysis} />
          <StockAlertsCard alerts={criticalAlerts} stats={stockStats} />
        </div>

        {/* Row 2: Top Produits + Pertes de marge */}
        <div className="grid gap-4 md:grid-cols-2">
          <TopProductsCard products={products} />
          <MarginLossCard products={products} />
        </div>

        {/* Row 3: Priorités IA */}
        <AIPrioritiesCard priorities={aiPriorities} />

        {/* Row 4: Répartition catégories */}
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryBreakdownChart products={products} />
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
