import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Eye, ShoppingCart, DollarSign, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface ProductPerformanceMetricsProps {
  productId: string
  sourceTable: 'products' | 'imported_products' | 'supplier_products'
}

export function ProductPerformanceMetrics({ productId, sourceTable }: ProductPerformanceMetricsProps) {
  const { data: performance, isLoading } = useQuery({
    queryKey: ['product-performance', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('product_performance')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('source_table', sourceTable)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error

      // Agrégation des données
      const total = data.reduce((acc, day) => ({
        views: acc.views + (day.views || 0),
        addToCart: acc.addToCart + (day.add_to_cart || 0),
        purchases: acc.purchases + (day.purchases || 0),
        revenue: acc.revenue + (parseFloat(day.revenue?.toString() || '0'))
      }), { views: 0, addToCart: 0, purchases: 0, revenue: 0 })

      const conversionRate = total.views > 0 ? (total.purchases / total.views * 100) : 0
      const addToCartRate = total.views > 0 ? (total.addToCart / total.views * 100) : 0

      return {
        ...total,
        conversionRate,
        addToCartRate,
        history: data
      }
    }
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
      rate: `${performance.addToCartRate.toFixed(1)}%`,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: 'Achats',
      value: performance.purchases.toLocaleString(),
      rate: `${performance.conversionRate.toFixed(1)}%`,
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

        {isHighTrafficLowConversion && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-900">
              ⚠️ Fort trafic mais faible conversion
            </p>
            <p className="text-xs text-red-700 mt-1">
              Ce produit reçoit beaucoup de vues mais convertit peu. Optimisez le titre, la description et les images pour améliorer les conversions.
            </p>
          </div>
        )}

        {isLowTrafficHighQuality && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-900">
              ✨ Produit très performant mais peu visible
            </p>
            <p className="text-xs text-green-700 mt-1">
              Excellent taux de conversion ! Investissez dans le SEO et la visibilité pour augmenter le trafic.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
