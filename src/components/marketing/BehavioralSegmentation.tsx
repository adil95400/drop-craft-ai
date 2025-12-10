import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  Target, 
  Brain, 
  TrendingUp, 
  ShoppingCart,
  Eye,
  Clock,
  DollarSign,
  Heart,
  Repeat,
  AlertCircle,
  Plus,
  Filter,
  Download,
  Send,
  Sparkles,
  UserCheck,
  UserX,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface Segment {
  id: string
  name: string
  type: 'behavioral' | 'demographic' | 'rfm' | 'predictive' | 'custom'
  description: string
  size: number
  growth: number
  averageValue: number
  conversionRate: number
  conditions: SegmentCondition[]
  color: string
  isAIGenerated: boolean
  lastUpdated: string
}

interface SegmentCondition {
  field: string
  operator: string
  value: string | number
}

const mockSegments: Segment[] = [
  {
    id: '1',
    name: 'Champions',
    type: 'rfm',
    description: 'Clients les plus fidèles avec une fréquence et valeur élevées',
    size: 1250,
    growth: 12.5,
    averageValue: 450,
    conversionRate: 45.2,
    conditions: [
      { field: 'rfm_score', operator: '>=', value: 9 },
      { field: 'orders_count', operator: '>=', value: 5 }
    ],
    color: 'emerald',
    isAIGenerated: false,
    lastUpdated: '2024-01-20'
  },
  {
    id: '2',
    name: 'À risque de churn',
    type: 'predictive',
    description: 'Clients susceptibles de partir basé sur leur comportement récent',
    size: 890,
    growth: -5.2,
    averageValue: 180,
    conversionRate: 8.5,
    conditions: [
      { field: 'days_since_purchase', operator: '>', value: 60 },
      { field: 'visit_frequency', operator: '<', value: 2 }
    ],
    color: 'red',
    isAIGenerated: true,
    lastUpdated: '2024-01-21'
  },
  {
    id: '3',
    name: 'Nouveaux clients prometteurs',
    type: 'behavioral',
    description: 'Nouveaux clients avec un fort potentiel de rétention',
    size: 2340,
    growth: 28.3,
    averageValue: 85,
    conversionRate: 22.1,
    conditions: [
      { field: 'first_purchase_days', operator: '<=', value: 30 },
      { field: 'pages_viewed', operator: '>=', value: 10 }
    ],
    color: 'blue',
    isAIGenerated: true,
    lastUpdated: '2024-01-21'
  },
  {
    id: '4',
    name: 'Acheteurs impulsifs',
    type: 'behavioral',
    description: 'Clients qui achètent rapidement après leur première visite',
    size: 1567,
    growth: 15.7,
    averageValue: 120,
    conversionRate: 35.8,
    conditions: [
      { field: 'time_to_purchase', operator: '<', value: 300 },
      { field: 'cart_abandonment_rate', operator: '<', value: 20 }
    ],
    color: 'purple',
    isAIGenerated: true,
    lastUpdated: '2024-01-20'
  },
  {
    id: '5',
    name: 'Comparateurs de prix',
    type: 'behavioral',
    description: 'Visiteurs qui comparent beaucoup avant d\'acheter',
    size: 3420,
    growth: 8.2,
    averageValue: 95,
    conversionRate: 12.3,
    conditions: [
      { field: 'product_views', operator: '>=', value: 15 },
      { field: 'session_duration', operator: '>=', value: 600 }
    ],
    color: 'orange',
    isAIGenerated: false,
    lastUpdated: '2024-01-19'
  },
  {
    id: '6',
    name: 'VIP Mobile',
    type: 'demographic',
    description: 'Clients premium qui achètent principalement sur mobile',
    size: 780,
    growth: 22.1,
    averageValue: 320,
    conversionRate: 28.5,
    conditions: [
      { field: 'device', operator: '=', value: 'mobile' },
      { field: 'lifetime_value', operator: '>=', value: 500 }
    ],
    color: 'cyan',
    isAIGenerated: false,
    lastUpdated: '2024-01-18'
  }
]

const behaviorMetrics = [
  { id: 'pages_viewed', label: 'Pages vues', icon: Eye },
  { id: 'session_duration', label: 'Durée session', icon: Clock },
  { id: 'cart_value', label: 'Valeur panier', icon: ShoppingCart },
  { id: 'purchase_frequency', label: 'Fréquence achat', icon: Repeat },
  { id: 'wishlist_items', label: 'Articles wishlist', icon: Heart },
  { id: 'time_to_purchase', label: 'Temps avant achat', icon: Zap }
]

export function BehavioralSegmentation() {
  const [segments, setSegments] = useState<Segment[]>(mockSegments)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const totalCustomers = segments.reduce((acc, s) => acc + s.size, 0)

  const handleGenerateAISegments = async () => {
    setIsGeneratingAI(true)
    toast.loading('Analyse comportementale en cours...')
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const newSegment: Segment = {
      id: Date.now().toString(),
      name: 'Acheteurs de week-end',
      type: 'predictive',
      description: 'Clients qui achètent principalement le week-end avec des paniers plus élevés',
      size: 1890,
      growth: 18.5,
      averageValue: 145,
      conversionRate: 31.2,
      conditions: [
        { field: 'weekend_purchase_ratio', operator: '>=', value: 0.7 },
        { field: 'avg_order_value', operator: '>=', value: 100 }
      ],
      color: 'indigo',
      isAIGenerated: true,
      lastUpdated: new Date().toISOString().split('T')[0]
    }
    
    setSegments(prev => [newSegment, ...prev])
    setIsGeneratingAI(false)
    toast.dismiss()
    toast.success('Nouveau segment découvert par l\'IA!')
  }

  const handleSendCampaign = (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId)
    toast.success(`Campagne envoyée à ${segment?.size.toLocaleString()} clients du segment "${segment?.name}"`)
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      red: 'bg-red-500/10 text-red-500 border-red-500/20',
      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    }
    return colors[color] || colors.blue
  }

  const getTypeIcon = (type: Segment['type']) => {
    switch (type) {
      case 'behavioral': return Eye
      case 'rfm': return DollarSign
      case 'predictive': return Brain
      case 'demographic': return Users
      default: return Target
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Segmentation Comportementale
          </h2>
          <p className="text-muted-foreground">
            Segments dynamiques basés sur le comportement réel de vos clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateAISegments} disabled={isGeneratingAI}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingAI ? 'Analyse...' : 'Découvrir segments IA'}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau segment
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total segments</p>
                <p className="text-2xl font-bold">{segments.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients segmentés</p>
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Segments IA</p>
                <p className="text-2xl font-bold">{segments.filter(s => s.isAIGenerated).length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                <p className="text-2xl font-bold">{Math.round(segments.reduce((acc, s) => acc + s.averageValue, 0) / segments.length)}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments Grid */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({segments.length})</TabsTrigger>
          <TabsTrigger value="behavioral">Comportementaux ({segments.filter(s => s.type === 'behavioral').length})</TabsTrigger>
          <TabsTrigger value="predictive">Prédictifs ({segments.filter(s => s.type === 'predictive').length})</TabsTrigger>
          <TabsTrigger value="rfm">RFM ({segments.filter(s => s.type === 'rfm').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map(segment => {
              const TypeIcon = getTypeIcon(segment.type)
              return (
                <Card 
                  key={segment.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => setSelectedSegment(segment)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getColorClasses(segment.color)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{segment.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {segment.type === 'behavioral' ? 'Comportemental' :
                             segment.type === 'rfm' ? 'RFM' :
                             segment.type === 'predictive' ? 'Prédictif' :
                             segment.type === 'demographic' ? 'Démographique' : 'Custom'}
                          </Badge>
                        </div>
                      </div>
                      {segment.isAIGenerated && (
                        <Badge className="bg-purple-500/10 text-purple-500">
                          <Sparkles className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {segment.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Taille</p>
                        <p className="font-semibold flex items-center gap-1">
                          {segment.size.toLocaleString()}
                          <span className={`text-xs ${segment.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {segment.growth >= 0 ? '+' : ''}{segment.growth}%
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valeur moy.</p>
                        <p className="font-semibold">{segment.averageValue}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taux conv.</p>
                        <p className="font-semibold">{segment.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Part totale</p>
                        <Progress 
                          value={(segment.size / totalCustomers) * 100} 
                          className="h-2 mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendCampaign(segment.id)
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Campagne
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.success('Export CSV démarré')
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="behavioral" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.filter(s => s.type === 'behavioral').map(segment => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="text-base">{segment.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                  <p className="font-semibold mt-2">{segment.size.toLocaleString()} clients</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.filter(s => s.type === 'predictive').map(segment => (
              <Card key={segment.id} className="border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                  <p className="font-semibold mt-2">{segment.size.toLocaleString()} clients</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rfm" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.filter(s => s.type === 'rfm').map(segment => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="text-base">{segment.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                  <p className="font-semibold mt-2">{segment.size.toLocaleString()} clients</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Behavior Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métriques comportementales disponibles
          </CardTitle>
          <CardDescription>
            Critères utilisables pour créer vos segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {behaviorMetrics.map(metric => {
              const Icon = metric.icon
              return (
                <div 
                  key={metric.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Icon className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">{metric.label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
