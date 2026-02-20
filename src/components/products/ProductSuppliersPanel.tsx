/**
 * ProductSuppliersPanel — Multi-supplier view per product
 * Shows linked suppliers with comparative pricing, stock, delivery times
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Truck, DollarSign, Package, Star, ExternalLink, 
  Clock, ArrowRight, Crown, AlertTriangle, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface SupplierLink {
  id: string
  supplier_id: string
  supplier_name: string
  supplier_url?: string
  supplier_price: number
  currency: string
  stock_quantity: number
  delivery_days: number
  is_preferred: boolean
  last_synced_at: string | null
  platform: string
}

interface ProductSuppliersPanelProps {
  productId: string
  productPrice: number
}

export function ProductSuppliersPanel({ productId, productPrice }: ProductSuppliersPanelProps) {
  // Fetch suppliers linked to this product
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async (): Promise<SupplierLink[]> => {
      // Try product_supplier_links first, fallback to supplier_products
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, supplier_id, supplier_price, supplier_url, stock_quantity, delivery_days, is_preferred, last_synced_at, suppliers!inner(name, platform)')
        .eq('product_id', productId)
        .order('is_preferred', { ascending: false })

      if (error || !data) return []

      return data.map((row: any) => ({
        id: row.id,
        supplier_id: row.supplier_id,
        supplier_name: row.suppliers?.name || 'Fournisseur inconnu',
        supplier_url: row.supplier_url,
        supplier_price: row.supplier_price || 0,
        currency: 'EUR',
        stock_quantity: row.stock_quantity || 0,
        delivery_days: row.delivery_days || 0,
        is_preferred: row.is_preferred || false,
        last_synced_at: row.last_synced_at,
        platform: row.suppliers?.platform || 'unknown',
      }))
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  })

  // Stats
  const stats = useMemo(() => {
    if (suppliers.length === 0) return null
    const bestPrice = Math.min(...suppliers.map(s => s.supplier_price).filter(p => p > 0))
    const bestDelivery = Math.min(...suppliers.map(s => s.delivery_days).filter(d => d > 0))
    const totalStock = suppliers.reduce((sum, s) => sum + s.stock_quantity, 0)
    const preferred = suppliers.find(s => s.is_preferred)
    return { bestPrice, bestDelivery, totalStock, preferred, count: suppliers.length }
  }, [suppliers])

  const getMargin = (cost: number) => {
    if (!cost || productPrice <= 0) return null
    return ((productPrice - cost) / productPrice * 100).toFixed(0)
  }

  const getPlatformIcon = (platform: string) => {
    const platformMap: Record<string, string> = {
      aliexpress: '🇨🇳',
      amazon: '📦',
      cjdropshipping: '🚀',
      alibaba: '🏭',
      temu: '🛍️',
      default: '🏪',
    }
    return platformMap[platform.toLowerCase()] || platformMap.default
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    )
  }

  if (suppliers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Aucun fournisseur lié</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Liez des fournisseurs à ce produit pour comparer les prix, suivre les stocks et automatiser les commandes.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-2">
            <Globe className="h-4 w-4" />
            Rechercher des fournisseurs
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              <span className="text-xs">Fournisseurs</span>
            </div>
            <p className="text-lg font-semibold">{stats.count}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Meilleur prix</span>
            </div>
            <p className="text-lg font-semibold text-primary">{stats.bestPrice.toFixed(2)}€</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Stock cumulé</span>
            </div>
            <p className="text-lg font-semibold">{stats.totalStock.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Livraison min.</span>
            </div>
            <p className="text-lg font-semibold">{stats.bestDelivery > 0 ? `${stats.bestDelivery}j` : '—'}</p>
          </div>
        </div>
      )}

      {/* Supplier cards */}
      <div className="space-y-3">
        {suppliers.map((supplier) => {
          const margin = getMargin(supplier.supplier_price)
          return (
            <Card key={supplier.id} className={cn(
              "transition-all hover:shadow-md",
              supplier.is_preferred && "ring-2 ring-primary/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Supplier info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getPlatformIcon(supplier.platform)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{supplier.supplier_name}</span>
                        {supplier.is_preferred && (
                          <Badge variant="default" className="gap-1 text-[10px]">
                            <Crown className="h-3 w-3" />
                            Préféré
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{supplier.platform}</Badge>
                      </div>

                      {/* Price comparison row */}
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Prix fournisseur</p>
                          <p className="text-lg font-bold">{supplier.supplier_price.toFixed(2)}€</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Prix de vente</p>
                          <p className="text-lg font-bold text-primary">{productPrice.toFixed(2)}€</p>
                        </div>
                        {margin && (
                          <div>
                            <p className="text-xs text-muted-foreground">Marge</p>
                            <p className={cn(
                              "text-lg font-bold",
                              parseFloat(margin) >= 30 ? "text-green-600" : parseFloat(margin) >= 15 ? "text-amber-600" : "text-red-600"
                            )}>
                              {margin}%
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Stock & delivery */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Stock: <span className={cn("font-medium", supplier.stock_quantity > 0 ? "text-foreground" : "text-destructive")}>{supplier.stock_quantity}</span>
                        </span>
                        {supplier.delivery_days > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Livraison: {supplier.delivery_days}j
                          </span>
                        )}
                        {supplier.last_synced_at && (
                          <span>
                            Sync: {new Date(supplier.last_synced_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {supplier.supplier_url && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                        <a href={supplier.supplier_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          Voir
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
