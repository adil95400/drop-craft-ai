import { useState, useEffect, useCallback } from 'react'
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
import { supabase } from '@/integrations/supabase/client'

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

export const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchRealLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch from multiple real sources
      const [securityEvents, activityLogs, apiLogs] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('api_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      const realLogs: LogEntry[] = []

      // Convert security events
      if (securityEvents.data) {
        securityEvents.data.forEach((event: any) => {
          realLogs.push({
            id: `sec_${event.id}`,
            timestamp: new Date(event.created_at).toLocaleString(),
            level: event.severity === 'critical' ? 'error' : event.severity === 'warning' ? 'warning' : 'info',
            source: 'security',
            message: event.description || event.event_type || 'Security event',
            user: event.user_id?.slice(0, 8),
            ip: event.metadata?.ip_address,
            action: event.event_type
          })
        })
      }

      // Convert activity logs
      if (activityLogs.data) {
        activityLogs.data.forEach((log: any) => {
          realLogs.push({
            id: `act_${log.id}`,
            timestamp: new Date(log.created_at).toLocaleString(),
            level: log.severity === 'critical' ? 'error' : log.severity === 'warning' ? 'warning' : 'info',
            source: log.source || 'system',
            message: log.description || log.action,
            user: log.user_id?.slice(0, 8),
            ip: log.ip_address,
            action: log.action
          })
        })
      }

      // Convert API logs
      if (apiLogs.data) {
        apiLogs.data.forEach((log: any) => {
          realLogs.push({
            id: `api_${log.id}`,
            timestamp: new Date(log.created_at).toLocaleString(),
            level: log.status_code >= 500 ? 'error' : log.status_code >= 400 ? 'warning' : 'info',
            source: 'api',
            message: `${log.method} ${log.endpoint} - ${log.status_code} (${log.response_time_ms || 0}ms)`,
            ip: log.ip_address,
            action: 'api_request'
          })
        })
      }

      // Sort by timestamp
      realLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setLogs(realLogs)
      setFilteredLogs(realLogs)
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRealLogs()
  }, [fetchRealLogs])

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
        fetchRealLogs()
      }, 10000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchRealLogs])

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
    const csvContent = [
      ['Timestamp', 'Level', 'Source', 'Message', 'User', 'IP', 'Action'].join(','),
      ...filteredLogs.map(log => 
        [log.timestamp, log.level, log.source, `"${log.message}"`, log.user || '', log.ip || '', log.action || ''].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export réussi",
      description: `${filteredLogs.length} logs exportés`
    })
  }

  // Calculate real stats
  const errorCount = logs.filter(l => l.level === 'error').length
  const warningCount = logs.filter(l => l.level === 'warning').length

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
            Données en temps réel depuis Supabase
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={fetchRealLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
          <TabsTrigger value="all">Tous les Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="errors">Erreurs ({errorCount})</TabsTrigger>
          <TabsTrigger value="warnings">Avertissements ({warningCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>
                Logs Récents ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun log trouvé</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Erreurs ({errorCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(l => l.level === 'error').map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{log.message}</TableCell>
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

        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Avertissements ({warningCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(l => l.level === 'warning').map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell className="font-mono">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
