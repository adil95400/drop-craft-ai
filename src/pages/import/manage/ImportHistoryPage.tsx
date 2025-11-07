import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ImportHistoryPage() {
  const navigate = useNavigate()

  // Mock data - à remplacer par des données réelles
  const importHistory = [
    {
      id: 1,
      date: '2024-01-15 14:30',
      supplier: 'AliExpress',
      products: 25,
      status: 'success',
      duration: '2m 15s'
    },
    {
      id: 2,
      date: '2024-01-14 10:20',
      supplier: 'CJDropshipping',
      products: 42,
      status: 'success',
      duration: '3m 45s'
    },
    {
      id: 3,
      date: '2024-01-13 16:45',
      supplier: 'AliExpress',
      products: 15,
      status: 'partial',
      duration: '1m 30s'
    },
    {
      id: 4,
      date: '2024-01-12 09:00',
      supplier: 'BTS Wholesaler',
      products: 8,
      status: 'failed',
      duration: '45s'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'partial':
        return <Clock className="w-5 h-5 text-orange-500" />
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Réussi</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-orange-500 text-white">Partiel</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-6 pt-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products/import/manage')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Historique Détaillé</h1>
          <p className="text-muted-foreground">
            Suivez tous vos imports en détail
          </p>
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-semibold">Historique des Imports</h2>
              <Button variant="outline" size="sm">
                Exporter CSV
              </Button>
            </div>

            <div className="space-y-3">
              {importHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">{item.supplier}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.date} • {item.products} produits • {item.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <Button variant="ghost" size="sm">
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {importHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun historique d'import pour le moment</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
