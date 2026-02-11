import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileSpreadsheet,
  ShoppingBag,
  Link2,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  RefreshCw,
  TrendingUp,
  XCircle,
  Package,
  BarChart3,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedImport } from '@/hooks/useUnifiedImport'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

type SortField = 'date' | 'products' | 'status'
type SortOrder = 'asc' | 'desc'
type StatusFilter = 'all' | 'completed' | 'failed' | 'processing' | 'pending'

export default function SimpleHistoryPage() {
  const navigate = useNavigate()
  const { importHistory, isLoadingHistory } = useUnifiedImport()

  // Advanced filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Computed statistics
  const stats = useMemo(() => {
    const total = importHistory.length
    const completed = importHistory.filter((h: any) => h.status === 'completed' || h.status === 'success').length
    const failed = importHistory.filter((h: any) => h.status === 'failed' || h.status === 'error').length
    const processing = importHistory.filter((h: any) => h.status === 'processing').length
    const totalProducts = importHistory.reduce((sum: number, h: any) => sum + (h.products_imported || 0), 0)
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, failed, processing, totalProducts, successRate }
  }, [importHistory])

  // Filtered and sorted data
  const filteredHistory = useMemo(() => {
    let result = [...importHistory]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r: any) =>
        (r.platform || '').toLowerCase().includes(q) ||
        (r.source_url || '').toLowerCase().includes(q) ||
        (r.error_message || '').toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r: any) => {
        if (statusFilter === 'completed') return r.status === 'completed' || r.status === 'success'
        if (statusFilter === 'failed') return r.status === 'failed' || r.status === 'error'
        return r.status === statusFilter
      })
    }

    // Sort
    result.sort((a: any, b: any) => {
      let cmp = 0
      if (sortField === 'date') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'products') {
        cmp = (a.products_imported || 0) - (b.products_imported || 0)
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '')
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })

    return result
  }, [importHistory, searchQuery, statusFilter, sortField, sortOrder])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'failed': case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'failed': case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return 'Réussi'
      case 'processing': return 'En cours'
      case 'failed': case 'error': return 'Échoué'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    if (type?.toLowerCase().includes('shopify')) return <ShoppingBag className="h-5 w-5 text-green-600" />
    if (type?.toLowerCase().includes('csv') || type?.toLowerCase().includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    if (type?.toLowerCase().includes('aliexpress')) return <Package className="h-5 w-5 text-orange-600" />
    if (type?.toLowerCase().includes('amazon')) return <Package className="h-5 w-5 text-yellow-600" />
    return <Link2 className="h-5 w-5 text-primary" />
  }

  const toggleSortOrder = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')

  if (isLoadingHistory) {
    return (
      <ChannablePageWrapper title="Historique des imports" heroImage="import" badge={{ label: 'Historique', icon: Clock }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Historique des imports"
      description={`${stats.total} imports — ${stats.totalProducts} produits importés au total`}
      heroImage="import"
      badge={{ label: 'Historique', icon: Clock }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm" onClick={() => navigate('/import')}>
            <Download className="h-4 w-4" />
            Nouvel import
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><BarChart3 className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Réussis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><XCircle className="h-4 w-4 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Échoués</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Loader2 className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Package className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Produits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Taux succès</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par plateforme, URL ou erreur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Réussis</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="products">Produits</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleSortOrder} title={sortOrder === 'desc' ? 'Décroissant' : 'Croissant'}>
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Détails des imports</CardTitle>
              <CardDescription>
                {filteredHistory.length === importHistory.length
                  ? `${importHistory.length} imports au total`
                  : `${filteredHistory.length} résultat${filteredHistory.length > 1 ? 's' : ''} sur ${importHistory.length}`
                }
              </CardDescription>
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all') }}>
                <Trash2 className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {importHistory.length === 0 ? 'Aucun import effectué' : 'Aucun résultat pour ces filtres'}
              </p>
              {importHistory.length === 0 && (
                <Button variant="outline" className="mt-4" onClick={() => navigate('/import')}>
                  Lancer un import
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    {/* Platform icon */}
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      {getTypeIcon(record.platform)}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{record.platform || 'Import URL'}</span>
                        <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {getStatusLabel(record.status)}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {record.source_url || `${record.products_imported || 0} produit${(record.products_imported || 0) > 1 ? 's' : ''} importé${(record.products_imported || 0) > 1 ? 's' : ''}`}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm shrink-0">
                      <div className="text-center">
                        <p className="font-semibold">{record.products_imported || 0}</p>
                        <p className="text-xs text-muted-foreground">importés</p>
                      </div>
                      {record.products_failed > 0 && (
                        <div className="text-center">
                          <p className="font-semibold text-red-600">{record.products_failed}</p>
                          <p className="text-xs text-muted-foreground">échecs</p>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-sm text-muted-foreground text-right shrink-0">
                      <p>{new Date(record.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs">{new Date(record.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {/* Error message */}
                  {record.error_message && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{record.error_message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
