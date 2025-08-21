import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { 
  Target, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Users,
  Zap,
  BarChart3,
  Bot,
  Globe,
  Play,
  Pause,
  Eye,
  Edit,
  RefreshCw,
  Activity,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

interface RealDataMarketingDashboardProps {
  className?: string
}

export const RealDataMarketingDashboard = ({ className = '' }: RealDataMarketingDashboardProps) => {
  const { campaigns, segments, contacts, automationJobs, stats, isLoading, lastActivity, refreshData } = useRealTimeMarketing()
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'completed': return 'outline'
      case 'draft': return 'destructive'
      default: return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'social': return <Globe className="h-4 w-4" />
      case 'ads': return <Target className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  // Generate performance data from real campaigns
  const performanceData = campaigns.slice(0, 6).map((campaign, index) => ({
    name: campaign.name.substring(0, 10),
    budget: campaign.budget_total || 0,
    spent: campaign.budget_spent,
    roas: campaign.metrics?.roas || 0,
    conversions: campaign.metrics?.conversions || 0
  }))

  const channelData = [
    { 
      name: 'Email', 
      campaigns: campaigns.filter(c => c.type === 'email').length,
      budget: campaigns.filter(c => c.type === 'email').reduce((sum, c) => sum + (c.budget_total || 0), 0),
      spent: campaigns.filter(c => c.type === 'email').reduce((sum, c) => sum + c.budget_spent, 0),
      color: '#22c55e' 
    },
    { 
      name: 'Social', 
      campaigns: campaigns.filter(c => c.type === 'social').length,
      budget: campaigns.filter(c => c.type === 'social').reduce((sum, c) => sum + (c.budget_total || 0), 0),
      spent: campaigns.filter(c => c.type === 'social').reduce((sum, c) => sum + c.budget_spent, 0),
      color: '#3b82f6' 
    },
    { 
      name: 'Ads', 
      campaigns: campaigns.filter(c => c.type === 'ads').length,
      budget: campaigns.filter(c => c.type === 'ads').reduce((sum, c) => sum + (c.budget_total || 0), 0),
      spent: campaigns.filter(c => c.type === 'ads').reduce((sum, c) => sum + c.budget_spent, 0),
      color: '#8b5cf6' 
    },
    { 
      name: 'SMS', 
      campaigns: campaigns.filter(c => c.type === 'sms').length,
      budget: campaigns.filter(c => c.type === 'sms').reduce((sum, c) => sum + (c.budget_total || 0), 0),
      spent: campaigns.filter(c => c.type === 'sms').reduce((sum, c) => sum + c.budget_spent, 0),
      color: '#f59e0b' 
    }
  ]

  if (isLoading) {
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Chargement des données marketing en temps réel...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header avec indicateur temps réel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Marketing Real-Time Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-green-500" />
              <span>En direct</span>
              <span>•</span>
              <span>Dernière activité: {lastActivity.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <Button onClick={refreshData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* KPIs Temps Réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes Actives</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.activeCampaigns}</div>
            <p className="text-xs text-blue-600">sur {stats.totalCampaigns} total</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-green-600">Dépensé: {formatCurrency(stats.totalSpent)}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts CRM</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-purple-600">{stats.totalSegments} segments</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.avgROAS.toFixed(1)}x</div>
            <p className="text-xs text-orange-600">Taux conv: {stats.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes Live</TabsTrigger>
          <TabsTrigger value="automation">Automation IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance par Canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="roas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Segments d'audience en temps réel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Segments d'Audience (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.slice(0, 6).map((segment) => (
                  <div key={segment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{segment.name}</h4>
                      <Badge variant="outline">{segment.contact_count} contacts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{segment.description || 'Aucune description'}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Cibler
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campagnes Live */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="space-y-4">
            {campaigns.slice(0, 10).map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {campaign.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'active' ? (
                        <Button variant="ghost" size="icon">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatCurrency(campaign.budget_total || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dépensé</p>
                      <p className="font-medium">{formatCurrency(campaign.budget_spent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROAS</p>
                      <p className="font-medium">{(campaign.metrics as any)?.roas?.toFixed(1) || '0.0'}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="font-medium">{(campaign.metrics as any)?.conversions || 0}</p>
                    </div>
                  </div>

                  {campaign.budget_total && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilisation du budget</span>
                        <span>{((campaign.budget_spent / campaign.budget_total) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(campaign.budget_spent / campaign.budget_total) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation IA */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Jobs d'Optimisation IA (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationJobs.slice(0, 8).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{job.job_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.status === 'completed' ? 'Terminé' : 
                           job.status === 'pending' ? 'En attente' : 
                           job.status === 'running' ? 'En cours' : 'Erreur'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.status === 'running' && (
                        <Progress value={job.progress} className="w-24" />
                      )}
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'running' ? 'secondary' :
                        job.status === 'pending' ? 'outline' : 'destructive'
                      }>
                        {job.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {job.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {job.progress}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Budgets</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle>Contacts CRM Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contacts.slice(0, 6).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{contact.lifecycle_stage}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Score: {contact.lead_score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}