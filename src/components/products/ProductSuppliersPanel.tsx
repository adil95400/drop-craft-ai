/**
 * ProductSuppliersPanel — Ultra Pro Multi-Supplier Mapping
 * DSers-level: scoring engine, primary/fallback, variant mapping, real-time metrics
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Truck, DollarSign, Package, Star, ExternalLink,
  Clock, ArrowRight, Crown, AlertTriangle, Globe,
  Plus, Trash2, MoreVertical, RefreshCw, Shield,
  TrendingUp, TrendingDown, Zap, Lock, Unlock,
  ChevronDown, ChevronUp, BarChart3, Target,
  Link2, Unlink, ArrowUpDown, Search, Loader2,
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────
interface SupplierLink {
  id: string
  user_id: string
  product_id: string
  supplier_id: string | null
  supplier_product_id: string | null
  supplier_sku: string | null
  supplier_url: string | null
  supplier_name: string | null
  variant_key: string | null
  priority: number
  is_primary: boolean
  lead_time_days: number | null
  min_order_qty: number
  last_seen_price: number | null
  last_seen_stock: number | null
  last_seen_currency: string
  last_checked_at: string | null
  reliability_score: number
  notes: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface ProductSuppliersPanelProps {
  productId: string
  productPrice: number
  productTitle?: string
  variantKeys?: string[]
}

interface ProductVariant {
  id: string
  name: string | null
  sku: string | null
  price: number | null
  stock_quantity: number | null
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
}

// ─── Scoring Weights ─────────────────────────────────────────────────
const SCORE_WEIGHTS = {
  price: 0.40,
  leadTime: 0.25,
  reliability: 0.20,
  stock: 0.10,
  quality: 0.05,
}

function computeSupplierScore(link: SupplierLink, allLinks: SupplierLink[]): number {
  const prices = allLinks.map(l => l.last_seen_price || Infinity).filter(p => p < Infinity)
  const bestPrice = Math.min(...prices)
  const worstPrice = Math.max(...prices)
  const priceRange = worstPrice - bestPrice || 1

  const priceScore = link.last_seen_price
    ? Math.max(0, 100 - ((link.last_seen_price - bestPrice) / priceRange) * 100)
    : 0

  const leadTimes = allLinks.map(l => l.lead_time_days || 30).filter(d => d > 0)
  const bestLead = Math.min(...leadTimes)
  const worstLead = Math.max(...leadTimes)
  const leadRange = worstLead - bestLead || 1
  const leadScore = link.lead_time_days
    ? Math.max(0, 100 - ((link.lead_time_days - bestLead) / leadRange) * 100)
    : 50

  const reliabilityScore = (link.reliability_score || 0) * 100

  const stocks = allLinks.map(l => l.last_seen_stock || 0)
  const maxStock = Math.max(...stocks, 1)
  const stockScore = ((link.last_seen_stock || 0) / maxStock) * 100

  const qualityScore = link.metadata?.quality_rating ? link.metadata.quality_rating * 20 : 50

  return Math.round(
    priceScore * SCORE_WEIGHTS.price +
    leadScore * SCORE_WEIGHTS.leadTime +
    reliabilityScore * SCORE_WEIGHTS.reliability +
    stockScore * SCORE_WEIGHTS.stock +
    qualityScore * SCORE_WEIGHTS.quality
  )
}

// ─── Platform config ─────────────────────────────────────────────────
const PLATFORMS: Record<string, { emoji: string; label: string; color: string }> = {
  aliexpress: { emoji: '🇨🇳', label: 'AliExpress', color: 'hsl(var(--destructive))' },
  amazon: { emoji: '📦', label: 'Amazon', color: 'hsl(var(--chart-3))' },
  cjdropshipping: { emoji: '🚀', label: 'CJ Drop', color: 'hsl(var(--primary))' },
  bigbuy: { emoji: '🏭', label: 'BigBuy', color: 'hsl(var(--chart-2))' },
  temu: { emoji: '🛍️', label: 'Temu', color: 'hsl(var(--chart-4))' },
  ebay: { emoji: '🏷️', label: 'eBay', color: 'hsl(var(--chart-5))' },
  manual: { emoji: '✏️', label: 'Manuel', color: 'hsl(var(--muted-foreground))' },
  default: { emoji: '🏪', label: 'Autre', color: 'hsl(var(--muted-foreground))' },
}

function getPlatform(name: string | null) {
  if (!name) return PLATFORMS.default
  const key = name.toLowerCase().replace(/[^a-z]/g, '')
  for (const [k, v] of Object.entries(PLATFORMS)) {
    if (key.includes(k)) return v
  }
  return PLATFORMS.default
}

// ─── Component ───────────────────────────────────────────────────────
export function ProductSuppliersPanel({
  productId,
  productPrice,
  productTitle,
  variantKeys = [],
}: ProductSuppliersPanelProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'score' | 'price' | 'lead_time' | 'stock'>('score')

  // ─── Queries ─────────────────────────────────────────────────────
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['product-supplier-links', productId],
    queryFn: async (): Promise<SupplierLink[]> => {
      // Try product_supplier_links table first
      const { data, error } = await supabase
        .from('product_supplier_links')
        .select('*')
        .eq('product_id', productId)
        .order('priority', { ascending: true })

      if (error) {
        // Fallback: build from supplier_products
        const { data: fallback } = await (supabase as any)
          .from('supplier_products')
          .select('*')
          .eq('product_id', productId)

        if (!fallback) return []
        return fallback.map((row: any, idx: number) => ({
          id: row.id,
          user_id: row.user_id || '',
          product_id: productId,
          supplier_id: row.supplier_id,
          supplier_product_id: row.external_product_id,
          supplier_sku: row.sku,
          supplier_url: row.supplier_url,
          supplier_name: row.supplier_name || 'Fournisseur',
          variant_key: null,
          priority: idx,
          is_primary: idx === 0,
          lead_time_days: row.delivery_days || null,
          min_order_qty: row.min_order_qty || 1,
          last_seen_price: row.cost_price || row.selling_price || null,
          last_seen_stock: row.stock_quantity || null,
          last_seen_currency: row.currency || 'EUR',
          last_checked_at: row.last_synced_at,
          reliability_score: row.reliability_score || 0,
          notes: null,
          metadata: {},
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }))
      }

      return (data || []) as SupplierLink[]
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  })

  // ─── Load product variants for mapping ────────────────────────────
  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants-for-mapping', productId],
    queryFn: async (): Promise<ProductVariant[]> => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, variant_name, sku, price, stock_quantity, option1_name, option1_value, option2_name, option2_value')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })
      if (error) return []
      return (data || []) as ProductVariant[]
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  })

  const variantLabels = useMemo(() => {
    return variants.map(v => {
      const parts: string[] = []
      if (v.option1_value) parts.push(`${v.option1_name || 'Option 1'}: ${v.option1_value}`)
      if (v.option2_value) parts.push(`${v.option2_name || 'Option 2'}: ${v.option2_value}`)
      return {
        key: v.id,
        label: parts.length > 0 ? parts.join(' / ') : v.variant_name || v.sku || v.id.slice(0, 8),
        sku: v.sku,
        price: v.price,
        stock: v.stock_quantity,
      }
    })
  }, [variants])

  // ─── Mutations ───────────────────────────────────────────────────
  const addLink = useMutation({
    mutationFn: async (newLink: Partial<SupplierLink>) => {
      const { data, error } = await (supabase as any)
        .from('product_supplier_links')
        .insert({
          user_id: user?.id,
          product_id: productId,
          ...newLink,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-supplier-links', productId] })
      toast.success('Fournisseur lié avec succès')
      setShowAddDialog(false)
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })

  const updateLink = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupplierLink> }) => {
      const { error } = await (supabase as any)
        .from('product_supplier_links')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-supplier-links', productId] })
    },
  })

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('product_supplier_links')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-supplier-links', productId] })
      toast.success('Fournisseur retiré')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })

  const setPrimary = useCallback((linkId: string) => {
    updateLink.mutate(
      { id: linkId, updates: { is_primary: true } },
      { onSuccess: () => toast.success('Fournisseur principal défini') }
    )
  }, [updateLink])

  // ─── Computed ────────────────────────────────────────────────────
  const scoredLinks = useMemo(() => {
    const scored = links.map(link => ({
      ...link,
      score: computeSupplierScore(link, links),
      margin: link.last_seen_price && productPrice > 0
        ? ((productPrice - link.last_seen_price) / productPrice * 100)
        : null,
    }))

    return scored.sort((a, b) => {
      if (sortMode === 'score') return b.score - a.score
      if (sortMode === 'price') return (a.last_seen_price || Infinity) - (b.last_seen_price || Infinity)
      if (sortMode === 'lead_time') return (a.lead_time_days || 99) - (b.lead_time_days || 99)
      if (sortMode === 'stock') return (b.last_seen_stock || 0) - (a.last_seen_stock || 0)
      return 0
    })
  }, [links, productPrice, sortMode])

  const stats = useMemo(() => {
    if (links.length === 0) return null
    const prices = links.map(l => l.last_seen_price).filter((p): p is number => p !== null && p > 0)
    const bestPrice = prices.length > 0 ? Math.min(...prices) : 0
    const avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0
    const totalStock = links.reduce((s, l) => s + (l.last_seen_stock || 0), 0)
    const primary = links.find(l => l.is_primary)
    const bestLead = Math.min(...links.map(l => l.lead_time_days || 99).filter(d => d > 0 && d < 99))
    const avgReliability = links.reduce((s, l) => s + (l.reliability_score || 0), 0) / links.length
    const savings = primary && bestPrice > 0 && primary.last_seen_price
      ? ((primary.last_seen_price - bestPrice) / primary.last_seen_price * 100)
      : 0
    return { bestPrice, avgPrice, totalStock, primary, bestLead, avgReliability, count: links.length, savings }
  }, [links])

  // ─── Render ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border/60">
        <CardContent className="py-16 text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Truck className="h-10 w-10 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-base font-semibold">Aucun fournisseur mappé</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Liez des fournisseurs à ce produit pour comparer prix, stocks et délais de livraison en temps réel — comme DSers ou AutoDS.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Ajouter un fournisseur
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* ─── KPI Bar ──────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard
              icon={<Truck className="h-4 w-4" />}
              label="Sources"
              value={`${stats.count}`}
              sub={stats.primary ? `Principal: ${stats.primary.supplier_name}` : 'Aucun principal'}
            />
            <KpiCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Meilleur prix"
              value={stats.bestPrice > 0 ? `${stats.bestPrice.toFixed(2)}€` : '—'}
              sub={stats.savings > 1 ? `${stats.savings.toFixed(0)}% d'économie possible` : undefined}
              highlight={stats.savings > 5}
            />
            <KpiCard
              icon={<Package className="h-4 w-4" />}
              label="Stock cumulé"
              value={stats.totalStock.toLocaleString()}
              sub={stats.totalStock === 0 ? 'Rupture totale ⚠️' : undefined}
              alert={stats.totalStock === 0}
            />
            <KpiCard
              icon={<Clock className="h-4 w-4" />}
              label="Livraison min"
              value={stats.bestLead < 99 ? `${stats.bestLead}j` : '—'}
            />
            <KpiCard
              icon={<Shield className="h-4 w-4" />}
              label="Fiabilité moy."
              value={`${(stats.avgReliability * 100).toFixed(0)}%`}
              sub={stats.avgReliability >= 0.8 ? 'Excellent' : stats.avgReliability >= 0.5 ? 'Bon' : 'À surveiller'}
              highlight={stats.avgReliability >= 0.8}
              alert={stats.avgReliability < 0.5}
            />
          </div>
        )}

        {/* ─── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Select value={sortMode} onValueChange={(v: any) => setSortMode(v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score global</SelectItem>
                <SelectItem value="price">Prix croissant</SelectItem>
                <SelectItem value="lead_time">Délai croissant</SelectItem>
                <SelectItem value="stock">Stock décroissant</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              Pondération: Prix {SCORE_WEIGHTS.price * 100}% · Délai {SCORE_WEIGHTS.leadTime * 100}% · Fiabilité {SCORE_WEIGHTS.reliability * 100}%
            </Badge>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Ajouter source
          </Button>
        </div>

        {/* ─── Supplier Cards ───────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {scoredLinks.map((link, idx) => {
            const platform = getPlatform(link.supplier_name)
            const isExpanded = expandedId === link.id
            const scoreColor = link.score >= 75 ? 'text-success' : link.score >= 50 ? 'text-warning' : 'text-destructive'

            return (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
              >
                <Card className={cn(
                  "transition-all overflow-hidden group",
                  link.is_primary && "ring-2 ring-primary/40 shadow-md",
                  !link.is_primary && "hover:shadow-sm"
                )}>
                  <CardContent className="p-0">
                    {/* Main row */}
                    <div className="flex items-center gap-3 p-4">
                      {/* Rank */}
                      <div className={cn(
                        "flex flex-col items-center justify-center w-10 h-10 rounded-lg text-xs font-bold shrink-0",
                        idx === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        #{idx + 1}
                      </div>

                      {/* Platform icon */}
                      <div className="text-2xl shrink-0">{platform.emoji}</div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">
                            {link.supplier_name || 'Fournisseur'}
                          </span>
                          {link.is_primary && (
                            <Badge className="gap-1 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              <Crown className="h-3 w-3" />
                              Principal
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {platform.label}
                          </Badge>
                          {link.variant_key && (
                            <Badge variant="secondary" className="text-[10px]">
                              Variante: {link.variant_key}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {link.supplier_sku && <span>SKU: {link.supplier_sku}</span>}
                          {link.min_order_qty > 1 && <span>MOQ: {link.min_order_qty}</span>}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="hidden md:flex items-center gap-5">
                        {/* Price */}
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Coût</p>
                          <p className="text-sm font-bold">
                            {link.last_seen_price ? `${link.last_seen_price.toFixed(2)}€` : '—'}
                          </p>
                        </div>

                        {/* Margin */}
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Marge</p>
                          <p className={cn("text-sm font-bold", 
                            link.margin !== null && link.margin >= 30 ? "text-success" :
                            link.margin !== null && link.margin >= 15 ? "text-warning" : "text-destructive"
                          )}>
                            {link.margin !== null ? `${link.margin.toFixed(0)}%` : '—'}
                          </p>
                        </div>

                        {/* Stock */}
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stock</p>
                          <p className={cn("text-sm font-bold",
                            (link.last_seen_stock || 0) > 10 ? "text-foreground" :
                            (link.last_seen_stock || 0) > 0 ? "text-warning" : "text-destructive"
                          )}>
                            {link.last_seen_stock !== null ? link.last_seen_stock.toLocaleString() : '—'}
                          </p>
                        </div>

                        {/* Lead time */}
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Délai</p>
                          <p className="text-sm font-bold">
                            {link.lead_time_days ? `${link.lead_time_days}j` : '—'}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="text-center min-w-[50px]">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all",
                                  link.score >= 75 ? "bg-success" : link.score >= 50 ? "bg-warning" : "bg-destructive"
                                )}
                                style={{ width: `${link.score}%` }}
                              />
                            </div>
                            <span className={cn("text-sm font-bold", scoreColor)}>{link.score}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpandedId(isExpanded ? null : link.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Détails</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {!link.is_primary && (
                              <DropdownMenuItem onClick={() => setPrimary(link.id)} className="gap-2">
                                <Crown className="h-4 w-4" />
                                Définir comme principal
                              </DropdownMenuItem>
                            )}
                            {link.supplier_url && (
                              <DropdownMenuItem asChild className="gap-2">
                                <a href={link.supplier_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                  Voir chez le fournisseur
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteLink.mutate(link.id)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Retirer ce fournisseur
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile metrics */}
                    <div className="md:hidden flex items-center gap-3 px-4 pb-3 text-xs overflow-x-auto">
                      <MetricPill label="Coût" value={link.last_seen_price ? `${link.last_seen_price.toFixed(2)}€` : '—'} />
                      <MetricPill label="Marge" value={link.margin !== null ? `${link.margin.toFixed(0)}%` : '—'}
                        color={link.margin !== null && link.margin >= 30 ? 'text-success' : link.margin !== null && link.margin < 15 ? 'text-destructive' : undefined}
                      />
                      <MetricPill label="Stock" value={link.last_seen_stock?.toLocaleString() || '—'} />
                      <MetricPill label="Score" value={`${link.score}`} color={scoreColor} />
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator />
                          <div className="p-4 bg-muted/30 space-y-4">
                            {/* Score breakdown */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Décomposition du score
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <ScoreBar label="Prix" weight={SCORE_WEIGHTS.price} score={link.score} />
                                <ScoreBar label="Délai" weight={SCORE_WEIGHTS.leadTime} score={link.score} />
                                <ScoreBar label="Fiabilité" weight={SCORE_WEIGHTS.reliability} score={link.reliability_score * 100} />
                                <ScoreBar label="Stock" weight={SCORE_WEIGHTS.stock} score={Math.min(100, (link.last_seen_stock || 0) / 10 * 100)} />
                                <ScoreBar label="Qualité" weight={SCORE_WEIGHTS.quality} score={50} />
                              </div>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <DetailCell label="ID externe" value={link.supplier_product_id || '—'} />
                              <DetailCell label="SKU fournisseur" value={link.supplier_sku || '—'} />
                              <DetailCell label="MOQ" value={`${link.min_order_qty}`} />
                              <DetailCell label="Priorité" value={`#${link.priority}`} />
                              <DetailCell label="Devise" value={link.last_seen_currency} />
                              <DetailCell label="Dernière vérif." value={
                                link.last_checked_at
                                  ? new Date(link.last_checked_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : 'Jamais'
                              } />
                              <DetailCell label="Fiabilité" value={`${(link.reliability_score * 100).toFixed(0)}%`} />
                              <DetailCell label="Créé le" value={new Date(link.created_at).toLocaleDateString('fr-FR')} />
                            </div>

                            {link.notes && (
                              <div className="text-xs text-muted-foreground bg-background rounded-lg p-3 border">
                                📝 {link.notes}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* ─── Add Supplier Dialog ──────────────────────────── */}
        <AddSupplierDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={(data) => addLink.mutate(data)}
          isLoading={addLink.isPending}
          variantKeys={variantKeys}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, highlight, alert }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; highlight?: boolean; alert?: boolean
}) {
  return (
    <div className={cn(
      "p-3 rounded-xl border bg-card transition-colors",
      highlight && "border-success/30 bg-success/5",
      alert && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", highlight && "text-success", alert && "text-destructive")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted whitespace-nowrap">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-semibold", color)}>{value}</span>
    </span>
  )
}

function ScoreBar({ label, weight, score }: { label: string; weight: number; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{(weight * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all",
            score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive"
          )}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-background border">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium truncate mt-0.5">{value}</p>
    </div>
  )
}

// ─── Add Dialog ──────────────────────────────────────────────────────
function AddSupplierDialog({ open, onOpenChange, onSubmit, isLoading, variantKeys }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Partial<SupplierLink>) => void
  isLoading: boolean
  variantKeys: string[]
}) {
  const [form, setForm] = useState({
    supplier_name: '',
    supplier_url: '',
    supplier_sku: '',
    supplier_product_id: '',
    last_seen_price: '',
    last_seen_stock: '',
    lead_time_days: '',
    min_order_qty: '1',
    variant_key: '',
    is_primary: false,
    notes: '',
  })

  const handleSubmit = () => {
    if (!form.supplier_name.trim()) {
      toast.error('Le nom du fournisseur est requis')
      return
    }
    onSubmit({
      supplier_name: form.supplier_name,
      supplier_url: form.supplier_url || undefined,
      supplier_sku: form.supplier_sku || undefined,
      supplier_product_id: form.supplier_product_id || undefined,
      last_seen_price: form.last_seen_price ? parseFloat(form.last_seen_price) : undefined,
      last_seen_stock: form.last_seen_stock ? parseInt(form.last_seen_stock) : undefined,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : undefined,
      min_order_qty: parseInt(form.min_order_qty) || 1,
      variant_key: form.variant_key || undefined,
      is_primary: form.is_primary,
      notes: form.notes || undefined,
      priority: 0,
    } as any)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Lier un fournisseur
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nom du fournisseur *</Label>
              <Input
                placeholder="AliExpress Store #123..."
                value={form.supplier_name}
                onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">URL produit fournisseur</Label>
              <Input
                placeholder="https://..."
                value={form.supplier_url}
                onChange={e => setForm(f => ({ ...f, supplier_url: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">ID produit externe</Label>
              <Input
                placeholder="SKU ou ID"
                value={form.supplier_product_id}
                onChange={e => setForm(f => ({ ...f, supplier_product_id: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">SKU fournisseur</Label>
              <Input
                placeholder="FSKU-001"
                value={form.supplier_sku}
                onChange={e => setForm(f => ({ ...f, supplier_sku: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Prix d'achat (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.last_seen_price}
                onChange={e => setForm(f => ({ ...f, last_seen_price: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Stock disponible</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.last_seen_stock}
                onChange={e => setForm(f => ({ ...f, last_seen_stock: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Délai livraison (jours)</Label>
              <Input
                type="number"
                placeholder="7"
                value={form.lead_time_days}
                onChange={e => setForm(f => ({ ...f, lead_time_days: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">MOQ</Label>
              <Input
                type="number"
                placeholder="1"
                value={form.min_order_qty}
                onChange={e => setForm(f => ({ ...f, min_order_qty: e.target.value }))}
              />
            </div>
            {variantKeys.length > 0 && (
              <div className="col-span-2">
                <Label className="text-xs">Variante associée</Label>
                <Select value={form.variant_key} onValueChange={v => setForm(f => ({ ...f, variant_key: v }))}>
                  <SelectTrigger><SelectValue placeholder="Toutes variantes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes variantes</SelectItem>
                    {variantKeys.map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Fournisseur principal</Label>
                <p className="text-[11px] text-muted-foreground">Utilisé par défaut pour les commandes auto</p>
              </div>
              <Switch
                checked={form.is_primary}
                onCheckedChange={v => setForm(f => ({ ...f, is_primary: v }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Lier ce fournisseur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
