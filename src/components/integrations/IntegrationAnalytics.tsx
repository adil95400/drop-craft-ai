import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Zap,
  Clock
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface IntegrationAnalyticsProps {
  integration: any
}

export const IntegrationAnalytics = ({ integration }: IntegrationAnalyticsProps) => {
  // Génération de données de performance simulées mais réalistes
  const generatePerformanceData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    return days.map((day, index) => ({
      day,
      performance: 65 + Math.random() * 30,
      revenue: 1200 + Math.random() * 800,
      orders: 15 + Math.random() * 20
    }))
  }

  const performanceData = generatePerformanceData()

  const getPerformanceMetrics = () => {
    const baseMetrics = {
      'Shopify Plus': {
        avgOrderValue: '€87.50',
        conversionRate: '3.8%',
        cartAbandonment: '67%',
        customerLifetime: '€245',
        performance: 92
      },
      'AliExpress AI Scout': {
        productSuccess: '89%',
        avgMargin: '34%',
        findingRate: '147/jour',
        qualityScore: '9.2/10',
        performance: 88
      },
      'Google Ads AI Manager': {
        roas: '4.8x',
        cpc: '€0.32',
        impressions: '2.3M',
        qualityScore: '8.9/10',
        performance: 94
      },
      'Predictive Analytics Pro': {
        accuracy: '94.7%',
        predictions: '1,247',
        insights: '89 auto',
        forecasts: '99% précis',
        performance: 96
      }
    }

    return baseMetrics[integration.name as keyof typeof baseMetrics] || {
      performance: 75,
      status: 'Bon',
      efficiency: '82%',
      errors: '< 1%'
    }
  }

  const metrics = getPerformanceMetrics()

  const getTrendIcon = (value: number) => {
    if (value > 80) return <TrendingUp className="w-4 h-4 text-success" />
    if (value > 60) return <Activity className="w-4 h-4 text-warning" />
    return <TrendingDown className="w-4 h-4 text-destructive" />
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics {integration.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics).map(([key, value]) => {
              if (key === 'performance') return null
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-sm text-muted-foreground capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance globale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance Globale
            </span>
            <Badge variant="outline" className="flex items-center gap-1">
              {getTrendIcon(metrics.performance)}
              {metrics.performance}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Efficacité IA</span>
                <span>{metrics.performance}%</span>
              </div>
              <Progress value={metrics.performance} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 rounded-lg bg-success/10">
                <Zap className="w-4 h-4 mx-auto mb-1 text-success" />
                <div className="text-xs text-muted-foreground">Optimisations</div>
                <div className="text-sm font-medium">{47 + Math.floor(Math.random() * 20)}</div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Automations</div>
                <div className="text-sm font-medium">{12 + Math.floor(Math.random() * 8)}</div>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-4 h-4 mx-auto mb-1 text-warning" />
                <div className="text-xs text-muted-foreground">Temps épargné</div>
                <div className="text-sm font-medium">{23 + Math.floor(Math.random() * 10)}h</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance cette semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'performance' ? `${value}%` : 
                    name === 'revenue' ? `€${value}` : value,
                    name === 'performance' ? 'Performance' :
                    name === 'revenue' ? 'Revenus' : 'Commandes'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.1}
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}