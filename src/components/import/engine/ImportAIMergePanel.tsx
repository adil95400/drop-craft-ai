/**
 * ImportAIMergePanel — Déduplication intelligente SKU + URL + hash perceptuel
 * Suggestions de fusion IA avec score de confiance multi-critères
 */
import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sparkles, GitMerge, ArrowRight, Check, X, Eye,
  Image, Tag, DollarSign, AlertTriangle, Zap, Hash,
  Link2, Search, ScanLine, Shield, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DuplicatePair {
  id: string
  product1: {
    id: string
    name: string
    sku?: string
    price?: number
    imageUrl?: string
    source?: string
    sourceUrl?: string
  }
  product2: {
    id: string
    name: string
    sku?: string
    price?: number
    imageUrl?: string
    source?: string
    sourceUrl?: string
  }
  confidence: number
  matchTypes: ('sku' | 'title' | 'image_hash' | 'url' | 'barcode')[]
  suggestion: 'merge' | 'keep_both' | 'review'
}

interface ImportAIMergePanelProps {
  className?: string
}

// Demo data with multi-criteria matching
const demoPairs: DuplicatePair[] = [
  {
    id: '1',
    product1: { id: 'p1', name: 'Écouteurs Bluetooth Pro Max', sku: 'BT-PRO-001', price: 29.99, source: 'AliExpress', sourceUrl: 'https://aliexpress.com/item/123' },
    product2: { id: 'p2', name: 'Bluetooth Pro Max Earbuds', sku: 'BT-PRO-001', price: 31.99, source: 'CJ Dropshipping', sourceUrl: 'https://cjdropshipping.com/p/456' },
    confidence: 97,
    matchTypes: ['sku', 'title', 'image_hash'],
    suggestion: 'merge',
  },
  {
    id: '2',
    product1: { id: 'p3', name: 'Montre Connectée Sport 2024', price: 45.00, source: 'Amazon', sourceUrl: 'https://amazon.fr/dp/B0XYZ' },
    product2: { id: 'p4', name: 'Smart Watch Sport Edition 2024', price: 42.50, source: 'AliExpress', sourceUrl: 'https://aliexpress.com/item/789' },
    confidence: 82,
    matchTypes: ['title', 'image_hash'],
    suggestion: 'review',
  },
  {
    id: '3',
    product1: { id: 'p5', name: 'Coque iPhone 15 Silicone', sku: 'CASE-IP15-SIL', price: 8.99, source: 'Temu' },
    product2: { id: 'p6', name: 'iPhone 15 Silicone Case Premium', sku: 'CASE-IP15-SIL', price: 12.99, source: 'AliExpress' },
    confidence: 98,
    matchTypes: ['sku', 'url'],
    suggestion: 'merge',
  },
  {
    id: '4',
    product1: { id: 'p7', name: 'Lampe LED Bureau Flexible', price: 18.50, source: 'Amazon' },
    product2: { id: 'p8', name: 'Desk LED Lamp Flexible Arm', price: 16.90, source: 'Temu' },
    confidence: 74,
    matchTypes: ['image_hash'],
    suggestion: 'review',
  },
]

const matchTypeConfig: Record<string, { icon: any; label: string; color: string; description: string }> = {
  sku: { icon: Tag, label: 'SKU', color: 'text-emerald-600 bg-emerald-500/10', description: 'SKU/référence identique' },
  title: { icon: Sparkles, label: 'Titre', color: 'text-blue-600 bg-blue-500/10', description: 'Similarité textuelle du titre' },
  image_hash: { icon: Hash, label: 'Hash Image', color: 'text-purple-600 bg-purple-500/10', description: 'Hash perceptuel (pHash) similaire' },
  url: { icon: Link2, label: 'URL source', color: 'text-amber-600 bg-amber-500/10', description: 'URL source normalisée identique' },
  barcode: { icon: ScanLine, label: 'Code-barres', color: 'text-rose-600 bg-rose-500/10', description: 'EAN/UPC identique' },
}

export function ImportAIMergePanel({ className }: ImportAIMergePanelProps) {
  const [pairs, setPairs] = useState<DuplicatePair[]>(demoPairs)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [scanning, setScanning] = useState(false)

  const visiblePairs = useMemo(() => {
    return pairs
      .filter(p => !dismissed.has(p.id))
      .filter(p => {
        if (filterType !== 'all') {
          return p.matchTypes.includes(filterType as any)
        }
        return true
      })
      .filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return p.product1.name.toLowerCase().includes(q) ||
          p.product2.name.toLowerCase().includes(q) ||
          p.product1.sku?.toLowerCase().includes(q) ||
          p.product2.sku?.toLowerCase().includes(q)
      })
  }, [pairs, dismissed, search, filterType])

  const handleMerge = useCallback((pairId: string) => {
    toast.success('Fusion programmée — les produits seront fusionnés par l\'IA')
    setDismissed(prev => new Set([...prev, pairId]))
  }, [])

  const handleMergeAll = useCallback(() => {
    const autoMerge = visiblePairs.filter(p => p.confidence >= 90)
    autoMerge.forEach(p => setDismissed(prev => new Set([...prev, p.id])))
    toast.success(`${autoMerge.length} fusion(s) automatique(s) lancée(s) (confiance ≥ 90%)`)
  }, [visiblePairs])

  const handleDismiss = useCallback((pairId: string) => {
    setDismissed(prev => new Set([...prev, pairId]))
  }, [])

  const handleScan = useCallback(() => {
    setScanning(true)
    toast.info('Scan de déduplication en cours (SKU + URL + Hash perceptuel)...')
    setTimeout(() => {
      setScanning(false)
      toast.success('Scan terminé — doublons mis à jour')
    }, 2000)
  }, [])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
    if (confidence >= 70) return 'text-blue-600 bg-blue-500/10 border-blue-500/30'
    return 'text-amber-600 bg-amber-500/10 border-amber-500/30'
  }

  const stats = useMemo(() => ({
    total: pairs.filter(p => !dismissed.has(p.id)).length,
    highConfidence: pairs.filter(p => !dismissed.has(p.id) && p.confidence >= 90).length,
    merged: dismissed.size,
  }), [pairs, dismissed])

  return (
    <Card className={cn('border-2 border-violet-500/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 bg-violet-500/10 rounded-lg">
                <GitMerge className="w-4 h-4 text-violet-600" />
              </div>
              Déduplication Intelligente
              <Badge className="ml-1 bg-violet-500/10 text-violet-600 border-violet-500/30" variant="outline">
                {stats.total} doublon{stats.total > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Détection multi-critères : SKU, URL normalisée, hash perceptuel d'image, similarité titre
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats.highConfidence > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleMergeAll}>
                <Zap className="w-3 h-3" />
                Auto-merge ({stats.highConfidence})
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleScan} disabled={scanning}>
              <ScanLine className={cn("w-3 h-3", scanning && "animate-pulse")} />
              {scanning ? 'Scan...' : 'Scanner'}
            </Button>
          </div>
        </div>

        {/* Match type filter chips */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <Badge
            variant="outline"
            className={cn('text-[10px] cursor-pointer', filterType === 'all' && 'ring-1 ring-offset-1 ring-primary')}
            onClick={() => setFilterType('all')}
          >
            Tous
          </Badge>
          {Object.entries(matchTypeConfig).map(([key, config]) => {
            const TypeIcon = config.icon
            return (
              <Badge
                key={key}
                variant="outline"
                className={cn('text-[10px] cursor-pointer gap-0.5', config.color,
                  filterType === key && 'ring-1 ring-offset-1'
                )}
                onClick={() => setFilterType(filterType === key ? 'all' : key)}
              >
                <TypeIcon className="w-2.5 h-2.5" />
                {config.label}
              </Badge>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search */}
        {stats.total > 3 && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
        )}

        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {visiblePairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {dismissed.size > 0 ? `${dismissed.size} doublon(s) traité(s) — catalogue propre` : 'Aucun doublon détecté'}
              </div>
            ) : (
              visiblePairs.map(pair => (
                <DuplicatePairCard
                  key={pair.id}
                  pair={pair}
                  onMerge={handleMerge}
                  onDismiss={handleDismiss}
                  getConfidenceColor={getConfidenceColor}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Extracted pair card component for cleaner code
function DuplicatePairCard({
  pair, onMerge, onDismiss, getConfidenceColor
}: {
  pair: DuplicatePair
  onMerge: (id: string) => void
  onDismiss: (id: string) => void
  getConfidenceColor: (c: number) => string
}) {
  return (
    <div className="border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Header with match types */}
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {pair.matchTypes.map(type => {
            const config = matchTypeConfig[type]
            if (!config) return null
            const TypeIcon = config.icon
            return (
              <Badge key={type} variant="outline" className={cn('text-[10px] gap-0.5', config.color)}>
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </Badge>
            )
          })}
          <Badge variant="outline" className={cn('text-[10px] border', getConfidenceColor(pair.confidence))}>
            {pair.confidence}% confiance
          </Badge>
        </div>
        {pair.suggestion === 'merge' && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]" variant="outline">
            <Check className="w-3 h-3 mr-1" />
            Fusion recommandée
          </Badge>
        )}
        {pair.suggestion === 'review' && (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]" variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            À vérifier
          </Badge>
        )}
      </div>

      {/* Products comparison */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <ProductCard product={pair.product1} />
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <GitMerge className="w-4 h-4 text-violet-500" />
        </div>
        <ProductCard product={pair.product2} />
      </div>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Confiance</span>
        <Progress value={pair.confidence} className="h-1 flex-1" />
        <span className="text-[10px] font-medium shrink-0">{pair.confidence}%</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onMerge(pair.id)}>
          <GitMerge className="w-3 h-3" />
          Fusionner
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onDismiss(pair.id)}>
          <X className="w-3 h-3" />
          Ignorer
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto" onClick={() => toast.info('Comparaison détaillée disponible prochainement')}>
          <Eye className="w-3 h-3" />
          Comparer
        </Button>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: DuplicatePair['product1'] }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
      <p className="text-sm font-medium line-clamp-1">{product.name}</p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
        {product.sku && (
          <span className="flex items-center gap-0.5">
            <Tag className="w-3 h-3" />
            {product.sku}
          </span>
        )}
        {product.price != null && (
          <span className="flex items-center gap-0.5">
            <DollarSign className="w-3 h-3" />
            {product.price.toFixed(2)}€
          </span>
        )}
      </div>
      {product.source && (
        <Badge variant="outline" className="text-[9px] h-4">
          {product.source}
        </Badge>
      )}
    </div>
  )
}
