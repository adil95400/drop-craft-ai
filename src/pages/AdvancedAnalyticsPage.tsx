/**
 * AdvancedAnalyticsPage - Analytics Avancés
 */
import { lazy, Suspense, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Users, Target, Activity, TrendingUp, Sparkles, Download, Loader2 } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

const CustomReportsBuilder = lazy(() => import('@/components/analytics/CustomReportsBuilder').then(m => ({ default: m.CustomReportsBuilder })))
const TeamManager = lazy(() => import('@/components/teams/TeamManager').then(m => ({ default: m.TeamManager })))
const KPIsDashboard = lazy(() => import('@/components/analytics/KPIsDashboard').then(m => ({ default: m.KPIsDashboard })))
const ActivityLog = lazy(() => import('@/components/analytics/ActivityLog').then(m => ({ default: m.ActivityLog })))
const UnifiedPerformanceOverview = lazy(() => import('@/components/analytics/UnifiedPerformanceOverview').then(m => ({ default: m.UnifiedPerformanceOverview })))

const TabSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
  </div>
)

export default function AdvancedAnalyticsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const handleGenerateReport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('Non authentifié')
      const { error } = await supabase.from('advanced_reports').insert({
        user_id: session.user.id,
        report_name: `Rapport Analytics ${new Date().toLocaleDateString('fr-FR')}`,
        report_type: 'analytics',
        status: 'generated',
        last_generated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast({ title: 'Rapport généré', description: 'Le rapport a été créé' })
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de générer le rapport', variant: 'destructive' })
    }
  }

  return (
    <ChannablePageWrapper
      title="Analytics Avancés"
      description="Rapports personnalisés, KPIs temps réel et gestion d'équipe"
      heroImage="analytics"
      badge={{ label: 'Business Intelligence', icon: Sparkles }}
      actions={
        <>
          <Button size="sm" onClick={handleGenerateReport}>
            <TrendingUp className="h-4 w-4 mr-2" />Générer un rapport
          </Button>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Exporter
          </Button>
        </>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2"><BarChart className="h-4 w-4" />Rapports</TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-2"><Target className="h-4 w-4" />KPIs</TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2"><Users className="h-4 w-4" />Équipes</TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2"><Activity className="h-4 w-4" />Activité</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Suspense fallback={<TabSkeleton />}><UnifiedPerformanceOverview /></Suspense></TabsContent>
        <TabsContent value="reports"><Suspense fallback={<TabSkeleton />}><CustomReportsBuilder /></Suspense></TabsContent>
        <TabsContent value="kpis"><Suspense fallback={<TabSkeleton />}><KPIsDashboard /></Suspense></TabsContent>
        <TabsContent value="teams"><Suspense fallback={<TabSkeleton />}><TeamManager /></Suspense></TabsContent>
        <TabsContent value="activity"><Suspense fallback={<TabSkeleton />}><ActivityLog /></Suspense></TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
