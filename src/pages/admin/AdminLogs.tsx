import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Info,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Terminal,
  Database,
  Server,
  Shield
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: string
  message: string
  user_id?: string
  user_email?: string
  ip_address?: string
  metadata?: any
}

const logLevels = [
  { value: 'all', label: 'Tous les niveaux' },
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600' },
  { value: 'warning', label: 'Warning', icon: AlertCircle, color: 'text-yellow-600' },
  { value: 'error', label: 'Error', icon: XCircle, color: 'text-red-600' },
  { value: 'critical', label: 'Critical', icon: AlertCircle, color: 'text-purple-600' }
]

const logCategories = [
  { value: 'all', label: 'Toutes les catégories', icon: Activity },
  { value: 'auth', label: 'Authentification', icon: Shield },
  { value: 'api', label: 'API', icon: Server },
  { value: 'database', label: 'Base de données', icon: Database },
  { value: 'security', label: 'Sécurité', icon: Shield },
  { value: 'system', label: 'Système', icon: Terminal }
]

export default function AdminLogs() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchLogs()
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedLevel, selectedCategory, autoRefresh])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      // Fetch from multiple sources
      const [securityEvents, apiLogs, activityLogs] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('api_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ])

      // Transform and combine logs
      const combinedLogs: LogEntry[] = [
        ...(securityEvents.data || []).map(log => ({
          id: log.id,
          timestamp: log.created_at,
          level: (log.severity || 'info') as LogEntry['level'],
          category: 'security',
          message: log.description,
          user_id: log.user_id,
          metadata: log.metadata
        })),
        ...(apiLogs.data || []).map(log => ({
          id: log.id,
          timestamp: log.created_at || new Date().toISOString(),
          level: (log.status_code >= 500 ? 'error' : log.status_code >= 400 ? 'warning' : 'info') as LogEntry['level'],
          category: 'api',
          message: `${log.method} ${log.endpoint} - ${log.status_code}`,
          user_id: log.user_id,
          ip_address: log.ip_address,
          metadata: { response_time: log.response_time_ms, error: log.error_message }
        })),
        ...(activityLogs.data || []).map(log => ({
          id: log.id,
          timestamp: log.created_at,
          level: (log.severity || 'info') as LogEntry['level'],
          category: log.entity_type || 'system',
          message: log.description,
          user_id: log.user_id,
          ip_address: log.ip_address,
          metadata: log.details
        }))
      ]

      // Sort by timestamp
      combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Apply filters
      let filteredLogs = combinedLogs
      if (selectedLevel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === selectedLevel)
      }
      if (selectedCategory !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.category === selectedCategory)
      }
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setLogs(filteredLogs)
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User ID', 'IP Address'].join(','),
      ...logs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message.replace(/,/g, ';'),
        log.user_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`
    a.click()
    
    toast({
      title: 'Export réussi',
      description: 'Les logs ont été exportés en CSV'
    })
  }

  const getLevelIcon = (level: string) => {
    const levelConfig = logLevels.find(l => l.value === level)
    if (!levelConfig || !levelConfig.icon) return Info
    return levelConfig.icon
  }

  const getLevelColor = (level: string) => {
    const levelConfig = logLevels.find(l => l.value === level)
    return levelConfig?.color || 'text-gray-600'
  }

  const getCategoryIcon = (category: string) => {
    const categoryConfig = logCategories.find(c => c.value === category)
    return categoryConfig?.icon || Activity
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Terminal className="h-8 w-8" />
            Logs Système
          </h1>
          <p className="text-muted-foreground mt-2">
            Surveillance et analyse des logs en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-500' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {logLevels.slice(1).map(level => {
          const count = logs.filter(log => log.level === level.value).length
          const Icon = level.icon
          return (
            <Card key={level.value}>
              <CardContent className="p-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${level.color}`} />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{level.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrées de logs ({logs.length})</CardTitle>
          <CardDescription>Logs système en temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Chargement des logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucun log trouvé</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => {
                const LevelIcon = getLevelIcon(log.level)
                const CategoryIcon = getCategoryIcon(log.category)
                
                return (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded ${getLevelColor(log.level)} bg-accent/10`}>
                        <LevelIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {log.category}
                            </Badge>
                            <Badge variant="outline" className={getLevelColor(log.level)}>
                              {log.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                          </div>
                        </div>
                        
                        <p className="text-sm font-medium">{log.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.user_id && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user_id.substring(0, 8)}...
                            </div>
                          )}
                          {log.ip_address && (
                            <div className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {log.ip_address}
                            </div>
                          )}
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
