/**
 * ImportAIMergePanel — Suggestions de fusion IA pour doublons détectés
 * Affiche les paires de produits similaires avec score de confiance
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles, GitMerge, ArrowRight, Check, X, Eye,
  Image, Tag, DollarSign, AlertTriangle, Zap
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
  }
  product2: {
    id: string
    name: string
    sku?: string
    price?: number
    imageUrl?: string
    source?: string
  }
  confidence: number
  matchType: 'sku' | 'title' | 'image' | 'url'
  suggestion: 'merge' | 'keep_both' | 'review'
}

interface ImportAIMergePanelProps {
  className?: string
}

// Demo data — will be replaced by API call
const demoPairs: DuplicatePair[] = [
  {
    id: '1',
    product1: { id: 'p1', name: 'Écouteurs Bluetooth Pro Max', sku: 'BT-PRO-001', price: 29.99, source: 'AliExpress' },
    product2: { id: 'p2', name: 'Bluetooth Pro Max Earbuds', sku: 'BT-PRO-001', price: 31.99, source: 'CJ Dropshipping' },
    confidence: 95,
    matchType: 'sku',
    suggestion: 'merge',
  },
  {
    id: '2',
    product1: { id: 'p3', name: 'Montre Connectée Sport 2024', price: 45.00, source: 'Amazon' },
    product2: { id: 'p4', name: 'Smart Watch Sport Edition 2024', price: 42.50, source: 'AliExpress' },
    confidence: 82,
    matchType: 'title',
    suggestion: 'review',
  },
  {
    id: '3',
    product1: { id: 'p5', name: 'Coque iPhone 15 Silicone', sku: 'CASE-IP15-SIL', price: 8.99, source: 'Temu' },
    product2: { id: 'p6', name: 'iPhone 15 Silicone Case Premium', sku: 'CASE-IP15-SIL', price: 12.99, source: 'AliExpress' },
    confidence: 98,
    matchType: 'sku',
    suggestion: 'merge',
  },
]

export function ImportAIMergePanel({ className }: ImportAIMergePanelProps) {
  const [pairs, setPairs] = useState<DuplicatePair[]>(demoPairs)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visiblePairs = pairs.filter(p => !dismissed.has(p.id))

  const handleMerge = (pairId: string) => {
    toast.success('Fusion programmée — les produits seront fusionnés par l\'IA')
    setDismissed(prev => new Set([...prev, pairId]))
  }

  const handleDismiss = (pairId: string) => {
    setDismissed(prev => new Set([...prev, pairId]))
  }

  const matchTypeConfig = {
    sku: { icon: Tag, label: 'SKU identique', color: 'text-emerald-600 bg-emerald-500/10' },
    title: { icon: Sparkles, label: 'Titre similaire', color: 'text-blue-600 bg-blue-500/10' },
    image: { icon: Image, label: 'Image similaire', color: 'text-purple-600 bg-purple-500/10' },
    url: { icon: Zap, label: 'URL source', color: 'text-amber-600 bg-amber-500/10' },
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
    if (confidence >= 70) return 'text-blue-600 bg-blue-500/10 border-blue-500/30'
    return 'text-amber-600 bg-amber-500/10 border-amber-500/30'
  }

  if (visiblePairs.length === 0) return null

  return (
    <Card className={cn('border-2 border-violet-500/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 bg-violet-500/10 rounded-lg">
            <GitMerge className="w-4 h-4 text-violet-600" />
          </div>
          Fusion IA — Doublons détectés
          <Badge className="ml-auto bg-violet-500/10 text-violet-600 border-violet-500/30" variant="outline">
            {visiblePairs.length} suggestion{visiblePairs.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Notre IA a identifié des produits potentiellement en double. Vérifiez et fusionnez.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {visiblePairs.map(pair => {
              const matchConfig = matchTypeConfig[pair.matchType]
              const MatchIcon = matchConfig.icon

              return (
                <div
                  key={pair.id}
                  className="border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', matchConfig.color)}>
                        <MatchIcon className="w-3 h-3 mr-1" />
                        {matchConfig.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] border', getConfidenceColor(pair.confidence))}
                      >
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
                    {/* Product 1 */}
                    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                      <p className="text-sm font-medium line-clamp-1">{pair.product1.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {pair.product1.sku && (
                          <span className="flex items-center gap-0.5">
                            <Tag className="w-3 h-3" />
                            {pair.product1.sku}
                          </span>
                        )}
                        {pair.product1.price && (
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            {pair.product1.price.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      {pair.product1.source && (
                        <Badge variant="outline" className="text-[9px] h-4">
                          {pair.product1.source}
                        </Badge>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <GitMerge className="w-4 h-4 text-violet-500" />
                    </div>

                    {/* Product 2 */}
                    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                      <p className="text-sm font-medium line-clamp-1">{pair.product2.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {pair.product2.sku && (
                          <span className="flex items-center gap-0.5">
                            <Tag className="w-3 h-3" />
                            {pair.product2.sku}
                          </span>
                        )}
                        {pair.product2.price && (
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            {pair.product2.price.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      {pair.product2.source && (
                        <Badge variant="outline" className="text-[9px] h-4">
                          {pair.product2.source}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleMerge(pair.id)}
                    >
                      <GitMerge className="w-3 h-3" />
                      Fusionner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleDismiss(pair.id)}
                    >
                      <X className="w-3 h-3" />
                      Ignorer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 ml-auto"
                      onClick={() => toast.info('Comparaison détaillée bientôt disponible')}
                    >
                      <Eye className="w-3 h-3" />
                      Comparer
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
