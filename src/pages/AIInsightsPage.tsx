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

export default function AIInsightsPage() {
  const { data: insights, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const activeInsights = insights?.filter((i) => i.status === 'active') || []
  const actionedInsights = insights?.filter((i) => i.status === 'actioned') || []
  const dismissedInsights = insights?.filter((i) => i.status === 'dismissed') || []

  const getImpactColor = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500/10 text-red-500',
      medium: 'bg-yellow-500/10 text-yellow-500',
      low: 'bg-blue-500/10 text-blue-500',
    }
    return colors[level] || 'bg-muted text-muted-foreground'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      pricing: TrendingUp,
      inventory: AlertTriangle,
      marketing: Lightbulb,
      optimization: Brain,
    }
    const Icon = icons[category] || Brain
    return <Icon className="w-5 h-5" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Intelligent recommendations powered by AI
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Insights</p>
              <p className="text-2xl font-bold">{activeInsights.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actioned</p>
              <p className="text-2xl font-bold">{actionedInsights.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Impact</p>
              <p className="text-2xl font-bold">
                €
                {insights
                  ?.filter((i) => i.status === 'active')
                  .reduce((sum, i) => sum + (i.estimated_revenue_impact || 0), 0)
                  .toFixed(0) || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeInsights.length})</TabsTrigger>
          <TabsTrigger value="actioned">
            Actioned ({actionedInsights.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed ({dismissedInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeInsights.length === 0 ? (
            <Card className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No active insights available</p>
            </Card>
          ) : (
            activeInsights.map((insight) => (
              <Card key={insight.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {getCategoryIcon(insight.category)}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact_level || '')}>
                            {insight.impact_level} impact
                          </Badge>
                          <Badge variant="outline">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                      </div>
                    </div>

                    {insight.estimated_revenue_impact && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">
                          Estimated impact:
                        </span>
                        <span className="font-semibold text-green-500">
                          +€{insight.estimated_revenue_impact.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {insight.recommended_actions && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommended Actions:</p>
                        <div className="space-y-2">
                          {(insight.recommended_actions as any[])?.map(
                            (action: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                              >
                                <ArrowRight className="w-4 h-4 text-primary" />
                                <span>{action.description || action}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(insight.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button size="sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="actioned" className="space-y-4">
          {actionedInsights.map((insight) => (
            <Card key={insight.id} className="p-6 opacity-75">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(insight.acted_upon_at!), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedInsights.map((insight) => (
            <Card key={insight.id} className="p-6 opacity-50">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
