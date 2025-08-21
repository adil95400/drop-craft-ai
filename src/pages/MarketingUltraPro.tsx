import { useState } from 'react'
import { Megaphone, Mail, MessageSquare, Users, Target, BarChart3, Zap, Calendar, Bot, Globe, Smartphone, TrendingUp, Eye, MousePointer, Heart, Share2, Filter, Download, Plus, Play, Pause, Edit, Trash2, MoreHorizontal, Award, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

import { useRealMarketing } from '@/hooks/useRealMarketing'
import { UnifiedMarketingHub } from '@/components/marketing/UnifiedMarketingHub'
import { AIMarketingOptimizer } from '@/components/marketing/AIMarketingOptimizer'
import { RealTimePerformanceTracker } from '@/components/marketing/RealTimePerformanceTracker'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'social' | 'ads'
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpa: number
  roas: number
  start_date: string
  end_date: string
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Black Friday Email Campaign',
    type: 'email',
    status: 'active',
    budget: 2500,
    spent: 1890,
    impressions: 45600,
    clicks: 2280,
    conversions: 156,
    ctr: 5.2,
    cpa: 12.11,
    roas: 4.8,
    start_date: '2024-01-10',
    end_date: '2024-01-25'
  },
  {
    id: '2',
    name: 'Google Ads - Écouteurs',
    type: 'ads',
    status: 'active',
    budget: 5000,
    spent: 3420,
    impressions: 123000,
    clicks: 3690,
    conversions: 89,
    ctr: 3.0,
    cpa: 38.43,
    roas: 3.2,
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  },
  {
    id: '3',
    name: 'Instagram Influenceurs',
    type: 'social',
    status: 'completed',
    budget: 3000,
    spent: 3000,
    impressions: 78900,
    clicks: 1578,
    conversions: 67,
    ctr: 2.0,
    cpa: 44.78,
    roas: 2.9,
    start_date: '2024-01-05',
    end_date: '2024-01-15'
  }
]

const performanceData = [
  { name: 'Jan', impressions: 89000, clicks: 3200, conversions: 245, revenue: 18900 },
  { name: 'Fév', impressions: 92000, clicks: 3450, conversions: 267, revenue: 21200 },
  { name: 'Mar', impressions: 87000, clicks: 3100, conversions: 234, revenue: 19800 },
  { name: 'Avr', impressions: 98000, clicks: 3890, conversions: 298, revenue: 24500 },
  { name: 'Mai', impressions: 105000, clicks: 4200, conversions: 334, revenue: 27800 },
  { name: 'Jun', impressions: 112000, clicks: 4680, conversions: 378, revenue: 31200 }
]

const channelData = [
  { name: 'Email', budget: 8500, spent: 7200, roas: 5.2, color: '#22c55e' },
  { name: 'Google Ads', budget: 15000, spent: 12800, roas: 3.8, color: '#3b82f6' },
  { name: 'Facebook', budget: 10000, spent: 8900, roas: 4.1, color: '#8b5cf6' },
  { name: 'Instagram', budget: 6000, spent: 5400, roas: 3.2, color: '#f59e0b' },
  { name: 'TikTok', budget: 4000, spent: 3200, roas: 2.9, color: '#ef4444' }
]

const audienceSegments = [
  { name: 'Nouveaux Visiteurs', size: 12800, engagement: 68, conversion: 2.3 },
  { name: 'Clients Existants', size: 4200, engagement: 89, conversion: 12.8 },
  { name: 'Abandons Panier', size: 2890, engagement: 76, conversion: 8.4 },
  { name: 'VIP/Premium', size: 1560, engagement: 94, conversion: 18.6 },
  { name: 'Réactivation', size: 3400, engagement: 54, conversion: 5.2 }
]

export default function MarketingUltraPro() {
  const [showRealDashboard, setShowRealDashboard] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'optimizer' | 'tracker'>('dashboard')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const { 
    campaigns: realCampaigns, 
    isLoadingCampaigns,
    createEmailCampaign,
    createGoogleAdsCampaign,
    connectMailchimp,
    isCreatingEmailCampaign
  } = useRealMarketing()

  // Use real campaigns if available, otherwise fallback to mock data
  const campaignsToUse = realCampaigns.length > 0 ? realCampaigns : mockCampaigns
  
  // Show real dashboard if we have real data
  if (showRealDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center p-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Marketing Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Suite marketing IA complète avec optimisation temps réel
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={activeView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveView('dashboard')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={activeView === 'optimizer' ? 'default' : 'outline'}
              onClick={() => setActiveView('optimizer')}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              IA Optimizer
            </Button>
            <Button 
              variant={activeView === 'tracker' ? 'default' : 'outline'}
              onClick={() => setActiveView('tracker')}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Live Tracker
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowRealDashboard(false)}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Version Classique
            </Button>
          </div>
        </div>
        
        {activeView === 'dashboard' && <UnifiedMarketingHub />}
        {activeView === 'optimizer' && <AIMarketingOptimizer />}
        {activeView === 'tracker' && <RealTimePerformanceTracker />}
      </div>
    )
  }
  
  const totalStats = {
    totalBudget: campaignsToUse.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpent: campaignsToUse.reduce((sum, c) => sum + (c.spent || 0), 0),
    totalImpressions: campaignsToUse.reduce((sum, c) => sum + (c.impressions || 0), 0),
    totalClicks: campaignsToUse.reduce((sum, c) => sum + (c.clicks || 0), 0),
    totalConversions: campaignsToUse.reduce((sum, c) => sum + (c.conversions || 0), 0),
    avgCTR: campaignsToUse.length > 0 ? campaignsToUse.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaignsToUse.length : 0,
    avgROAS: campaignsToUse.length > 0 ? campaignsToUse.reduce((sum, c) => sum + (c.roas || 0), 0) / campaignsToUse.length : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'social': return <Share2 className="h-4 w-4" />
      case 'ads': return <Target className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header avec Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Marketing Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Automation avancée et attribution multi-touch pour vos campagnes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              IA Optimisation
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Rapport
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600">
                  <Plus className="h-4 w-4" />
                  Nouvelle Campagne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une Nouvelle Campagne</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 p-4">
                  <Button className="h-24 flex-col gap-2 border-2 border-dashed">
                    <Mail className="h-8 w-8" />
                    <span>Email Marketing</span>
                  </Button>
                  <Button className="h-24 flex-col gap-2 border-2 border-dashed">
                    <Target className="h-8 w-8" />
                    <span>Google Ads</span>
                  </Button>
                  <Button className="h-24 flex-col gap-2 border-2 border-dashed">
                    <Share2 className="h-8 w-8" />
                    <span>Réseaux Sociaux</span>
                  </Button>
                  <Button className="h-24 flex-col gap-2 border-2 border-dashed">
                    <MessageSquare className="h-8 w-8" />
                    <span>SMS Marketing</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Budget Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">Alloué ce mois</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                Dépensé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalStats.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {((totalStats.totalSpent / totalStats.totalBudget) * 100).toFixed(1)}% utilisé
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalStats.totalImpressions / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Vues générées</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-orange-500" />
                Clics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">CTR: {totalStats.avgCTR.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalConversions}</div>
              <p className="text-xs text-muted-foreground">
                {((totalStats.totalConversions / totalStats.totalClicks) * 100).toFixed(1)}% conv.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                ROAS Moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.avgROAS.toFixed(1)}x</div>
              <p className="text-xs text-muted-foreground">Retour sur invest.</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-pink-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStats.avgROAS >= 4 ? 'Excellent' : 
                 totalStats.avgROAS >= 3 ? 'Bon' : 
                 totalStats.avgROAS >= 2 ? 'Moyen' : 'Faible'}
              </div>
              <p className="text-xs text-muted-foreground">Score global</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Target className="h-4 w-4" />
              Campagnes
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Globe className="h-4 w-4" />
              Canaux
            </TabsTrigger>
            <TabsTrigger value="audience" className="gap-2">
              <Users className="h-4 w-4" />
              Audiences
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Bot className="h-4 w-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="attribution" className="gap-2">
              <Zap className="h-4 w-4" />
              Attribution
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance dans le temps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Marketing
                  </CardTitle>
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
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        name="Revenus"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="conversions" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.2}
                        name="Conversions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* ROI par Canal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    ROI par Canal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={channelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="roas" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Insights IA */}
            <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Bot className="h-5 w-5" />
                  Recommandations IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <Award className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Budget Optimisation</p>
                      <p className="text-sm text-muted-foreground">+23% ROAS potentiel sur Email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Audience Expansion</p>
                      <p className="text-sm text-muted-foreground">Nouveau segment détecté</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-medium">Timing Optimal</p>
                      <p className="text-sm text-muted-foreground">Jeudi 14h = +18% CTR</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des Campagnes */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* Filtres et Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtres & Actions
                  </span>
                  {selectedCampaigns.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedCampaigns.length} sélectionnées</Badge>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Activer
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pauser
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actives</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="ads">Publicités</SelectItem>
                      <SelectItem value="social">Réseaux sociaux</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des Campagnes */}
            <div className="space-y-4">
              {mockCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={selectedCampaigns.includes(campaign.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCampaigns([...selectedCampaigns, campaign.id])
                              } else {
                                setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaign.id))
                              }
                            }}
                          />
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getTypeIcon(campaign.type)}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status === 'active' && 'Active'}
                              {campaign.status === 'paused' && 'En pause'}
                              {campaign.status === 'completed' && 'Terminée'}
                              {campaign.status === 'draft' && 'Brouillon'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(campaign.start_date).toLocaleDateString('fr-FR')} - 
                              {new Date(campaign.end_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Play className="h-4 w-4" />
                            Démarrer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pause className="h-4 w-4" />
                            Mettre en pause
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Métriques de Performance */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Dépensé</p>
                        <p className="font-semibold">{formatCurrency(campaign.spent)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{(campaign.impressions / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">CTR</p>
                        <p className="font-semibold">{campaign.ctr}%</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="font-semibold">{campaign.conversions}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">ROAS</p>
                        <p className="font-semibold">{campaign.roas}x</p>
                      </div>
                    </div>

                    {/* Barre de progression du budget */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilisation du budget</span>
                        <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(campaign.spent / campaign.budget) * 100} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Canaux */}
          <TabsContent value="channels" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={channelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="roas" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allocation Budgétaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="budget"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {channelData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Détails par Canal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channelData.map((channel, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                      {channel.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Budget alloué</span>
                      <span className="font-medium">{formatCurrency(channel.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dépensé</span>
                      <span className="font-medium">{formatCurrency(channel.spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ROAS</span>
                      <span className="font-medium">{channel.roas}x</span>
                    </div>
                    <Progress value={(channel.spent / channel.budget) * 100} className="mt-2" />
                    <p className="text-xs text-muted-foreground">
                      {((channel.spent / channel.budget) * 100).toFixed(1)}% du budget utilisé
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Audiences */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segments d'Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {audienceSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{segment.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {segment.size.toLocaleString()} utilisateurs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">{segment.engagement}%</p>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{segment.conversion}%</p>
                          <p className="text-xs text-muted-foreground">Conversion</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Cibler
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Workflows d'Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Email de Bienvenue</h4>
                        <p className="text-sm text-muted-foreground">Nouvel abonné newsletter</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Séquence automatique de 3 emails sur 7 jours</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                      <Button size="sm" variant="outline">Configurer</Button>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Panier Abandonné</h4>
                        <p className="text-sm text-muted-foreground">Relance automatique</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Email + SMS après 1h, 24h et 7 jours</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                      <Button size="sm" variant="outline">Configurer</Button>
                    </div>
                  </Card>
                </div>

                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un Nouveau Workflow
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attribution */}
          <TabsContent value="attribution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Modèle d'Attribution Multi-Touch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Parcours Client Typique</h4>
                    <div className="space-y-3">
                      {[
                        { step: '1. Première visite', channel: 'Google Organique', attribution: 30 },
                        { step: '2. Retour', channel: 'Email Marketing', attribution: 25 },
                        { step: '3. Considération', channel: 'Facebook Ads', attribution: 20 },
                        { step: '4. Conversion', channel: 'Google Ads', attribution: 25 }
                      ].map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{step.step}</p>
                            <p className="text-xs text-muted-foreground">{step.channel}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{step.attribution}%</p>
                            <p className="text-xs text-muted-foreground">Attribution</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Temps de Conversion</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        { day: 0, conversions: 15 },
                        { day: 1, conversions: 25 },
                        { day: 3, conversions: 45 },
                        { day: 7, conversions: 70 },
                        { day: 14, conversions: 85 },
                        { day: 30, conversions: 95 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="conversions" stroke="hsl(var(--primary))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}