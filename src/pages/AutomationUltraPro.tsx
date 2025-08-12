import { useState } from 'react'
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
  Workflow
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const AutomationUltraPro = () => {
  const { toast } = useToast()
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  // Mock data for automation workflows
  const workflows = [
    {
      id: '1',
      name: 'Campagne email abandon panier',
      status: 'active',
      trigger: 'Panier abandonné',
      actions: 4,
      conversions: 156,
      revenue: 12450,
      lastRun: '2024-01-15 14:30',
      success_rate: 85
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
      success_rate: 92
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
      success_rate: 78
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
      success_rate: 88
    }
  ]

  // Mock data for automation performance
  const performanceData = [
    { date: '01/01', executions: 245, conversions: 48, revenue: 2400 },
    { date: '02/01', executions: 289, conversions: 56, revenue: 2890 },
    { date: '03/01', executions: 234, conversions: 42, revenue: 2100 },
    { date: '04/01', executions: 378, conversions: 71, revenue: 3560 },
    { date: '05/01', executions: 456, conversions: 89, revenue: 4450 },
    { date: '06/01', executions: 389, conversions: 76, revenue: 3800 },
    { date: '07/01', executions: 423, conversions: 82, revenue: 4100 }
  ]

  const triggerTypes = [
    { name: 'Email', value: 35, color: '#8b5cf6' },
    { name: 'Page visitée', value: 25, color: '#06b6d4' },
    { name: 'Achat', value: 20, color: '#10b981' },
    { name: 'Temps', value: 20, color: '#f59e0b' }
  ]

  const automationStats = [
    {
      title: "Workflows actifs",
      value: "12",
      change: "+2",
      icon: Bot,
      color: "text-primary"
    },
    {
      title: "Exécutions/jour",
      value: "1,234",
      change: "+15%",
      icon: Zap,
      color: "text-green-600"
    },
    {
      title: "Taux de conversion",
      value: "18.5%",
      change: "+3.2%",
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "ROI moyen",
      value: "340%",
      change: "+25%",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  const recentActivities = [
    {
      workflow: 'Campagne abandon panier',
      action: 'Email envoyé',
      user: 'Marie Dubois',
      time: 'Il y a 5 min',
      status: 'success'
    },
    {
      workflow: 'Welcome series',
      action: 'SMS envoyé',
      user: 'Pierre Martin',
      time: 'Il y a 12 min',
      status: 'success'
    },
    {
      workflow: 'Remarketing',
      action: 'Notification push',
      user: 'Sophie Leroy',
      time: 'Il y a 18 min',
      status: 'failed'
    },
    {
      workflow: 'Réactivation clients',
      action: 'Email envoyé',
      user: 'Jean Dupont',
      time: 'Il y a 25 min',
      status: 'success'
    }
  ]

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Automation Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-1">
              Automatisez vos processus marketing et commerciaux
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              toast({
                title: "Paramètres",
                description: "Ouverture des paramètres d'automation...",
              });
            }}>
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button size="sm">
              <Bot className="w-4 h-4 mr-2" />
              Nouveau workflow
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {automationStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="workflows" className="space-y-6">
              <TabsList className="grid w-full lg:w-[400px] grid-cols-4">
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="builder">Builder</TabsTrigger>
              </TabsList>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Workflows List */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Workflow className="w-5 h-5" />
                          Workflows actifs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {workflows.map((workflow) => (
                          <div
                            key={workflow.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedWorkflow === workflow.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedWorkflow(workflow.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{workflow.name}</h3>
                                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                                    {workflow.status === 'active' ? 'Actif' : 'Pausé'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Trigger: {workflow.trigger}
                                </p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Actions</p>
                                    <p className="font-medium">{workflow.actions}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Conversions</p>
                                    <p className="font-medium">{workflow.conversions}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Revenue</p>
                                    <p className="font-medium">{workflow.revenue}€</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Dernière exécution: {workflow.lastRun}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={workflow.success_rate} className="w-16 h-2" />
                                    <span className="text-xs font-medium">{workflow.success_rate}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: workflow.status === 'active' ? "Workflow mis en pause" : "Workflow activé",
                                    description: `Le workflow "${workflow.name}" a été ${workflow.status === 'active' ? 'mis en pause' : 'activé'}`,
                                  });
                                }}>
                                  {workflow.status === 'active' ? 
                                    <Pause className="w-4 h-4" /> : 
                                    <Play className="w-4 h-4" />
                                  }
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: "Configuration",
                                    description: `Ouverture de la configuration pour "${workflow.name}"`,
                                  });
                                }}>
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Activité récente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
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
                              <p className="text-xs text-muted-foreground">User: {activity.user}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance des workflows</CardTitle>
                      <CardDescription>Évolution des exécutions et conversions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="executions" stroke="#8b5cf6" strokeWidth={2} />
                          <Line type="monotone" dataKey="conversions" stroke="#06b6d4" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue par workflow</CardTitle>
                    <CardDescription>Revenus générés par chaque automation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Triggers Tab */}
              <TabsContent value="triggers" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Triggers disponibles</CardTitle>
                      <CardDescription>Configuration des déclencheurs d'automation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { icon: Mail, name: 'Email ouvert', desc: 'Déclenche quand un email est ouvert' },
                        { icon: ShoppingCart, name: 'Panier abandonné', desc: 'Après 1h sans finalisation' },
                        { icon: MessageSquare, name: 'Message reçu', desc: 'Support ou chat en ligne' },
                        { icon: Users, name: 'Nouveau client', desc: 'Inscription ou première commande' },
                        { icon: Calendar, name: 'Date spécifique', desc: 'Anniversaire, événement...' },
                        { icon: BarChart3, name: 'Seuil atteint', desc: 'Montant, nombre de vues...' }
                      ].map((trigger, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <trigger.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{trigger.name}</h4>
                            <p className="text-sm text-muted-foreground">{trigger.desc}</p>
                          </div>
                          <Switch />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actions disponibles</CardTitle>
                      <CardDescription>Actions pouvant être automatisées</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { icon: Mail, name: 'Envoyer email', desc: 'Email personnalisé avec template' },
                        { icon: MessageSquare, name: 'Envoyer SMS', desc: 'Message texte court' },
                        { icon: Bell, name: 'Notification push', desc: 'Notification sur mobile/web' },
                        { icon: Target, name: 'Ajouter à segment', desc: 'Segmentation automatique' },
                        { icon: TrendingUp, name: 'Mettre à jour score', desc: 'Lead scoring automatique' },
                        { icon: Clock, name: 'Programmer tâche', desc: 'Création de tâche CRM' }
                      ].map((action, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <action.icon className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{action.name}</h4>
                            <p className="text-sm text-muted-foreground">{action.desc}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => {
                            toast({
                              title: "Configuration",
                              description: "Ouverture de la configuration du trigger",
                            });
                          }}>
                            Configurer
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Workflow Builder Tab */}
              <TabsContent value="builder" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Créateur de workflow</CardTitle>
                    <CardDescription>Construisez votre automation étape par étape</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="workflow-name">Nom du workflow</Label>
                          <Input id="workflow-name" placeholder="Ex: Campagne abandon panier" />
                        </div>
                        
                        <div>
                          <Label htmlFor="workflow-trigger">Déclencheur</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un trigger" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cart-abandoned">Panier abandonné</SelectItem>
                              <SelectItem value="email-opened">Email ouvert</SelectItem>
                              <SelectItem value="page-visited">Page visitée</SelectItem>
                              <SelectItem value="new-signup">Nouvelle inscription</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="workflow-condition">Condition (optionnel)</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Ajouter une condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="amount-over">Montant supérieur à</SelectItem>
                              <SelectItem value="first-time">Premier achat</SelectItem>
                              <SelectItem value="location">Localisation</SelectItem>
                              <SelectItem value="segment">Segment client</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="workflow-delay">Délai d'exécution</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="1" className="w-20" />
                            <Select>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Unité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Heures</SelectItem>
                                <SelectItem value="days">Jours</SelectItem>
                                <SelectItem value="weeks">Semaines</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="workflow-action">Action principale</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="send-email">Envoyer email</SelectItem>
                              <SelectItem value="send-sms">Envoyer SMS</SelectItem>
                              <SelectItem value="push-notification">Notification push</SelectItem>
                              <SelectItem value="add-to-segment">Ajouter au segment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="email-template">Template email</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="abandoned-cart">Panier abandonné</SelectItem>
                              <SelectItem value="welcome">Bienvenue</SelectItem>
                              <SelectItem value="promotional">Promotionnel</SelectItem>
                              <SelectItem value="reactivation">Réactivation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="workflow-frequency">Fréquence</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Une fois par..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">Une seule fois</SelectItem>
                              <SelectItem value="daily">Quotidien</SelectItem>
                              <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              <SelectItem value="monthly">Mensuel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch id="active-workflow" />
                          <Label htmlFor="active-workflow">Activer immédiatement</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button onClick={() => {
                        toast({
                          title: "Workflow créé",
                          description: "Le nouveau workflow a été créé avec succès",
                        });
                      }}>
                        <Bot className="w-4 h-4 mr-2" />
                        Créer le workflow
                      </Button>
                      <Button variant="outline" onClick={() => {
                        toast({
                          title: "Test en cours",
                          description: "Le workflow est en cours de test...",
                        });
                      }}>
                        Tester le workflow
                      </Button>
                      <Button variant="outline" onClick={() => {
                        toast({
                          title: "Prévisualisation",
                          description: "Ouverture de la prévisualisation du workflow",
                        });
                      }}>
                        Prévisualiser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default AutomationUltraPro;