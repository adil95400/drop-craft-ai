import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ShipmentsListProps {
  shipments: any[]
  isLoading: boolean
}

export function ShipmentsList({ shipments, isLoading }: ShipmentsListProps) {
  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default'
      case 'in_transit': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Créée'
      case 'printed': return 'Imprimée'
      case 'picked_up': return 'Enlevée'
      case 'in_transit': return 'En transit'
      case 'delivered': return 'Livrée'
      case 'failed': return 'Échec'
      default: return status
    }
  }

  if (shipments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucune expédition</p>
          <p className="text-sm text-muted-foreground">Les expéditions apparaîtront ici</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <Card key={shipment.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{shipment.tracking_number}</p>
                  <Badge variant={getStatusColor(shipment.status)}>
                    {getStatusLabel(shipment.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {shipment.shipping_address?.city}, {shipment.shipping_address?.country}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(shipment.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{shipment.total_cost}€</p>
                <p className="text-sm text-muted-foreground">{shipment.weight_kg}kg</p>
                {shipment.label_url && (
                  <a
                    href={shipment.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    Étiquette <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
