import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useProductionData } from '@/hooks/useProductionData'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { DashboardMetric, MetricsGrid } from '@/components/dashboard/DashboardMetrics'
import { AIInsightsSection } from '@/components/dashboard/AIInsightCard'
import { ConnectedStores } from '@/components/dashboard/ConnectedStores'
import { 
  Package, Users, ShoppingCart, DollarSign, TrendingUp,
  Activity, Target, Zap, RefreshCw, Crown, Bell,
  CheckCircle2, AlertTriangle, Star, Rocket, Brain,
  MessageSquare, PieChart as PieChartIcon, LineChart as LineChartIcon,
  ArrowUpRight, Sparkles, Store, Settings, HelpCircle
} from 'lucide-react'
import { AreaChart, Area, PieChart as RechartsPieChart, Cell, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PriceOptimizationResults } from './PriceOptimizationResults'

export default function OptimizedClientDashboard() {
  const { dashboardStats, orders, customers, products, seedDatabase, isSeeding } = useProductionData()
  const { user, profile, isAdmin } = useUnifiedSystem()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('overview')
  const [showPriceOptimization, setShowPriceOptimization] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Métriques calculées
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
  const totalOrders = orders?.length || 0
  const totalCustomers = customers?.length || 0
  const totalProducts = products?.length || 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0

  // Données graphiques optimisées
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      fullDate: date.toISOString().split('T')[0]
    }
  })

  const revenueData = last7Days.map(day => {
    const dayOrders = orders?.filter(order => 
      order.created_at?.split('T')[0] === day.fullDate
    ) || []
    const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    return {
      date: day.date,
      revenue: dayRevenue,
      orders: dayOrders.length,
      customers: new Set(dayOrders.map(o => o.customer_id)).size
    }
  })

  // Données pour graphique en secteurs
  const categoryData = [
    { name: 'Electronics', value: 35, color: '#8b5cf6' },
    { name: 'Fashion', value: 28, color: '#06b6d4' },
    { name: 'Home & Garden', value: 22, color: '#10b981' },
    { name: 'Sports', value: 15, color: '#f59e0b' }
  ]

  // Métriques principales avec animations
  const mainMetrics = [
    {
      title: "Chiffre d'Affaires",
      value: formatCurrency(totalRevenue),
      change: 15.3,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      trend: "up" as const,
      description: "Total des ventes"
    },
    {
      title: "Commandes",
      value: totalOrders.toString(),
      change: 12.8,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-600",
      trend: "up" as const,
      description: "Nouvelles commandes"
    },
    {
      title: "Clients Actifs",
      value: totalCustomers.toString(),
      change: 8.4,
      icon: Users,
      gradient: "from-purple-500 to-pink-600",
      trend: "up" as const,
      description: "Base clients"
    },
    {
      title: "Taux de Conversion",
      value: `${conversionRate.toFixed(1)}%`,
      change: 5.2,
      icon: Target,
      gradient: "from-orange-500 to-red-600",
      trend: "up" as const,
      description: "Performance conversion"
    }
  ] as const

  // Suggestions AI pour ShopOpti+ avec fonctionnalités complètes
  const aiInsights = [
    {
      title: "Optimisation des Prix",
      description: "Augmentez vos marges de 18% en ajustant 12 produits",
      impact: "high" as const,
      estimated: "+2,340€/mois",
      type: "optimization" as const,
      onApply: async () => {
        console.log("🚀 Bouton Optimisation des prix cliqué!");
        
        toast.loading("Analyse des prix en cours...", { id: 'price-analysis' });
        
        // Simuler l'analyse IA des prix
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success("Analyse terminée ! Affichage des résultats.", { 
          id: 'price-analysis', 
          duration: 2000 
        });
        
        // Ouvrir la modal avec les résultats détaillés
        setShowPriceOptimization(true);
      }
    },
    {
      title: "Stock Alert",
      description: "5 produits populaires bientôt en rupture",
      impact: "medium" as const,
      estimated: "Éviter -1,200€ de perte",
      type: "alert" as const,
      onApply: async () => {
        console.log("📦 Bouton Alerte stock cliqué!");
        try {
          alert("Test: Bouton d'alerte stock cliqué!");
          
          toast.loading("Traitement des alertes de stock...", { 
            id: 'stock-alert',
            duration: Infinity
          });
          
          // Simuler le traitement des alertes stock
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const lowStockProducts = [
            { name: "Smartphone XY", stock: 2, recommended: 25 },
            { name: "Casque Audio", stock: 1, recommended: 15 },
            { name: "Montre Connect", stock: 3, recommended: 20 }
          ];
          
          toast.success(
            `✅ Alertes traitées ! ${lowStockProducts.length} produits identifiés. Commandes automatiques programmées.`, 
            { id: 'stock-alert', duration: 4000 }
          );
          
          setTimeout(() => navigate("/products?view=inventory"), 1000);
        } catch (error) {
          console.error("❌ Erreur alertes stock:", error);
          toast.error("Erreur lors du traitement des alertes", { id: 'stock-alert' });
        }
      }
    },
    {
      title: "Recommandations Clients",
      description: "Personnalisez 89% de vos recommandations produits",
      impact: "high" as const,
      estimated: "+35% conversion",
      type: "recommendation" as const,
      onApply: async () => {
        console.log("🎯 Bouton Recommandations clients cliqué!");
        try {
          alert("Test: Bouton de recommandations clients cliqué!");
          
          toast.loading("Activation du système de recommandations...", { 
            id: 'recommendations',
            duration: Infinity
          });
          
          // Simuler l'activation du système de recommandations
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // Simulation des résultats
          const optimizationResults = {
            customersAnalyzed: 1247,
            recommendationsGenerated: 3891,
            expectedConversionIncrease: 35,
            segmentsCreated: 8
          };
          
          toast.success(
            `✅ Système activé ! ${optimizationResults.customersAnalyzed} clients analysés, +${optimizationResults.expectedConversionIncrease}% de conversion attendue.`, 
            { id: 'recommendations', duration: 4000 }
          );
          
          setTimeout(() => navigate("/customers?view=segments"), 1000);
        } catch (error) {
          console.error("❌ Erreur recommandations:", error);
          toast.error("Erreur lors de l'activation du système", { id: 'recommendations' });
        }
      }
    }
  ]

  // Actions rapides optimisées avec navigation
  const quickActions = [
    { 
      title: "Nouveau Produit", 
      icon: Package, 
      color: "bg-gradient-to-r from-blue-500 to-blue-600", 
      action: () => navigate("/products?action=add")
    },
    { 
      title: "Gérer Commandes", 
      icon: ShoppingCart, 
      color: "bg-gradient-to-r from-green-500 to-green-600", 
      action: () => navigate("/orders")
    },
    { 
      title: "Analytics AI", 
      icon: Brain, 
      color: "bg-gradient-to-r from-purple-500 to-purple-600", 
      action: () => navigate("/analytics")
    },
    { 
      title: "Support Client", 
      icon: MessageSquare, 
      color: "bg-gradient-to-r from-orange-500 to-orange-600", 
      action: () => navigate("/customers")
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header moderne avec bienvenue */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-3xl">👋</span>
                Bonjour, {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Voici votre tableau de bord ShopOpti+ optimisé
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Ultra Pro
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/settings')}
                className="hover-scale"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => seedDatabase()}
                disabled={isSeeding}
                className="hover-scale"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSeeding ? 'animate-spin' : ''}`} />
                {isSeeding ? 'Génération...' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </div>

        {/* Métriques principales avec design moderne */}
        <MetricsGrid className="animate-fade-in">
          {mainMetrics.map((metric, index) => (
            <DashboardMetric
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              gradient={metric.gradient}
              trend={metric.trend}
              description={metric.description}
            />
          ))}
        </MetricsGrid>

        {/* Suggestions AI ShopOpti+ */}
        <AIInsightsSection 
          insights={aiInsights}
        />

        {/* Boutiques Connectées */}
        <ConnectedStores className="animate-fade-in" />

        {/* Graphiques et Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Graphique de revenus */}
          <Card className="border-0 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-500" />
                Évolution du Chiffre d'Affaires
              </CardTitle>
              <CardDescription>Performance des 7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{`${label}`}</p>
                            <p className="text-blue-600">
                              {`Revenus: ${formatCurrency(payload[0].value as number)}`}
                            </p>
                            <p className="text-green-600">
                              {`Commandes: ${payload[0].payload.orders}`}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Graphique répartition par catégorie */}
          <Card className="border-0 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-purple-500" />
                Répartition par Catégorie
              </CardTitle>
              <CardDescription>Distribution des ventes par secteur</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Pourcentage']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides et tableaux de bord */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Actions rapides */}
          <Card className="border-0 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-12 hover-scale"
                      onClick={action.action}
                    >
                      <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mr-3`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {action.title}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performances récentes */}
          <Card className="border-0 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Panier Moyen</span>
                  <span className="font-semibold">{formatCurrency(avgOrderValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux Conversion</span>
                  <span className="font-semibold text-green-600">{conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Score Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">4.8/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Croissance</span>
                  <span className="font-semibold text-green-600">+23.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes et notifications */}
          <Card className="border-0 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-sm">Stock Critique</span>
                  </div>
                  <p className="text-xs text-red-700">3 produits en rupture imminente</p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Objectif Atteint</span>
                  </div>
                  <p className="text-xs text-green-700">CA mensuel dépassé de 12%</p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Nouvelle Fonctionnalité</span>
                  </div>
                  <p className="text-xs text-blue-700">AI Pricing disponible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal d'optimisation des prix */}
        <PriceOptimizationResults
          isOpen={showPriceOptimization}
          onClose={() => setShowPriceOptimization(false)}
          onApplyAll={async () => {
            toast.loading("Application de toutes les optimisations...", { id: 'apply-all' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            toast.success("✅ Toutes les optimisations appliquées ! Gain total: +4,990€/mois", { 
              id: 'apply-all', 
              duration: 4000 
            });
            setShowPriceOptimization(false);
            setTimeout(() => navigate("/products"), 1000);
          }}
          onApplyProduct={async (productId: string) => {
            toast.loading("Application de l'optimisation...", { id: `apply-${productId}` });
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("✅ Optimisation appliquée pour ce produit !", { 
              id: `apply-${productId}`, 
              duration: 3000 
            });
          }}
        />

      </div>
    </div>
  )
}