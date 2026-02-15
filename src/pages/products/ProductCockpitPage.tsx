/**
 * Cockpit Business — Vue de pilotage stratégique complet
 * KPIs prédictifs, Forecasting, SWOT, Alertes intelligentes, Comparaison périodes
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
import { PredictiveKPIPanel } from '@/components/cockpit/PredictiveKPIPanel'
import { RevenueForecastChart } from '@/components/cockpit/RevenueForecastChart'
import { SWOTAnalysisCard } from '@/components/cockpit/SWOTAnalysisCard'
import { SmartAlertsPanel } from '@/components/cockpit/SmartAlertsPanel'
import { PeriodComparisonWidget } from '@/components/cockpit/PeriodComparisonWidget'
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

  // Compute aggregate metrics for new widgets
  const revenue = products.reduce((s, p) => s + p.price * (p.stock_quantity || 0), 0)
  const orders = products.length // proxy
  const customers = new Set(products.map(p => p.category).filter(Boolean)).size
  const avgMargin = products.filter(p => p.profit_margin).length > 0
    ? products.filter(p => p.profit_margin).reduce((s, p) => s + (p.profit_margin || 0), 0) / products.filter(p => p.profit_margin).length
    : 0

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Cockpit Business" description="Chargement…" heroImage="analytics" badge={{ label: 'Cockpit BI', icon: TrendingUp }}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Cockpit Business"
      description={`${products.length} produits — Pilotage stratégique et intelligence prédictive`}
      heroImage="analytics"
      badge={{ label: 'Cockpit BI', icon: TrendingUp }}
    >
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" />
            Catalogue
          </Button>
        </div>

        {/* Row 0: KPIs classiques */}
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

        {/* Row 1: KPIs prédictifs */}
        <PredictiveKPIPanel
          revenue={revenue}
          orders={orders}
          customers={customers}
          avgMargin={avgMargin}
          products={products}
        />

        {/* Row 2: Forecasting + Comparaison */}
        <div className="grid gap-4 md:grid-cols-2">
          <RevenueForecastChart
            currentRevenue={revenue}
            orders={orders}
            avgMargin={avgMargin}
          />
          <PeriodComparisonWidget
            revenue={revenue}
            orders={orders}
            customers={customers}
            avgMargin={avgMargin}
            products={products}
          />
        </div>

        {/* Row 3: SWOT */}
        <SWOTAnalysisCard
          products={products}
          revenue={revenue}
          orders={orders}
        />

        {/* Row 4: Alertes intelligentes */}
        <SmartAlertsPanel products={products} revenue={revenue} />

        {/* Row 5: Santé + ROI + Stock */}
        <div className="grid gap-4 md:grid-cols-3">
          <CatalogHealthCard health={catalogHealth} />
          <ROIAnalysisCard roi={roiAnalysis} />
          <StockAlertsCard alerts={criticalAlerts} stats={stockStats} />
        </div>

        {/* Row 6: Top Produits + Pertes marge */}
        <div className="grid gap-4 md:grid-cols-2">
          <TopProductsCard products={products} />
          <MarginLossCard products={products} />
        </div>

        {/* Row 7: IA + Catégories */}
        <AIPrioritiesCard priorities={aiPriorities} />
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryBreakdownChart products={products} />
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
