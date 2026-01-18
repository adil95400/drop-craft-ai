import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Clock, Plus, Calendar, TrendingUp, Settings, Play, Pause,
  MoreVertical, Edit, Trash2, CheckCircle, AlertCircle, Search,
  RefreshCw, Timer, Zap
} from 'lucide-react'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Schedule {
  id: string
  name: string
  source_type: string
  source_url?: string
  frequency: string
  next_run: string
  last_run?: string
  active: boolean
  last_run_status: 'completed' | 'failed' | 'pending' | 'never'
  products_imported?: number
}

export default function ImportScheduledPage() {
  const prefersReducedMotion = useReducedMotion()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // Form state for new schedule
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    source_type: 'url',
    source_url: '',
    frequency: 'daily'
  })

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: '1',
      name: 'Import AliExpress Quotidien',
      source_type: 'url',
      source_url: 'https://aliexpress.com/store/123',
      frequency: 'daily',
      next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      active: true,
      last_run_status: 'completed',
      products_imported: 145
    },
    {
      id: '2',
      name: 'Sync CSV Hebdomadaire',
      source_type: 'csv',
      frequency: 'weekly',
      next_run: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      active: false,
      last_run_status: 'pending',
      products_imported: 0
    },
    {
      id: '3',
      name: 'Feed XML Fournisseur',
      source_type: 'xml',
      source_url: 'https://supplier.com/feed.xml',
      frequency: 'hourly',
      next_run: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      last_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      active: true,
      last_run_status: 'completed',
      products_imported: 892
    }
  ])

  // Stats calculation
  const stats = useMemo(() => [
    { label: 'Total plannings', value: schedules.length.toString() },
    { label: 'Actifs', value: schedules.filter(s => s.active).length.toString() },
    { label: 'Produits importés', value: schedules.reduce((sum, s) => sum + (s.products_imported || 0), 0).toString() },
    { label: 'Inactifs', value: schedules.filter(s => !s.active).length.toString() }
  ], [schedules])

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (!searchQuery) return schedules
    return schedules.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source_type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [schedules, searchQuery])

  const toggleSchedule = (id: string) => {
    setSchedules(prev =>
      prev.map(s => (s.id === id ? { ...s, active: !s.active } : s))
    )
    const schedule = schedules.find(s => s.id === id)
    toast({
      title: schedule?.active ? 'Planning désactivé' : 'Planning activé',
      description: `Le planning "${schedule?.name}" a été ${schedule?.active ? 'désactivé' : 'activé'}`
    })
  }

  const deleteSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    toast({
      title: 'Planning supprimé',
      description: `Le planning "${schedule?.name}" a été supprimé`
    })
  }

  const runNow = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    toast({
      title: 'Import lancé',
      description: `L'import "${schedule?.name}" a été lancé manuellement`
    })
  }

  const createSchedule = () => {
    if (!newSchedule.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom pour le planning',
        variant: 'destructive'
      })
      return
    }

    const schedule: Schedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      source_type: newSchedule.source_type,
      source_url: newSchedule.source_url || undefined,
      frequency: newSchedule.frequency,
      next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      last_run_status: 'never',
      products_imported: 0
    }

    setSchedules(prev => [schedule, ...prev])
    setNewSchedule({ name: '', source_type: 'url', source_url: '', frequency: 'daily' })
    setIsCreateDialogOpen(false)
    
    toast({
      title: 'Planning créé',
      description: `Le planning "${schedule.name}" a été créé avec succès`
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
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <ChannablePageLayout
      title="Imports Planifiés"
      metaTitle="Imports Planifiés"
      metaDescription="Automatisez vos imports avec des plannings récurrents"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'import"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge="Automatisation"
        title="Imports planifiés"
        subtitle="automatisation complète"
        description="Planifiez vos imports pour qu'ils s'exécutent automatiquement selon vos besoins. Gagnez du temps avec l'automatisation."
        primaryAction={{
          label: "Nouveau planning",
          onClick: () => setIsCreateDialogOpen(true),
          icon: <Plus className="w-5 h-5" />
        }}
        stats={stats}
        showHexagons={!prefersReducedMotion}
        variant="compact"
      />

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
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Planning
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau planning</DialogTitle>
                    <DialogDescription>
                      Configurez un import automatique récurrent
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du planning</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Import AliExpress quotidien"
                        value={newSchedule.name}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="source_type">Type de source</Label>
                      <Select 
                        value={newSchedule.source_type} 
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, source_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML Feed</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newSchedule.source_type !== 'csv' && (
                      <div className="space-y-2">
                        <Label htmlFor="source_url">URL source</Label>
                        <Input
                          id="source_url"
                          placeholder="https://..."
                          value={newSchedule.source_url}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, source_url: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Select 
                        value={newSchedule.frequency} 
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={createSchedule}>
                      Créer le planning
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plannings', value: schedules.length, icon: Calendar, color: 'blue' },
          { label: 'Actifs', value: schedules.filter(s => s.active).length, icon: TrendingUp, color: 'green' },
          { label: 'Inactifs', value: schedules.filter(s => !s.active).length, icon: Pause, color: 'gray' },
          { label: 'Produits importés', value: schedules.reduce((sum, s) => sum + (s.products_imported || 0), 0), icon: Zap, color: 'purple' }
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
          {filteredSchedules.length === 0 ? (
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
                    schedule.active ? "bg-gradient-to-r from-primary/5 to-transparent" : "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={schedule.active}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
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
                          Prochain: {format(new Date(schedule.next_run), 'dd MMM à HH:mm', { locale: fr })}
                        </span>
                        {schedule.last_run && (
                          <span className="flex items-center gap-1">
                            {getStatusIcon(schedule.last_run_status)}
                            Dernier: {formatDistanceToNow(new Date(schedule.last_run), { addSuffix: true, locale: fr })}
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
                    
                    <Badge variant={schedule.active ? 'default' : 'secondary'}>
                      {schedule.active ? 'Actif' : 'Inactif'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => runNow(schedule.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Exécuter maintenant
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Paramètres
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteSchedule(schedule.id)}
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
    </ChannablePageLayout>
  )
}
