import { useState } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Shield, Users, BarChart3, Settings, Ban, UserCheck, Download, Eye, AlertTriangle } from "lucide-react"

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("")

  const users = [
    {
      id: 1,
      name: "Jean Dupont",
      email: "jean.dupont@email.com",
      role: "user",
      plan: "Pro",
      status: "active",
      lastLogin: "Il y a 2h",
      products: 156,
      revenue: "€2,450"
    },
    {
      id: 2,
      name: "Marie Martin",
      email: "marie.martin@email.com",
      role: "admin",
      plan: "Enterprise",
      status: "active",
      lastLogin: "Il y a 1j",
      products: 89,
      revenue: "€1,230"
    },
    {
      id: 3,
      name: "Pierre Durand",
      email: "pierre.durand@email.com",
      role: "user",
      plan: "Basic",
      status: "suspended",
      lastLogin: "Il y a 5j",
      products: 23,
      revenue: "€340"
    }
  ]

  const organizations = [
    {
      id: 1,
      name: "E-commerce Pro SARL",
      users: 5,
      plan: "Enterprise",
      revenue: "€12,450",
      status: "active"
    },
    {
      id: 2,
      name: "Dropship Masters",
      users: 3,
      plan: "Pro",
      revenue: "€5,670",
      status: "active"
    }
  ]

  const systemStats = [
    { label: "Utilisateurs Totaux", value: "2,847", growth: "+12%" },
    { label: "Organisations", value: "156", growth: "+8%" },
    { label: "Revenus Mensuel", value: "€125K", growth: "+25%" },
    { label: "Uptime", value: "99.9%", growth: "Stable" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'suspended': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500'
      case 'user': return 'bg-blue-500'
      case 'support': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Shield className="w-8 h-8 mr-3 text-red-600" />
              Administration
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestion des utilisateurs, organisations et système
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Export logs functionality
                const logs = 'timestamp,level,message\n2024-01-08T10:00:00Z,INFO,System operational\n2024-01-08T09:55:00Z,WARN,High API usage detected\n';
                const blob = new Blob([logs], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'system-logs.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir activer le mode maintenance ?')) {
                  alert('Mode maintenance activé. Tous les utilisateurs seront déconnectés.');
                }
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mode Maintenance
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.growth}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher utilisateurs, organisations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="organizations">Organisations</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Gestion des Utilisateurs
                    </CardTitle>
                    <CardDescription>
                      Gérez les comptes utilisateurs, rôles et permissions
                    </CardDescription>
                  </div>
                  <Button onClick={() => alert('Créer un nouvel utilisateur')}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/placeholder-avatar-${user.id}.jpg`} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{user.name}</h3>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Plan: {user.plan}</span>
                            <span>•</span>
                            <span>{user.products} produits</span>
                            <span>•</span>
                            <span>CA: {user.revenue}</span>
                            <span>•</span>
                            <span>Dernière connexion: {user.lastLogin}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'Actif' : 'Suspendu'}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Voir les détails de ${user.name}`)}
                            aria-label={`Voir les détails de ${user.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Modifier ${user.name}`)}
                            aria-label={`Modifier ${user.name}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Suspendre ${user.name} ?`)) {
                                alert(`${user.name} suspendu`);
                              }
                            }}
                            aria-label={`Suspendre ${user.name}`}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Organisations</CardTitle>
                <CardDescription>
                  Gérez les comptes entreprise et leurs équipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{org.users} utilisateurs</span>
                            <span>•</span>
                            <span>Plan: {org.plan}</span>
                            <span>•</span>
                            <span>CA: {org.revenue}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(org.status)}>
                          Actif
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Voir détails de ${org.name}`)}
                          >
                            Voir Détails
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Gérer ${org.name}`)}
                          >
                            Gérer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Système</CardTitle>
                  <CardDescription>
                    Paramètres globaux de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Mode Maintenance</h4>
                        <p className="text-sm text-muted-foreground">Activer la maintenance globale</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Nouvelles Inscriptions</h4>
                        <p className="text-sm text-muted-foreground">Autoriser les nouvelles inscriptions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Mode Debug</h4>
                        <p className="text-sm text-muted-foreground">Logs détaillés pour debug</p>
                      </div>
                      <Switch />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Limite Globale Import</h4>
                      <Select defaultValue="1000">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 produits/jour</SelectItem>
                          <SelectItem value="1000">1000 produits/jour</SelectItem>
                          <SelectItem value="5000">5000 produits/jour</SelectItem>
                          <SelectItem value="unlimited">Illimité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs Système</CardTitle>
                  <CardDescription>
                    Activité et erreurs du système
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Système opérationnel</span>
                      </div>
                      <p className="text-muted-foreground mt-1">Tous les services fonctionnent normalement</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Nouvelle connexion admin</span>
                      </div>
                      <p className="text-muted-foreground mt-1">marie.martin@email.com - Il y a 5 min</p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="font-medium">Pic d'utilisation API</span>
                      </div>
                      <p className="text-muted-foreground mt-1">+150% sur l'endpoint /import - Il y a 1h</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => {
                      const detailedLogs = 'timestamp,level,message,details\n2024-01-08T10:00:00Z,INFO,System operational,All services running\n2024-01-08T09:55:00Z,WARN,High API usage,150% increase detected\n2024-01-08T09:45:00Z,INFO,User login,marie.martin@email.com\n';
                      const blob = new Blob([detailedLogs], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'detailed-logs.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger Logs Complets
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métriques Globales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Utilisateurs Actifs (30j)</span>
                      <span className="font-semibold">2,456</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Produits Importés (30j)</span>
                      <span className="font-semibold">45,678</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Requêtes API (24h)</span>
                      <span className="font-semibold">123,456</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taux d'erreur API</span>
                      <span className="font-semibold text-green-600">0.02%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plans & Abonnements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Plan Basic</span>
                      <span className="font-semibold">1,234 utilisateurs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Plan Pro</span>
                      <span className="font-semibold">890 utilisateurs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Plan Enterprise</span>
                      <span className="font-semibold">123 utilisateurs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taux de conversion</span>
                      <span className="font-semibold text-green-600">12.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}