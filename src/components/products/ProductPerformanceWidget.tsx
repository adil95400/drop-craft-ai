import { Card } from "@/components/ui/card"
import { Eye, TrendingUp, ShoppingCart, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductPerformanceWidgetProps {
  viewCount?: number
  conversionRate?: number
  revenue?: number
  orders?: number
  isLoading?: boolean
}

export const ProductPerformanceWidget = ({ 
  viewCount = 0,
  conversionRate = 0,
  revenue = 0,
  orders = 0,
  isLoading = false
}: ProductPerformanceWidgetProps) => {
  if (isLoading) {
    return (
      <Card className="p-3">
        <Skeleton className="h-16 w-full" />
      </Card>
    )
  }

  const metrics = [
    {
      label: 'Vues',
      value: viewCount.toLocaleString(),
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      label: 'Conversion',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Commandes',
      value: orders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-purple-500'
    },
    {
      label: 'CA',
      value: `${revenue.toFixed(0)}€`,
      icon: DollarSign,
      color: 'text-amber-500'
    }
  ]

  return (
    <Card className="p-3">
      <h4 className="text-xs font-semibold mb-3 text-muted-foreground">
        Performance (7 derniers jours)
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-2">
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {metric.label}
              </p>
              <p className="text-sm font-semibold truncate">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
