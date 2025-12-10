import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  FlaskConical, 
  Users, 
  Workflow, 
  BarChart3,
  Sparkles,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react'

// AI Components
import { CrossSellingEngine } from '@/components/ai/CrossSellingEngine'
import { AdvancedSEOGenerator } from '@/components/ai/AdvancedSEOGenerator'
import { PricePredictionsEngine } from '@/components/ai/PricePredictionsEngine'
import { SmartAlertsEngine } from '@/components/ai/SmartAlertsEngine'

// Marketing Components
import { AdvancedABTesting } from '@/components/marketing/AdvancedABTesting'
import { BehavioralSegmentation } from '@/components/marketing/BehavioralSegmentation'
import { AdvancedRulesEngine } from '@/components/marketing/AdvancedRulesEngine'
import { FlexibleAnalytics } from '@/components/marketing/FlexibleAnalytics'

export default function MarketingIntelligencePage() {
  const [activeTab, setActiveTab] = useState('analytics')

  return (
    <>
      <Helmet>
        <title>Marketing & IA Intelligence - ShopOpti</title>
        <meta name="description" content="Centre de contrôle Marketing et Intelligence Artificielle pour optimiser vos ventes" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              Marketing & IA Intelligence
            </h1>
            <p className="text-muted-foreground mt-2">
              Centre de contrôle unifié pour l'optimisation marketing et l'intelligence artificielle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Suggestions IA
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Actions rapides
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-8 h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="ab-testing" className="flex items-center gap-2 data-[state=active]:bg-background">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Testing</span>
            </TabsTrigger>
            <TabsTrigger value="segmentation" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2 data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">SEO IA</span>
            </TabsTrigger>
            <TabsTrigger value="cross-sell" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Cross-sell</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Prix IA</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Alertes</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <FlexibleAnalytics />
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value="ab-testing">
            <AdvancedABTesting />
          </TabsContent>

          {/* Segmentation Tab */}
          <TabsContent value="segmentation">
            <BehavioralSegmentation />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation">
            <AdvancedRulesEngine />
          </TabsContent>

          {/* SEO IA Tab */}
          <TabsContent value="seo">
            <AdvancedSEOGenerator />
          </TabsContent>

          {/* Cross-sell Tab */}
          <TabsContent value="cross-sell">
            <CrossSellingEngine />
          </TabsContent>

          {/* Pricing IA Tab */}
          <TabsContent value="pricing">
            <PricePredictionsEngine />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <SmartAlertsEngine />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
