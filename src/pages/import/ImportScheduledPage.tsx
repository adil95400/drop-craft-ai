import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Clock, Plus, Calendar, TrendingUp, Settings, Play, Pause,
  MoreVertical, Edit, Trash2, CheckCircle, AlertCircle, Search,
  RefreshCw, Timer, Zap, Copy, ExternalLink, Loader2
} from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { useToast } from '@/hooks/use-toast'
import { ScheduleFormDialog, ScheduleFormData } from '@/components/import/ScheduleFormDialog'
import { useScheduledImports, ScheduledImport, CreateScheduledImportData } from '@/hooks/useScheduledImports'

export default function ImportScheduledPage() {
  const prefersReducedMotion = useReducedMotion()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledImport | null>(null)

  // Use real data from hook
  const {
    schedules,
    isLoading,
    stats,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleActive,
    executeNow,
    isCreating,
    isUpdating,
    isDeleting,
    isExecuting
  } = useScheduledImports()

  // Stats for hero
  const heroStats = useMemo(() => [
    { label: 'Total plannings', value: stats.total.toString() },
    { label: 'Actifs', value: stats.active.toString() },
    { label: 'Produits importés', value: stats.totalProductsImported.toString() },
    { label: 'Inactifs', value: stats.inactive.toString() }
  ], [stats])

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (!searchQuery) return schedules
    return schedules.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source_type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [schedules, searchQuery])

  const handleToggleSchedule = async (id: string) => {
    await toggleActive(id)
  }

  const runNow = (id: string) => {
    executeNow(id)
  }

  const handleCreateSchedule = (data: ScheduleFormData) => {
    const payload: CreateScheduledImportData = {
      name: data.name,
      source_type: data.source_type as ScheduledImport['source_type'],
      source_url: data.source_url || undefined,
      frequency: data.frequency as ScheduledImport['frequency'],
      is_active: data.active,
      description: data.description,
      config: {
        auto_optimize: data.auto_optimize,
        auto_publish: data.auto_publish
      }
    }
    createSchedule(payload)
    setIsCreateDialogOpen(false)
  }

  const handleEditSchedule = (data: ScheduleFormData) => {
    if (!selectedSchedule) return
    
    updateSchedule({
      id: selectedSchedule.id,
      data: {
        name: data.name,
        source_type: data.source_type as ScheduledImport['source_type'],
        source_url: data.source_url || undefined,
        frequency: data.frequency as ScheduledImport['frequency'],
        is_active: data.active,
        description: data.description,
        config: {
          auto_optimize: data.auto_optimize,
          auto_publish: data.auto_publish
        }
      }
    })
    setIsEditDialogOpen(false)
    setSelectedSchedule(null)
  }

  const handleDeleteConfirm = () => {
    if (!selectedSchedule) return
    deleteSchedule(selectedSchedule.id)
    setIsDeleteDialogOpen(false)
    setSelectedSchedule(null)
  }

  const openEditDialog = (schedule: ScheduledImport) => {
    setSelectedSchedule(schedule)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (schedule: ScheduledImport) => {
    setSelectedSchedule(schedule)
    setIsDeleteDialogOpen(true)
  }

  const duplicateSchedule = (schedule: ScheduledImport) => {
    const payload: CreateScheduledImportData = {
      name: `${schedule.name} (copie)`,
      source_type: schedule.source_type,
      source_url: schedule.source_url,
      frequency: schedule.frequency,
      is_active: false,
      description: schedule.description,
      config: schedule.config
    }
    createSchedule(payload)
    toast({
      title: 'Planning dupliqué',
      description: `Le planning "${schedule.name}" a été dupliqué`
    })
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'hourly': return 'Toutes les heures'
      case 'daily': return 'Quotidien'
      case 'weekly': return 'Hebdomadaire'
      case 'monthly': return 'Mensuel'
      default: return freq
    }
  }

  const getFrequencyBadge = (freq: string) => {
    const colors: Record<string, string> = {
      hourly: 'bg-purple-500/10 text-purple-500',
      daily: 'bg-blue-500/10 text-blue-500',
      weekly: 'bg-green-500/10 text-green-500',
      monthly: 'bg-orange-500/10 text-orange-500'
    }
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", colors[freq] || colors.daily)}>
        <RefreshCw className="w-3 h-3" />
        {getFrequencyLabel(freq)}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <ChannablePageWrapper
      title="Imports Planifiés"
      description="Planifiez vos imports pour qu'ils s'exécutent automatiquement. Gagnez du temps avec l'automatisation."
      heroImage="automation"
      badge={{ label: 'Automatisation', icon: Calendar }}
      actions={
        <Button 
          className="bg-gradient-to-r from-primary to-purple-600"
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={isCreating}
        >
          {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Nouveau Planning
        </Button>
      }
    >

      {/* Search & Actions */}
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
      >
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un planning..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button 
                className="bg-gradient-to-r from-primary to-purple-600"
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Nouveau Planning
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plannings', value: stats.total, icon: Calendar, color: 'blue' },
          { label: 'Actifs', value: stats.active, icon: TrendingUp, color: 'green' },
          { label: 'Inactifs', value: stats.inactive, icon: Pause, color: 'gray' },
          { label: 'Produits importés', value: stats.totalProductsImported, icon: Zap, color: 'purple' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.1 }
            })}
          >
            <Card className={cn("border-none shadow-sm", `bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-500/5`)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-3xl font-bold mt-1", stat.color === 'green' && 'text-green-600')}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-xl", `bg-${stat.color}-500/20`)}>
                    <stat.icon className={cn("w-6 h-6", `text-${stat.color}-500`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Schedules List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Mes Plannings
          </CardTitle>
          <CardDescription>
            Gérez vos imports automatiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                  <Skeleton className="w-12 h-6" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="w-20 h-8" />
                </div>
              ))}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'Aucun résultat' : 'Aucun planning'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'Essayez de modifier votre recherche'
                  : 'Créez votre premier planning d\'import automatique'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un planning
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.05 }
                  })}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-xl transition-all hover:shadow-md group",
                    schedule.is_active ? "bg-gradient-to-r from-primary/5 to-transparent" : "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={() => handleToggleSchedule(schedule.id)}
                      disabled={isUpdating}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{schedule.name}</p>
                        {getFrequencyBadge(schedule.frequency)}
                        <Badge variant="outline" className="text-xs">
                          {schedule.source_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          Prochain: {format(new Date(schedule.next_run_at), 'dd MMM à HH:mm', { locale: fr })}
                        </span>
                        {schedule.last_run_at && (
                          <span className="flex items-center gap-1">
                            {getStatusIcon(schedule.last_run_status)}
                            Dernier: {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>
                      {schedule.source_url && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {schedule.source_url}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-lg font-bold">{schedule.products_imported || 0}</p>
                      <p className="text-xs text-muted-foreground">produits</p>
                    </div>
                    
                    <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                      {schedule.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => runNow(schedule.id)} disabled={isExecuting}>
                          {isExecuting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Exécuter maintenant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(schedule)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateSchedule(schedule)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        {schedule.source_url && (
                          <DropdownMenuItem onClick={() => window.open(schedule.source_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ouvrir la source
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => openDeleteDialog(schedule)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Schedule Dialog */}
      <ScheduleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateSchedule}
        mode="create"
      />

      {/* Edit Schedule Dialog */}
      <ScheduleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        schedule={selectedSchedule ? {
          id: selectedSchedule.id,
          name: selectedSchedule.name,
          source_type: selectedSchedule.source_type as any,
          source_url: selectedSchedule.source_url || '',
          frequency: selectedSchedule.frequency as any,
          active: selectedSchedule.is_active,
          auto_optimize: selectedSchedule.config?.auto_optimize ?? true,
          auto_publish: selectedSchedule.config?.auto_publish ?? false,
          description: selectedSchedule.description,
          notify_on_complete: true,
          notify_on_error: true,
          retry_on_failure: true,
          max_retries: 3
        } : null}
        onSubmit={handleEditSchedule}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le planning ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le planning "{selectedSchedule?.name}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChannablePageWrapper>
  )
}
