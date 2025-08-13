import { useState, useMemo, useCallback } from 'react'
import { AppLayout } from "@/layouts/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Globe, 
  Link, 
  FileText, 
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Zap,
  Settings,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Brain,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Users,
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { toast } from 'sonner'
import { AsyncButton } from "@/components/ui/async-button"

const SEOUltraProOptimized = () => {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [auditFilter, setAuditFilter] = useState('all')
  const [autoOptimization, setAutoOptimization] = useState(true)
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true)

  // Enhanced mock data with more insights
  const seoMetrics = useMemo(() => [
    {
      title: "Score SEO global",
      value: "78/100",
      change: "+5",
      icon: Target,
      color: "text-primary",
      trend: "up",
      description: "Amélioration continue"
    },
    {
      title: "Mots-clés classés",
      value: "1,247",
      change: "+23",
      icon: Search,
      color: "text-green-600",
      trend: "up",
      description: "Nouveau record"
    },
    {
      title: "Trafic organique",
      value: "15.2K",
      change: "+12%",
      icon: TrendingUp,
      color: "text-blue-600",
      trend: "up",
      description: "Croissance soutenue"
    },
    {
      title: "Backlinks",
      value: "892",
      change: "+34",
      icon: Link,
      color: "text-purple-600",
      trend: "up",
      description: "Autorité renforcée"
    }
  ], [])

  // Enhanced keywords with more data
  const keywords = useMemo(() => [
    {
      id: '1',
      keyword: 'e-commerce solution',
      position: 3,
      previousPosition: 5,
      volume: 2400,
      difficulty: 65,
      traffic: 450,
      url: '/solutions/ecommerce',
      intent: 'commercial',
      ctr: 12.5,
      conversions: 34,
      revenue: 1250
    },
    {
      id: '2',
      keyword: 'dropshipping automation',
      position: 7,
      previousPosition: 12,
      volume: 1800,
      difficulty: 58,
      traffic: 230,
      url: '/automation/dropshipping',
      intent: 'informational',
      ctr: 8.3,
      conversions: 18,
      revenue: 890
    },
    {
      id: '3',
      keyword: 'inventory management',
      position: 12,
      previousPosition: 15,
      volume: 3200,
      difficulty: 72,
      traffic: 180,
      url: '/features/inventory',
      intent: 'commercial',
      ctr: 5.7,
      conversions: 12,
      revenue: 560
    },
    {
      id: '4',
      keyword: 'online store builder',
      position: 15,
      previousPosition: 18,
      volume: 5600,
      difficulty: 85,
      traffic: 120,
      url: '/builder',
      intent: 'commercial',
      ctr: 3.2,
      conversions: 8,
      revenue: 340
    }
  ], [])

  // Enhanced performance data
  const performanceData = useMemo(() => [
    { date: '01/01', organic_traffic: 12500, rankings: 890, score: 72, conversions: 125, revenue: 2840 },
    { date: '02/01', organic_traffic: 13200, rankings: 920, score: 74, conversions: 142, revenue: 3120 },
    { date: '03/01', organic_traffic: 12800, rankings: 945, score: 75, conversions: 138, revenue: 2890 },
    { date: '04/01', organic_traffic: 14100, rankings: 980, score: 76, conversions: 156, revenue: 3450 },
    { date: '05/01', organic_traffic: 15600, rankings: 1050, score: 77, conversions: 178, revenue: 3890 },
    { date: '06/01', organic_traffic: 14800, rankings: 1120, score: 78, conversions: 165, revenue: 3670 },
    { date: '07/01', organic_traffic: 16200, rankings: 1247, score: 78, conversions: 189, revenue: 4120 }
  ], [])

  // Enhanced technical issues with actionable insights
  const technicalIssues = useMemo(() => [
    {
      id: '1',
      type: 'critical',
      title: 'Pages avec erreurs 404',
      description: '15 pages génèrent des erreurs 404',
      affected: 15,
      impact: 'Haute',
      status: 'open',
      autoFix: true,
      estimatedFix: '2h'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Images sans attribut alt',
      description: '47 images manquent de texte alternatif',
      affected: 47,
      impact: 'Moyenne',
      status: 'open',
      autoFix: true,
      estimatedFix: '30min'
    },
    {
      id: '3',
      type: 'info',
      title: 'Meta descriptions manquantes',
      description: '8 pages sans meta description',
      affected: 8,
      impact: 'Moyenne',
      status: 'fixed',
      autoFix: true,
      estimatedFix: '15min'
    },
    {
      id: '4',
      type: 'critical',
      title: 'Vitesse de chargement lente',
      description: 'Temps de chargement supérieur à 3s',
      affected: 23,
      impact: 'Haute',
      status: 'open',
      autoFix: false,
      estimatedFix: '1 jour'
    }
  ], [])

  // Enhanced competitor analysis
  const competitors = useMemo(() => [
    {
      name: 'Shopify',
      domain: 'shopify.com',
      organic_keywords: 2850000,
      traffic: 45000000,
      domain_rating: 91,
      backlinks: 5600000,
      topKeywords: ['e-commerce platform', 'online store', 'shopify'],
      gapOpportunities: 156
    },
    {
      name: 'WooCommerce',
      domain: 'woocommerce.com',
      organic_keywords: 890000,
      traffic: 12000000,
      domain_rating: 84,
      backlinks: 2100000,
      topKeywords: ['wordpress ecommerce', 'woocommerce plugin', 'online shop'],
      gapOpportunities: 89
    },
    {
      name: 'BigCommerce',
      domain: 'bigcommerce.com',
      organic_keywords: 156000,
      traffic: 3200000,
      domain_rating: 78,
      backlinks: 890000,
      topKeywords: ['enterprise ecommerce', 'bigcommerce platform', 'online retail'],
      gapOpportunities: 67
    }
  ], [])

  // AI Content suggestions
  const aiSuggestions = useMemo(() => [
    {
      type: 'content',
      title: 'Article "Guide Dropshipping 2024"',
      reason: 'Forte demande, faible concurrence',
      estimatedTraffic: '2.4k visites/mois',
      difficulty: 'Facile',
      priority: 'Haute'
    },
    {
      type: 'optimization',
      title: 'Optimiser page "/pricing"',
      reason: 'Position 12 → Potentiel top 5',
      estimatedTraffic: '+890 visites/mois',
      difficulty: 'Moyenne',
      priority: 'Haute'
    },
    {
      type: 'technical',
      title: 'Améliorer Core Web Vitals',
      reason: 'Impact sur ranking Google',
      estimatedTraffic: '+15% trafic global',
      difficulty: 'Moyenne',
      priority: 'Critique'
    }
  ], [])

  const filteredIssues = useMemo(() => 
    technicalIssues.filter(issue => {
      if (auditFilter === 'all') return true
      if (auditFilter === 'critical') return issue.type === 'critical'
      if (auditFilter === 'warning') return issue.type === 'warning'
      if (auditFilter === 'fixed') return issue.status === 'fixed'
      return true
    }), [technicalIssues, auditFilter])

  const getPositionTrend = useCallback((current: number, previous: number) => {
    if (current < previous) return { 
      color: 'text-green-600', 
      icon: ArrowUp, 
      change: `+${previous - current}`,
      bgColor: 'bg-green-100'
    }
    if (current > previous) return { 
      color: 'text-red-600', 
      icon: ArrowDown, 
      change: `-${current - previous}`,
      bgColor: 'bg-red-100'
    }
    return { 
      color: 'text-muted-foreground', 
      icon: Minus, 
      change: '0',
      bgColor: 'bg-gray-100'
    }
  }, [])

  const handleAutoFix = useCallback((issueId: string) => {
    const issue = technicalIssues.find(i => i.id === issueId)
    if (issue?.autoFix) {
      toast.success(`Correction automatique lancée pour: ${issue.title}`)
      // Simulate fix process
      setTimeout(() => {
        toast.success(`${issue.title} corrigé automatiquement !`)
      }, 2000)
    }
  }, [technicalIssues])

  const handleAIOptimization = useCallback((keyword: string) => {
    toast.info(`IA en train d'optimiser le contenu pour "${keyword}"...`)
    setTimeout(() => {
      toast.success(`Optimisation IA terminée pour "${keyword}" - +23% de performance estimée`)
    }, 3000)
  }, [])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Switch 
                checked={autoOptimization} 
                onCheckedChange={setAutoOptimization}
                id="auto-opt"
              />
              <Label htmlFor="auto-opt" className="text-sm">IA Auto</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={realTimeMonitoring} 
                onCheckedChange={setRealTimeMonitoring}
                id="real-time"
              />
              <Label htmlFor="real-time" className="text-sm">Temps réel</Label>
            </div>
            <Button variant="outline" size="sm" className="hover-scale">
              <RefreshCw className="w-4 h-4 mr-2" />
              Audit complet
            </Button>
            <Button size="sm" className="hover-scale">
              <Download className="w-4 h-4 mr-2" />
              Rapport
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {seoMetrics.map((metric, index) => (
            <Card key={index} className="relative overflow-hidden hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {metric.change}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10 group-hover:scale-110 transition-transform`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
                {/* Real-time indicator */}
                {realTimeMonitoring && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Card */}
        {autoOptimization && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900">Assistant SEO IA</h3>
                  <p className="text-sm text-purple-700">
                    IA active - {aiSuggestions.length} optimisations automatiques identifiées
                  </p>
                </div>
                <AsyncButton 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={async () => {
                    // Simulate AI optimization process
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // In real app: await applyAIOptimizations();
                  }}
                  icon={<Sparkles className="w-4 h-4" />}
                  loadingText="Application en cours..."
                  successMessage="Optimisations IA appliquées automatiquement"
                  data-testid="ai-optimize-all-button"
                >
                  Appliquer tout
                </AsyncButton>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList className="grid w-full lg:w-[700px] grid-cols-7 bg-white shadow-sm">
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
            <TabsTrigger value="content">Contenu IA</TabsTrigger>
            <TabsTrigger value="competitors">Concurrence</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          {/* Enhanced Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher des mots-clés..." className="pl-10 w-80" />
                </div>
                <Select>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="top10">Top 10</SelectItem>
                    <SelectItem value="top50">Top 50</SelectItem>
                    <SelectItem value="declining">En baisse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hover-scale">
                  <Brain className="w-4 h-4 mr-2" />
                  Suggestions IA
                </Button>
                <Button className="hover-scale">
                  <Search className="w-4 h-4 mr-2" />
                  Ajouter mot-clé
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Suivi des positions</CardTitle>
                    <CardDescription>Performances de vos mots-clés principaux avec insights IA</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {keywords.length} mots-clés suivis
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => {
                    const trend = getPositionTrend(keyword.position, keyword.previousPosition)
                    return (
                      <div
                        key={keyword.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover-scale animate-fade-in ${
                          selectedKeyword === keyword.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        style={{animationDelay: `${index * 0.1}s`}}
                        onClick={() => setSelectedKeyword(keyword.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{keyword.keyword}</h3>
                              <Badge variant="outline" className="text-xs">
                                {keyword.intent}
                              </Badge>
                              {autoOptimization && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                  IA Ready
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{keyword.url}</p>
                            <div className="grid grid-cols-7 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Position</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-lg">#{keyword.position}</p>
                                  <div className={`flex items-center gap-1 ${trend.color} p-1 rounded ${trend.bgColor}`}>
                                    <trend.icon className="w-3 h-3" />
                                    <span className="text-xs">{trend.change}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Volume</p>
                                <p className="font-medium">{keyword.volume.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Difficulté</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={keyword.difficulty} className="w-12 h-2" />
                                  <span className="text-xs">{keyword.difficulty}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Trafic</p>
                                <p className="font-medium">{keyword.traffic}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CTR</p>
                                <p className="font-medium text-blue-600">{keyword.ctr}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Conv.</p>
                                <p className="font-medium text-green-600">{keyword.conversions}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAIOptimization(keyword.keyword)
                                  }}
                                  disabled={!autoOptimization}
                                  className="hover-scale"
                                >
                                  <Brain className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="hover-scale">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="hover-scale">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Trafic organique</CardTitle>
                  <CardDescription>Évolution du trafic avec prédictions IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toLocaleString() : value,
                          name === 'organic_traffic' ? 'Trafic organique' : name
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="organic_traffic" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle>Conversions SEO</CardTitle>
                  <CardDescription>Impact des optimisations sur les conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Score SEO avec IA</CardTitle>
                <CardDescription>Évolution de votre score SEO avec optimisations automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Technical SEO Tab */}
          <TabsContent value="technical" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="warning">Attention</SelectItem>
                    <SelectItem value="fixed">Corrigés</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  {filteredIssues.filter(i => i.status === 'open').length} problèmes actifs
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const autoFixableIssues = filteredIssues.filter(i => i.autoFix && i.status === 'open')
                    autoFixableIssues.forEach(issue => handleAutoFix(issue.id))
                  }}
                  disabled={!autoOptimization}
                  className="hover-scale"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Correction auto
                </Button>
                <Button size="sm" className="hover-scale">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nouvel audit
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredIssues.map((issue, index) => (
                <Card 
                  key={issue.id} 
                  className={`hover-scale animate-fade-in ${
                    issue.type === 'critical' ? 'border-red-200 bg-red-50' :
                    issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          issue.type === 'critical' ? 'bg-red-100' :
                          issue.type === 'warning' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {issue.status === 'fixed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : issue.type === 'critical' ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{issue.affected} éléments affectés</span>
                            <span>Impact: {issue.impact}</span>
                            <span>Temps estimé: {issue.estimatedFix}</span>
                            {issue.autoFix && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                Auto-fix
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {issue.autoFix && issue.status === 'open' && autoOptimization && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAutoFix(issue.id)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Corriger
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="hover-scale">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* New Content AI Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Assistant Contenu IA
                </CardTitle>
                <CardDescription>
                  L'IA analyse votre contenu et propose des optimisations personnalisées
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
                                suggestion.priority === 'Critique' ? 'bg-red-500' :
                                suggestion.priority === 'Haute' ? 'bg-orange-500' :
                                'bg-blue-500'
                              } text-white`}>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-green-600 font-medium">{suggestion.estimatedTraffic}</span>
                              <span>Difficulté: {suggestion.difficulty}</span>
                            </div>
                          </div>
                          <AsyncButton 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            onClick={async () => {
                              // Simulate AI content generation
                              await new Promise(resolve => setTimeout(resolve, 2000));
                              // In real app: await generateContent(suggestion);
                            }}
                            icon={<Sparkles className="w-4 h-4" />}
                            loadingText="Génération..."
                            successMessage={`Contenu généré pour: ${suggestion.title}`}
                            data-testid="generate-content-button"
                          >
                            Générer
                          </AsyncButton>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            <div className="grid gap-6">
              {competitors.map((competitor, index) => (
                <Card key={index} className="hover-scale animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{competitor.name}</CardTitle>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        DR: {competitor.domain_rating}
                      </Badge>
                    </div>
                    <CardDescription>{competitor.domain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Mots-clés</p>
                        <p className="font-bold">{competitor.organic_keywords.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trafic</p>
                        <p className="font-bold">{competitor.traffic.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Backlinks</p>
                        <p className="font-bold">{competitor.backlinks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Opportunités</p>
                        <p className="font-bold text-green-600">{competitor.gapOpportunities}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {competitor.topKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="hover-scale">
                        <Target className="w-4 h-4 mr-2" />
                        Analyser gaps
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* New Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-500" />
                  Automations SEO
                </CardTitle>
                <CardDescription>
                  Configurez des automations pour optimiser continuellement votre SEO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Optimisation automatique des meta descriptions</h4>
                      <p className="text-sm text-muted-foreground">L'IA génère automatiquement des meta descriptions optimisées</p>
                    </div>
                    <Switch checked={autoOptimization} onCheckedChange={setAutoOptimization} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Surveillance des positions en temps réel</h4>
                      <p className="text-sm text-muted-foreground">Alertes automatiques en cas de chute de positions</p>
                    </div>
                    <Switch checked={realTimeMonitoring} onCheckedChange={setRealTimeMonitoring} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Génération automatique de contenu</h4>
                      <p className="text-sm text-muted-foreground">Création de nouveaux articles basés sur les tendances</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="text-lg">Rapport hebdomadaire</CardTitle>
                  <CardDescription>Synthèse complète des performances</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="text-lg">Analyse concurrentielle</CardTitle>
                  <CardDescription>Comparaison détaillée avec vos concurrents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Générer rapport
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="text-lg">Audit technique</CardTitle>
                  <CardDescription>Rapport complet des problèmes techniques</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Lancer audit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default SEOUltraProOptimized