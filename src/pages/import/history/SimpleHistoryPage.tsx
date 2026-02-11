import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileSpreadsheet,
  ShoppingBag,
  Link2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedImport } from '@/hooks/useUnifiedImport'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function SimpleHistoryPage() {
  const navigate = useNavigate()
  const { importHistory, isLoadingHistory } = useUnifiedImport()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'processing': return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'failed': case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    if (type?.includes('shopify')) return <ShoppingBag className="h-5 w-5" />
    if (type?.includes('csv')) return <FileSpreadsheet className="h-5 w-5" />
    return <Link2 className="h-5 w-5" />
  }

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
      description="Tous vos imports récents"
      heroImage="import"
      badge={{ label: 'Historique', icon: Clock }}
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importHistory.length}</div>
            <p className="text-xs text-muted-foreground">imports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Réussis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {importHistory.filter((h: any) => h.status === 'completed' || h.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">imports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Produits importés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {importHistory.reduce((sum: number, h: any) => sum + (h.products_imported || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">au total</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des imports</CardTitle>
          <CardDescription>
            Historique complet de vos imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun import effectué</p>
            </div>
          ) : (
            <div className="space-y-3">
              {importHistory.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {getTypeIcon(record.platform)}
                      
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">{record.platform || record.source_url}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.products_imported || 0} importés
                          {record.products_failed > 0 && ` • ${record.products_failed} échecs`}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Error message if exists */}
                  {record.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-900">
                      {record.error_message}
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
