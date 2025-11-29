import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Package, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { unifiedImportService } from '@/services/UnifiedImportService'
import { Link } from 'react-router-dom'

export default function ImportHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => unifiedImportService.getHistory(100),
    refetchInterval: 10000 // Refresh every 10s
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing': return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>
      case 'processing':
        return <Badge className="bg-blue-500">En cours</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      default:
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  // Filtrer l'historique
  const filteredHistory = history.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (typeFilter !== 'all' && item.source_type !== typeFilter) return false
    if (searchQuery && !item.source_url?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link to="/import">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Historique des Imports</h1>
          <p className="text-muted-foreground">
            Suivez tous vos imports en détail
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
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
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="ftp">FTP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des imports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Imports ({filteredHistory.length})</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>Chargement de l'historique...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun import trouvé</p>
              <p className="text-sm mt-1">Essayez d'ajuster vos filtres</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(item.status)}
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
                      <p className="text-sm font-medium">
                        {item.success_rows} / {item.total_rows}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.error_rows > 0 && `${item.error_rows} erreurs`}
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
