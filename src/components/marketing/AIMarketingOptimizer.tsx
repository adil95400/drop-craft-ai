import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Brain,
  Target,
  TrendingUp,
  Zap,
  Settings,
  Play,
  Pause,
  BarChart3,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'

interface OptimizationRecommendation {
  id: string
  type: 'budget' | 'audience' | 'creative' | 'timing' | 'bidding'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: string
  confidence: number
  estimatedLift: string
}

const mockRecommendations: OptimizationRecommendation[] = [
  {
    id: '1',
    type: 'budget',
    priority: 'high',
    title: 'Réallouer budget entre campagnes',
    description: 'Transférer 20% du budget de la campagne Google Ads vers Email Marketing',
    impact: 'Augmentation ROAS estimée: +15%',
    effort: 'Faible - 5 minutes',
    confidence: 89,
    estimatedLift: '+€2,400 revenus mensuels'
  },
  {
    id: '2',
    type: 'audience',
    priority: 'high',
    title: 'Exclure audiences à faible conversion',
    description: 'Exclure le segment "Nouveaux visiteurs mobiles 18-24" avec CR < 0.5%',
    impact: 'Réduction CPA estimée: -25%',
    effort: 'Faible - 2 minutes',
    confidence: 94,
    estimatedLift: '+€1,800 économies mensuelles'
  }
]

export function AIMarketingOptimizer() {
  const { automationJobs } = useRealTimeMarketing()
  const [activeTab, setActiveTab] = useState('recommendations')
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget': return <BarChart3 className="h-4 w-4" />
      case 'audience': return <Users className="h-4 w-4" />
      case 'creative': return <Sparkles className="h-4 w-4" />
      case 'timing': return <Clock className="h-4 w-4" />
      case 'bidding': return <Target className="h-4 w-4" />
      default: return <Bot className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Optimiseur IA Marketing
          </h2>
          <p className="text-muted-foreground">
            Optimisations automatiques basées sur l'analyse des performances
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Button 
            disabled={selectedRecommendations.length === 0 || isOptimizing}
            className="gap-2"
          >
            {isOptimizing ? (
              <>
                <Pause className="h-4 w-4" />
                Optimisation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Appliquer ({selectedRecommendations.length})
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Gains Potentiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+€7,200</div>
            <p className="text-sm text-muted-foreground">Revenus mensuels estimés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Économies Possibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€1,800</div>
            <p className="text-sm text-muted-foreground">Réduction CPA mensuelle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Optimisations Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{automationJobs.length}</div>
            <p className="text-sm text-muted-foreground">Tâches en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-600" />
              Confiance Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">84%</div>
            <p className="text-sm text-muted-foreground">Fiabilité des recommandations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Recommandations d'Optimisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(rec.type)}
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-green-600 font-medium">{rec.impact}</span>
                          <span className="text-blue-600">{rec.effort}</span>
                        </div>
                      </div>
                      <Progress value={rec.confidence} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Tâches d'Automatisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{job.job_type}</h4>
                    <Progress value={job.progress || 0} className="mt-2 h-2" />
                  </div>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
              ))}
              {automationJobs.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune tâche en cours
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}