/**
 * SupplierSyncPage — Surveillance & Sync Fournisseurs
 * Phase 4 de l'audit global + Sync Continue Attributs
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  RefreshCw, Truck, AlertTriangle, CheckCircle, XCircle, Clock,
  Link2, Unlink, TrendingUp, Package, Zap, Settings, Activity,
  ArrowRightLeft, Database, Shield, Globe, BarChart3, GitCompare
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AttributeSyncPanel } from '@/components/catalog/AttributeSyncPanel'
import { MultiSourceEnrichPanel } from '@/components/catalog/MultiSourceEnrichPanel'
import { AIContentRefreshPanel } from '@/components/catalog/AIContentRefreshPanel'
import { AutoFallbackPanel } from '@/components/catalog/AutoFallbackPanel'

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }

export default function SupplierSyncPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [autoSync, setAutoSync] = useState(true)

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['supplier-sync-suppliers', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!user,
  })

  // Fetch supplier products
  const { data: supplierProducts = [] } = useQuery({
    queryKey: ['supplier-sync-products', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('supplier_products')
        .select('id, supplier_id, title, price, stock_quantity, selling_price, status, last_synced_at')
        .eq('user_id', user.id)
        .limit(1000)
      return data || []
    },
    enabled: !!user,
  })

  // Fetch product-supplier links
  const { data: links = [] } = useQuery({
    queryKey: ['product-supplier-links', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('product_supplier_links')
        .select('*')
        .eq('user_id', user.id)
      return data || []
    },
    enabled: !!user,
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: { supplierId, limit: 500 }
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, supplierId) => {
      toast.success('Synchronisation terminée')
      queryClient.invalidateQueries({ queryKey: ['supplier-sync'] })
    },
    onError: (err) => {
      toast.error('Erreur de synchronisation', { description: String(err) })
    },
  })

  // Compute stats
  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length
    const active = suppliers.filter((s: any) => s.status === 'active').length
    const totalLinked = supplierProducts.length
    const outOfStock = supplierProducts.filter((sp: any) => (sp.stock_quantity ?? 0) === 0).length
    const multiSupplier = new Set(links.map((l: any) => l.product_id)).size
    const avgProducts = totalSuppliers > 0 ? Math.round(totalLinked / totalSuppliers) : 0

    // Stale products (not synced in 24h)
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const stale = supplierProducts.filter((sp: any) => !sp.last_synced_at || new Date(sp.last_synced_at) < staleThreshold).length

    return { totalSuppliers, active, totalLinked, outOfStock, multiSupplier, avgProducts, stale }
  }, [suppliers, supplierProducts, links])

  // Supplier health cards
  const supplierCards = useMemo(() => {
    return suppliers.map((s: any) => {
      const prods = supplierProducts.filter((sp: any) => sp.supplier_id === s.id)
      const oos = prods.filter((sp: any) => (sp.stock_quantity ?? 0) === 0).length
      const linked = links.filter((l: any) => l.supplier_id === s.id).length
      const lastSync = prods.reduce((latest: Date | null, sp: any) => {
        if (!sp.last_synced_at) return latest
        const d = new Date(sp.last_synced_at)
        return !latest || d > latest ? d : latest
      }, null as Date | null)

      const health = oos === 0 && prods.length > 0 ? 'healthy' : oos > prods.length * 0.3 ? 'critical' : 'warning'

      return { ...s, productCount: prods.length, oosCount: oos, linkedCount: linked, lastSync, health }
    })
  }, [suppliers, supplierProducts, links])

  return (
    <ChannablePageWrapper
      title="Surveillance Fournisseurs"
      description={`${stats.totalSuppliers} fournisseurs — ${stats.totalLinked} produits liés — ${stats.stale} produits obsolètes`}
      heroImage="products"
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* KPIs */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Fournisseurs', value: stats.totalSuppliers, icon: Truck, color: 'text-primary' },
            { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'text-success' },
            { label: 'Produits Liés', value: stats.totalLinked, icon: Link2, color: 'text-info' },
            { label: 'Rupture Fourn.', value: stats.outOfStock, icon: XCircle, color: 'text-destructive' },
            { label: 'Multi-Fourn.', value: stats.multiSupplier, icon: ArrowRightLeft, color: 'text-primary' },
            { label: 'Obsolètes (24h)', value: stats.stale, icon: Clock, color: 'text-warning' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Auto-Sync Banner */}
        <motion.div variants={fadeUp}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Synchronisation Automatique</p>
                  <p className="text-xs text-muted-foreground">Mise à jour automatique des prix et stocks toutes les 6h</p>
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="sync-changes" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="sync-changes">
              <GitCompare className="h-3.5 w-3.5 mr-1" />
              Sync Continue
            </TabsTrigger>
            <TabsTrigger value="multi-source">
              <Database className="h-3.5 w-3.5 mr-1" />
              Multi-Source
            </TabsTrigger>
            <TabsTrigger value="ai-refresh">
              <Zap className="h-3.5 w-3.5 mr-1" />
              IA Dynamique
            </TabsTrigger>
            <TabsTrigger value="auto-fallback">
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
              Fallback Auto
            </TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="alerts">Alertes Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="sync-changes">
            <AttributeSyncPanel />
          </TabsContent>

          <TabsContent value="multi-source">
            <MultiSourceEnrichPanel />
          </TabsContent>

          <TabsContent value="ai-refresh">
            <AIContentRefreshPanel />
          </TabsContent>

          <TabsContent value="auto-fallback">
            <AutoFallbackPanel />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            {supplierCards.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aucun fournisseur configuré</p>
                  <p className="text-xs mt-1">Ajoutez vos fournisseurs depuis la page Intégrations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplierCards.map((s: any) => (
                  <Card key={s.id} className={cn('relative overflow-hidden', s.health === 'critical' && 'border-destructive/30', s.health === 'warning' && 'border-warning/30')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{s.supplier_type || 'API'} • {s.country || 'EU'}</p>
                        </div>
                        <Badge variant={s.health === 'healthy' ? 'default' : s.health === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {s.health === 'healthy' ? 'Sain' : s.health === 'critical' ? 'Critique' : 'Attention'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-lg font-bold tabular-nums">{s.productCount}</p>
                          <p className="text-[10px] text-muted-foreground">Produits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold tabular-nums text-destructive">{s.oosCount}</p>
                          <p className="text-[10px] text-muted-foreground">Rupture</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold tabular-nums text-info">{s.linkedCount}</p>
                          <p className="text-[10px] text-muted-foreground">Mappés</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {s.lastSync ? `Sync: ${new Date(s.lastSync).toLocaleDateString('fr-FR')}` : 'Jamais synchronisé'}
                        </span>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => syncMutation.mutate(s.id)} disabled={syncMutation.isPending}>
                          <RefreshCw className={cn('h-3 w-3 mr-1', syncMutation.isPending && 'animate-spin')} />
                          Sync
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Mapping Multi-Fournisseurs</CardTitle>
                  <Badge variant="outline">{links.length} liens actifs</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold tabular-nums">{stats.multiSupplier}</p>
                      <p className="text-xs text-muted-foreground mt-1">Produits multi-fournisseurs</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold tabular-nums">{links.filter((l: any) => l.is_primary).length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Fournisseurs primaires</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold tabular-nums">{links.filter((l: any) => !l.is_primary).length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Fournisseurs de fallback</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Le mapping multi-fournisseurs permet de basculer automatiquement vers un fournisseur de secours en cas de rupture de stock chez le fournisseur principal (à la DSers).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertes Stock Fournisseurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {supplierProducts.filter((sp: any) => (sp.stock_quantity ?? 0) === 0).slice(0, 15).map((sp: any) => {
                    const supplier = suppliers.find((s: any) => s.id === sp.supplier_id)
                    return (
                      <div key={sp.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/10 bg-destructive/5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sp.title}</p>
                          <p className="text-xs text-muted-foreground">{supplier?.name || 'Fournisseur inconnu'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
                          <span className="text-xs text-muted-foreground tabular-nums">{(sp.price || 0).toFixed(2)}€</span>
                        </div>
                      </div>
                    )
                  })}
                  {supplierProducts.filter((sp: any) => (sp.stock_quantity ?? 0) === 0).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                      <p className="text-sm">Aucune rupture fournisseur détectée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ChannablePageWrapper>
  )
}
