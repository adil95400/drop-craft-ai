import { useState } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff,
  Activity,
  Users,
  Globe,
  Key,
  Smartphone,
  FileText,
  Settings,
  RefreshCw,
  Filter,
  Search,
  Download,
  Zap,
  Clock,
  MapPin,
  Monitor
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const SecurityUltraPro = () => {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState('all')

  // Mock data for security metrics
  const securityMetrics = [
    {
      title: "Score de sécurité",
      value: "94/100",
      change: "+2",
      icon: Shield,
      color: "text-primary",
      trend: "up"
    },
    {
      title: "Menaces détectées",
      value: "3",
      change: "-5",
      icon: AlertTriangle,
      color: "text-red-600",
      trend: "down"
    },
    {
      title: "Connexions sécurisées",
      value: "99.8%",
      change: "+0.1%",
      icon: Lock,
      color: "text-green-600",
      trend: "up"
    },
    {
      title: "Utilisateurs actifs",
      value: "2,347",
      change: "+156",
      icon: Users,
      color: "text-blue-600",
      trend: "up"
    }
  ]

  // Mock data for security threats
  const threats = [
    {
      id: '1',
      type: 'high',
      title: 'Tentative de connexion suspecte',
      description: 'Plusieurs tentatives de connexion depuis une IP blacklistée',
      time: '2024-01-15 14:32',
      ip: '192.168.1.100',
      location: 'Paris, France',
      status: 'blocked',
      user: 'admin@exemple.com'
    },
    {
      id: '2',
      type: 'medium',
      title: 'Fichier potentiellement malveillant',
      description: 'Upload d\'un fichier avec une extension suspecte',
      time: '2024-01-15 13:45',
      ip: '10.0.0.50',
      location: 'Lyon, France',
      status: 'quarantined',
      user: 'user@exemple.com'
    },
    {
      id: '3',
      type: 'low',
      title: 'Accès API anormal',
      description: 'Pic inhabituel de requêtes API depuis une application',
      time: '2024-01-15 12:18',
      ip: '172.16.0.25',
      location: 'Marseille, France',
      status: 'monitoring',
      user: 'app@exemple.com'
    },
    {
      id: '4',
      type: 'info',
      title: 'Nouveau périphérique détecté',
      description: 'Connexion depuis un nouvel appareil non reconnu',
      time: '2024-01-15 11:30',
      ip: '203.0.113.42',
      location: 'Toulouse, France',
      status: 'verified',
      user: 'marie@exemple.com'
    }
  ]

  // Mock data for security analytics
  const securityData = [
    { date: '01/01', threats: 12, blocked: 11, allowed: 1456 },
    { date: '02/01', threats: 8, blocked: 7, allowed: 1678 },
    { date: '03/01', threats: 15, blocked: 14, allowed: 1534 },
    { date: '04/01', threats: 6, blocked: 6, allowed: 1789 },
    { date: '05/01', threats: 9, blocked: 8, allowed: 1623 },
    { date: '06/01', threats: 4, blocked: 4, allowed: 1845 },
    { date: '07/01', threats: 3, blocked: 3, allowed: 1967 }
  ]

  // Mock data for threat types
  const threatTypes = [
    { name: 'Brute Force', value: 35, color: '#ef4444' },
    { name: 'Malware', value: 25, color: '#f97316' },
    { name: 'Phishing', value: 20, color: '#eab308' },
    { name: 'DDoS', value: 15, color: '#8b5cf6' },
    { name: 'Autre', value: 5, color: '#6b7280' }
  ]

  // Mock data for user sessions
  const userSessions = [
    {
      id: '1',
      user: 'marie.dubois@exemple.com',
      device: 'Chrome - Windows',
      ip: '192.168.1.45',
      location: 'Paris, France',
      startTime: '2024-01-15 14:00',
      status: 'active',
      riskLevel: 'low'
    },
    {
      id: '2',
      user: 'pierre.martin@exemple.com',
      device: 'Safari - MacOS',
      ip: '10.0.0.23',
      location: 'Lyon, France',
      startTime: '2024-01-15 13:30',
      status: 'active',
      riskLevel: 'low'
    },
    {
      id: '3',
      user: 'sophie.leroy@exemple.com',
      device: 'Mobile App - iOS',
      ip: '172.16.0.89',
      location: 'Marseille, France',
      startTime: '2024-01-15 12:45',
      status: 'expired',
      riskLevel: 'medium'
    }
  ]

  // Mock data for compliance status
  const complianceItems = [
    { name: 'GDPR', status: 'compliant', score: 98 },
    { name: 'ISO 27001', status: 'compliant', score: 94 },
    { name: 'SOC 2', status: 'partial', score: 87 },
    { name: 'PCI DSS', status: 'compliant', score: 96 },
    { name: 'HIPAA', status: 'not_applicable', score: 0 }
  ]

  const filteredThreats = threats.filter(threat => {
    if (logFilter === 'all') return true
    if (logFilter === 'high') return threat.type === 'high'
    if (logFilter === 'medium') return threat.type === 'medium'
    if (logFilter === 'blocked') return threat.status === 'blocked'
    return true
  })

  const getThreatBadgeColor = (type: string) => {
    switch (type) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'bg-red-100 text-red-800'
      case 'quarantined': return 'bg-yellow-100 text-yellow-800'
      case 'monitoring': return 'bg-blue-100 text-blue-800'
      case 'verified': return 'bg-green-100 text-green-800'
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
                  Security Ultra Pro
                </h1>
                <p className="text-muted-foreground mt-1">
                  Surveillance et protection avancée de votre système
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Rapport
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {securityMetrics.map((metric, index) => (
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

            <Tabs defaultValue="threats" className="space-y-6">
              <TabsList className="grid w-full lg:w-[600px] grid-cols-6">
                <TabsTrigger value="threats">Menaces</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="access">Accès</TabsTrigger>
                <TabsTrigger value="compliance">Conformité</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
              </TabsList>

              {/* Threats Tab */}
              <TabsContent value="threats" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Rechercher des menaces..." className="pl-10 w-80" />
                    </div>
                    <Select value={logFilter} onValueChange={setLogFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="high">Critique</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="blocked">Bloquées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Journal des menaces
                    </CardTitle>
                    <CardDescription>Événements de sécurité détectés et actions prises</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredThreats.map((threat) => (
                      <div
                        key={threat.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedThreat === threat.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedThreat(threat.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{threat.title}</h3>
                              <Badge className={getThreatBadgeColor(threat.type)}>
                                {threat.type === 'high' ? 'Critique' :
                                 threat.type === 'medium' ? 'Moyenne' :
                                 threat.type === 'low' ? 'Faible' : 'Info'}
                              </Badge>
                              <Badge className={getStatusBadgeColor(threat.status)}>
                                {threat.status === 'blocked' ? 'Bloqué' :
                                 threat.status === 'quarantined' ? 'Quarantaine' :
                                 threat.status === 'monitoring' ? 'Surveillance' : 'Vérifié'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{threat.description}</p>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{threat.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span>{threat.ip}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{threat.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{threat.user}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution des menaces</CardTitle>
                      <CardDescription>Nombre de menaces détectées et bloquées</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={securityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} />
                          <Line type="monotone" dataKey="blocked" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Types de menaces</CardTitle>
                      <CardDescription>Répartition des attaques par catégorie</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={threatTypes}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {threatTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {threatTypes.map((type, index) => (
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
                    <CardTitle>Activité de sécurité</CardTitle>
                    <CardDescription>Volume des connexions autorisées vs menaces</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={securityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="allowed" fill="#10b981" />
                        <Bar dataKey="threats" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Sessions utilisateurs actives
                    </CardTitle>
                    <CardDescription>Surveillance des connexions en temps réel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userSessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{session.user}</h3>
                              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                {session.status === 'active' ? 'Actif' : 'Expiré'}
                              </Badge>
                              <Badge variant={session.riskLevel === 'low' ? 'default' : 'destructive'}>
                                Risque {session.riskLevel === 'low' ? 'faible' : 'moyen'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Monitor className="w-4 h-4" />
                                <span>{session.device}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                <span>{session.ip}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{session.startTime}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              Déconnecter
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Access Control Tab */}
              <TabsContent value="access" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Gestion des accès
                      </CardTitle>
                      <CardDescription>Contrôlez les permissions et authentifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Authentification à deux facteurs</p>
                            <p className="text-sm text-muted-foreground">Obligatoire pour tous les admin</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Connexion SSO</p>
                            <p className="text-sm text-muted-foreground">Authentification unique</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Limitation géographique</p>
                            <p className="text-sm text-muted-foreground">Bloquer les connexions suspectes</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Expiration automatique</p>
                            <p className="text-sm text-muted-foreground">Sessions inactives après 30min</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Politique de mots de passe</CardTitle>
                      <CardDescription>Configuration des exigences de sécurité</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="min-length">Longueur minimale</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="12 caractères" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8">8 caractères</SelectItem>
                            <SelectItem value="10">10 caractères</SelectItem>
                            <SelectItem value="12">12 caractères</SelectItem>
                            <SelectItem value="16">16 caractères</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch id="uppercase" defaultChecked />
                          <Label htmlFor="uppercase">Majuscules obligatoires</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="numbers" defaultChecked />
                          <Label htmlFor="numbers">Chiffres obligatoires</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="symbols" defaultChecked />
                          <Label htmlFor="symbols">Caractères spéciaux</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="history" defaultChecked />
                          <Label htmlFor="history">Mémoriser 10 derniers mots de passe</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="expiry">Expiration</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="90 jours" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 jours</SelectItem>
                            <SelectItem value="60">60 jours</SelectItem>
                            <SelectItem value="90">90 jours</SelectItem>
                            <SelectItem value="365">1 an</SelectItem>
                            <SelectItem value="never">Jamais</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      État de conformité
                    </CardTitle>
                    <CardDescription>Vérification des standards de sécurité</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {complianceItems.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant={
                              item.status === 'compliant' ? 'default' :
                              item.status === 'partial' ? 'secondary' : 'outline'
                            }>
                              {item.status === 'compliant' ? 'Conforme' :
                               item.status === 'partial' ? 'Partiel' : 'Non applicable'}
                            </Badge>
                          </div>
                          {item.status !== 'not_applicable' && (
                            <div className="flex items-center gap-2">
                              <Progress value={item.score} className="w-20 h-2" />
                              <span className="text-sm font-medium">{item.score}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Rapport
                          </Button>
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
                      <CardTitle>Paramètres de surveillance</CardTitle>
                      <CardDescription>Configuration des alertes et notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Alertes en temps réel</p>
                            <p className="text-sm text-muted-foreground">Notifications immédiates</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Rapport quotidien</p>
                            <p className="text-sm text-muted-foreground">Résumé des événements</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Blocage automatique</p>
                            <p className="text-sm text-muted-foreground">Actions préventives</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actions automatisées</CardTitle>
                      <CardDescription>Réponses automatiques aux menaces</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="threat-response">Réponse aux menaces critiques</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Bloquer immédiatement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Bloquer immédiatement</SelectItem>
                            <SelectItem value="quarantine">Mettre en quarantaine</SelectItem>
                            <SelectItem value="monitor">Surveiller seulement</SelectItem>
                            <SelectItem value="alert">Alerter uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="failed-attempts">Tentatives de connexion échouées</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Bloquer après 5 tentatives" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 tentatives</SelectItem>
                            <SelectItem value="5">5 tentatives</SelectItem>
                            <SelectItem value="10">10 tentatives</SelectItem>
                            <SelectItem value="disabled">Désactivé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="quarantine-duration">Durée de quarantaine</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="24 heures" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1h">1 heure</SelectItem>
                            <SelectItem value="6h">6 heures</SelectItem>
                            <SelectItem value="24h">24 heures</SelectItem>
                            <SelectItem value="7d">7 jours</SelectItem>
                            <SelectItem value="permanent">Permanent</SelectItem>
                          </SelectContent>
                        </Select>
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

export default SecurityUltraPro;