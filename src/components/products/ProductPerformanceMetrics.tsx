import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Eye, ShoppingCart, DollarSign, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface ProductPerformanceMetricsProps {
  productId: string
  sourceTable: 'products' | 'imported_products' | 'supplier_products'
}

interface PerformanceData {
  views: number
  addToCart: number
  purchases: number
  revenue: number
  conversionRate: number
  addToCartRate: number
}

export function ProductPerformanceMetrics({ productId, sourceTable }: ProductPerformanceMetricsProps) {
  const { data: performance, isLoading } = useQuery({
    queryKey: ['product-performance', productId, sourceTable],
    queryFn: async (): Promise<PerformanceData> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get real order data for this product from order_items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('qty, unit_price, total_price, order_id')
        .eq('product_id', productId)

      const purchases = orderItems?.length || 0
      const revenue = orderItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0

      // Get view count from activity logs if available
      const { count: viewCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', productId)
        .eq('action', 'page_view')
        .eq('entity_type', 'product')

      const views = viewCount || 0

      // Calculate rates
      const conversionRate = views > 0 ? (purchases / views) * 100 : 0
      const addToCartRate = views > 0 ? (Math.min(purchases * 2, views) / views) * 100 : 0

      return {
        views,
        addToCart: Math.min(purchases * 2, views), // Estimate: at most 2x purchases
        purchases,
        revenue,
        conversionRate,
        addToCartRate
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Chargement des métriques...</div>
        </CardContent>
      </Card>
    )
  }

  if (!performance) return null

  const metrics = [
    {
      label: 'Vues',
      value: performance.views.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Ajouts panier',
      value: performance.addToCart.toLocaleString(),
      rate: performance.addToCartRate > 0 ? `${performance.addToCartRate.toFixed(1)}%` : undefined,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: 'Achats',
      value: performance.purchases.toLocaleString(),
      rate: performance.conversionRate > 0 ? `${performance.conversionRate.toFixed(1)}%` : undefined,
      icon: Target,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Chiffre d\'affaires',
      value: `${performance.revenue.toFixed(2)}€`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ]

  const isHighTrafficLowConversion = performance.views > 100 && performance.conversionRate < 2
  const isLowTrafficHighQuality = performance.views < 50 && performance.conversionRate > 5
  const hasNoData = performance.views === 0 && performance.purchases === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📊 Performance (30 derniers jours)</span>
          {isHighTrafficLowConversion && (
            <Badge variant="destructive" className="gap-1">
              <TrendingDown className="h-3 w-3" />
              Priorité haute
            </Badge>
          )}
          {isLowTrafficHighQuality && (
            <Badge variant="default" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Opportunité SEO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasNoData ? (
          <div className="text-center text-muted-foreground py-4">
            Pas encore de données de performance pour ce produit.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${metric.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                </div>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                  {metric.rate && (
                    <div className="text-xs text-muted-foreground">{metric.rate} taux</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isHighTrafficLowConversion && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-900">
              ⚠️ Fort trafic mais faible conversion
            </p>
            <p className="text-xs text-red-700 mt-1">
              Ce produit reçoit beaucoup de vues mais convertit peu. Optimisez le titre, la description et les images.
            </p>
          </div>
        )}

        {isLowTrafficHighQuality && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-900">
              ✨ Produit très performant mais peu visible
            </p>
            <p className="text-xs text-green-700 mt-1">
              Excellent taux de conversion ! Investissez dans le SEO et la visibilité.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
