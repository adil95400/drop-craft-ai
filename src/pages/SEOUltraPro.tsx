import { useState } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
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
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

const SEOUltraPro = () => {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [auditFilter, setAuditFilter] = useState('all')

  // Mock data for SEO metrics
  const seoMetrics = [
    {
      title: "Score SEO global",
      value: "78/100",
      change: "+5",
      icon: Target,
      color: "text-primary",
      trend: "up"
    },
    {
      title: "Mots-clés classés",
      value: "1,247",
      change: "+23",
      icon: Search,
      color: "text-green-600",
      trend: "up"
    },
    {
      title: "Trafic organique",
      value: "15.2K",
      change: "+12%",
      icon: TrendingUp,
      color: "text-blue-600",
      trend: "up"
    },
    {
      title: "Backlinks",
      value: "892",
      change: "+34",
      icon: Link,
      color: "text-purple-600",
      trend: "up"
    }
  ]

  // Mock data for keyword rankings
  const keywords = [
    {
      id: '1',
      keyword: 'e-commerce solution',
      position: 3,
      previousPosition: 5,
      volume: 2400,
      difficulty: 65,
      traffic: 450,
      url: '/solutions/ecommerce',
      intent: 'commercial'
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
      intent: 'informational'
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
      intent: 'commercial'
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
      intent: 'commercial'
    }
  ]

  // Mock data for SEO performance over time
  const performanceData = [
    { date: '01/01', organic_traffic: 12500, rankings: 890, score: 72 },
    { date: '02/01', organic_traffic: 13200, rankings: 920, score: 74 },
    { date: '03/01', organic_traffic: 12800, rankings: 945, score: 75 },
    { date: '04/01', organic_traffic: 14100, rankings: 980, score: 76 },
    { date: '05/01', organic_traffic: 15600, rankings: 1050, score: 77 },
    { date: '06/01', organic_traffic: 14800, rankings: 1120, score: 78 },
    { date: '07/01', organic_traffic: 16200, rankings: 1247, score: 78 }
  ]

  // Mock data for technical SEO audit
  const technicalIssues = [
    {
      id: '1',
      type: 'critical',
      title: 'Pages avec erreurs 404',
      description: '15 pages génèrent des erreurs 404',
      affected: 15,
      impact: 'Haute',
      status: 'open'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Images sans attribut alt',
      description: '47 images manquent de texte alternatif',
      affected: 47,
      impact: 'Moyenne',
      status: 'open'
    },
    {
      id: '3',
      type: 'info',
      title: 'Meta descriptions manquantes',
      description: '8 pages sans meta description',
      affected: 8,
      impact: 'Moyenne',
      status: 'fixed'
    },
    {
      id: '4',
      type: 'critical',
      title: 'Vitesse de chargement lente',
      description: 'Temps de chargement supérieur à 3s',
      affected: 23,
      impact: 'Haute',
      status: 'open'
    }
  ]

  // Mock data for competitor analysis
  const competitors = [
    {
      name: 'Shopify',
      domain: 'shopify.com',
      organic_keywords: 2850000,
      traffic: 45000000,
      domain_rating: 91,
      backlinks: 5600000
    },
    {
      name: 'WooCommerce',
      domain: 'woocommerce.com',
      organic_keywords: 890000,
      traffic: 12000000,
      domain_rating: 84,
      backlinks: 2100000
    },
    {
      name: 'BigCommerce',
      domain: 'bigcommerce.com',
      organic_keywords: 156000,
      traffic: 3200000,
      domain_rating: 78,
      backlinks: 890000
    }
  ]

  const filteredIssues = technicalIssues.filter(issue => {
    if (auditFilter === 'all') return true
    if (auditFilter === 'critical') return issue.type === 'critical'
    if (auditFilter === 'warning') return issue.type === 'warning'
    if (auditFilter === 'fixed') return issue.status === 'fixed'
    return true
  })

  const getPositionTrend = (current: number, previous: number) => {
    if (current < previous) return { color: 'text-green-600', icon: TrendingUp, change: `+${previous - current}` }
    if (current > previous) return { color: 'text-red-600', icon: TrendingUp, change: `-${current - previous}` }
    return { color: 'text-muted-foreground', icon: TrendingUp, change: '0' }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-background/80">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  SEO Ultra Pro
                </h1>
                <p className="text-muted-foreground mt-1">
                  Optimisez votre référencement et analysez vos performances
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Audit
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Rapport
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {seoMetrics.map((metric, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{metric.value}</p>
                          <Badge variant="secondary" className="text-xs">
                            {metric.change}
                          </Badge>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-primary/10`}>
                        <metric.icon className={`w-6 h-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="keywords" className="space-y-6">
              <TabsList className="grid w-full lg:w-[600px] grid-cols-6">
                <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="technical">Technique</TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="competitors">Concurrence</TabsTrigger>
                <TabsTrigger value="reports">Rapports</TabsTrigger>
              </TabsList>

              {/* Keywords Tab */}
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
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    Ajouter mot-clé
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Suivi des positions</CardTitle>
                    <CardDescription>Performances de vos mots-clés principaux</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {keywords.map((keyword) => {
                        const trend = getPositionTrend(keyword.position, keyword.previousPosition)
                        return (
                          <div
                            key={keyword.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedKeyword === keyword.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedKeyword(keyword.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">{keyword.keyword}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {keyword.intent}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{keyword.url}</p>
                                <div className="grid grid-cols-5 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Position</p>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-lg">#{keyword.position}</p>
                                      <div className={`flex items-center gap-1 ${trend.color}`}>
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
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <ExternalLink className="w-4 h-4" />
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

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trafic organique</CardTitle>
                      <CardDescription>Évolution du trafic depuis les moteurs de recherche</CardDescription>
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Mots-clés classés</CardTitle>
                      <CardDescription>Nombre de mots-clés dans les résultats de recherche</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="rankings" stroke="#06b6d4" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Score SEO</CardTitle>
                    <CardDescription>Évolution de votre score SEO global</CardDescription>
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

              {/* Technical SEO Tab */}
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
                  </div>
                  <Button>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nouveau scan
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit technique</CardTitle>
                    <CardDescription>Problèmes SEO détectés sur votre site</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredIssues.map((issue) => (
                      <div key={issue.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              issue.type === 'critical' ? 'bg-red-100 text-red-600' :
                              issue.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {issue.type === 'critical' ? <XCircle className="w-4 h-4" /> :
                               issue.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                               <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{issue.title}</h4>
                                <Badge variant={issue.status === 'fixed' ? 'default' : 'secondary'}>
                                  {issue.status === 'fixed' ? 'Corrigé' : 'Ouvert'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Pages affectées: <strong>{issue.affected}</strong></span>
                                <span>Impact: <strong>{issue.impact}</strong></span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Corriger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Optimization Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimisation de contenu</CardTitle>
                    <CardDescription>Améliorez le SEO de vos pages importantes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="page-url">URL de la page</Label>
                          <Input id="page-url" placeholder="https://votre-site.com/page" />
                        </div>

                        <div>
                          <Label htmlFor="target-keyword">Mot-clé cible</Label>
                          <Input id="target-keyword" placeholder="Ex: solution e-commerce" />
                        </div>

                        <div>
                          <Label htmlFor="page-title">Titre de la page (Title)</Label>
                          <Input id="page-title" placeholder="Titre optimisé SEO" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Recommandé: 50-60 caractères</span>
                            <span>0/60</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="meta-desc">Meta description</Label>
                          <Textarea 
                            id="meta-desc" 
                            placeholder="Description optimisée pour les résultats de recherche"
                            rows={3}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Recommandé: 150-160 caractères</span>
                            <span>0/160</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Score d'optimisation</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Progress value={72} className="flex-1" />
                            <span className="text-sm font-medium">72/100</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium">Vérifications SEO</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm">Mot-clé dans le titre</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm">Meta description présente</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm">Densité de mot-clé faible</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm">Balise H1 manquante</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Recommandations</Label>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <p>• Ajouter une balise H1 avec le mot-clé cible</p>
                            <p>• Augmenter la densité du mot-clé (1-2%)</p>
                            <p>• Ajouter des variantes du mot-clé principal</p>
                            <p>• Optimiser les balises d'images (alt text)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyser la page
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser SERP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Competitors Tab */}
              <TabsContent value="competitors" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse concurrentielle</CardTitle>
                    <CardDescription>Comparez votre performance SEO avec vos concurrents</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {competitors.map((competitor, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{competitor.name}</h3>
                            <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Mots-clés organiques</p>
                            <p className="font-medium">{competitor.organic_keywords.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Trafic mensuel</p>
                            <p className="font-medium">{competitor.traffic.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Domain Rating</p>
                            <div className="flex items-center gap-2">
                              <Progress value={competitor.domain_rating} className="w-16 h-2" />
                              <span className="font-medium">{competitor.domain_rating}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Backlinks</p>
                            <p className="font-medium">{competitor.backlinks.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rapports automatiques</CardTitle>
                      <CardDescription>Configurez vos rapports SEO périodiques</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Rapport hebdomadaire</p>
                            <p className="text-sm text-muted-foreground">Performances et classements</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Rapport mensuel</p>
                            <p className="text-sm text-muted-foreground">Analyse complète et recommandations</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Alertes de position</p>
                            <p className="text-sm text-muted-foreground">Changements significatifs de classement</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Génération de rapport</CardTitle>
                      <CardDescription>Créez un rapport personnalisé</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="report-period">Période</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une période" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Cette semaine</SelectItem>
                            <SelectItem value="month">Ce mois</SelectItem>
                            <SelectItem value="quarter">Ce trimestre</SelectItem>
                            <SelectItem value="year">Cette année</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Sections à inclure</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="keywords-section" defaultChecked />
                            <Label htmlFor="keywords-section">Mots-clés et positions</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="traffic-section" defaultChecked />
                            <Label htmlFor="traffic-section">Trafic organique</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="technical-section" />
                            <Label htmlFor="technical-section">Audit technique</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="competitors-section" />
                            <Label htmlFor="competitors-section">Analyse concurrentielle</Label>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Générer le rapport
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default SEOUltraPro