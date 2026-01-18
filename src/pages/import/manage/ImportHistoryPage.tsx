import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, XCircle, Clock, AlertCircle, Package, Search, Filter,
  Download, MoreVertical, Eye, RotateCcw, Trash2, TrendingUp,
  LayoutGrid, List, SortAsc, SortDesc, Loader2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { unifiedImportService } from '@/services/UnifiedImportService'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export default function ImportHistoryPage() {
  const prefersReducedMotion = useReducedMotion()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => unifiedImportService.getHistory(100),
    refetchInterval: 10000
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
        item.source_type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [history, statusFilter, typeFilter, searchQuery, sortOrder])

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
        badge="Historique"
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
                  placeholder="Rechercher par source..."
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
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </Button>

                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
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
              {filteredHistory.map((item, index) => {
                const statusConfig = getStatusConfig(item.status)
                return (
                  <motion.div
                    key={item.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 },
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
                        <p className="text-lg font-bold">{item.success_rows || 0}</p>
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
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {item.status === 'failed' && (
                            <DropdownMenuItem>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Relancer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((item, index) => {
                const statusConfig = getStatusConfig(item.status)
                return (
                  <motion.div
                    key={item.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, scale: 0.95 },
                      animate: { opacity: 1, scale: 1 },
                      transition: { delay: index * 0.03 }
                    })}
                  >
                    <Card className="hover:shadow-md transition-all">
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
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">{item.success_rows || 0}</p>
                            <p className="text-xs text-muted-foreground">produits</p>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {item.status === 'processing' && item.total_rows > 0 && (
                          <Progress 
                            value={((item.success_rows || 0) / item.total_rows) * 100} 
                            className="h-1.5 mt-4"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ChannablePageLayout>
  )
}
