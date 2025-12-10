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
  Zap,
  Mail,
  GitBranch,
  Tag
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

// New Marketing Components
import { TemplateManager } from '@/components/marketing/TemplateManager'
import { CampaignPerformanceDashboard } from '@/components/marketing/CampaignPerformanceDashboard'
import { MultiChannelSequences } from '@/components/marketing/MultiChannelSequences'
import { DynamicTagsSystem } from '@/components/marketing/DynamicTagsSystem'
import { ZapierWebhooks } from '@/components/marketing/ZapierWebhooks'

export default function MarketingIntelligencePage() {
  const [activeTab, setActiveTab] = useState('performance')

  return (
    <>
      <Helmet>
        <title>Marketing & IA Intelligence - ShopOpti</title>
        <meta name="description" content="Centre de contrôle Marketing et Intelligence Artificielle pour optimiser vos ventes" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="sequences" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Séquences</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="ab-testing" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Testing</span>
            </TabsTrigger>
            <TabsTrigger value="segmentation" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <CampaignPerformanceDashboard />
          </TabsContent>
          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>
          <TabsContent value="sequences">
            <MultiChannelSequences />
          </TabsContent>
          <TabsContent value="tags">
            <DynamicTagsSystem />
          </TabsContent>
          <TabsContent value="webhooks">
            <ZapierWebhooks />
          </TabsContent>
          <TabsContent value="ab-testing">
            <AdvancedABTesting />
          </TabsContent>
          <TabsContent value="segmentation">
            <BehavioralSegmentation />
          </TabsContent>
          <TabsContent value="automation">
            <AdvancedRulesEngine />
          </TabsContent>
          <TabsContent value="analytics">
            <FlexibleAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
