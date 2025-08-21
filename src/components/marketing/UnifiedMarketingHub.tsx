import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp, 
  Bot, 
  Zap,
  RefreshCw,
  Mail,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { MarketingDataSync } from './MarketingDataSync'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export function UnifiedMarketingHub() {
  const { 
    campaigns, 
    segments, 
    contacts, 
    automationJobs, 
    stats, 
    isLoading, 
    refreshData,
    lastActivity 
  } = useRealTimeMarketing()

  const [selectedTab, setSelectedTab] = useState('overview')

  // Performance data for charts
  const performanceData = [
    { name: 'Jan', campaigns: 8, budget: 12000, spent: 9500, conversions: 245 },
    { name: 'Fév', campaigns: 12, budget: 15000, spent: 12800, conversions: 320 },
    { name: 'Mar', campaigns: 15, budget: 18000, spent: 16200, conversions: 410 },
    { name: 'Avr', campaigns: 18, budget: 22000, spent: 19800, conversions: 485 },
    { name: 'Mai', campaigns: 22, budget: 25000, spent: 23100, conversions: 578 },
    { name: 'Jun', campaigns: 28, budget: 30000, spent: 28500, conversions: 687 }
  ]

  const channelData = [
    { name: 'Email', value: stats.totalBudget * 0.4, color: COLORS[0] },
    { name: 'Social', value: stats.totalBudget * 0.3, color: COLORS[1] },
    { name: 'Search', value: stats.totalBudget * 0.2, color: COLORS[2] },
    { name: 'Display', value: stats.totalBudget * 0.1, color: COLORS[3] }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des données marketing...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec synchro temps réel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hub Marketing Unifié</h2>
          <p className="text-muted-foreground">
            Données temps réel • Dernière activité: {
              lastActivity ? new Date(lastActivity).toLocaleTimeString() : 'Jamais'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <MarketingDataSync />
          <Button onClick={refreshData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs Temps Réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Campagnes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-sm text-muted-foreground">
              {stats.totalCampaigns} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              Budget Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(stats.totalSpent)} dépensé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Contacts CRM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-sm text-muted-foreground">
              {stats.totalSegments} segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              ROAS Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgROAS.toFixed(1)}x</div>
            <p className="text-sm text-muted-foreground">
              {(stats.conversionRate * 100).toFixed(1)}% conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="automation">Automatisation IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance temps réel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Marketing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversions" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="spent" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par canal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Répartition Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Segments d'audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Segments d'Audience
              </CardTitle>
              <CardDescription>
                Aperçu de vos segments marketing les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segments.slice(0, 5).map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{segment.contact_count} contacts</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(segment.last_updated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campagnes en Cours
              </CardTitle>
              <CardDescription>
                Gestion et suivi de vos campagnes marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(campaign.budget_spent || 0)} / {formatCurrency(campaign.budget_total || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Démarré: {new Date(campaign.started_at || campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune campagne trouvée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Tâches d'Optimisation IA
              </CardTitle>
              <CardDescription>
                Suivi des optimisations automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'running' ? 'bg-blue-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{job.job_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          Progression: {job.progress || 0}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{job.status}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {automationJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune tâche d'automatisation en cours
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métriques Clés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Impressions totales</span>
                  <span className="font-medium">{stats.totalImpressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clics totaux</span>
                  <span className="font-medium">{stats.totalClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de conversion</span>
                  <span className="font-medium">{(stats.conversionRate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>ROAS moyen</span>
                  <span className="font-medium">{stats.avgROAS.toFixed(2)}x</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contacts Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contacts.slice(0, 5).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                      </div>
                      <Badge variant="outline">{contact.lifecycle_stage}</Badge>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Aucun contact récent
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}