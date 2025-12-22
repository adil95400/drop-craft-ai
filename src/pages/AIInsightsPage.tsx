import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AIInsight {
  id: string
  title: string
  description: string | null
  insight_type: string
  status: string | null
  priority: number | null
  confidence_score: number | null
  impact_score: number | null
  actionable_recommendations: any
  supporting_data: any
  created_at: string | null
}

export default function AIInsightsPage() {
  const { data: insights, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_intelligence_insights')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as AIInsight[]
    },
  })

  const activeInsights = insights?.filter((i) => i.status === 'new' || i.status === 'active') || []
  const actionedInsights = insights?.filter((i) => i.status === 'actioned' || i.status === 'applied') || []
  const dismissedInsights = insights?.filter((i) => i.status === 'dismissed' || i.status === 'ignored') || []

  const getImpactColor = (score: number | null) => {
    if (!score) return 'bg-muted text-muted-foreground'
    if (score >= 0.7) return 'bg-red-500/10 text-red-500'
    if (score >= 0.4) return 'bg-yellow-500/10 text-yellow-500'
    return 'bg-blue-500/10 text-blue-500'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      pricing: TrendingUp,
      inventory: AlertTriangle,
      marketing: Lightbulb,
      optimization: Brain,
      supplier_recommendation: Brain,
    }
    const Icon = icons[category] || Brain
    return Icon
  }

  const handleAction = async (id: string, action: 'apply' | 'dismiss') => {
    await supabase
      .from('business_intelligence_insights')
      .update({ status: action === 'apply' ? 'applied' : 'dismissed' })
      .eq('id', id)
    refetch()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Insights IA</h1>
          <p className="text-muted-foreground">
            Recommandations intelligentes pour optimiser votre business
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <Brain className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Actifs</span>
          </div>
          <p className="text-2xl font-bold mt-2">{activeInsights.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium">Appliqués</span>
          </div>
          <p className="text-2xl font-bold mt-2">{actionedInsights.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Ignorés</span>
          </div>
          <p className="text-2xl font-bold mt-2">{dismissedInsights.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Actifs ({activeInsights.length})</TabsTrigger>
          <TabsTrigger value="actioned">Appliqués ({actionedInsights.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Ignorés ({dismissedInsights.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          {activeInsights.map((insight) => {
            const Icon = getCategoryIcon(insight.insight_type)
            return (
              <Card key={insight.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <Badge className={getImpactColor(insight.impact_score)}>
                        Impact: {Math.round((insight.impact_score || 0) * 100)}%
                      </Badge>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Confiance: {Math.round((insight.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(insight.id, 'apply')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Appliquer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(insight.id, 'dismiss')}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{insight.description}</p>
                {insight.actionable_recommendations && Array.isArray(insight.actionable_recommendations) && (
                  <div className="mt-3 space-y-1">
                    {(insight.actionable_recommendations as string[]).slice(0, 3).map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-3 h-3" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}
                {insight.created_at && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                  </p>
                )}
              </Card>
            )
          })}
          {activeInsights.length === 0 && (
            <Card className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun insight actif pour le moment</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actioned" className="mt-4 space-y-4">
          {actionedInsights.map((insight) => (
            <Card key={insight.id} className="p-4 opacity-75">
              <h3 className="font-medium">{insight.title}</h3>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </Card>
          ))}
          {actionedInsights.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun insight appliqué</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="mt-4 space-y-4">
          {dismissedInsights.map((insight) => (
            <Card key={insight.id} className="p-4 opacity-50">
              <h3 className="font-medium">{insight.title}</h3>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </Card>
          ))}
          {dismissedInsights.length === 0 && (
            <Card className="p-8 text-center">
              <X className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun insight ignoré</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
