/**
 * PickingPackingWorkflow — Interface de préparation de commandes
 * Scan, validation des articles, passage au statut "packed"
 */
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Package, CheckCircle, ScanBarcode, ArrowRight, AlertTriangle,
  Loader2, Printer, Box, ClipboardCheck, Undo2, Timer
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PickItem {
  id: string
  product_title: string
  sku: string
  quantity: number
  picked: number
  location?: string
  barcode?: string
}

interface PickingOrder {
  id: string
  order_number: string
  customer_name: string
  items: PickItem[]
  status: 'ready' | 'picking' | 'packed' | 'shipped'
  priority: 'normal' | 'urgent' | 'express'
  created_at: string
}

export function PickingPackingWorkflow() {
  const [activeOrder, setActiveOrder] = useState<PickingOrder | null>(null)
  const [scanInput, setScanInput] = useState('')
  const [pickingStartTime, setPickingStartTime] = useState<number | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch orders ready for picking
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['picking-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .in('status', ['processing', 'confirmed', 'paid'])
        .is('fulfillment_status', null)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) return []

      return (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `#${order.id.slice(0, 8)}`,
        customer_name: order.customer_name || order.shipping_name || 'Client',
        items: (order.order_items || []).map((item: any) => ({
          id: item.id,
          product_title: item.product_title || 'Produit',
          sku: item.product_sku || item.sku || '-',
          quantity: item.quantity || 1,
          picked: 0,
          location: item.warehouse_location || null,
          barcode: item.barcode || item.product_sku || null,
        })),
        status: 'ready' as const,
        priority: (order.shipping_method === 'express' ? 'express' : 'normal') as PickingOrder['priority'],
        created_at: order.created_at,
      }))
    },
    refetchInterval: 30000,
  })

  // Mark order as packed
  const packMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('orders')
        .update({
          fulfillment_status: 'packed',
          status: 'processing',
          packed_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picking-orders'] })
      toast.success('Commande emballée ✓')
      setActiveOrder(null)
      setPickingStartTime(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const startPicking = (order: PickingOrder) => {
    setActiveOrder({ ...order, status: 'picking' })
    setPickingStartTime(Date.now())
    setTimeout(() => scanRef.current?.focus(), 100)
  }

  const handleScan = (value: string) => {
    if (!activeOrder || !value.trim()) return

    const trimmed = value.trim().toUpperCase()
    const itemIndex = activeOrder.items.findIndex(
      item => (item.barcode?.toUpperCase() === trimmed || item.sku?.toUpperCase() === trimmed)
        && item.picked < item.quantity
    )

    if (itemIndex === -1) {
      // Check if all items with this barcode are already picked
      const matchingItem = activeOrder.items.find(
        item => item.barcode?.toUpperCase() === trimmed || item.sku?.toUpperCase() === trimmed
      )
      if (matchingItem && matchingItem.picked >= matchingItem.quantity) {
        toast.warning('Cet article est déjà scanné en totalité')
      } else {
        toast.error('Article non reconnu')
      }
      setScanInput('')
      return
    }

    const updated = { ...activeOrder }
    updated.items[itemIndex].picked += 1
    setActiveOrder(updated)
    setScanInput('')

    // Check if all items are picked
    const allPicked = updated.items.every(item => item.picked >= item.quantity)
    if (allPicked) {
      toast.success('Tous les articles sont scannés ! Prêt pour l\'emballage.')
    }
  }

  const undoPick = (itemId: string) => {
    if (!activeOrder) return
    const updated = { ...activeOrder }
    const item = updated.items.find(i => i.id === itemId)
    if (item && item.picked > 0) {
      item.picked -= 1
      setActiveOrder(updated)
    }
  }

  const totalItems = activeOrder?.items.reduce((s, i) => s + i.quantity, 0) || 0
  const pickedItems = activeOrder?.items.reduce((s, i) => s + i.picked, 0) || 0
  const allPicked = activeOrder ? activeOrder.items.every(i => i.picked >= i.quantity) : false

  const elapsedTime = pickingStartTime
    ? Math.floor((Date.now() - pickingStartTime) / 1000)
    : 0

  const priorityConfig = {
    express: { label: 'Express', className: 'bg-destructive/10 text-red-700 border-red-200' },
    urgent: { label: 'Urgent', className: 'bg-warning/10 text-orange-700 border-orange-200' },
    normal: { label: 'Normal', className: 'bg-muted text-muted-foreground' },
  }

  return (
    <div className="space-y-6">
      {/* Active Picking Session */}
      {activeOrder ? (
        <div className="space-y-4">
          {/* Header */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ScanBarcode className="h-5 w-5 text-primary" />
                    Préparation : {activeOrder.order_number}
                  </CardTitle>
                  <CardDescription>{activeOrder.customer_name}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    <Timer className="h-3 w-3" />
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveOrder(null)
                      setPickingStartTime(null)
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-medium">{pickedItems}/{totalItems} articles</span>
                </div>
                <Progress value={totalItems > 0 ? (pickedItems / totalItems) * 100 : 0} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Scan Input */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={scanRef}
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleScan(scanInput)
                    }}
                    placeholder="Scanner un code-barres ou saisir un SKU..."
                    className="pl-10 text-lg h-12"
                    autoFocus
                  />
                </div>
                <Button size="lg" onClick={() => handleScan(scanInput)} className="h-12">
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Articles à préparer</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  <AnimatePresence>
                    {activeOrder.items.map(item => {
                      const isComplete = item.picked >= item.quantity
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            isComplete ? "bg-success/5 border-green-200" : "bg-background"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isComplete ? "bg-success/10" : "bg-muted"
                          )}>
                            {isComplete
                              ? <CheckCircle className="h-5 w-5 text-success" />
                              : <Package className="h-5 w-5 text-muted-foreground" />
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-sm", isComplete && "line-through text-muted-foreground")}>
                              {item.product_title}
                            </p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>SKU: {item.sku}</span>
                              {item.location && <span>• Emplacement: {item.location}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={isComplete ? 'default' : 'secondary'}>
                              {item.picked}/{item.quantity}
                            </Badge>
                            {item.picked > 0 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => undoPick(item.id)}>
                                <Undo2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              disabled={!allPicked || packMutation.isPending}
              onClick={() => packMutation.mutate(activeOrder.id)}
            >
              {packMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Box className="h-4 w-4 mr-2" />
              }
              Marquer comme emballé
            </Button>
            <Button variant="outline" size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Bon de livraison
            </Button>
          </div>
        </div>
      ) : (
        /* Order Queue */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    File de préparation
                  </CardTitle>
                  <CardDescription>
                    {orders.length} commande(s) en attente de préparation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucune commande en attente</p>
                  <p className="text-sm">Toutes les commandes ont été préparées</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{order.order_number}</span>
                            <Badge variant="outline" className={priorityConfig[order.priority].className}>
                              {priorityConfig[order.priority].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.items.length} article(s)
                          </p>
                        </div>
                        <Button size="sm" onClick={() => startPicking(order)}>
                          <ScanBarcode className="h-4 w-4 mr-2" />
                          Préparer
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
