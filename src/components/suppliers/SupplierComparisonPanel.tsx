/**
 * Supplier Comparison Panel
 * Compare prices and reliability across multiple suppliers
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useB2BSupplierConnector, type SupplierComparisonResult } from '@/hooks/suppliers';
import { Search, Loader2, TrendingUp, Truck, DollarSign, Star, ArrowUpDown } from 'lucide-react';

interface SupplierComparisonPanelProps {
  initialProductTitle?: string;
  initialSellingPrice?: number;
}

export function SupplierComparisonPanel({ 
  initialProductTitle = '',
  initialSellingPrice = 0,
}: SupplierComparisonPanelProps) {
  const [productTitle, setProductTitle] = useState(initialProductTitle);
  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice);
  const [sortBy, setSortBy] = useState<'totalCost' | 'margin' | 'shippingTime' | 'reliability'>('margin');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { compareSuppliers, isComparing, comparisonResult } = useB2BSupplierConnector();

  const handleCompare = async () => {
    if (!productTitle.trim() || sellingPrice <= 0) return;
    await compareSuppliers({ productTitle, sellingPrice });
  };

  const sortedSuppliers = comparisonResult?.suppliers
    ? [...comparisonResult.suppliers].sort((a, b) => {
        let aVal: number, bVal: number;
        switch (sortBy) {
          case 'totalCost': aVal = a.totalCost; bVal = b.totalCost; break;
          case 'margin': aVal = a.marginPercent; bVal = b.marginPercent; break;
          case 'shippingTime': aVal = parseInt(a.shippingTime); bVal = parseInt(b.shippingTime); break;
          case 'reliability': aVal = a.reliabilityScore; bVal = b.reliabilityScore; break;
          default: aVal = a.margin; bVal = b.margin;
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      })
    : [];

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Comparateur de Fournisseurs
        </CardTitle>
        <CardDescription>
          Comparez les prix, marges et fiabilité entre fournisseurs pour un produit
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="productTitle">Nom du produit</Label>
            <Input
              id="productTitle"
              placeholder="Ex: Wireless Earbuds Bluetooth 5.0"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Prix de vente (€)</Label>
            <Input
              id="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="29.99"
              value={sellingPrice || ''}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button 
          onClick={handleCompare} 
          disabled={isComparing || !productTitle.trim() || sellingPrice <= 0}
          className="w-full sm:w-auto"
        >
          {isComparing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recherche en cours...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Comparer les fournisseurs
            </>
          )}
        </Button>

        {/* Results */}
        {comparisonResult && (
          <>
            {/* Summary Badges */}
            <div className="flex flex-wrap gap-2">
              {comparisonResult.highestMargin && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Meilleure marge: {comparisonResult.highestMargin}
                </Badge>
              )}
              {comparisonResult.fastestShipping && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <Truck className="w-3 h-3 mr-1" />
                  Plus rapide: {comparisonResult.fastestShipping}
                </Badge>
              )}
              {comparisonResult.bestValue && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Meilleur rapport: {comparisonResult.bestValue}
                </Badge>
              )}
            </div>

            {/* Comparison Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('totalCost')}
                    >
                      <div className="flex items-center gap-1">
                        Prix Total
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('margin')}
                    >
                      <div className="flex items-center gap-1">
                        Marge
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('shippingTime')}
                    >
                      <div className="flex items-center gap-1">
                        Livraison
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('reliability')}
                    >
                      <div className="flex items-center gap-1">
                        Fiabilité
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSuppliers.map((supplier, index) => (
                    <TableRow 
                      key={supplier.supplierId}
                      className={index === 0 ? 'bg-green-50 dark:bg-green-950/20' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {supplier.supplierName}
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              Recommandé
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{supplier.totalCost.toFixed(2)} €</div>
                          <div className="text-xs text-muted-foreground">
                            {supplier.price.toFixed(2)} € + {supplier.shippingCost.toFixed(2)} € livraison
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getMarginColor(supplier.marginPercent)}`}>
                          {supplier.margin.toFixed(2)} € ({supplier.marginPercent.toFixed(0)}%)
                        </div>
                      </TableCell>
                      <TableCell>{supplier.shippingTime}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${getReliabilityColor(supplier.reliabilityScore)}`}>
                          {Math.round(supplier.reliabilityScore * 100)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.stock > 0 ? 'outline' : 'destructive'}>
                          {supplier.stock > 0 ? `${supplier.stock} unités` : 'Rupture'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {sortedSuppliers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun fournisseur trouvé pour ce produit
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getMarginColor(percent: number): string {
  if (percent >= 40) return 'text-green-600';
  if (percent >= 20) return 'text-blue-600';
  if (percent >= 10) return 'text-yellow-600';
  return 'text-red-600';
}

function getReliabilityColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}
