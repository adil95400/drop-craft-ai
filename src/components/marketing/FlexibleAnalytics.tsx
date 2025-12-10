import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Plus,
  Settings,
  Calendar as CalendarIcon,
  Filter,
  Maximize2,
  Grid3X3,
  List,
  Eye,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Share2,
  Save,
  Trash2
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Widget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'funnel'
  title: string
  metric?: string
  chartType?: 'line' | 'bar' | 'area' | 'pie'
  size: 'sm' | 'md' | 'lg' | 'xl'
  data?: any[]
  comparison?: {
    value: number
    period: string
  }
}

interface Dashboard {
  id: string
  name: string
  widgets: Widget[]
  isDefault: boolean
}

const revenueData = [
  { date: 'Jan 1', revenue: 4200, orders: 85, visitors: 2100 },
  { date: 'Jan 2', revenue: 5100, orders: 102, visitors: 2400 },
  { date: 'Jan 3', revenue: 4800, orders: 96, visitors: 2200 },
  { date: 'Jan 4', revenue: 6200, orders: 124, visitors: 2800 },
  { date: 'Jan 5', revenue: 5500, orders: 110, visitors: 2500 },
  { date: 'Jan 6', revenue: 7100, orders: 142, visitors: 3100 },
  { date: 'Jan 7', revenue: 6800, orders: 136, visitors: 2900 },
  { date: 'Jan 8', revenue: 5900, orders: 118, visitors: 2600 },
  { date: 'Jan 9', revenue: 6500, orders: 130, visitors: 2850 },
  { date: 'Jan 10', revenue: 7800, orders: 156, visitors: 3400 },
  { date: 'Jan 11', revenue: 8200, orders: 164, visitors: 3600 },
  { date: 'Jan 12', revenue: 7500, orders: 150, visitors: 3200 },
  { date: 'Jan 13', revenue: 8900, orders: 178, visitors: 3800 },
  { date: 'Jan 14', revenue: 9200, orders: 184, visitors: 4000 }
]

const channelData = [
  { name: 'Organic', value: 35, color: '#22c55e' },
  { name: 'Paid Ads', value: 28, color: '#3b82f6' },
  { name: 'Email', value: 18, color: '#a855f7' },
  { name: 'Social', value: 12, color: '#f97316' },
  { name: 'Direct', value: 7, color: '#6b7280' }
]

const productPerformance = [
  { name: 'Produit A', sales: 1250, revenue: 31250, growth: 15.2 },
  { name: 'Produit B', sales: 980, revenue: 24500, growth: -5.3 },
  { name: 'Produit C', sales: 756, revenue: 22680, growth: 28.7 },
  { name: 'Produit D', sales: 654, revenue: 19620, growth: 8.1 },
  { name: 'Produit E', sales: 543, revenue: 16290, growth: -12.4 }
]

const funnelData = [
  { stage: 'Visiteurs', value: 10000, rate: 100 },
  { stage: 'Vues produit', value: 4500, rate: 45 },
  { stage: 'Ajout panier', value: 1800, rate: 18 },
  { stage: 'Checkout', value: 900, rate: 9 },
  { stage: 'Achat', value: 450, rate: 4.5 }
]

const defaultWidgets: Widget[] = [
  { id: '1', type: 'metric', title: 'Revenu total', metric: 'revenue', size: 'sm', comparison: { value: 12.5, period: 'vs semaine dernière' } },
  { id: '2', type: 'metric', title: 'Commandes', metric: 'orders', size: 'sm', comparison: { value: 8.3, period: 'vs semaine dernière' } },
  { id: '3', type: 'metric', title: 'Visiteurs', metric: 'visitors', size: 'sm', comparison: { value: -2.1, period: 'vs semaine dernière' } },
  { id: '4', type: 'metric', title: 'Taux conversion', metric: 'conversion', size: 'sm', comparison: { value: 0.8, period: 'vs semaine dernière' } },
  { id: '5', type: 'chart', title: 'Évolution du revenu', chartType: 'area', size: 'lg', data: revenueData },
  { id: '6', type: 'chart', title: 'Sources de trafic', chartType: 'pie', size: 'md', data: channelData },
  { id: '7', type: 'table', title: 'Top produits', size: 'md', data: productPerformance },
  { id: '8', type: 'funnel', title: 'Entonnoir de conversion', size: 'lg', data: funnelData }
]

export function FlexibleAnalytics() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 0, 14)
  })
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
    toast.success('Données actualisées')
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    toast.success(`Export ${format.toUpperCase()} démarré`)
  }

  const handleSaveDashboard = () => {
    toast.success('Dashboard sauvegardé')
  }

  const handleAddWidget = () => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type: 'metric',
      title: 'Nouveau widget',
      metric: 'custom',
      size: 'sm'
    }
    setWidgets(prev => [...prev, newWidget])
    toast.success('Widget ajouté')
  }

  const renderMetricCard = (widget: Widget) => {
    const metrics: Record<string, { value: string; icon: any; color: string }> = {
      revenue: { value: '89 450€', icon: DollarSign, color: 'text-green-500' },
      orders: { value: '1 847', icon: ShoppingCart, color: 'text-blue-500' },
      visitors: { value: '42 560', icon: Users, color: 'text-purple-500' },
      conversion: { value: '4.34%', icon: Target, color: 'text-orange-500' }
    }
    
    const data = metrics[widget.metric || 'revenue']
    const Icon = data.icon

    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{widget.title}</p>
              <p className={`text-2xl font-bold ${data.color}`}>{data.value}</p>
              {widget.comparison && (
                <p className={`text-xs flex items-center gap-1 mt-1 ${widget.comparison.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {widget.comparison.value >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(widget.comparison.value)}% {widget.comparison.period}
                </p>
              )}
            </div>
            <Icon className={`h-8 w-8 ${data.color} opacity-50`} />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = (widget: Widget) => {
    if (widget.chartType === 'area') {
      return (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{widget.title}</CardTitle>
              <Button size="icon" variant="ghost">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={widget.data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )
    }

    if (widget.chartType === 'pie') {
      return (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={widget.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {widget.data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {widget.data?.map((item, idx) => (
                <Badge key={idx} variant="outline" style={{ borderColor: item.color, color: item.color }}>
                  {item.name}: {item.value}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const renderTable = (widget: Widget) => {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <Button size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {productPerformance.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{product.sales} ventes</span>
                  <span className="font-medium">{product.revenue.toLocaleString()}€</span>
                  <Badge className={product.growth >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                    {product.growth >= 0 ? '+' : ''}{product.growth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderFunnel = (widget: Widget) => {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">{stage.value.toLocaleString()} ({stage.rate}%)</span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden bg-muted">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${stage.rate}%` }}
                  />
                </div>
                {idx < funnelData.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground ml-1">
                      {((funnelData[idx + 1].value / stage.value) * 100).toFixed(1)}% conversion
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'metric':
        return renderMetricCard(widget)
      case 'chart':
        return renderChart(widget)
      case 'table':
        return renderTable(widget)
      case 'funnel':
        return renderFunnel(widget)
      default:
        return null
    }
  }

  const getWidgetGridClass = (size: Widget['size']) => {
    switch (size) {
      case 'sm': return 'col-span-1'
      case 'md': return 'col-span-1 md:col-span-2'
      case 'lg': return 'col-span-1 md:col-span-2 lg:col-span-3'
      case 'xl': return 'col-span-1 md:col-span-2 lg:col-span-4'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Flexibles
          </h2>
          <p className="text-muted-foreground">
            Dashboard personnalisable avec métriques en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'dd MMM', { locale: fr })} - {format(dateRange.to, 'dd MMM yyyy', { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                  }
                }}
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <Select onValueChange={(v) => handleExport(v as 'csv' | 'pdf' | 'excel')}>
            <SelectTrigger className="w-[120px]">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setIsCustomizing(!isCustomizing)}>
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Terminer' : 'Personnaliser'}
          </Button>

          {isCustomizing && (
            <>
              <Button variant="outline" onClick={handleAddWidget}>
                <Plus className="h-4 w-4 mr-2" />
                Widget
              </Button>
              <Button onClick={handleSaveDashboard}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Aujourd'hui</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">7 derniers jours</Badge>
        <Badge variant="outline" className="cursor-pointer bg-primary/10 border-primary">14 derniers jours</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">30 derniers jours</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Ce mois</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Trimestre</Badge>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map(widget => (
          <div key={widget.id} className={getWidgetGridClass(widget.size)}>
            {isCustomizing && (
              <div className="flex items-center justify-end gap-1 mb-1">
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Settings className="h-3 w-3" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-destructive"
                  onClick={() => setWidgets(prev => prev.filter(w => w.id !== widget.id))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-500">Opportunité</span>
              </div>
              <p className="text-sm">Le trafic organique a augmenté de 28% cette semaine. Envisagez d'augmenter le budget contenu.</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-500">Attention</span>
              </div>
              <p className="text-sm">Le taux de conversion mobile est 40% inférieur au desktop. Optimisez l'expérience mobile.</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-500">Recommandation</span>
              </div>
              <p className="text-sm">Les produits de la catégorie "Accessoires" ont un taux de marge 35% supérieur. Poussez-les en homepage.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
