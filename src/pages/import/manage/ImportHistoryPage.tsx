import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, XCircle, Clock, Package, Search,
  Download, MoreVertical, Eye, RotateCcw, Trash2,
  LayoutGrid, List, SortAsc, SortDesc, Loader2,
  FileSpreadsheet, AlertTriangle, RefreshCw, X
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { unifiedImportService, ImportJobStatus } from '@/services/UnifiedImportService'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ImportLiveTracker } from '@/components/import/ImportLiveTracker'

export default function ImportHistoryPage() {
  const prefersReducedMotion = useReducedMotion()
  const queryClient = useQueryClient()
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  
  // Dialog states
  const [selectedJob, setSelectedJob] = useState<ImportJobStatus | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)

  // Fetch history
  const { data: history = [], isLoading, refetch } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => unifiedImportService.getHistory(100),
    refetchInterval: 10000
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('import_jobs')
        .delete()
        .eq('id', jobId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Import supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      setDeleteDialogOpen(false)
      setJobToDelete(null)
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  })

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await unifiedImportService.retryJob(jobId)
    },
    onSuccess: () => {
      toast.success('Import relancé avec succès')
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
    },
    onError: (error: any) => {
      toast.error(`Erreur lors du relancement: ${error.message}`)
    }
  })

  // Cancel mutation  
  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await unifiedImportService.cancelJob(jobId)
    },
    onSuccess: () => {
      toast.success('Import annulé')
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'annulation: ${error.message}`)
    }
  })

  // Stats calculation
  const stats = useMemo(() => {
    const completed = history.filter(h => h.status === 'completed').length
    const failed = history.filter(h => h.status === 'failed').length
    const processing = history.filter(h => h.status === 'processing').length
    const totalProducts = history.reduce((sum, h) => sum + (h.success_rows || 0), 0)
    
    return [
      { label: 'Total imports', value: history.length.toString() },
      { label: 'Réussis', value: completed.toString() },
      { label: 'Produits importés', value: totalProducts.toString() },
      { label: 'Taux succès', value: `${history.length > 0 ? Math.round((completed / history.length) * 100) : 0}%` }
    ]
  }, [history])

  // Status config
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Terminé' },
      processing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'En cours' },
      failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' }
    }
    return configs[status] || configs.pending
  }

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status)
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", config.bgColor, config.color)}>
        <config.icon className={cn("w-3 h-3", status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
        {config.label}
      </Badge>
    )
  }

  // Filter history
  const filteredHistory = useMemo(() => {
    let filtered = [...history]
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.source_type === typeFilter)
    }
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.source_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [history, statusFilter, typeFilter, searchQuery, sortOrder])

  // Export CSV function
  const handleExportCSV = useCallback(() => {
    if (filteredHistory.length === 0) {
      toast.warning('Aucune donnée à exporter')
      return
    }

    const headers = ['ID', 'Type', 'Status', 'Produits Réussis', 'Produits Échoués', 'Total', 'Date', 'URL Source']
    const rows = filteredHistory.map(item => [
      item.id,
      item.source_type || 'N/A',
      item.status,
      item.success_rows?.toString() || '0',
      item.error_rows?.toString() || '0',
      item.total_rows?.toString() || '0',
      format(new Date(item.created_at), 'dd/MM/yyyy HH:mm'),
      item.source_url || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `import-history-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`${filteredHistory.length} imports exportés en CSV`)
  }, [filteredHistory])

  // View details
  const handleViewDetails = useCallback((job: ImportJobStatus) => {
    setSelectedJob(job)
    setDetailsOpen(true)
  }, [])

  // Delete job
  const handleDelete = useCallback((jobId: string) => {
    setJobToDelete(jobId)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete)
    }
  }, [jobToDelete, deleteMutation])

  // Retry job
  const handleRetry = useCallback((jobId: string) => {
    retryMutation.mutate(jobId)
  }, [retryMutation])

  // Cancel job
  const handleCancel = useCallback((jobId: string) => {
    cancelMutation.mutate(jobId)
  }, [cancelMutation])

  return (
    <ChannablePageWrapper
      title="Historique des Imports"
      description="Consultez l'historique complet de vos imports avec des statistiques détaillées et des filtres avancés."
      heroImage="import"
      badge={{ label: 'Historique', icon: Clock }}
      actions={
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      }
    >

      {/* Live Import Tracker */}
      <ImportLiveTracker />

      {/* Filters Card */}
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
      >
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par source, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="bulk_import">Import en masse</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  title={sortOrder === 'desc' ? 'Plus récent en premier' : 'Plus ancien en premier'}
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </Button>

                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('list')}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('grid')}
                    title="Vue grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => refetch()}
                  title="Actualiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Import List */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Imports ({filteredHistory.length})</CardTitle>
              <CardDescription>Liste complète de vos imports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Aucun résultat' : 'Aucun import'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Essayez d\'ajuster vos filtres'
                  : 'Votre historique d\'import apparaîtra ici'
                }
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((item, index) => {
                  const statusConfig = getStatusConfig(item.status)
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, x: -20 },
                        transition: { delay: index * 0.03 }
                      })}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                          <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, item.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {item.source_type?.toUpperCase() || 'Import'}
                            <Badge variant="outline" className="text-xs">
                              {item.source_type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
                          </div>
                          {item.source_url && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                              {item.source_url}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{item.success_rows || 0}</p>
                          <p className="text-xs text-muted-foreground">
                            sur {item.total_rows || 0}
                            {item.error_rows > 0 && <span className="text-red-500 ml-1">({item.error_rows} erreurs)</span>}
                          </p>
                        </div>
                        
                        {item.status === 'processing' && item.total_rows > 0 && (
                          <div className="w-24">
                            <Progress 
                              value={((item.success_rows || 0) / item.total_rows) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        {getStatusBadge(item.status)}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {item.status === 'failed' && (
                              <DropdownMenuItem 
                                onClick={() => handleRetry(item.id)}
                                disabled={retryMutation.isPending}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Relancer
                              </DropdownMenuItem>
                            )}
                            {item.status === 'processing' && (
                              <DropdownMenuItem 
                                onClick={() => handleCancel(item.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((item, index) => {
                  const statusConfig = getStatusConfig(item.status)
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, scale: 0.95 },
                        animate: { opacity: 1, scale: 1 },
                        exit: { opacity: 0, scale: 0.9 },
                        transition: { delay: index * 0.03 }
                      })}
                    >
                      <Card className="hover:shadow-md transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", statusConfig.bgColor)}>
                              <statusConfig.icon className={cn("w-5 h-5", statusConfig.color, item.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                          
                          <h3 className="font-semibold mb-1 truncate">{item.source_type?.toUpperCase() || 'Import'}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                          </p>
                          
                          {item.status === 'processing' && item.total_rows > 0 && (
                            <Progress 
                              value={((item.success_rows || 0) / item.total_rows) * 100} 
                              className="h-2 mb-4"
                            />
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{item.success_rows || 0}</p>
                              <p className="text-xs text-muted-foreground">
                                produits
                                {item.error_rows > 0 && <span className="text-red-500 ml-1">({item.error_rows} erreurs)</span>}
                              </p>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {item.status === 'failed' && (
                                  <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Relancer
                                  </DropdownMenuItem>
                                )}
                                {item.status === 'processing' && (
                                  <DropdownMenuItem onClick={() => handleCancel(item.id)}>
                                    <X className="w-4 h-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {selectedJob && (() => {
            const statusConfig = getStatusConfig(selectedJob.status)
            const successRate = selectedJob.total_rows > 0 
              ? Math.round((selectedJob.success_rows / selectedJob.total_rows) * 100)
              : 0
            const duration = selectedJob.started_at && selectedJob.completed_at
              ? Math.round((new Date(selectedJob.completed_at).getTime() - new Date(selectedJob.started_at).getTime()) / 1000)
              : null
            
            return (
              <>
                {/* Header with gradient */}
                <div className={cn(
                  "relative px-6 py-8 text-white overflow-hidden",
                  selectedJob.status === 'completed' && "bg-gradient-to-br from-green-500 to-emerald-600",
                  selectedJob.status === 'failed' && "bg-gradient-to-br from-red-500 to-rose-600",
                  selectedJob.status === 'processing' && "bg-gradient-to-br from-blue-500 to-indigo-600",
                  selectedJob.status === 'pending' && "bg-gradient-to-br from-amber-500 to-orange-600"
                )}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <statusConfig.icon className={cn("w-8 h-8 text-white", selectedJob.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedJob.source_type?.toUpperCase() || 'Import'}</h2>
                        <p className="text-white/80 text-sm mt-1">
                          {format(new Date(selectedJob.created_at), 'EEEE dd MMMM yyyy', { locale: getDateFnsLocale() })}
                        </p>
                        <p className="text-white/60 text-xs">
                          à {format(new Date(selectedJob.created_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Stats row in header */}
                  <div className="relative grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{selectedJob.success_rows || 0}</p>
                      <p className="text-xs text-white/70 mt-1">Réussis</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{selectedJob.error_rows || 0}</p>
                      <p className="text-xs text-white/70 mt-1">Échoués</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{selectedJob.total_rows || 0}</p>
                      <p className="text-xs text-white/70 mt-1">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{successRate}%</p>
                      <p className="text-xs text-white/70 mt-1">Succès</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="max-h-[45vh]">
                  <div className="p-6 space-y-6">
                    {/* Progress bar for processing */}
                    {selectedJob.status === 'processing' && selectedJob.total_rows > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="font-medium">{selectedJob.progress}%</span>
                        </div>
                        <Progress value={selectedJob.progress} className="h-3" />
                      </div>
                    )}

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileSpreadsheet className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">ID Import</p>
                              <p className="font-mono text-xs truncate max-w-[150px]" title={selectedJob.id}>
                                {selectedJob.id.slice(0, 8)}...{selectedJob.id.slice(-4)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Type source</p>
                              <Badge variant="secondary" className="mt-1">
                                {selectedJob.source_type?.toUpperCase() || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Démarré</p>
                              <p className="text-sm font-medium">
                                {selectedJob.started_at 
                                  ? format(new Date(selectedJob.started_at), 'HH:mm:ss') 
                                  : 'En attente'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Durée</p>
                              <p className="text-sm font-medium">
                                {duration !== null ? (
                                  duration < 60 
                                    ? `${duration}s`
                                    : `${Math.floor(duration / 60)}m ${duration % 60}s`
                                ) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Source URL */}
                    {selectedJob.source_url && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          URL Source
                        </p>
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <p className="text-sm font-mono break-all text-muted-foreground">
                            {selectedJob.source_url}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Errors */}
                    {selectedJob.errors && selectedJob.errors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <p className="text-sm font-medium text-red-600">
                            Erreurs détectées ({selectedJob.errors.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {selectedJob.errors.slice(0, 5).map((error, i) => (
                            <div 
                              key={i} 
                              className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                          ))}
                          {selectedJob.errors.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                              + {selectedJob.errors.length - 5} autres erreurs
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        Chronologie
                      </p>
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        <div className="relative">
                          <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          <div className="text-sm">
                            <p className="font-medium">Créé</p>
                            <p className="text-muted-foreground">
                              {format(new Date(selectedJob.created_at), 'dd/MM/yyyy à HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                        {selectedJob.started_at && (
                          <div className="relative">
                            <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-blue-500 border-2 border-background" />
                            <div className="text-sm">
                              <p className="font-medium">Démarré</p>
                              <p className="text-muted-foreground">
                                {format(new Date(selectedJob.started_at), 'dd/MM/yyyy à HH:mm:ss')}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedJob.completed_at && (
                          <div className="relative">
                            <div className={cn(
                              "absolute -left-[18px] w-3 h-3 rounded-full border-2 border-background",
                              selectedJob.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                            )} />
                            <div className="text-sm">
                              <p className="font-medium">
                                {selectedJob.status === 'completed' ? 'Terminé' : 'Échoué'}
                              </p>
                              <p className="text-muted-foreground">
                                {format(new Date(selectedJob.completed_at), 'dd/MM/yyyy à HH:mm:ss')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Dernière mise à jour: {format(new Date(selectedJob.updated_at), 'HH:mm:ss')}
                  </div>
                  <div className="flex gap-2">
                    {selectedJob.status === 'failed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          handleRetry(selectedJob.id)
                          setDetailsOpen(false)
                        }}
                        disabled={retryMutation.isPending}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Relancer
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setDetailsOpen(false)
                        handleDelete(selectedJob.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                    <Button size="sm" onClick={() => setDetailsOpen(false)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet import ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChannablePageWrapper>
  )
}
