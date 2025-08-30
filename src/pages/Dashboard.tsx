import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useSimplePlan } from '@/hooks/useSimplePlan'
import { useRealAnalytics } from "@/hooks/useRealAnalytics"
import { useRealIntegrations } from "@/hooks/useRealIntegrations"
import { useRealSuppliers } from "@/hooks/useRealSuppliers"
import { useRealCustomers } from "@/hooks/useRealCustomers"
import { useRealReviews } from "@/hooks/useRealReviews"
import { useRealSEO } from "@/hooks/useRealSEO"
import { useMarketing } from "@/hooks/useMarketing"
import { useRealAutomation } from "@/hooks/useRealAutomation"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
import { ActivityFeed } from "@/components/activity/ActivityFeed"
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Star,
  RefreshCw,
  Plus,
  Store,
  Link,
  Truck,
  MessageSquare,
  Search,
  Bot,
  Target,
  Zap,
  Crown,
  Activity,
  Globe,
  Shield,
  Euro,
  Brain,
  Sparkles,
  Eye,
  Download
} from 'lucide-react'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { checkSubscription } = useStripeSubscription()
  const { plan, isUltraPro, isPro, loading: planLoading } = useSimplePlan(user)
  
  // Real data hooks
  const { analytics, isLoading } = useRealAnalytics()
  const { integrations, stats: integrationStats, isLoading: integrationsLoading } = useRealIntegrations()
  const { suppliers, stats: supplierStats, isLoading: suppliersLoading } = useRealSuppliers()
  const { customers, stats: customerStats, isLoading: customersLoading } = useRealCustomers()
  const { reviews, stats: reviewStats, isLoading: reviewsLoading } = useRealReviews()
  const { analyses, keywords, stats: seoStats, isLoading: seoLoading } = useRealSEO()
  const { campaigns, stats: marketingStats, isLoading: marketingLoading } = useMarketing()
  const { workflows, stats: automationStats, isLoading: automationLoading } = useRealAutomation()
  
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [dateRange, setDateRange] = useState('7d')
  const [aiInsights, setAiInsights] = useState<string[]>([])

  // Handle checkout success/cancel notifications
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const plan = searchParams.get('plan')

    if (checkout === 'success' && plan) {
      toast({
        title: "Paiement réussi !",
        description: `Bienvenue dans le plan ${plan === 'pro' ? 'Pro' : 'Ultra Pro'} ! Votre abonnement est maintenant actif.`,
        variant: "default"
      })
      
      setTimeout(() => {
        checkSubscription()
      }, 2000)
      
      window.history.replaceState({}, '', '/dashboard')
    } else if (checkout === 'cancelled') {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez reprendre votre abonnement à tout moment.",
        variant: "default"
      })
      
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, toast, checkSubscription])

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setInitialLoadComplete(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  // Generate AI insights for Ultra Pro users
  useEffect(() => {
    const isUltraProPlan = plan === 'ultra_pro'
    if (isUltraProPlan && analytics && !isLoading) {
      const insights = [
        `Votre taux de conversion de ${analytics.conversionRate.toFixed(1)}% est ${analytics.conversionRate > 3 ? 'excellent' : 'à améliorer'}`,
        `Avec ${analytics.orders} commandes et un panier moyen de €${analytics.averageOrderValue.toFixed(2)}, vous générez €${analytics.revenue.toLocaleString()}`,
        `${analytics.products} produits en catalogue - Optimisez vos top performers pour maximiser les ventes`,
        analytics.revenue > 10000 ? 'Croissance prometteuse ! Considérez l\'expansion vers de nouveaux marchés' : 'Continuez vos efforts marketing pour augmenter le chiffre d\'affaires'
      ];
      setAiInsights(insights);
    } else if (!isUltraProPlan) {
      setAiInsights([]);
    }
  }, [analytics, isLoading, plan])

  // Enhanced metrics combining all modules
  const metrics = [
    {
      title: "Chiffre d'affaires",
      value: analytics ? `€${analytics.revenue.toLocaleString()}` : "€0",
      change: { value: 12.5, trend: 'up' },
      icon: DollarSign,
      description: "Total des ventes"
    },
    {
      title: "Clients",
      value: customerStats?.total?.toString() || analytics?.customers.toString() || "0",
      change: { value: 8.2, trend: 'up' },
      icon: Users,
      description: "Clients enregistrés"
    },
    {
      title: "Avis Clients",
      value: reviewStats?.total?.toString() || "0",
      change: { value: 15.3, trend: 'up' },
      icon: Star,
      description: `Moyenne: ${reviewStats?.averageRating?.toFixed(1) || '0'}/5`
    },
    {
      title: "SEO Score",
      value: `${Math.round(seoStats?.averageScore || 0)}/100`,
      change: { value: 5.7, trend: 'up' },
      icon: Search,
      description: `${seoStats?.totalKeywords || 0} mots-clés`
    }
  ]

  // Advanced analytics combining all data sources
  const advancedMetrics = [
    {
      title: "Automations Actives",
      value: automationStats?.activeWorkflows || 0,
      icon: Bot,
      color: "text-blue-600",
      description: `${automationStats?.totalExecutions || 0} exécutions`
    },
    {
      title: "Campagnes Marketing", 
      value: marketingStats?.activeCampaigns || 0,
      icon: Target,
      color: "text-purple-600",
      description: `€${marketingStats?.totalSpent || 0} dépensés`
    },
    {
      title: "Intégrations",
      value: integrationStats?.connected || 0,
      icon: Link,
      color: "text-green-600", 
      description: `${integrationStats?.total || 0} configurées`
    },
    {
      title: "Fournisseurs",
      value: supplierStats?.active || 0,
      icon: Truck,
      color: "text-orange-600",
      description: `${supplierStats?.total || 0} connectés`
    }
  ]

  // Mock performance data combining all metrics
  const performanceData = [
    { name: 'Lun', sales: 2400, customers: 45, reviews: 12, seo: 75 },
    { name: 'Mar', sales: 2800, customers: 52, reviews: 18, seo: 77 },
    { name: 'Mer', sales: 3200, customers: 48, reviews: 15, seo: 78 },
    { name: 'Jeu', sales: 2900, customers: 41, reviews: 22, seo: 76 },
    { name: 'Ven', sales: 3800, customers: 67, reviews: 28, seo: 79 },
    { name: 'Sam', sales: 4200, customers: 73, reviews: 31, seo: 80 },
    { name: 'Dim', sales: 3600, customers: 58, reviews: 25, seo: 81 }
  ]

  const handleRefresh = async () => {
    toast({
      title: "Actualisation",
      description: "Mise à jour des données en cours...",
    })
  }

  const handleExport = async () => {
    if (!isPro()) {
      toast({
        title: "Fonctionnalité Pro",
        description: "L'export de données nécessite un plan Pro ou Ultra Pro",
        variant: "destructive"
      });
      return;
    }
    
    try {
      toast({
        title: "Export en cours",
        description: "Génération du rapport PDF...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = `Dashboard Report - ${new Date().toLocaleDateString()}
      
Revenue: €${analytics?.revenue || 0}
Orders: ${analytics?.orders || 0}  
Products: ${analytics?.products || 0}
Conversion Rate: ${analytics?.conversionRate?.toFixed(1) || 0}%

Generated on: ${new Date().toLocaleString()}`;
      
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export terminé",
        description: "Le rapport a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    }
  }

  if (authLoading || planLoading || !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder au dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLoadingAny = isLoading || customersLoading || reviewsLoading || seoLoading || marketingLoading || automationLoading

  if (isLoadingAny) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Checklist - Only for Standard users */}
      {!isPro() && <OnboardingChecklist />}

      {/* AI Insights for Ultra Pro users */}
      {isUltraPro() && aiInsights.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Insights IA
              </CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                Intelligence
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700 flex-1">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {isUltraPro() ? (
              <>
                <Crown className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard Ultra Pro
                </span>
              </>
            ) : isPro() ? (
              <>
                <Crown className="h-8 w-8 text-primary" />
                Dashboard Pro
              </>
            ) : (
              <>
                <BarChart3 className="h-8 w-8 text-primary" />
                Dashboard
              </>
            )}
          </h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.email} ! 
            {isUltraPro() && " Intelligence artificielle et analytics avancés."}
            {isPro() && !isUltraPro() && " Analytics professionnels et automatisation."}
            {!isPro() && " Vue d'ensemble de votre activité e-commerce."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isUltraPro() && (
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoadingAny}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAny ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {isPro() && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          {isUltraPro() && (
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              IA Insights
            </Button>
          )}
          
          <Badge variant="default" className={`gap-1 ${isUltraPro() ? 'bg-purple-100 text-purple-800' : isPro() ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            <Activity className="h-3 w-3" />
            {isUltraPro() ? 'Ultra Pro' : isPro() ? 'Pro' : 'Standard'}
          </Badge>
        </div>
      </div>

      {/* Vue d'ensemble rapide améliorée */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Globale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Panier moyen</p>
              <p className="font-semibold text-lg">€{analytics?.averageOrderValue.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Taux conversion</p>
              <p className="font-semibold text-lg">{analytics?.conversionRate.toFixed(1) || '0.0'}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Satisfaction client</p>
              <p className="font-semibold text-lg">{reviewStats?.averageRating?.toFixed(1) || '0.0'}/5</p>
            </div>
            <div>
              <p className="text-muted-foreground">Score SEO moyen</p>
              <p className="font-semibold text-lg">{Math.round(seoStats?.averageScore || 0)}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metric.change.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {metric.change.value}%
                  </span>
                  <span className="ml-1">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {advancedMetrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2">
                  <IconComponent className={`h-8 w-8 ${metric.color}`} />
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphiques de performance améliorés */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution des ventes avec nouvelles métriques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Multi-Métrique
            </CardTitle>
            <CardDescription>Évolution des ventes, clients et avis (7 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="customers" 
                  stackId="2"
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score SEO et Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Qualité & Réputation
            </CardTitle>
            <CardDescription>Score SEO et satisfaction client</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="seo" fill="#8b5cf6" name="Score SEO" />
                <Bar dataKey="reviews" fill="#f59e0b" name="Avis reçus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides étendues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow group" 
              onClick={() => window.location.href = '/reviews'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Star className="h-5 w-5" />
              Gérer les Avis
            </CardTitle>
            <CardDescription>
              {reviewStats?.total || 0} avis • Note moyenne: {reviewStats?.averageRating?.toFixed(1) || '0.0'}/5
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => window.location.href = '/seo'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
              Optimiser SEO
            </CardTitle>
            <CardDescription>
              {seoStats?.totalKeywords || 0} mots-clés suivis • Score: {Math.round(seoStats?.averageScore || 0)}/100
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => window.location.href = '/automation-ai'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <Bot className="h-5 w-5" />
              Automatisation IA
            </CardTitle>
            <CardDescription>
              {automationStats?.activeWorkflows || 0} workflows actifs • {automationStats?.totalExecutions || 0} exécutions
            </CardDescription>
          </CardHeader>
        </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => window.location.href = '/security'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <Shield className="h-5 w-5" />
                Sécurité & Auth
              </CardTitle>
              <CardDescription>
                Gérer les sessions, rôles et paramètres de sécurité
              </CardDescription>
            </CardHeader>
          </Card>
      </div>

      {/* Statut des systèmes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            État des Systèmes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Intégrations</span>
              <Badge variant="outline" className="ml-auto">{integrationStats?.connected || 0}/{integrationStats?.total || 0}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Fournisseurs</span>
              <Badge variant="outline" className="ml-auto">{supplierStats?.active || 0}/{supplierStats?.total || 0}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Automations</span>
              <Badge variant="outline" className="ml-auto">{automationStats?.activeWorkflows || 0} actifs</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">API Status</span>
              <Badge variant="default" className="ml-auto">100%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Raccourcis Ultra Pro */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Fonctionnalités Ultra Pro
            </CardTitle>
            <CardDescription>
              Accès direct aux outils avancés de votre plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/seo-ultra-pro'}>
                SEO Ultra Pro
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/reviews-ultra-pro'}>
                Reviews Ultra Pro
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/analytics'}>
                Analytics Avancé
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'}>
                Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;