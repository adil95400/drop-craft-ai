/**
 * Marketing Automation - Real data from automated_campaigns table
 */
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Mail, Users, Target, TrendingUp, Play, Pause, 
  Settings, BarChart3, Eye, Zap
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

export const MarketingAutomation: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('campaigns')

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await (supabase.from('automated_campaigns') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: 'email',
        status: c.is_active ? 'active' : 'draft',
        trigger: c.trigger_type || 'automated',
        audience: { total: c.trigger_count || 0, criteria: [] },
        performance: {
          sent: c.current_metrics?.sent || 0,
          opened: c.current_metrics?.opened || 0,
          clicked: c.current_metrics?.clicked || 0,
          converted: c.current_metrics?.converted || 0,
          revenue: c.current_metrics?.revenue || 0,
        },
        created_at: c.created_at,
      }))
    },
    enabled: !!user?.id,
  })

  const { data: automationRules = [] } = useQuery({
    queryKey: ['automation-rules', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await (supabase.from('automation_workflows') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) return []
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        trigger: r.trigger_type || 'event',
        conditions: r.conditions ? Object.keys(r.conditions) : [],
        actions: r.steps ? (r.steps as any[]).map((s: any) => s.name || s.action) : [],
        isActive: r.is_active ?? true,
        performance: { triggered: r.trigger_count || 0, executed: r.execution_count || 0, success_rate: r.execution_count && r.trigger_count ? ((r.execution_count / r.trigger_count) * 100) : 0 },
      }))
    },
    enabled: !!user?.id,
  })

  const toggleCampaign = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await (supabase.from('automated_campaigns') as any).update({ is_active: active }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] }),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'draft': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) return <div className="space-y-6 animate-pulse"><div className="h-8 bg-muted rounded w-1/3" /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted rounded" />)}</div></div>

  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active')
  const totalRevenue = campaigns.reduce((s: number, c: any) => s + c.performance.revenue, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center"><Target className="h-8 w-8 mr-3 text-primary" />Marketing Automation</h1>
          <p className="text-muted-foreground">Automatisez vos campagnes et optimisez vos conversions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Campagnes actives</CardTitle><Mail className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeCampaigns.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total campagnes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{campaigns.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{campaigns.length > 0 && campaigns.some((c: any) => c.performance.sent > 0)
            ? (campaigns.filter((c: any) => c.performance.sent > 0).reduce((sum: number, c: any) => sum + (c.performance.opened / c.performance.sent), 0) / campaigns.filter((c: any) => c.performance.sent > 0).length * 100).toFixed(1) : 0}%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenus générés</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalRevenue.toLocaleString()}€</div></CardContent></Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Mail className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Aucune campagne. Créez votre première campagne marketing.</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {campaigns.map((campaign: any) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">{campaign.name}<Badge className={`${getStatusColor(campaign.status)} text-white`}>{campaign.status === 'active' ? 'Active' : 'Brouillon'}</Badge></CardTitle>
                        <CardDescription className="mt-1">EMAIL • {campaign.trigger}</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toggleCampaign.mutate({ id: campaign.id, active: campaign.status !== 'active' })}>
                        {campaign.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {campaign.performance.sent > 0 && (
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><div className="text-muted-foreground">Envoyés</div><div className="font-medium">{campaign.performance.sent}</div></div>
                        <div><div className="text-muted-foreground">Ouverts</div><div className="font-medium">{campaign.performance.opened} ({((campaign.performance.opened / campaign.performance.sent) * 100).toFixed(1)}%)</div></div>
                      </div>
                      {campaign.performance.revenue > 0 && (
                        <div className="text-sm font-medium mt-2">Revenus: {campaign.performance.revenue}€</div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          {automationRules.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Zap className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Aucune règle d'automatisation configurée.</p></CardContent></Card>
          ) : (
            automationRules.map((rule: any) => (
              <Card key={rule.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">{rule.name}<Badge variant={rule.isActive ? 'default' : 'secondary'}>{rule.isActive ? 'Actif' : 'Inactif'}</Badge></CardTitle>
                  <CardDescription>Déclencheur: {rule.trigger}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Déclenchements</span><p className="font-medium">{rule.performance.triggered}</p></div>
                    <div><span className="text-muted-foreground">Exécutions</span><p className="font-medium">{rule.performance.executed}</p></div>
                    <div><span className="text-muted-foreground">Taux succès</span><p className="font-medium">{rule.performance.success_rate.toFixed(1)}%</p></div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}