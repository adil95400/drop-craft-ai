import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Search, Shield, Users, BarChart3, Settings, Ban, UserCheck, Download, Eye, AlertTriangle, TrendingUp, Activity, Clock, Globe, Server, Database, Zap } from "lucide-react"
import { adminActions, orgActions } from "@/lib/admin"
import { roleService } from "@/lib/roleService"
import { useUserRole } from "@/hooks/useUserRole"
import { useToast } from "@/hooks/use-toast"
import { ActionButton } from "@/components/common/ActionButton"

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("")
  const { isAdmin } = useUserRole()
  const { toast } = useToast()

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const result = await roleService.setUserRole(userId, newRole)
      
      if (result.success) {
        toast({
          title: "Rôle mis à jour",
          description: result.message,
        })
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      })
    }
  }

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
      revenue: "€2,450",
      avatar: "/lovable-uploads/aa11c615-9c0c-4dbf-b691-586cf4f9c53a.png"
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
      revenue: "€1,230",
      avatar: "/lovable-uploads/aa11c615-9c0c-4dbf-b691-586cf4f9c53a.png"
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
      revenue: "€340",
      avatar: "/lovable-uploads/aa11c615-9c0c-4dbf-b691-586cf4f9c53a.png"
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
    { 
      label: "Utilisateurs Totaux", 
      value: 2847, 
      growth: "+12%", 
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    { 
      label: "Organisations", 
      value: 156, 
      growth: "+8%", 
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    { 
      label: "Revenus Mensuel", 
      value: "€125K", 
      growth: "+25%", 
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    { 
      label: "Uptime", 
      value: "99.9%", 
      growth: "Stable", 
      icon: Activity,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    }
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              Administration
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestion des utilisateurs, organisations et système
            </p>
          </div>
          
          <div className="flex gap-2">
            <ActionButton 
              variant="outline" 
              size="sm"
              onClick={adminActions.exportLogs}
              loadingText="Export en cours..."
            >
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </ActionButton>
            <ActionButton 
              variant="destructive" 
              size="sm"
              onClick={async () => {
                if (confirm('Êtes-vous sûr de vouloir activer le mode maintenance ?')) {
                  await adminActions.enableMaintenanceMode();
                }
              }}
              loadingText="Activation..."
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mode Maintenance
            </ActionButton>
          </div>
        </div>

        {/* Enhanced System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`absolute inset-0 ${stat.bgColor} opacity-5`} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <div className="flex items-center gap-2">
                        {typeof stat.value === 'number' ? (
                          <p className="text-2xl font-bold">
                            <AnimatedCounter value={stat.value} />
                          </p>
                        ) : (
                          <p className="text-2xl font-bold">{stat.value}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <p className="text-sm text-green-600 font-medium">{stat.growth}</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher utilisateurs, organisations, logs système..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

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
                  <ActionButton onClick={async () => {
                    await adminActions.createUser({
                      name: 'Nouvel Utilisateur',
                      email: 'nouveau@email.com',
                      role: 'user',
                      plan: 'standard'
                    });
                  }}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Nouvel Utilisateur
                  </ActionButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-primary/10">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg">{user.name}</h3>
                                <Badge className={`${getRoleColor(user.role)} text-white`}>
                                  {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {user.plan}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Produits:</span> {user.products}
                                </div>
                                <div>
                                  <span className="font-medium">CA:</span> {user.revenue}
                                </div>
                                <div>
                                  <span className="font-medium">Connexion:</span> {user.lastLogin}
                                </div>
                                <div>
                                  <Badge className={`${getStatusColor(user.status)} text-white text-xs`}>
                                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <ActionButton 
                              variant="outline" 
                              size="sm"
                              onClick={() => adminActions.viewUserDetails(user.id.toString())}
                              aria-label={`Voir les détails de ${user.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </ActionButton>
                            <Select
                              value={user.role}
                              onValueChange={(newRole: 'admin' | 'user') => 
                                handleRoleChange(user.id.toString(), newRole)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <ActionButton 
                              variant="outline" 
                              size="sm"
                            onClick={async () => {
                              await adminActions.updateUser(user.id.toString(), {
                                id: user.id.toString(),
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                plan: user.plan
                              });
                            }}
                              aria-label={`Modifier ${user.name}`}
                            >
                              <Settings className="w-4 h-4" />
                            </ActionButton>
                            <ActionButton 
                              variant="destructive" 
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Suspendre ${user.name} ?`)) {
                                  await adminActions.suspendUser(user.id.toString(), user.name);
                                }
                              }}
                              aria-label={`Suspendre ${user.name}`}
                              loadingText="Suspension..."
                            >
                              <Ban className="w-4 h-4" />
                            </ActionButton>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                          <ActionButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => orgActions.viewOrgDetails(org.id.toString())}
                          >
                            Voir Détails
                          </ActionButton>
                          <ActionButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => orgActions.manageOrg(org.id.toString())}
                          >
                            Gérer
                          </ActionButton>
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
  )
}