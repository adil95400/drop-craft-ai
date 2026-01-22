import React, { useState } from 'react'
import { 
  ArrowUpDown, ExternalLink, ShoppingCart, Star, 
  Truck, Package, TrendingUp, ChevronDown, ChevronUp,
  Check, AlertTriangle, X, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SupplierResult } from '@/hooks/useSearchAllSuppliers'
import { useToast } from '@/hooks/use-toast'

interface SupplierComparisonTableProps {
  results: SupplierResult[]
  isSearching: boolean
  searchProgress: number
  platformsSearched: string[]
  onSort: (sortBy: 'price' | 'rating' | 'shipping' | 'score' | 'totalCost', order: 'asc' | 'desc') => void
}

export function SupplierComparisonTable({
  results,
  isSearching,
  searchProgress,
  platformsSearched,
  onSort
}: SupplierComparisonTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const handleSort = (field: 'price' | 'rating' | 'shipping' | 'score' | 'totalCost') => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    onSort(field, newOrder)
  }

  const toggleSelection = (url: string) => {
    setSelectedItems(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    )
  }

  const selectAll = () => {
    setSelectedItems(results.map(r => r.productUrl))
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copié !",
      description: "URL copiée dans le presse-papiers"
    })
  }

  const getAvailabilityBadge = (availability: SupplierResult['availability']) => {
    switch (availability) {
      case 'in_stock':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" /> En stock</Badge>
      case 'low_stock':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><AlertTriangle className="h-3 w-3 mr-1" /> Stock limité</Badge>
      case 'out_of_stock':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><X className="h-3 w-3 mr-1" /> Rupture</Badge>
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500 text-white">{score}</Badge>
    if (score >= 50) return <Badge className="bg-yellow-500 text-white">{score}</Badge>
    return <Badge className="bg-red-500 text-white">{score}</Badge>
  }

  if (isSearching) {
    return (
      <div className="space-y-4 py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium">Recherche en cours...</p>
          <p className="text-sm text-muted-foreground">
            {platformsSearched.length > 0 && `Dernière plateforme: ${platformsSearched[platformsSearched.length - 1]}`}
          </p>
        </div>
        <Progress value={searchProgress} className="h-2" />
        <div className="flex flex-wrap gap-2 justify-center">
          {platformsSearched.map((platform) => (
            <Badge key={platform} variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {platform}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Aucun résultat</p>
        <p className="text-sm">Lancez une recherche pour comparer les fournisseurs</p>
      </div>
    )
  }

  const bestPrice = Math.min(...results.map(r => r.totalCost))
  const bestRating = Math.max(...results.map(r => r.rating))

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats trouvés</p>
          <p className="text-2xl font-bold">{results.length}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Meilleur prix total</p>
          <p className="text-2xl font-bold text-green-600">${bestPrice.toFixed(2)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Meilleure note</p>
          <p className="text-2xl font-bold text-yellow-600">{bestRating.toFixed(1)} ★</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Plateformes</p>
          <p className="text-2xl font-bold">{new Set(results.map(r => r.platform)).size}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg">
          <span className="font-medium">{selectedItems.length} sélectionné(s)</span>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            Désélectionner
          </Button>
          <Button size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Importer la sélection
          </Button>
        </div>
      )}

      {/* Results Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedItems.length === results.length}
                  onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
                />
              </TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('score')} className="gap-1">
                  Score
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('price')} className="gap-1">
                  Prix
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('shipping')} className="gap-1">
                  Livraison
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('totalCost')} className="gap-1">
                  Total
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('rating')} className="gap-1">
                  Note
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Disponibilité</TableHead>
              <TableHead>Marge</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow 
                key={result.productUrl} 
                className={`
                  ${result.totalCost === bestPrice ? 'bg-green-50 dark:bg-green-950/20' : ''}
                  ${index === 0 ? 'border-l-4 border-l-primary' : ''}
                `}
              >
                <TableCell>
                  <Checkbox 
                    checked={selectedItems.includes(result.productUrl)}
                    onCheckedChange={() => toggleSelection(result.productUrl)}
                  />
                </TableCell>
                <TableCell>
                  <img 
                    src={result.imageUrl} 
                    alt={result.productTitle}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{result.platformIcon}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.platform}
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate" title={result.productTitle}>
                      {result.productTitle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.seller}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {getScoreBadge(result.score)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-bold">${result.price.toFixed(2)}</p>
                    {result.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        ${result.originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className={result.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                      {result.shipping === 0 ? 'Gratuit' : `$${result.shipping.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {result.shippingTime}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className={`font-bold ${result.totalCost === bestPrice ? 'text-green-600' : ''}`}>
                    ${result.totalCost.toFixed(2)}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{result.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({result.reviews.toLocaleString()})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getAvailabilityBadge(result.availability)}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-green-600">
                          {result.margin?.toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marge estimée à 2.5x le coût</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(result.productUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => window.open(result.productUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
