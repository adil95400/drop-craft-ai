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
  Headphones, 
  MessageCircle, 
  Clock, 
  User, 
  Star, 
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings,
  Search,
  Filter,
  Plus,
  Send,
  Paperclip,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const SupportUltraPro = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [ticketFilter, setTicketFilter] = useState('all')

  // Mock data for support metrics
  const supportMetrics = [
    {
      title: "Tickets ouverts",
      value: "47",
      change: "-8",
      icon: MessageCircle,
      color: "text-primary",
      trend: "down"
    },
    {
      title: "Temps de réponse",
      value: "2.4h",
      change: "-0.5h",
      icon: Clock,
      color: "text-green-600",
      trend: "down"
    },
    {
      title: "Satisfaction client",
      value: "4.8/5",
      change: "+0.2",
      icon: Star,
      color: "text-yellow-600",
      trend: "up"
    },
    {
      title: "Taux de résolution",
      value: "94%",
      change: "+3%",
      icon: CheckCircle2,
      color: "text-blue-600",
      trend: "up"
    }
  ]

  // Mock data for support tickets
  const tickets = [
    {
      id: '1',
      title: 'Problème de synchronisation des produits',
      description: 'Les produits ne se synchronisent pas depuis Shopify',
      customer: 'Marie Dubois',
      email: 'marie@exemple.com',
      priority: 'high',
      status: 'open',
      category: 'Integration',
      assignee: 'Support Team',
      created: '2024-01-15 14:30',
      updated: '2024-01-15 15:45',
      satisfaction: null
    },
    {
      id: '2',
      title: 'Demande de fonctionnalité - Export CSV',
      description: 'Possibilité d\'exporter les commandes en CSV',
      customer: 'Pierre Martin',
      email: 'pierre@exemple.com',
      priority: 'medium',
      status: 'in_progress',
      category: 'Feature Request',
      assignee: 'Dev Team',
      created: '2024-01-15 12:15',
      updated: '2024-01-15 14:20',
      satisfaction: null
    },
    {
      id: '3',
      title: 'Erreur lors du paiement',
      description: 'Transaction échouée malgré validation bancaire',
      customer: 'Sophie Leroy',
      email: 'sophie@exemple.com',
      priority: 'high',
      status: 'resolved',
      category: 'Payment',
      assignee: 'Support Team',
      created: '2024-01-14 16:00',
      updated: '2024-01-15 10:30',
      satisfaction: 5
    },
    {
      id: '4',
      title: 'Question sur la facturation',
      description: 'Clarification sur les frais de transaction',
      customer: 'Jean Dupont',
      email: 'jean@exemple.com',
      priority: 'low',
      status: 'closed',
      category: 'Billing',
      assignee: 'Finance Team',
      created: '2024-01-14 09:30',
      updated: '2024-01-14 11:45',
      satisfaction: 4
    }
  ]

  // Mock data for support analytics
  const analyticsData = [
    { date: '01/01', tickets: 23, resolved: 20, response_time: 3.2 },
    { date: '02/01', tickets: 31, resolved: 28, response_time: 2.8 },
    { date: '03/01', tickets: 28, resolved: 26, response_time: 2.5 },
    { date: '04/01', tickets: 35, resolved: 33, response_time: 2.1 },
    { date: '05/01', tickets: 42, resolved: 39, response_time: 2.3 },
    { date: '06/01', tickets: 38, resolved: 36, response_time: 2.0 },
    { date: '07/01', tickets: 29, resolved: 28, response_time: 2.4 }
  ]

  // Mock data for category distribution
  const categoryData = [
    { name: 'Technique', value: 35, color: '#8b5cf6' },
    { name: 'Billing', value: 25, color: '#06b6d4' },
    { name: 'Feature Request', value: 20, color: '#10b981' },
    { name: 'Integration', value: 15, color: '#f59e0b' },
    { name: 'Autre', value: 5, color: '#ef4444' }
  ]

  // Mock data for knowledge base
  const kbArticles = [
    {
      id: '1',
      title: 'Comment synchroniser avec Shopify',
      category: 'Integration',
      views: 1250,
      helpful: 89,
      lastUpdated: '2024-01-10'
    },
    {
      id: '2',
      title: 'Configuration des méthodes de paiement',
      category: 'Payment',
      views: 980,
      helpful: 92,
      lastUpdated: '2024-01-08'
    },
    {
      id: '3',
      title: 'Gestion des stocks et alertes',
      category: 'Inventory',
      views: 756,
      helpful: 85,
      lastUpdated: '2024-01-05'
    }
  ]

  const filteredTickets = tickets.filter(ticket => {
    if (ticketFilter === 'all') return true
    if (ticketFilter === 'open') return ticket.status === 'open'
    if (ticketFilter === 'urgent') return ticket.priority === 'high'
    if (ticketFilter === 'resolved') return ticket.status === 'resolved'
    return true
  })

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
                  Support Ultra Pro
                </h1>
                <p className="text-muted-foreground mt-1">
                  Centre d'assistance et gestion du support client
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau ticket
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportMetrics.map((metric, index) => (
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

            <Tabs defaultValue="tickets" className="space-y-6">
              <TabsList className="grid w-full lg:w-[600px] grid-cols-6">
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="knowledge">Base de connaissances</TabsTrigger>
                <TabsTrigger value="chat">Chat en direct</TabsTrigger>
                <TabsTrigger value="team">Équipe</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
              </TabsList>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Rechercher des tickets..." className="pl-10 w-80" />
                    </div>
                    <Select value={ticketFilter} onValueChange={setTicketFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="open">Ouverts</SelectItem>
                        <SelectItem value="urgent">Urgents</SelectItem>
                        <SelectItem value="resolved">Résolus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Tickets List */}
                  <div className="lg:col-span-2 space-y-4">
                    {filteredTickets.map((ticket) => (
                      <Card 
                        key={ticket.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedTicket === ticket.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedTicket(ticket.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">#{ticket.id} - {ticket.title}</h3>
                                <Badge className={getPriorityBadgeColor(ticket.priority)}>
                                  {ticket.priority === 'high' ? 'Urgent' :
                                   ticket.priority === 'medium' ? 'Moyen' : 'Faible'}
                                </Badge>
                                <Badge className={getStatusBadgeColor(ticket.status)}>
                                  {ticket.status === 'open' ? 'Ouvert' :
                                   ticket.status === 'in_progress' ? 'En cours' :
                                   ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm mb-3">{ticket.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>{ticket.customer}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{ticket.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{ticket.created}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  <span>{ticket.category}</span>
                                </div>
                              </div>
                              {ticket.satisfaction && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm">{ticket.satisfaction}/5</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Phone className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Quick Actions Sidebar */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Actions rapides
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un ticket
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat en direct
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Base de connaissances
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Rapports
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Créer un ticket</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="customer-email">Email client</Label>
                          <Input id="customer-email" placeholder="client@exemple.com" />
                        </div>
                        <div>
                          <Label htmlFor="ticket-subject">Sujet</Label>
                          <Input id="ticket-subject" placeholder="Description du problème" />
                        </div>
                        <div>
                          <Label htmlFor="ticket-priority">Priorité</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Urgent</SelectItem>
                              <SelectItem value="medium">Moyen</SelectItem>
                              <SelectItem value="low">Faible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ticket-description">Description</Label>
                          <Textarea 
                            id="ticket-description" 
                            placeholder="Détails du problème..."
                            rows={3}
                          />
                        </div>
                        <Button className="w-full">
                          <Send className="w-4 h-4 mr-2" />
                          Créer le ticket
                        </Button>
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
                      <CardTitle>Volume des tickets</CardTitle>
                      <CardDescription>Évolution des tickets créés et résolus</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="tickets" stroke="#8b5cf6" strokeWidth={2} />
                          <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par catégorie</CardTitle>
                      <CardDescription>Types de demandes les plus fréquents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {categoryData.map((category, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm text-muted-foreground">({category.value}%)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Temps de réponse</CardTitle>
                    <CardDescription>Évolution du temps de première réponse (en heures)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="response_time" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Knowledge Base Tab */}
              <TabsContent value="knowledge" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Rechercher dans la base..." className="pl-10 w-80" />
                    </div>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvel article
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Articles populaires</CardTitle>
                      <CardDescription>Les plus consultés par vos clients</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {kbArticles.map((article) => (
                        <div key={article.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{article.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{article.category}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{article.views} vues</span>
                                <span>{article.helpful}% utile</span>
                                <span>MAJ: {article.lastUpdated}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Modifier
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Créer un article</CardTitle>
                      <CardDescription>Ajoutez du contenu à votre base de connaissances</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="article-title">Titre de l'article</Label>
                        <Input id="article-title" placeholder="Comment faire..." />
                      </div>
                      <div>
                        <Label htmlFor="article-category">Catégorie</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="integration">Integration</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="general">Général</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="article-content">Contenu</Label>
                        <Textarea 
                          id="article-content" 
                          placeholder="Rédigez votre article..."
                          rows={6}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="article-public" defaultChecked />
                        <Label htmlFor="article-public">Visible publiquement</Label>
                      </div>
                      <Button className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Publier l'article
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Live Chat Tab */}
              <TabsContent value="chat" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Chat en direct
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96 border rounded-lg p-4 bg-muted/20 mb-4">
                        <div className="text-center text-muted-foreground">
                          Interface de chat en direct sera intégrée ici
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Tapez votre message..." className="flex-1" />
                        <Button size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversations actives</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">Client {i}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Dernier message...</p>
                          <p className="text-xs text-muted-foreground">Il y a 2 min</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Équipe support
                    </CardTitle>
                    <CardDescription>Gestion des agents et performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Sarah Johnson', role: 'Support Manager', tickets: 23, satisfaction: 4.9, status: 'online' },
                      { name: 'Mike Chen', role: 'Senior Agent', tickets: 31, satisfaction: 4.7, status: 'online' },
                      { name: 'Emma Davis', role: 'Support Agent', tickets: 18, satisfaction: 4.8, status: 'away' },
                      { name: 'Alex Wilson', role: 'Technical Support', tickets: 15, satisfaction: 4.6, status: 'offline' }
                    ].map((agent, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              agent.status === 'online' ? 'bg-green-500' :
                              agent.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <h4 className="font-medium">{agent.name}</h4>
                              <p className="text-sm text-muted-foreground">{agent.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{agent.tickets} tickets ce mois</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{agent.satisfaction}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres généraux</CardTitle>
                      <CardDescription>Configuration du support client</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Chat en direct</p>
                            <p className="text-sm text-muted-foreground">Activer le chat sur le site</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Réponse automatique</p>
                            <p className="text-sm text-muted-foreground">Message d'accusé de réception</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Horaires d'ouverture</p>
                            <p className="text-sm text-muted-foreground">9h-18h du lundi au vendredi</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>SLA et objectifs</CardTitle>
                      <CardDescription>Définir les temps de réponse</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="sla-urgent">Tickets urgents</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="1 heure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30min">30 minutes</SelectItem>
                            <SelectItem value="1h">1 heure</SelectItem>
                            <SelectItem value="2h">2 heures</SelectItem>
                            <SelectItem value="4h">4 heures</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="sla-normal">Tickets normaux</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="4 heures" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2h">2 heures</SelectItem>
                            <SelectItem value="4h">4 heures</SelectItem>
                            <SelectItem value="8h">8 heures</SelectItem>
                            <SelectItem value="24h">24 heures</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="satisfaction-target">Objectif de satisfaction</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={90} className="flex-1" />
                          <span className="text-sm">90%</span>
                        </div>
                      </div>
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

export default SupportUltraPro