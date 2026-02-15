import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Search, RefreshCw, AlertCircle, CheckCircle, Clock, Download, Loader2 } from 'lucide-react'

interface SyncLog {
  id: string
  integration_id: string
  sync_type: string
  status: 'success' | 'error' | 'in_progress'
  items_processed: number
  items_success: number
  items_error: number
  error_message?: string
  started_at: string
  completed_at?: string
  platform_name?: string
}

export const SyncLogsTable = () => {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['sync-logs', user?.id, statusFilter, typeFilter],
    queryFn: async () => {
      if (!user) return []

      // Query jobs table (unified source of truth)
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, job_type, job_subtype, status, processed_items, failed_items, started_at, completed_at, error_message, metadata, name')
        .eq('user_id', user.id)
        .in('job_type', ['sync', 'import', 'export'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (error || !jobs) return []

      return jobs.map((job: any): SyncLog => ({
        id: job.id,
        integration_id: job.id,
        platform_name: job.name || job.job_subtype || job.job_type,
        sync_type: job.job_subtype || job.job_type,
        status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'in_progress',
        items_processed: job.processed_items || 0,
        items_success: (job.processed_items || 0) - (job.failed_items || 0),
        items_error: job.failed_items || 0,
        started_at: job.started_at || job.completed_at || new Date().toISOString(),
        completed_at: job.completed_at || undefined,
        error_message: job.error_message || undefined
      }))
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.platform_name?.toLowerCase().includes(search.toLowerCase()) ||
                          log.sync_type.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesType = typeFilter === 'all' || log.sync_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Réussi</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>
      case 'in_progress':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En cours</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'products': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'orders': return 'bg-green-100 text-green-800 border-green-200'
      case 'inventory': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Plateforme', 'Type', 'Statut', 'Éléments traités', 'Succès', 'Erreurs', 'Démarré le', 'Terminé le'].join(','),
      ...filteredLogs.map(log => [
        log.platform_name || 'N/A',
        log.sync_type,
        log.status,
        log.items_processed,
        log.items_success,
        log.items_error,
        new Date(log.started_at).toLocaleString(),
        log.completed_at ? new Date(log.completed_at).toLocaleString() : 'En cours'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sync-logs.csv'
    a.click()
  }

  const successRate = logs.length > 0 
    ? Math.round((logs.filter(log => log.status === 'success').length / logs.length) * 100)
    : 0

  const totalProcessed = logs.reduce((sum, log) => sum + log.items_processed, 0)
  const totalErrors = logs.reduce((sum, log) => sum + log.items_error, 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Syncs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de réussite</p>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Éléments traités</p>
                <p className="text-2xl font-bold">{totalProcessed.toLocaleString()}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historique des Synchronisations</CardTitle>
              <CardDescription>Consultez l'historique de toutes les synchronisations effectuées</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />Actualiser
              </Button>
              <Button variant="outline" onClick={exportLogs} size="sm">
                <Download className="w-4 h-4 mr-2" />Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="success">Réussi</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="products">Produits</SelectItem>
                <SelectItem value="orders">Commandes</SelectItem>
                <SelectItem value="inventory">Inventaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Éléments</TableHead>
                  <TableHead>Succès</TableHead>
                  <TableHead>Erreurs</TableHead>
                  <TableHead>Démarré le</TableHead>
                  <TableHead>Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun historique de synchronisation
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.platform_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(log.sync_type)}>{log.sync_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.items_processed.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">{log.items_success.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600 font-medium">{log.items_error.toLocaleString()}</TableCell>
                      <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.completed_at ? (
                          `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / (1000 * 60))}min`
                        ) : (
                          <Badge variant="outline">En cours</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
