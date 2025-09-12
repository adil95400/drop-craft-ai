import { AnalyticsCharts } from '@/components/stores/analytics/AnalyticsCharts'

export function StoreAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Performances et métriques de votre boutique</p>
        </div>
      </div>

      <AnalyticsCharts />
    </div>
  )
}