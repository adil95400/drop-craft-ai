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
import { fr } from 'date-fns/locale'
import { unifiedImportService, ImportJobStatus } from '@/services/UnifiedImportService'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
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
    <ChannablePageLayout
      title="Historique des Imports"
      metaTitle="Historique des Imports"
      metaDescription="Suivez tous vos imports en détail avec statistiques et filtres avancés"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'import"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge={{ label: "Historique", icon: Clock }}
        title="Historique des imports"
        subtitle="suivi en temps réel"
        description="Consultez l'historique complet de vos imports avec des statistiques détaillées et des filtres avancés."
        stats={stats}
        showHexagons={!prefersReducedMotion}
        variant="compact"
      />

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
                            {format(new Date(item.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Détails de l'import
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur cet import
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const config = getStatusConfig(selectedJob.status)
                      return (
                        <>
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bgColor)}>
                            <config.icon className={cn("w-6 h-6", config.color)} />
                          </div>
                          <div>
                            <p className="font-medium">{config.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedJob.created_at), 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  {getStatusBadge(selectedJob.status)}
                </div>

                <Separator />

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Import</p>
                    <p className="font-mono text-sm">{selectedJob.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{selectedJob.source_type?.toUpperCase() || 'N/A'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Produits réussis</p>
                    <p className="text-2xl font-bold text-green-600">{selectedJob.success_rows || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Produits échoués</p>
                    <p className="text-2xl font-bold text-red-500">{selectedJob.error_rows || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total traité</p>
                    <p className="text-xl font-semibold">{selectedJob.total_rows || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Progression</p>
                    <p className="text-xl font-semibold">{selectedJob.progress || 0}%</p>
                  </div>
                </div>

                {selectedJob.source_url && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">URL Source</p>
                      <p className="text-sm break-all bg-muted p-2 rounded">{selectedJob.source_url}</p>
                    </div>
                  </>
                )}

                {/* Errors */}
                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="font-medium">Erreurs ({selectedJob.errors.length})</p>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedJob.errors.map((error, i) => (
                          <div key={i} className="text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Démarré</p>
                    <p>{selectedJob.started_at ? format(new Date(selectedJob.started_at), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Terminé</p>
                    <p>{selectedJob.completed_at ? format(new Date(selectedJob.completed_at), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            {selectedJob?.status === 'failed' && (
              <Button 
                variant="outline" 
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
            <Button variant="secondary" onClick={() => setDetailsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
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
    </ChannablePageLayout>
  )
}
