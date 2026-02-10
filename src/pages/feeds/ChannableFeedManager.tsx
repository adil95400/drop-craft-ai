/**
 * Channable-Inspired Feed Manager — Premium Export Feeds UI
 * Professional feed management with channel table, quality scores, rules, bulk actions, and advanced modals
 */
import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProductFeeds, ProductFeed } from '@/hooks/useProductFeeds'
import { useToast } from '@/hooks/use-toast'
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { ChannableModal, ChannableFormField } from '@/components/channable/ChannableModal'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rss, Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Trash2, Clock, Package, TrendingUp, Search, Loader2, Store,
  Sparkles, Zap, Globe, Filter, Settings, ArrowRight, ArrowLeft,
  Check, Tag, Star, Shield, Eye, BarChart3, GitBranch, FolderTree,
  AlertCircle, ChevronDown, ChevronRight, MoreHorizontal, Download, Copy,
  Play, Pause, Calendar, Link2, FileText, Code, Image, Type,
  ListChecks, Workflow, Info, Edit, RotateCcw, Upload
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// ── Marketplace Data ──────────────────────────────────────────────────

const MARKETPLACE_CATEGORIES = [
  { id: 'popular', name: 'Populaires', icon: Star },
  { id: 'shopping', name: 'Comparateurs', icon: Search },
  { id: 'social', name: 'Social Commerce', icon: Globe },
  { id: 'europe', name: 'Europe', icon: Globe },
  { id: 'international', name: 'International', icon: Globe },
  { id: 'niche', name: 'Niche', icon: Tag },
  { id: 'affiliate', name: 'Affiliation', icon: Zap },
]

const getMarketplaceLogoPath = (id: string): string | null => {
  const logoMap: Record<string, string> = {
    amazon: '/logos/amazon.svg', ebay: '/logos/ebay.svg', google_shopping: '/logos/google.svg',
    meta: '/logos/meta-color.svg', shopify: '/logos/shopify.svg', woocommerce: '/logos/woocommerce.svg',
    prestashop: '/logos/prestashop.svg', magento: '/logos/magento.svg', tiktok: '/logos/tiktok-shop.svg',
    instagram: '/logos/instagram-color.svg', pinterest: '/logos/pinterest.svg', facebook: '/logos/facebook.svg',
    cdiscount: '/logos/cdiscount.svg', fnac: '/logos/fnac.svg', zalando: '/logos/zalando.svg',
    aliexpress: '/logos/aliexpress.svg', rakuten: '/logos/rakuten.svg', etsy: '/logos/etsy.svg',
    google: '/logos/google.svg', google_ads: '/logos/google-ads.svg',
  }
  return logoMap[id] || null
}

const MARKETPLACES = [
  { id: 'amazon', name: 'Amazon', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'ebay', name: 'eBay', emoji: '🏷️', category: 'popular', status: 'popular' },
  { id: 'google_shopping', name: 'Google Shopping', emoji: '🔍', category: 'popular', status: 'popular' },
  { id: 'meta', name: 'Meta Commerce', emoji: '📘', category: 'popular', status: 'popular' },
  { id: 'shopify', name: 'Shopify', emoji: '🛍️', category: 'popular', status: 'popular' },
  { id: 'woocommerce', name: 'WooCommerce', emoji: '🔮', category: 'popular', status: 'popular' },
  { id: 'prestashop', name: 'PrestaShop', emoji: '🛒', category: 'popular', status: 'popular' },
  { id: 'magento', name: 'Magento', emoji: '🧱', category: 'popular', status: 'popular' },
  { id: 'tiktok', name: 'TikTok Shop', emoji: '🎵', category: 'social', status: 'trending' },
  { id: 'instagram', name: 'Instagram Shopping', emoji: '📸', category: 'social', status: 'trending' },
  { id: 'pinterest', name: 'Pinterest', emoji: '📌', category: 'social', status: 'popular' },
  { id: 'facebook', name: 'Facebook Shop', emoji: '📘', category: 'social', status: 'popular' },
  { id: 'bing_shopping', name: 'Bing Shopping', emoji: '🔷', category: 'shopping', status: 'popular' },
  { id: 'idealo', name: 'Idealo', emoji: '💡', category: 'shopping', status: 'eu' },
  { id: 'kelkoo', name: 'Kelkoo', emoji: '🔶', category: 'shopping', status: 'eu' },
  { id: 'google_ads', name: 'Google Ads', emoji: '📢', category: 'shopping', status: 'popular' },
  { id: 'cdiscount', name: 'Cdiscount', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'fnac', name: 'Fnac', emoji: '🇫🇷', category: 'europe', status: 'eu' },
  { id: 'zalando', name: 'Zalando', emoji: '👟', category: 'europe', status: 'eu' },
  { id: 'manomano', name: 'ManoMano', emoji: '🔧', category: 'europe', status: 'eu' },
  { id: 'walmart', name: 'Walmart', emoji: '🏪', category: 'international', status: 'popular' },
  { id: 'aliexpress', name: 'AliExpress', emoji: '🇨🇳', category: 'international', status: 'popular' },
  { id: 'rakuten', name: 'Rakuten', emoji: '🇯🇵', category: 'international', status: 'popular' },
  { id: 'shopee', name: 'Shopee', emoji: '🧡', category: 'international', status: 'trending' },
  { id: 'etsy', name: 'Etsy', emoji: '🎨', category: 'niche', status: 'popular' },
  { id: 'wayfair', name: 'Wayfair', emoji: '🏠', category: 'niche', status: 'popular' },
  { id: 'decathlon', name: 'Decathlon', emoji: '⚽', category: 'niche', status: 'eu' },
  { id: 'awin', name: 'Awin', emoji: '🔗', category: 'affiliate', status: 'popular' },
  { id: 'cj', name: 'CJ Affiliate', emoji: '🤝', category: 'affiliate', status: 'popular' },
  { id: 'criteo', name: 'Criteo', emoji: '🎯', category: 'affiliate', status: 'popular' },
]

// ── Reusable Components ───────────────────────────────────────────────

const MarketplaceLogo = ({ id, emoji, size = 24 }: { id: string; emoji: string; size?: number }) => {
  const logoPath = getMarketplaceLogoPath(id)
  if (logoPath) {
    return (
      <img src={logoPath} alt={id} className="object-contain" style={{ width: size, height: size }}
        onError={(e) => {
          const parent = e.currentTarget.parentElement
          if (parent) parent.innerHTML = `<span style="font-size: ${size}px">${emoji}</span>`
        }}
      />
    )
  }
  return <span style={{ fontSize: size }}>{emoji}</span>
}

const QualityScore = ({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) => {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-500/10 border-green-500/20'
    if (score >= 50) return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    return 'text-red-600 bg-red-500/10 border-red-500/20'
  }
  const getIcon = () => {
    if (score >= 80) return <CheckCircle className={cn(size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
    if (score >= 50) return <AlertCircle className={cn(size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
    return <XCircle className={cn(size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            "flex items-center gap-1.5 rounded-full border font-semibold",
            getColor(),
            size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
          )}>
            {getIcon()}
            {score}%
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Score de qualité du feed</p>
          <p className="text-xs text-muted-foreground">
            {score >= 80 ? 'Excellent — prêt pour la marketplace' : score >= 50 ? 'Moyen — améliorations recommandées' : 'Faible — corrections nécessaires'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const FeedStatusChip = ({ status }: { status: string | null }) => {
  const configs: Record<string, { color: string; icon: any; label: string }> = {
    completed: { color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle, label: 'Actif' },
    pending: { color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Clock, label: 'En attente' },
    error: { color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: XCircle, label: 'Erreur' },
    generating: { color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: RefreshCw, label: 'Génération...' },
  }
  const config = configs[status || 'pending'] || configs.pending
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn("gap-1 border", config.color)}>
      <Icon className={cn("h-3 w-3", status === 'generating' && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

// ── Quality Checklist Items ───────────────────────────────────────────

interface QualityCheckItem {
  label: string
  description: string
  icon: any
  check: (feed: ProductFeed) => boolean
  weight: number
}

const QUALITY_CHECKS: QualityCheckItem[] = [
  { label: 'Titres optimisés', description: 'Titres de produits conformes aux exigences du canal', icon: Type, check: (f) => !!f.name, weight: 20 },
  { label: 'Images HD présentes', description: 'Images haute résolution (min. 800×800px)', icon: Image, check: (f) => (f.product_count || 0) > 0, weight: 20 },
  { label: 'Catégories mappées', description: 'Catégories produits mappées vers la taxonomie cible', icon: FolderTree, check: () => false, weight: 20 },
  { label: 'Prix & disponibilité', description: 'Prix, devise et état du stock renseignés', icon: Tag, check: (f) => f.generation_status === 'completed', weight: 15 },
  { label: 'Identifiants produits', description: 'GTIN, EAN, UPC ou MPN renseignés', icon: FileText, check: () => false, weight: 15 },
  { label: 'Descriptions enrichies', description: 'Descriptions > 150 caractères avec mots-clés', icon: ListChecks, check: (f) => !!f.feed_url, weight: 10 },
]

function getQualityScore(feed: ProductFeed): number {
  return QUALITY_CHECKS.reduce((score, item) => score + (item.check(feed) ? item.weight : 0), 0)
}

// ── Feed Settings Modal ───────────────────────────────────────────────

function FeedSettingsModal({ feed, open, onOpenChange, onSave }: { 
  feed: ProductFeed | null; open: boolean; onOpenChange: (v: boolean) => void;
  onSave: (id: string, data: { name?: string; feed_type?: string; settings?: Record<string, unknown> }) => void
}) {
  const [activeTab, setActiveTab] = useState('general')
  const [feedName, setFeedName] = useState('')
  
  // Sync local state when feed changes
  React.useEffect(() => {
    if (feed) setFeedName(feed.name)
  }, [feed])

  if (!feed) return null
  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
  const quality = getQualityScore(feed)

  const handleSave = () => {
    onSave(feed.id, { name: feedName })
    onOpenChange(false)
  }

  return (
    <ChannableModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Configuration — ${feedName || feed.name}`}
      description={`Canal: ${mp?.name || feed.feed_type}`}
      icon={Settings}
      size="xl"
      variant="premium"
      submitLabel="Sauvegarder"
      onSubmit={handleSave}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-9">
          <TabsTrigger value="general" className="text-xs gap-1"><Settings className="h-3 w-3" />Général</TabsTrigger>
          <TabsTrigger value="mapping" className="text-xs gap-1"><FolderTree className="h-3 w-3" />Mapping</TabsTrigger>
          <TabsTrigger value="rules" className="text-xs gap-1"><GitBranch className="h-3 w-3" />Règles</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs gap-1"><Shield className="h-3 w-3" />Qualité</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs gap-1"><Calendar className="h-3 w-3" />Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{feed.name}</p>
              <p className="text-xs text-muted-foreground">{mp?.name} • {(feed.product_count || 0).toLocaleString()} produits</p>
            </div>
            <QualityScore score={quality} />
          </div>

          <ChannableFormField label="Nom du feed" required>
            <Input value={feedName} onChange={(e) => setFeedName(e.target.value)} className="h-9" />
          </ChannableFormField>

          <div className="grid grid-cols-2 gap-4">
            <ChannableFormField label="Format d'export">
              <Select defaultValue="xml">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="tsv">TSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </ChannableFormField>
            <ChannableFormField label="Pays cible">
              <Select defaultValue="FR">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="DE">🇩🇪 Allemagne</SelectItem>
                  <SelectItem value="ES">🇪🇸 Espagne</SelectItem>
                  <SelectItem value="IT">🇮🇹 Italie</SelectItem>
                  <SelectItem value="UK">🇬🇧 Royaume-Uni</SelectItem>
                  <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                </SelectContent>
              </Select>
            </ChannableFormField>
          </div>

          {feed.feed_url && (
            <ChannableFormField label="URL du feed" hint="Partagez cette URL avec votre marketplace">
              <div className="flex gap-2">
                <Input defaultValue={feed.feed_url} readOnly className="h-9 font-mono text-xs" />
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => navigator.clipboard.writeText(feed.feed_url || '')}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </ChannableFormField>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Options avancées</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Optimisation IA</p>
                <p className="text-xs text-muted-foreground">Améliorer automatiquement titres et descriptions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Filtrer les ruptures</p>
                <p className="text-xs text-muted-foreground">Exclure les produits en rupture de stock</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enrichissement automatique</p>
                <p className="text-xs text-muted-foreground">Ajouter GTIN, marque et catégories manquants</p>
              </div>
              <Switch />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border border-dashed bg-muted/20 text-center">
            <FolderTree className="h-10 w-10 mx-auto mb-3 text-primary/50" />
            <h4 className="font-semibold text-sm mb-1">Mapping de catégories</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-3">
              Mappez vos catégories vers la taxonomie officielle {mp?.name || 'du canal'} pour maximiser la visibilité
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />Importer mapping
              </Button>
              <Button size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />Auto-mapper par IA
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {['Électronique', 'Mode & Accessoires', 'Maison & Jardin', 'Sports & Loisirs'].map(cat => (
              <div key={cat} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Non mappé</Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Mapper</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border border-dashed bg-muted/20 text-center">
            <GitBranch className="h-10 w-10 mx-auto mb-3 text-primary/50" />
            <h4 className="font-semibold text-sm mb-1">Règles de transformation</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-3">
              Transformez automatiquement vos données produit avec des règles IF/THEN puissantes
            </p>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Nouvelle règle
            </Button>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Préfixer titre avec marque', type: 'Combinaison', active: true },
              { name: 'Exclure prix < 5€', type: 'Exclusion', active: true },
              { name: 'Arrondir prix à .99', type: 'Réécriture', active: false },
            ].map(rule => (
              <div key={rule.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", rule.active ? "bg-green-500" : "bg-muted-foreground/30")} />
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.type}</p>
                  </div>
                </div>
                <Switch defaultChecked={rule.active} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Score de qualité</h4>
              <p className="text-xs text-muted-foreground">Basé sur {QUALITY_CHECKS.length} critères</p>
            </div>
            <QualityScore score={quality} size="lg" />
          </div>
          <Progress value={quality} className="h-2.5" />

          <div className="space-y-2">
            {QUALITY_CHECKS.map(item => {
              const passed = item.check(feed)
              const ItemIcon = item.icon
              return (
                <div key={item.label} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  passed ? "bg-green-500/5 border-green-500/20" : "bg-muted/30"
                )}>
                  <div className={cn(
                    "p-1.5 rounded-lg mt-0.5",
                    passed ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    <ItemIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.label}</p>
                      <Badge variant="outline" className={cn("text-[10px]", passed ? "text-green-600 border-green-500/30" : "text-muted-foreground")}>
                        {passed ? 'OK' : `+${item.weight}%`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 space-y-4">
          <ChannableFormField label="Fréquence de synchronisation">
            <Select defaultValue="daily">
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="6hours">Toutes les 6 heures</SelectItem>
                <SelectItem value="12hours">Toutes les 12 heures</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </ChannableFormField>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">Dernière synchronisation</p>
              <p className="text-sm font-semibold">
                {feed.last_generated_at ? new Date(feed.last_generated_at).toLocaleString('fr-FR') : 'Jamais'}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">Prochaine synchronisation</p>
              <p className="text-sm font-semibold">Dans 24h</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">Recevoir une alerte en cas d'erreur</p>
            </div>
            <Switch defaultChecked />
          </div>
        </TabsContent>
      </Tabs>
    </ChannableModal>
  )
}

// ── Delete Confirmation Modal ─────────────────────────────────────────

function DeleteFeedModal({ feed, open, onOpenChange, onConfirm }: {
  feed: ProductFeed | null; open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void
}) {
  if (!feed) return null
  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
  return (
    <ChannableModal
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer le feed"
      description="Cette action est irréversible"
      icon={Trash2}
      variant="danger"
      size="sm"
      submitLabel="Supprimer définitivement"
      onSubmit={() => { onConfirm(); onOpenChange(false) }}
    >
      <div className="p-3 rounded-xl border bg-destructive/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={24} />
        </div>
        <div>
          <p className="font-semibold text-sm">{feed.name}</p>
          <p className="text-xs text-muted-foreground">{mp?.name} • {(feed.product_count || 0)} produits</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3">
        Tous les paramètres, règles et mappings associés à ce feed seront perdus. L'URL de feed deviendra inactive immédiatement.
      </p>
    </ChannableModal>
  )
}

// ── Expanded Row Content ──────────────────────────────────────────────

function FeedExpandedRow({ feed, onOpenSettings, onGenerate, isGenerating }: {
  feed: ProductFeed; onOpenSettings: () => void; onGenerate: () => void; isGenerating: boolean
}) {
  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
  const quality = getQualityScore(feed)

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="p-5 border-t bg-muted/5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — Overview Card */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={28} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{mp?.name}</p>
                  <FeedStatusChip status={feed.generation_status} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="font-medium">XML</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fréquence</p>
                  <p className="font-medium">24h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pays</p>
                  <p className="font-medium">🇫🇷 France</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IA</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />Activée
                  </Badge>
                </div>
              </div>

              {feed.feed_url && (
                <div className="p-2.5 rounded-lg bg-muted/50 flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <code className="text-[10px] flex-1 truncate text-muted-foreground">{feed.feed_url}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(feed.feed_url || '')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={onOpenSettings}>
                  <Settings className="h-3.5 w-3.5" />Configurer
                </Button>
                <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={onGenerate} disabled={isGenerating}>
                  <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
                  Synchroniser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Center — Quality Breakdown */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />Qualité du feed
                </h4>
                <QualityScore score={quality} />
              </div>
              <Progress value={quality} className="h-2" />
              <div className="space-y-1.5">
                {QUALITY_CHECKS.map(item => {
                  const passed = item.check(feed)
                  return (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <span className={cn("flex-1", !passed && 'text-muted-foreground')}>{item.label}</span>
                      <span className="text-muted-foreground font-mono">{item.weight}%</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right — Quick Actions */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />Actions rapides
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Optimiser titres avec IA', icon: Sparkles, desc: 'Améliorer SEO et pertinence' },
                  { label: 'Auto-mapper catégories', icon: FolderTree, desc: 'Mapping intelligent par IA' },
                  { label: 'Ajouter règles IF/THEN', icon: GitBranch, desc: 'Transformer les données' },
                  { label: 'Prévisualiser le feed', icon: Eye, desc: `${feed.product_count || 0} produits • XML` },
                  { label: 'Télécharger le feed', icon: Download, desc: 'Export XML / CSV / JSON' },
                ].map(action => (
                  <button
                    key={action.label}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <action.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export default function ChannableFeedManager() {
  const { toast } = useToast()
  const { feeds, isLoading: isLoadingFeeds, stats, createFeed, isCreating, updateFeed, deleteFeed, generateFeed, isGenerating } = useProductFeeds()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('popular')
  const [newFeed, setNewFeed] = useState({ name: '', marketplace: '' })
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [settingsFeed, setSettingsFeed] = useState<ProductFeed | null>(null)
  const [deletingFeed, setDeletingFeed] = useState<ProductFeed | null>(null)

  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || feed.generation_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [feeds, searchTerm, statusFilter])

  const allSelected = filteredFeeds.length > 0 && selectedIds.length === filteredFeeds.length
  const someSelected = selectedIds.length > 0

  const toggleAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(filteredFeeds.map(f => f.id))
  }

  const toggleRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleCreateFeed = () => {
    if (!newFeed.name || !newFeed.marketplace) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs', variant: 'destructive' })
      return
    }
    createFeed({ name: newFeed.name, feed_type: newFeed.marketplace })
    setShowCreateDialog(false)
    setNewFeed({ name: '', marketplace: '' })
    setCreateStep(1)
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setNewFeed({ name: '', marketplace: '' })
    setCreateStep(1)
  }

  const selectedMp = MARKETPLACES.find(mp => mp.id === newFeed.marketplace)

  return (
    <ChannablePageWrapper
      title="Export Feeds"
      subtitle="Canaux de vente"
      description={`${stats.totalFeeds} feeds configurés • ${stats.activeFeeds} actifs • ${stats.totalProducts.toLocaleString()} produits synchronisés sur ${MARKETPLACES.length}+ marketplaces`}
      heroImage="integrations"
      badge={{ label: "Feeds", icon: Rss }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur" onClick={() => feeds.forEach(f => generateFeed(f.id))}>
            <RefreshCw className="h-4 w-4" />
            Tout synchroniser
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Feed
          </Button>
        </div>
      }
    >
      <FeedSubNavigation />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Feeds actifs', value: stats.activeFeeds, total: stats.totalFeeds, icon: Rss, color: 'text-primary' },
          { label: 'Produits exportés', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-blue-600' },
          { label: 'Canaux connectés', value: new Set(feeds.map(f => f.feed_type)).size, icon: Globe, color: 'text-green-600' },
          { label: 'Erreurs', value: stats.errorFeeds, icon: AlertTriangle, color: stats.errorFeeds > 0 ? 'text-red-600' : 'text-muted-foreground' },
          { label: 'Qualité moy.', value: feeds.length > 0 ? `${Math.round(feeds.reduce((s, f) => s + getQualityScore(f), 0) / feeds.length)}%` : '--', icon: Shield, color: 'text-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-xl font-bold">{kpi.value}</p>
                  {'total' in kpi && kpi.total !== undefined && (
                    <span className="text-xs text-muted-foreground">/{kpi.total}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-3 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-primary-foreground">{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
                    Tout désélectionner
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                    selectedIds.forEach(id => generateFeed(id))
                    toast({ title: 'Synchronisation lancée', description: `${selectedIds.length} feed(s) en cours de synchronisation` })
                  }}>
                    <RefreshCw className="h-3 w-3" />Synchroniser
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                    toast({ title: 'Export lancé', description: `${selectedIds.length} feed(s) en cours d'export` })
                  }}>
                    <Download className="h-3 w-3" />Exporter
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => {
                    selectedIds.forEach(id => deleteFeed(id))
                    setSelectedIds([])
                    toast({ title: 'Suppression', description: `${selectedIds.length} feed(s) supprimé(s)` })
                  }}>
                    <Trash2 className="h-3 w-3" />Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, canal, format..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="error">En erreur</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-9 px-3 flex items-center gap-1 whitespace-nowrap">
              {filteredFeeds.length} feed{filteredFeeds.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Feed Table */}
      <AnimatePresence mode="wait">
        {isLoadingFeeds ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Chargement des feeds...</p>
            </div>
          </div>
        ) : filteredFeeds.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-2xl bg-primary/5 mb-4">
                <Rss className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun feed configuré</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Connectez vos premiers canaux de vente pour exporter vos produits vers 2,500+ marketplaces, plateformes publicitaires et comparateurs.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un feed
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
                  </TableHead>
                  <TableHead className="w-14">Canal</TableHead>
                  <TableHead>Nom du feed</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Produits</TableHead>
                  <TableHead className="text-center">Qualité</TableHead>
                  <TableHead>Mise à jour</TableHead>
                  <TableHead className="text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeds.map((feed) => {
                  const mp = MARKETPLACES.find(m => m.id === feed.feed_type)
                  const quality = getQualityScore(feed)
                  const isExpanded = expandedFeed === feed.id
                  const isSelected = selectedIds.includes(feed.id)

                  return (
                    <React.Fragment key={feed.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer transition-colors",
                          isExpanded && "bg-muted/20 border-b-0",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => setExpandedFeed(isExpanded ? null : feed.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(feed.id)} />
                        </TableCell>
                        <TableCell>
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                            <MarketplaceLogo id={feed.feed_type} emoji={mp?.emoji || '📦'} size={28} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{feed.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {mp?.name || feed.feed_type}
                              <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <FeedStatusChip status={feed.generation_status} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-semibold text-sm">{(feed.product_count || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <QualityScore score={quality} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {feed.last_generated_at
                              ? new Date(feed.last_generated_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'Jamais'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateFeed(feed.id)} disabled={isGenerating}>
                                    <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Synchroniser</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSettingsFeed(feed)}>
                                  <Settings className="h-4 w-4 mr-2" />Configurer
                                </DropdownMenuItem>
                                {feed.feed_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={feed.feed_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2" />Ouvrir le feed
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(feed.feed_url || '')
                                  toast({ title: 'URL copiée', description: 'URL du feed copiée dans le presse-papier' })
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />Copier l'URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({ title: 'Téléchargement', description: `Export du feed "${feed.name}" lancé` })
                                }}>
                                  <Download className="h-4 w-4 mr-2" />Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingFeed(feed)}>
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row — 3-column layout */}
                      {isExpanded && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0">
                            <FeedExpandedRow
                              feed={feed}
                              onOpenSettings={() => setSettingsFeed(feed)}
                              onGenerate={() => generateFeed(feed.id)}
                              isGenerating={isGenerating}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </AnimatePresence>

      {/* Quick Add Marketplace Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Ajouter un canal
              </CardTitle>
              <CardDescription>{MARKETPLACES.length}+ marketplaces et canaux supportés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {MARKETPLACE_CATEGORIES.map(cat => {
                const Icon = cat.icon
                const count = MARKETPLACES.filter(mp => mp.category === cat.id).length
                return (
                  <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background">
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{cat.name}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">{count}</Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {MARKETPLACE_CATEGORIES.map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="mt-3">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {MARKETPLACES.filter(mp => mp.category === cat.id).map(mp => (
                    <motion.button
                      key={mp.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setNewFeed({ name: `${mp.name} Feed`, marketplace: mp.id })
                        setShowCreateDialog(true)
                        setCreateStep(2)
                      }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all hover:border-primary hover:shadow-md bg-card"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={20} />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">{mp.name}</span>
                    </motion.button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Modals ──────────────────────────────────────────────────── */}

      {/* Create Feed Modal */}
      <ChannableModal
        open={showCreateDialog}
        onOpenChange={handleCloseDialog}
        title={createStep === 1 ? 'Choisir un canal' : `Configuration — ${selectedMp?.name || ''}`}
        description={createStep === 1 ? 'Sélectionnez le canal de vente cible' : 'Personnalisez les paramètres de votre feed'}
        icon={createStep === 1 ? Store : Settings}
        variant="premium"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={createStep === 1 ? handleCloseDialog : () => setCreateStep(1)} className="gap-2">
              {createStep === 1 ? 'Annuler' : <><ArrowLeft className="h-4 w-4" />Retour</>}
            </Button>
            {createStep === 1 ? (
              <Button onClick={() => setCreateStep(2)} disabled={!newFeed.marketplace} className="gap-2">
                Continuer<ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreateFeed} disabled={isCreating || !newFeed.name} className="gap-2">
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : <><Check className="h-4 w-4" />Créer le feed</>}
              </Button>
            )}
          </div>
        }
      >
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-5">
          <div className={cn("flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold", createStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>1</div>
          <div className={cn("h-0.5 flex-1", createStep >= 2 ? "bg-primary" : "bg-muted")} />
          <div className={cn("flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold", createStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
        </div>

        <AnimatePresence mode="wait">
          {createStep === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full">
                  {MARKETPLACE_CATEGORIES.slice(0, 4).map(cat => {
                    const Icon = cat.icon
                    return (
                      <TabsTrigger key={cat.id} value={cat.id} className="flex-1 flex items-center justify-center gap-1 text-xs">
                        <Icon className="h-3 w-3" />{cat.name}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                {MARKETPLACE_CATEGORIES.map(cat => (
                  <TabsContent key={cat.id} value={cat.id} className="mt-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {MARKETPLACES.filter(mp => mp.category === cat.id).slice(0, 8).map(mp => (
                        <button
                          key={mp.id}
                          onClick={() => setNewFeed({ ...newFeed, marketplace: mp.id, name: `${mp.name} Feed` })}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm",
                            newFeed.marketplace === mp.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-border bg-card"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <MarketplaceLogo id={mp.id} emoji={mp.emoji} size={24} />
                          </div>
                          <span className="text-xs font-medium">{mp.name}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {selectedMp && (
                <div className="p-3 rounded-xl border bg-muted/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MarketplaceLogo id={selectedMp.id} emoji={selectedMp.emoji} size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedMp.name}</p>
                    <p className="text-xs text-muted-foreground">Canal sélectionné</p>
                  </div>
                  <Badge className="ml-auto" variant="outline"><Check className="h-3 w-3 mr-1" />OK</Badge>
                </div>
              )}
              <ChannableFormField label="Nom du feed" required hint="Identifiant unique pour ce flux d'export">
                <Input
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder={`Ex: ${selectedMp?.name || 'Amazon'} FR — Catalogue`}
                  className="h-10"
                />
              </ChannableFormField>

              <div className="grid grid-cols-2 gap-4">
                <ChannableFormField label="Format">
                  <Select defaultValue="xml">
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </ChannableFormField>
                <ChannableFormField label="Pays cible">
                  <Select defaultValue="FR">
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="DE">🇩🇪 Allemagne</SelectItem>
                      <SelectItem value="ES">🇪🇸 Espagne</SelectItem>
                      <SelectItem value="UK">🇬🇧 Royaume-Uni</SelectItem>
                    </SelectContent>
                  </Select>
                </ChannableFormField>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Optimisation IA</p>
                    <p className="text-xs text-muted-foreground">Titres et descriptions optimisés automatiquement</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ChannableModal>

      {/* Settings Modal */}
      <FeedSettingsModal
        feed={settingsFeed}
        open={!!settingsFeed}
        onOpenChange={(v) => !v && setSettingsFeed(null)}
        onSave={(id, data) => updateFeed({ id, data })}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFeedModal
        feed={deletingFeed}
        open={!!deletingFeed}
        onOpenChange={(v) => !v && setDeletingFeed(null)}
        onConfirm={() => deletingFeed && deleteFeed(deletingFeed.id)}
      />
    </ChannablePageWrapper>
  )
}
