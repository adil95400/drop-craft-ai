import { Helmet } from 'react-helmet-async'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UnifiedMarketingHub } from '@/components/marketing/UnifiedMarketingHub'
import { MarketingAnalyticsDashboard } from '@/components/marketing/MarketingAnalyticsDashboard'
import { AutomationWorkflows } from '@/components/marketing/AutomationWorkflows'
import { MarketingCalendar } from '@/components/marketing/MarketingCalendar'
import { ABTestManager } from '@/components/marketing/ABTestManager'
import { CampaignsTable } from '@/components/marketing/CampaignsTable'
import { 
  BarChart3, Zap, Calendar, Target, 
  TrendingUp, Users, MessageSquare, Mail
} from 'lucide-react'

export default function MarketingUltraPro() {
  return (
    <>
      <Helmet>
        <title>Marketing Ultra Pro - Hub Marketing Complet</title>
        <meta name="description" content="Hub marketing ultra-avancé avec analytics temps réel, automatisations IA, tests A/B et planification intelligente." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Marketing Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Hub marketing complet avec IA, automatisation et analytics avancés
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Mode Ultra Pro</div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <Tabs defaultValue="hub" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hub" className="gap-2">
              <Target className="h-4 w-4" />
              Hub
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Zap className="h-4 w-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="abtests" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Tests A/B
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Mail className="h-4 w-4" />
              Campagnes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hub">
            <UnifiedMarketingHub />
          </TabsContent>

          <TabsContent value="analytics">
            <MarketingAnalyticsDashboard timeRange="30d" />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationWorkflows />
          </TabsContent>

          <TabsContent value="calendar">
            <MarketingCalendar />
          </TabsContent>

          <TabsContent value="abtests">
            <ABTestManager />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsTable />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}