import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
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
  Tag,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Stats data
const statsCards = [
  { label: 'Campagnes Actives', value: '12', icon: Target, color: 'text-primary', bgColor: 'bg-primary/10', link: 'performance' },
  { label: 'Taux Conversion', value: '3.8%', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-500/10', link: 'analytics' },
  { label: 'Emails Envoyés', value: '24.5K', icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-500/10', link: 'templates' },
  { label: 'Règles Actives', value: '8', icon: Workflow, color: 'text-purple-600', bgColor: 'bg-purple-500/10', link: 'automation' },
]

export default function MarketingIntelligencePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('performance')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.loading('Actualisation des données...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.dismiss()
    toast.success('Données marketing actualisées')
  }

  const handleAISuggestions = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Analyse IA en cours...',
        success: '3 suggestions générées pour optimiser vos campagnes',
        error: 'Erreur lors de l\'analyse'
      }
    )
  }

  const handleQuickActions = () => {
    toast.info('Actions rapides: Créer campagne, A/B Test, Nouvelle règle')
  }

  return (
    <>
      <Helmet>
        <title>Marketing & IA Intelligence - ShopOpti</title>
        <meta name="description" content="Centre de contrôle Marketing et Intelligence Artificielle pour optimiser vos ventes" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              Marketing & IA Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Centre de contrôle unifié pour l'optimisation marketing et l'intelligence artificielle
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleAISuggestions}>
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Suggestions IA</span>
            </Button>
            <Button size="sm" onClick={handleQuickActions}>
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actions rapides</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : (
            statsCards.map((stat, idx) => (
              <Card 
                key={idx} 
                className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]" 
                onClick={() => setActiveTab(stat.link)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="performance" className="flex items-center gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 text-xs sm:text-sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="sequences" className="flex items-center gap-2 text-xs sm:text-sm">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Séquences</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2 text-xs sm:text-sm">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="ab-testing" className="flex items-center gap-2 text-xs sm:text-sm">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Testing</span>
            </TabsTrigger>
            <TabsTrigger value="segmentation" className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2 text-xs sm:text-sm">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm">
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
