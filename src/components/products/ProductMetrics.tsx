import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Eye, ShoppingCart } from 'lucide-react'

interface ProductMetric {
  label: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ReactNode
  color: 'success' | 'warning' | 'destructive' | 'default'
}

export function ProductMetrics() {
  const metrics: ProductMetric[] = [
    {
      label: 'Vues Moyennes',
      value: '2,847',
      change: 15.3,
      changeLabel: '+15.3% cette semaine',
      icon: <Eye className="h-4 w-4" />,
      color: 'success'
    },
    {
      label: 'Note Moyenne',
      value: '4.7',
      change: 0.2,
      changeLabel: 'Excellent',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'success'
    },
    {
      label: 'Conversions',
      value: '12.4%',
      change: 2.1,
      changeLabel: '+2.1% vs mois dernier',
      icon: <ShoppingCart className="h-4 w-4" />,
      color: 'success'
    },
    {
      label: "Nouveaux Aujourd'hui",
      value: '24',
      change: -5,
      changeLabel: '3 en attente',
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'warning'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="text-xs">
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </Badge>
              <span className="text-muted-foreground">{metric.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}