import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Copy, CheckCircle2, Merge, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface DuplicateMatch {
  importRow: number
  importName: string
  importSku: string | null
  existingId: string
  existingName: string
  existingSku: string | null
  matchType: 'sku' | 'name'
  confidence: number
}

interface DuplicateDetectorProps {
  products: any[]
  onFilterDuplicates: (filteredProducts: any[], duplicates: DuplicateMatch[]) => void
}

export function DuplicateDetector({ products, onFilterDuplicates }: DuplicateDetectorProps) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (products.length > 0 && !hasChecked) {
      checkDuplicates()
    }
  }, [products])

  const checkDuplicates = async () => {
    setIsChecking(true)
    const matches: DuplicateMatch[] = []

    try {
      // Collect SKUs from import
      const skus = products
        .map(p => p.sku)
        .filter((s): s is string => !!s && s.trim() !== '')

      // Check existing products by SKU
      if (skus.length > 0) {
        const { data: existingBySku } = await supabase
          .from('products')
          .select('id, name, sku')
          .in('sku', skus)
          .limit(500)

        if (existingBySku) {
          const skuMap = new Map(existingBySku.map(p => [p.sku?.toLowerCase(), p]))

          products.forEach((product, idx) => {
            if (!product.sku) return
            const existing = skuMap.get(product.sku.toLowerCase())
            if (existing) {
              matches.push({
                importRow: product.row_number || idx + 1,
                importName: product.name,
                importSku: product.sku,
                existingId: existing.id,
                existingName: existing.name,
                existingSku: existing.sku,
                matchType: 'sku',
                confidence: 100,
              })
            }
          })
        }
      }

      // Check by exact name match (only for products not already matched by SKU)
      const matchedRows = new Set(matches.map(m => m.importRow))
      const unmatchedProducts = products.filter(p => !matchedRows.has(p.row_number || 0))

      if (unmatchedProducts.length > 0) {
        const names = unmatchedProducts
          .map(p => p.name)
          .filter((n): n is string => !!n && n.trim() !== '')
          .slice(0, 100) // limit for performance

        if (names.length > 0) {
          const { data: existingByName } = await supabase
            .from('products')
            .select('id, name, sku')
            .in('name', names)
            .limit(500)

          if (existingByName) {
            const nameMap = new Map(existingByName.map(p => [p.name?.toLowerCase(), p]))

            unmatchedProducts.forEach((product, idx) => {
              if (!product.name) return
              const existing = nameMap.get(product.name.toLowerCase())
              if (existing) {
                matches.push({
                  importRow: product.row_number || idx + 1,
                  importName: product.name,
                  importSku: product.sku,
                  existingId: existing.id,
                  existingName: existing.name,
                  existingSku: existing.sku,
                  matchType: 'name',
                  confidence: 90,
                })
              }
            })
          }
        }
      }
    } catch (err) {
      console.error('Duplicate check failed:', err)
    }

    setDuplicates(matches)
    setHasChecked(true)
    setIsChecking(false)

    // Auto-filter if skip duplicates is on
    if (skipDuplicates && matches.length > 0) {
      const duplicateRows = new Set(matches.map(m => m.importRow))
      const filtered = products.filter(p => !duplicateRows.has(p.row_number))
      onFilterDuplicates(filtered, matches)
    } else {
      onFilterDuplicates(products, matches)
    }
  }

  useEffect(() => {
    if (!hasChecked || duplicates.length === 0) return

    if (skipDuplicates) {
      const duplicateRows = new Set(duplicates.map(m => m.importRow))
      const filtered = products.filter(p => !duplicateRows.has(p.row_number))
      onFilterDuplicates(filtered, duplicates)
    } else {
      onFilterDuplicates(products, duplicates)
    }
  }, [skipDuplicates])

  if (isChecking) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div>
            <p className="font-medium text-sm">Vérification des doublons...</p>
            <p className="text-xs text-muted-foreground">Analyse de {products.length} produits</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasChecked) return null

  if (duplicates.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Aucun doublon détecté parmi {products.length} produits
        </span>
      </div>
    )
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            {duplicates.length} doublons détectés
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={setSkipDuplicates}
              />
              <Label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
                Ignorer les doublons
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={checkDuplicates} className="gap-1">
              <Copy className="w-3 h-3" />
              Revérifier
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {duplicates.map((dup, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                  skipDuplicates
                    ? "bg-muted/50 opacity-60 border-muted"
                    : "bg-background border-yellow-500/20"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md",
                  skipDuplicates ? "bg-muted" : "bg-yellow-500/10"
                )}>
                  {skipDuplicates ? (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Merge className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Ligne {dup.importRow}: {dup.importName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Correspond à "{dup.existingName}" 
                    {dup.existingSku && <span> (SKU: {dup.existingSku})</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={dup.matchType === 'sku' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {dup.matchType === 'sku' ? 'SKU exact' : 'Nom identique'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {dup.confidence}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
