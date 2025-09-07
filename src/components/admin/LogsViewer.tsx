import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Search, 
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Shield,
  Globe,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
  user?: string
  ip?: string
  action?: string
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    level: 'info',
    source: 'auth',
    message: 'Utilisateur connecté avec succès',
    user: 'user@example.com',
    ip: '192.168.1.100',
    action: 'login'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:29:45',
    level: 'warning',
    source: 'api',
    message: 'Limite de taux atteinte pour l\'API',
    ip: '192.168.1.101',
    action: 'api_limit'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:28:12',
    level: 'error',
    source: 'database',
    message: 'Échec de connexion à la base de données',
    action: 'db_connection'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:27:33',
    level: 'info',
    source: 'import',
    message: 'Import de produits terminé avec succès',
    user: 'admin@example.com',
    action: 'product_import'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:26:55',
    level: 'debug',
    source: 'system',
    message: 'Nettoyage automatique des fichiers temporaires',
    action: 'cleanup'
  },
]

const securityLogs: LogEntry[] = [
  {
    id: 'sec_1',
    timestamp: '2024-01-15 14:25:12',
    level: 'warning',
    source: 'security',
    message: 'Tentative de connexion échouée',
    ip: '192.168.1.200',
    action: 'failed_login'
  },
  {
    id: 'sec_2',
    timestamp: '2024-01-15 14:20:45',
    level: 'info',
    source: 'security',
    message: 'Nouveau dispositif détecté',
    user: 'user@example.com',
    ip: '192.168.1.150',
    action: 'new_device'
  },
  {
    id: 'sec_3',
    timestamp: '2024-01-15 14:15:33',
    level: 'error',
    source: 'security',
    message: 'Tentative d\'accès non autorisé détectée',
    ip: '192.168.1.250',
    action: 'unauthorized_access'
  },
]

const apiLogs: LogEntry[] = [
  {
    id: 'api_1',
    timestamp: '2024-01-15 14:30:01',
    level: 'info',
    source: 'api',
    message: 'GET /api/products - 200 OK (125ms)',
    ip: '192.168.1.100',
    action: 'api_request'
  },
  {
    id: 'api_2',
    timestamp: '2024-01-15 14:29:58',
    level: 'warning',
    source: 'api',
    message: 'POST /api/orders - 429 Too Many Requests',
    ip: '192.168.1.101',
    action: 'api_limit'
  },
]

export const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(mockLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let filtered = logs
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter)
    }
    
    setFilteredLogs(filtered)
  }, [logs, searchTerm, levelFilter, sourceFilter])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (autoRefresh) {
      interval = setInterval(() => {
        // Simuler l'ajout de nouveaux logs
        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString(),
          level: 'info',
          source: 'system',
          message: 'Vérification automatique système',
          action: 'health_check'
        }
        setLogs(prev => [newLog, ...prev])
      }, 10000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'debug':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default',
      debug: 'outline'
    }
    return (
      <Badge variant={variants[level as keyof typeof variants] as any}>
        {level.toUpperCase()}
      </Badge>
    )
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'auth':
        return <Shield className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Globe className="h-4 w-4" />
      case 'system':
        return <Activity className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "Les logs seront téléchargés dans quelques instants",
    })
  }

  const refreshLogs = () => {
    toast({
      title: "Logs actualisés",
      description: "Les derniers logs ont été récupérés",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Logs Système
          </h2>
          <p className="text-muted-foreground">
            Consultez et analysez l'activité de la plateforme en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={refreshLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Rechercher dans les logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="auth">Authentification</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="database">Base de données</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tous les Logs</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>
                Logs Récents ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Niveau</TableHead>
                    <TableHead className="w-32">Timestamp</TableHead>
                    <TableHead className="w-24">Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-40">Utilisateur/IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          {getLevelBadge(log.level)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(log.source)}
                          <span className="capitalize">{log.source}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.message}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          {log.user && <div>{log.user}</div>}
                          {log.ip && <div className="font-mono">{log.ip}</div>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Logs de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell className="font-mono">{log.ip}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Logs API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="font-mono">{log.message}</TableCell>
                      <TableCell className="font-mono">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">2,847</div>
                      <p className="text-sm text-muted-foreground">Événements aujourd'hui</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">12</div>
                      <p className="text-sm text-muted-foreground">Erreurs critiques</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600">45</div>
                      <p className="text-sm text-muted-foreground">Avertissements</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}