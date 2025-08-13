import { useState, useMemo, useCallback } from 'react'
import { AppLayout } from "@/layouts/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Zap, 
  Clock, 
  Target, 
  TrendingUp,
  Mail,
  ShoppingCart,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Workflow,
  Brain,
  Sparkles,
  RefreshCw,
  Download,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts'

const AutomationUltraProOptimized = () => {
  const { toast } = useToast()
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [workflowFilter, setWorkflowFilter] = useState('all')
  const [aiMode, setAiMode] = useState(true)
  const [autoOptimization, setAutoOptimization] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced mock data for automation workflows
  const workflows = useMemo(() => [
    {
      id: '1',
      name: 'Campagne email abandon panier',
      status: 'active',
      trigger: 'Panier abandonné',
      actions: 4,
      conversions: 156,
      revenue: 12450,
      lastRun: '2024-01-15 14:30',
      success_rate: 85,
      aiOptimized: true,
      category: 'email',
      complexity: 'medium',
      estimatedImpact: '+23%'
    },
    {
      id: '2',
      name: 'Welcome series nouveaux clients',
      status: 'active',
      trigger: 'Nouvel inscription',
      actions: 3,
      conversions: 234,
      revenue: 8900,
      lastRun: '2024-01-15 15:00',
      success_rate: 92,
      aiOptimized: true,
      category: 'email',
      complexity: 'simple',
      estimatedImpact: '+18%'
    },
    {
      id: '3',
      name: 'Remarketing produits vus',
      status: 'paused',
      trigger: 'Produit consulté',
      actions: 2,
      conversions: 89,
      revenue: 5670,
      lastRun: '2024-01-14 10:15',
      success_rate: 78,
      aiOptimized: false,
      category: 'retargeting',
      complexity: 'simple',
      estimatedImpact: '+34%'
    },
    {
      id: '4',
      name: 'Réactivation clients inactifs',
      status: 'active',
      trigger: 'Inactivité 30j',
      actions: 5,
      conversions: 67,
      revenue: 9200,
      lastRun: '2024-01-15 09:00',
      success_rate: 88,
      aiOptimized: true,
      category: 'retention',
      complexity: 'complex',
      estimatedImpact: '+42%'
    },
    {
      id: '5',
      name: 'Personnalisation prix dynamique',
      status: 'active',
      trigger: 'Visitor behavior',
      actions: 1,
      conversions: 345,
      revenue: 15670,
      lastRun: '2024-01-15 16:45',
      success_rate: 94,
      aiOptimized: true,
      category: 'pricing',
      complexity: 'complex',
      estimatedImpact: '+67%'
    }
  ], [])

  // Enhanced performance data
  const performanceData = useMemo(() => [
    { date: '01/01', executions: 245, conversions: 48, revenue: 2400, aiScore: 78 },
    { date: '02/01', executions: 289, conversions: 56, revenue: 2890, aiScore: 82 },
    { date: '03/01', executions: 234, conversions: 42, revenue: 2100, aiScore: 80 },
    { date: '04/01', executions: 378, conversions: 71, revenue: 3560, aiScore: 85 },
    { date: '05/01', executions: 456, conversions: 89, revenue: 4450, aiScore: 88 },
    { date: '06/01', executions: 389, conversions: 76, revenue: 3800, aiScore: 87 },
    { date: '07/01', executions: 423, conversions: 82, revenue: 4100, aiScore: 91 }
  ], [])

  const triggerTypes = useMemo(() => [
    { name: 'Email', value: 35, color: '#8b5cf6' },
    { name: 'Page visitée', value: 25, color: '#06b6d4' },
    { name: 'Achat', value: 20, color: '#10b981' },
    { name: 'Temps', value: 20, color: '#f59e0b' }
  ], [])

  const automationStats = useMemo(() => [
    {
      title: "Workflows actifs",
      value: workflows.filter(w => w.status === 'active').length.toString(),
      change: "+2",
      icon: Bot,
      color: "text-primary",
      description: "Automatisations en cours"
    },
    {
      title: "Exécutions/jour",
      value: "1,234",
      change: "+15%",
      icon: Zap,
      color: "text-green-600",
      description: "Actions automatisées"
    },
    {
      title: "Taux de conversion",
      value: "18.5%",
      change: "+3.2%",
      icon: Target,
      color: "text-blue-600",
      description: "Performance globale"
    },
    {
      title: "ROI moyen",
      value: "340%",
      change: "+25%",
      icon: TrendingUp,
      color: "text-purple-600",
      description: "Retour sur investissement"
    }
  ], [workflows])

  const recentActivities = useMemo(() => [
    {
      workflow: 'Campagne abandon panier',
      action: 'Email envoyé',
      user: 'Marie Dubois',
      time: 'Il y a 5 min',
      status: 'success',
      revenue: 89
    },
    {
      workflow: 'Welcome series',
      action: 'SMS envoyé',
      user: 'Pierre Martin',
      time: 'Il y a 12 min',
      status: 'success',
      revenue: 0
    },
    {
      workflow: 'Prix dynamique',
      action: 'Ajustement prix',
      user: 'Sophie Leroy',
      time: 'Il y a 18 min',
      status: 'success',
      revenue: 156
    },
    {
      workflow: 'Réactivation clients',
      action: 'Email envoyé',
      user: 'Jean Dupont',
      time: 'Il y a 25 min',
      status: 'success',
      revenue: 45
    }
  ], [])

  // AI Workflow suggestions
  const aiSuggestions = useMemo(() => [
    {
      type: 'optimization',
      title: 'Optimiser "Remarketing produits vus"',
      description: 'L\'IA peut améliorer le timing et le contenu pour +34% de conversions',
      impact: '+34%',
      effort: 'Faible',
      category: 'retargeting'
    },
    {
      type: 'new',
      title: 'Workflow "Cross-sell intelligent"',
      description: 'Proposer automatiquement des produits complémentaires',
      impact: '+28%',
      effort: 'Moyen',
      category: 'upsell'
    },
    {
      type: 'optimization',
      title: 'A/B Test automatique des emails',
      description: 'Tester automatiquement différentes versions d\'emails',
      impact: '+21%',
      effort: 'Faible',
      category: 'email'
    }
  ], [])

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      const matchesFilter = workflowFilter === 'all' || workflow.category === workflowFilter
      const matchesSearch = searchQuery === '' || 
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.trigger.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [workflows, workflowFilter, searchQuery])

  const handleToggleWorkflow = useCallback((workflowId: string, currentStatus: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow) {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      toast({
        title: newStatus === 'active' ? "Workflow activé" : "Workflow mis en pause",
        description: `"${workflow.name}" est maintenant ${newStatus === 'active' ? 'actif' : 'en pause'}`,
      })
    }
  }, [workflows, toast])

  const handleAIOptimization = useCallback((workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow) {
      toast({
        title: "Optimisation IA lancée",
        description: `L'IA optimise "${workflow.name}" - Impact estimé: ${workflow.estimatedImpact}`,
      })
    }
  }, [workflows, toast])

  const handleCreateSuggestedWorkflow = useCallback((suggestion: typeof aiSuggestions[0]) => {
    toast({
      title: "Nouveau workflow créé",
      description: `"${suggestion.title}" a été créé avec les optimisations IA`,
    })
  }, [toast])

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'complex': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'email': return Mail
      case 'retargeting': return Target
      case 'retention': return Users
      case 'pricing': return TrendingUp
      default: return Workflow
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Switch 
                checked={aiMode} 
                onCheckedChange={setAiMode}
                id="ai-mode"
              />
              <Label htmlFor="ai-mode" className="text-sm">Mode IA</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={autoOptimization} 
                onCheckedChange={setAutoOptimization}
                id="auto-opt"
              />
              <Label htmlFor="auto-opt" className="text-sm">Auto-optimisation</Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              toast({
                title: "Paramètres",
                description: "Ouverture des paramètres d'automation...",
              });
            }} className="hover-scale">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button size="sm" className="hover-scale">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau workflow
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {automationStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                {/* Real-time indicator */}
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Card */}
        {aiMode && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900">Assistant Automation IA</h3>
                  <p className="text-sm text-purple-700">
                    IA active - {aiSuggestions.length} optimisations automatiques identifiées
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    onClick={() => toast({ title: "Analyse IA", description: "Analyse complète des workflows en cours..." })}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Analyser
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => toast({ title: "Optimisations appliquées", description: "Toutes les optimisations IA ont été appliquées" })}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Optimiser tout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid w-full lg:w-[600px] grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-suggestions">IA Suggestions</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>

          {/* Enhanced Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="retargeting">Retargeting</SelectItem>
                  <SelectItem value="retention">Rétention</SelectItem>
                  <SelectItem value="pricing">Prix Dynamique</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {filteredWorkflows.length} workflows
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Enhanced Workflows List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Workflow className="w-5 h-5" />
                          Workflows actifs
                        </CardTitle>
                        <CardDescription>Automations configurées avec IA</CardDescription>
                      </div>
                      <Button size="sm" className="hover-scale">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredWorkflows.map((workflow, index) => {
                      const CategoryIcon = getCategoryIcon(workflow.category)
                      return (
                        <div
                          key={workflow.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover-scale animate-fade-in ${
                            selectedWorkflow === workflow.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          style={{animationDelay: `${index * 0.05}s`}}
                          onClick={() => setSelectedWorkflow(workflow.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CategoryIcon className="w-5 h-5 text-blue-500" />
                                <h3 className="font-semibold">{workflow.name}</h3>
                                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                                  {workflow.status === 'active' ? 'Actif' : 'Pausé'}
                                </Badge>
                                {workflow.aiOptimized && aiMode && (
                                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                    <Brain className="w-3 h-3 mr-1" />
                                    IA
                                  </Badge>
                                )}
                                <Badge className={getComplexityColor(workflow.complexity)}>
                                  {workflow.complexity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Trigger: {workflow.trigger}
                              </p>
                              <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-muted-foreground">Actions</p>
                                  <p className="font-medium">{workflow.actions}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Conversions</p>
                                  <p className="font-medium text-green-600">{workflow.conversions}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Revenue</p>
                                  <p className="font-medium">{workflow.revenue}€</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">ROI</p>
                                  <p className="font-medium text-purple-600">{workflow.estimatedImpact}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Dernière exécution: {workflow.lastRun}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={workflow.success_rate} className="w-16 h-2" />
                                  <span className="text-xs font-medium">{workflow.success_rate}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              {aiMode && !workflow.aiOptimized && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAIOptimization(workflow.id)
                                  }}
                                  className="hover-scale bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700"
                                >
                                  <Brain className="w-3 h-3" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleWorkflow(workflow.id, workflow.status)
                                }}
                                className="hover-scale"
                              >
                                {workflow.status === 'active' ? 
                                  <Pause className="w-3 h-3" /> : 
                                  <Play className="w-3 h-3" />
                                }
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toast({
                                    title: "Configuration",
                                    description: `Ouverture de la configuration pour "${workflow.name}"`,
                                  })
                                }}
                                className="hover-scale"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toast({
                                    title: "Workflow dupliqué",
                                    description: `"${workflow.name}" a été dupliqué`,
                                  })
                                }}
                                className="hover-scale"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Activité récente
                        </CardTitle>
                        <CardDescription>Actions en temps réel</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="hover-scale">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover-scale animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {activity.status === 'success' ? 
                            <CheckCircle2 className="w-4 h-4" /> : 
                            <AlertTriangle className="w-4 h-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.workflow}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">User: {activity.user}</p>
                            {activity.revenue > 0 && (
                              <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                                +{activity.revenue}€
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Enhanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Performance des workflows</CardTitle>
                  <CardDescription>Évolution des exécutions et conversions avec score IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="executions" stroke="#8b5cf6" strokeWidth={2} name="Exécutions" />
                      <Line type="monotone" dataKey="conversions" stroke="#06b6d4" strokeWidth={2} name="Conversions" />
                      {aiMode && (
                        <Line type="monotone" dataKey="aiScore" stroke="#10b981" strokeWidth={2} name="Score IA" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Types de triggers</CardTitle>
                  <CardDescription>Répartition des déclencheurs utilisés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={triggerTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {triggerTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {triggerTypes.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-sm">{type.name}</span>
                        <span className="text-sm text-muted-foreground">({type.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Revenue et ROI par workflow</CardTitle>
                <CardDescription>Performance financière des automations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New AI Suggestions Tab */}
          <TabsContent value="ai-suggestions" className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Suggestions IA Personnalisées
                </CardTitle>
                <CardDescription>
                  L'IA analyse vos workflows et propose des améliorations basées sur vos données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <Card key={index} className="hover-scale animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <Badge className={`${
                                suggestion.type === 'optimization' ? 'bg-blue-500' : 'bg-green-500'
                              } text-white`}>
                                {suggestion.type === 'optimization' ? 'Optimisation' : 'Nouveau'}
                              </Badge>
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                {suggestion.impact}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span>Effort: {suggestion.effort}</span>
                              <span>Catégorie: {suggestion.category}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: "Aperçu", description: `Prévisualisation de "${suggestion.title}"` })}
                              className="hover-scale"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                              size="sm"
                              onClick={() => handleCreateSuggestedWorkflow(suggestion)}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Implémenter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Triggers Tab */}
          <TabsContent value="triggers" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Triggers disponibles</CardTitle>
                  <CardDescription>Configuration des déclencheurs d'automation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Comportement utilisateur', icon: Users, count: 12 },
                      { name: 'Événements e-commerce', icon: ShoppingCart, count: 8 },
                      { name: 'Temporels/Calendrier', icon: Calendar, count: 5 },
                      { name: 'Communications', icon: Mail, count: 15 },
                      { name: 'IA/Machine Learning', icon: Brain, count: 6 },
                    ].map((trigger, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <trigger.icon className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{trigger.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{trigger.count} triggers</Badge>
                          <Button size="sm" variant="outline">
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Performance des triggers</CardTitle>
                  <CardDescription>Efficacité par type de déclencheur</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Comportement', performance: 85 },
                      { name: 'E-commerce', performance: 92 },
                      { name: 'Temps', performance: 78 },
                      { name: 'Email', performance: 88 },
                      { name: 'IA', performance: 94 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="performance" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Constructeur de Workflow Visuel
                </CardTitle>
                <CardDescription>
                  Interface drag & drop pour créer des automations complexes avec IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Templates IA</h4>
                    {[
                      'Abandon panier optimisé',
                      'Welcome series personnalisé',
                      'Réactivation intelligente',
                      'Cross-sell automatique',
                      'Prix dynamique IA'
                    ].map((template, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className="w-full justify-start hover-scale"
                        onClick={() => toast({ title: "Template sélectionné", description: `"${template}" ajouté au builder` })}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {template}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <Workflow className="w-16 h-16 mx-auto text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-600">Zone de construction</h3>
                      <p className="text-sm text-gray-500">
                        Glissez des éléments ici pour construire votre workflow
                      </p>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Commencer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default AutomationUltraProOptimized