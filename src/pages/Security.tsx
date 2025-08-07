import { useState } from 'react'
import { Shield, AlertTriangle, Lock, Key, Eye, UserCheck, Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const securityMetrics = {
  securityScore: 85,
  vulnerabilities: 3,
  lastScan: '2024-01-07 10:30',
  activeThreats: 0,
  blocked: 247,
  ssl: true,
  firewall: true,
  backup: true,
  monitoring: true
}

const securityEvents = [
  {
    id: 1,
    type: 'warning',
    title: 'Tentative de connexion suspecte',
    description: 'Plusieurs tentatives de connexion échouées depuis 192.168.1.100',
    timestamp: '2024-01-07 14:25',
    severity: 'medium',
    status: 'blocked'
  },
  {
    id: 2,
    type: 'info',
    title: 'Mise à jour de sécurité appliquée',
    description: 'Patch de sécurité v2.1.3 installé avec succès',
    timestamp: '2024-01-07 09:15',
    severity: 'low',
    status: 'resolved'
  },
  {
    id: 3,
    type: 'critical',
    title: 'Violation potentielle détectée',
    description: 'Accès non autorisé détecté sur l\'endpoint /api/admin',
    timestamp: '2024-01-06 22:30',
    severity: 'high',
    status: 'investigating'
  }
]

const accessLogs = [
  {
    id: 1,
    user: 'admin@system.com',
    action: 'Login',
    ip: '192.168.1.50',
    timestamp: '2024-01-07 14:30',
    status: 'success',
    device: 'Chrome - Windows 11'
  },
  {
    id: 2,
    user: 'user@example.com',
    action: 'View Products',
    ip: '10.0.0.25',
    timestamp: '2024-01-07 14:15',
    status: 'success',
    device: 'Safari - macOS'
  },
  {
    id: 3,
    user: 'unknown',
    action: 'Failed Login',
    ip: '192.168.1.100',
    timestamp: '2024-01-07 13:45',
    status: 'failed',
    device: 'Firefox - Linux'
  }
]

const vulnerabilities = [
  {
    id: 1,
    title: 'Mot de passe faible détecté',
    description: 'Un utilisateur utilise un mot de passe ne respectant pas les critères de sécurité',
    severity: 'medium',
    category: 'Authentication',
    status: 'open',
    discovered: '2024-01-06'
  },
  {
    id: 2,
    title: 'Bibliothèque obsolète',
    description: 'Une dépendance npm présente des vulnérabilités connues',
    severity: 'low',
    category: 'Dependencies',
    status: 'patched',
    discovered: '2024-01-05'
  },
  {
    id: 3,
    title: 'Endpoint non sécurisé',
    description: 'API endpoint accessible sans authentification appropriée',
    severity: 'high',
    category: 'API Security',
    status: 'investigating',
    discovered: '2024-01-07'
  }
]

export default function Security() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'blocked':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Sécurité
          </h1>
          <p className="text-muted-foreground mt-2">
            Surveillez et protégez votre plateforme contre les menaces
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Eye className="w-4 h-4 mr-2" />
          Scan de Sécurité
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="access">Accès</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Security Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Score de Sécurité
              </CardTitle>
              <CardDescription>Évaluation globale de votre sécurité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{securityMetrics.securityScore}/100</span>
                  <Badge className={`${
                    securityMetrics.securityScore >= 80 ? 'bg-green-500' :
                    securityMetrics.securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  } text-white`}>
                    {securityMetrics.securityScore >= 80 ? 'Bon' :
                     securityMetrics.securityScore >= 60 ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
                <Progress value={securityMetrics.securityScore} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${securityMetrics.ssl ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>SSL/TLS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${securityMetrics.firewall ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Firewall</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${securityMetrics.backup ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Sauvegardes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${securityMetrics.monitoring ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Monitoring</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vulnérabilités</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.vulnerabilities}</div>
                <p className="text-xs text-muted-foreground">
                  Nécessitent attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menaces Actives</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.activeThreats}</div>
                <p className="text-xs text-muted-foreground">
                  En cours de traitement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attaques Bloquées</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.blocked}</div>
                <p className="text-xs text-muted-foreground">
                  Dernières 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernier Scan</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{securityMetrics.lastScan}</div>
                <p className="text-xs text-muted-foreground">
                  Scan automatique
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnérabilités Détectées</CardTitle>
              <CardDescription>Problèmes de sécurité nécessitant une attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vulnerabilities.slice(0, 3).map((vuln) => (
                  <div key={vuln.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(vuln.severity)}`} />
                      <div>
                        <div className="font-medium">{vuln.title}</div>
                        <div className="text-sm text-muted-foreground">{vuln.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{vuln.category}</Badge>
                          <span className="text-xs text-muted-foreground">Découverte: {vuln.discovered}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={vuln.status === 'open' ? 'destructive' : 'secondary'}
                      >
                        {vuln.status === 'open' && 'Ouverte'}
                        {vuln.status === 'patched' && 'Corrigée'}
                        {vuln.status === 'investigating' && 'Investigation'}
                      </Badge>
                      <Button variant="outline" size="sm">Corriger</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité</CardTitle>
              <CardDescription>Activité de sécurité en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <AlertTriangle className={`h-5 w-5 mt-1 ${
                      event.severity === 'high' ? 'text-red-500' :
                      event.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${getSeverityColor(event.severity)} text-white`}
                          >
                            {event.severity === 'high' ? 'Élevé' :
                             event.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                          <Badge variant="outline">
                            {event.status === 'blocked' && 'Bloqué'}
                            {event.status === 'resolved' && 'Résolu'}
                            {event.status === 'investigating' && 'Investigation'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {event.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'Accès</CardTitle>
              <CardDescription>Historique des connexions et actions utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Adresse IP</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          {log.user}
                        </div>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      <TableCell className="text-sm">{log.device}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(log.status)}`}>
                          {log.status === 'success' ? 'Succès' : 'Échec'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Sécurité</CardTitle>
                <CardDescription>Configuration des mesures de protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Authentification à deux facteurs</div>
                    <div className="text-sm text-muted-foreground">Sécurité supplémentaire pour les comptes</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Monitoring en temps réel</div>
                    <div className="text-sm text-muted-foreground">Surveillance continue des activités</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Blocage automatique IP</div>
                    <div className="text-sm text-muted-foreground">Bloquer les IP suspectes automatiquement</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alertes par email</div>
                    <div className="text-sm text-muted-foreground">Recevoir les alertes de sécurité par email</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions de Sécurité</CardTitle>
                <CardDescription>Outils de maintenance et protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Régénérer les clés API
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Scan complet de sécurité
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Nettoyer les logs anciens
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Forcer déconnexion utilisateurs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}