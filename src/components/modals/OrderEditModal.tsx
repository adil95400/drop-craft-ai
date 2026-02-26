import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { OrdersService } from '@/services/orders.service'
import { orderUpdateSchema, OrderUpdateData } from '@/lib/validation/orderSchema'
import { UnifiedOrder } from '@/hooks/unified/useOrdersUnified'
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CreditCard, 
  Loader2,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface OrderEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: UnifiedOrder
  onSuccess?: () => void
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'processing', label: 'En traitement', color: 'bg-blue-500' },
  { value: 'shipped', label: 'Expédiée', color: 'bg-purple-500' },
  { value: 'delivered', label: 'Livrée', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Annulée', color: 'bg-red-500' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'paid', label: 'Payé', color: 'bg-green-500' },
  { value: 'failed', label: 'Échoué', color: 'bg-red-500' },
  { value: 'refunded', label: 'Remboursé', color: 'bg-gray-500' },
]

const CARRIERS = [
  { value: 'colissimo', label: 'Colissimo', trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=' },
  { value: 'chronopost', label: 'Chronopost', trackingUrl: 'https://www.chronopost.fr/tracking-no-cms/?searchType=shipment&liession=' },
  { value: 'ups', label: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { value: 'dhl', label: 'DHL', trackingUrl: 'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=' },
  { value: 'fedex', label: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=' },
  { value: 'mondialrelay', label: 'Mondial Relay', trackingUrl: 'https://www.mondialrelay.fr/suivi-de-colis/?NumColis=' },
]

export function OrderEditModal({ open, onOpenChange, order, onSuccess }: OrderEditModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('status')
  const [copied, setCopied] = useState(false)

  const form = useForm<OrderUpdateData>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: order.status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number || '',
      carrier: (order as any).carrier || '',
      notes: order.notes || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: OrderUpdateData) => {
      if (!user) throw new Error('Non authentifié')
      return OrdersService.updateOrder(order.id, user.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-orders'] })
      toast.success('Commande mise à jour')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    // Filter out empty values
    const updates: OrderUpdateData = {}
    if (data.status && data.status !== order.status) updates.status = data.status
    if (data.payment_status && data.payment_status !== order.payment_status) updates.payment_status = data.payment_status
    if (data.tracking_number !== order.tracking_number) updates.tracking_number = data.tracking_number
    if (data.carrier !== (order as any).carrier) updates.carrier = data.carrier
    if (data.notes !== order.notes) updates.notes = data.notes

    if (Object.keys(updates).length === 0) {
      toast.info('Aucune modification à enregistrer')
      return
    }

    updateMutation.mutate(updates)
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copié dans le presse-papier')
  }

  const getTrackingUrl = () => {
    const carrier = CARRIERS.find(c => c.value === form.watch('carrier'))
    const trackingNumber = form.watch('tracking_number')
    if (carrier && trackingNumber) {
      return carrier.trackingUrl + trackingNumber
    }
    return null
  }

  const getStatusBadge = (status: string, options: typeof STATUS_OPTIONS) => {
    const option = options.find(o => o.value === status)
    return option ? (
      <Badge className={`${option.color} text-white`}>{option.label}</Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    )
  }

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Commande {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-accent/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Montant</div>
            <div className="text-lg font-bold">{order.total_amount?.toFixed(2)}€</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Statut</div>
            <div className="mt-1">{getStatusBadge(order.status, STATUS_OPTIONS)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Paiement</div>
            <div className="mt-1">{getStatusBadge(order.payment_status, PAYMENT_STATUS_OPTIONS)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-medium">
              {format(new Date(order.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Statut
                </TabsTrigger>
                <TabsTrigger value="tracking" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Suivi
                </TabsTrigger>
                <TabsTrigger value="items" className="gap-2">
                  <Package className="h-4 w-4" />
                  Articles
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Détails
                </TabsTrigger>
              </TabsList>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut de la commande</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100] bg-popover">
                            {STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut du paiement</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100] bg-popover">
                            {PAYMENT_STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes internes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Ajouter des notes sur cette commande..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tracking Tab */}
              <TabsContent value="tracking" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations de suivi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="carrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transporteur</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un transporteur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[100] bg-popover">
                              {CARRIERS.map(carrier => (
                                <SelectItem key={carrier.value} value={carrier.value}>
                                  {carrier.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tracking_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de suivi</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Ex: 6A12345678901"
                                className="font-mono"
                              />
                            </FormControl>
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(field.value || '')}
                              >
                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {getTrackingUrl() && (
                      <Alert>
                        <Truck className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Lien de suivi disponible</span>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => window.open(getTrackingUrl()!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Suivre le colis
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-muted-foreground">
                      L'ajout d'un numéro de suivi passera automatiquement la commande en statut "Expédiée".
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Items Tab */}
              <TabsContent value="items" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Articles commandés ({order.items?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-3">
                        {order.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{item.product_name || item.title || 'Produit'}</div>
                              <div className="text-sm text-muted-foreground">
                                Quantité: {item.quantity} × {item.unit_price?.toFixed(2)}€
                              </div>
                            </div>
                            <div className="font-bold">
                              {(item.total_price || item.quantity * item.unit_price)?.toFixed(2)}€
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-medium">Total</span>
                          <span className="text-xl font-bold text-primary">{order.total_amount?.toFixed(2)}€</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun article dans cette commande</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {order.shipping_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresse de livraison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{order.shipping_address.name}</p>
                        <p>{order.shipping_address.line1}</p>
                        {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                        <p>
                          {order.shipping_address.postal_code} {order.shipping_address.city}
                        </p>
                        <p>{order.shipping_address.country}</p>
                        {order.shipping_address.phone && (
                          <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID Commande</span>
                      <span className="font-mono text-sm">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numéro</span>
                      <span className="font-medium">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Devise</span>
                      <span>{order.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créée le</span>
                      <span>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mise à jour</span>
                      <span>{format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
