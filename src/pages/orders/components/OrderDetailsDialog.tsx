import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, MapPin, CreditCard, Truck } from 'lucide-react'

interface OrderDetailsDialogProps {
  order: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Commande #{order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Informations client
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nom:</span> {order.customerName}</p>
              <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
              <p><span className="font-medium">Ville:</span> {order.city}, {order.country}</p>
            </div>
          </div>

          <Separator />

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits
            </h3>
            <div className="space-y-2">
              {order.products?.map((product: string, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{product}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment & Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paiement
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Statut:</span> <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>{order.paymentStatus}</Badge></p>
                <p><span className="font-medium">Total:</span> {formatCurrency(order.total)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Livraison
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Méthode:</span> {order.shippingMethod}</p>
                {order.trackingNumber && (
                  <p><span className="font-medium">Suivi:</span> {order.trackingNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
