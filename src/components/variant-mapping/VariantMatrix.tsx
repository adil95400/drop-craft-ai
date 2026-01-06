/**
 * Variant Matrix
 * Matrice interactive pour visualiser les combinaisons de variantes
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Grid3X3, Plus, Trash2, RefreshCw, Check, X,
  Package, AlertTriangle, CheckCircle, Loader2,
  Eye, EyeOff, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariantCell {
  exists: boolean;
  variantId?: string;
  sku?: string;
  stock?: number;
  price?: number;
  status?: string;
}

interface MatrixData {
  rows: string[];
  cols: string[];
  cells: Record<string, VariantCell>;
  rowAttribute: string;
  colAttribute: string;
}

export function VariantMatrix() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [rowAttribute, setRowAttribute] = useState('option1');
  const [colAttribute, setColAttribute] = useState('option2');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-with-variants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('id, title, sku')
        .eq('user_id', user.id)
        .order('title');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch variants for selected product
  const { data: variants = [], isLoading: isLoadingVariants } = useQuery({
    queryKey: ['product-variants', selectedProduct],
    queryFn: async () => {
      if (!selectedProduct) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', selectedProduct)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProduct,
  });

  // Build matrix data
  const matrixData = useMemo<MatrixData | null>(() => {
    if (!variants.length) return null;

    const rowValues = new Set<string>();
    const colValues = new Set<string>();
    const cells: Record<string, VariantCell> = {};

    // Extract attribute mappings
    const getAttributeValue = (variant: any, attr: string): string => {
      switch (attr) {
        case 'option1': return variant.option1_value || '';
        case 'option2': return variant.option2_value || '';
        case 'option3': return variant.option3_value || '';
        default: return '';
      }
    };

    const getAttributeName = (attr: string): string => {
      const sample = variants[0];
      if (!sample) return attr;
      switch (attr) {
        case 'option1': return sample.option1_name || 'Option 1';
        case 'option2': return sample.option2_name || 'Option 2';
        case 'option3': return sample.option3_name || 'Option 3';
        default: return attr;
      }
    };

    variants.forEach(variant => {
      const rowVal = getAttributeValue(variant, rowAttribute);
      const colVal = getAttributeValue(variant, colAttribute);

      if (rowVal) rowValues.add(rowVal);
      if (colVal) colValues.add(colVal);

      if (rowVal && colVal) {
        const key = `${rowVal}|${colVal}`;
        cells[key] = {
          exists: true,
          variantId: variant.id,
          sku: variant.sku,
          stock: variant.stock_quantity,
          price: variant.price,
          status: variant.status,
        };
      }
    });

    return {
      rows: Array.from(rowValues).sort(),
      cols: Array.from(colValues).sort(),
      cells,
      rowAttribute: getAttributeName(rowAttribute),
      colAttribute: getAttributeName(colAttribute),
    };
  }, [variants, rowAttribute, colAttribute]);

  // Create missing variant
  const createVariantMutation = useMutation({
    mutationFn: async ({ row, col }: { row: string; col: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sample = variants[0];
      const { data, error } = await supabase
        .from('product_variants')
        .insert({
          user_id: user.id,
          product_id: selectedProduct,
          option1_name: sample?.option1_name,
          option1_value: rowAttribute === 'option1' ? row : (rowAttribute === 'option2' ? col : sample?.option1_value),
          option2_name: sample?.option2_name,
          option2_value: rowAttribute === 'option2' ? row : (colAttribute === 'option2' ? col : sample?.option2_value),
          option3_name: sample?.option3_name,
          option3_value: rowAttribute === 'option3' ? row : (colAttribute === 'option3' ? col : sample?.option3_value),
          name: `${row} / ${col}`,
          stock_quantity: 0,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', selectedProduct] });
      toast.success('Variante créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Bulk create missing variants
  const createBulkVariantsMutation = useMutation({
    mutationFn: async () => {
      if (!matrixData) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sample = variants[0];
      const missingVariants: any[] = [];

      matrixData.rows.forEach(row => {
        matrixData.cols.forEach(col => {
          const key = `${row}|${col}`;
          if (!matrixData.cells[key]) {
            missingVariants.push({
              user_id: user.id,
              product_id: selectedProduct,
              option1_name: sample?.option1_name,
              option1_value: rowAttribute === 'option1' ? row : (colAttribute === 'option1' ? col : sample?.option1_value),
              option2_name: sample?.option2_name,
              option2_value: rowAttribute === 'option2' ? row : (colAttribute === 'option2' ? col : sample?.option2_value),
              name: `${row} / ${col}`,
              stock_quantity: 0,
              status: 'draft',
            });
          }
        });
      });

      if (missingVariants.length === 0) return [];

      const { data, error } = await supabase
        .from('product_variants')
        .insert(missingVariants)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', selectedProduct] });
      toast.success(`${data?.length || 0} variantes créées`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Delete variant
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', selectedProduct] });
      toast.success('Variante supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleCellSelection = (key: string) => {
    setSelectedCells(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getCellClass = (cell: VariantCell | undefined) => {
    if (!cell?.exists) {
      return 'bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50';
    }
    if ((cell.stock ?? 0) === 0) {
      return 'bg-red-50 dark:bg-red-950/20 border-red-200';
    }
    if ((cell.stock ?? 0) < 5) {
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
    }
    return 'bg-green-50 dark:bg-green-950/20 border-green-200';
  };

  const missingCount = matrixData 
    ? (matrixData.rows.length * matrixData.cols.length) - Object.keys(matrixData.cells).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            Matrice de Variantes
          </CardTitle>
          <CardDescription>
            Visualisez et gérez toutes les combinaisons de variantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Produit</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Lignes (Attribut 1)</Label>
              <Select value={rowAttribute} onValueChange={setRowAttribute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1 (Taille)</SelectItem>
                  <SelectItem value="option2">Option 2 (Couleur)</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Colonnes (Attribut 2)</Label>
              <Select value={colAttribute} onValueChange={setColAttribute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1 (Taille)</SelectItem>
                  <SelectItem value="option2">Option 2 (Couleur)</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Display */}
      {isLoadingVariants ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Chargement des variantes...</span>
            </div>
          </CardContent>
        </Card>
      ) : matrixData && matrixData.rows.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{variants.length} variantes</Badge>
                  {missingCount > 0 && (
                    <Badge variant="secondary" className="text-yellow-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {missingCount} manquantes
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {missingCount > 0 && (
                  <Button 
                    size="sm"
                    onClick={() => createBulkVariantsMutation.mutate()}
                    disabled={createBulkVariantsMutation.isPending}
                  >
                    {createBulkVariantsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Créer toutes ({missingCount})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-fit">
                {/* Header Row */}
                <div className="flex">
                  <div className="w-24 h-12 flex items-center justify-center font-medium text-sm border-b border-r bg-muted/50">
                    {matrixData.rowAttribute} ↓
                  </div>
                  {matrixData.cols.map(col => (
                    <div 
                      key={col}
                      className="w-24 h-12 flex items-center justify-center font-medium text-sm border-b bg-muted/50 text-center px-1"
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Matrix Rows */}
                {matrixData.rows.map(row => (
                  <div key={row} className="flex">
                    <div className="w-24 h-16 flex items-center justify-center font-medium text-sm border-r bg-muted/50">
                      {row}
                    </div>
                    {matrixData.cols.map(col => {
                      const key = `${row}|${col}`;
                      const cell = matrixData.cells[key];
                      
                      return (
                        <TooltipProvider key={key}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  "w-24 h-16 border flex items-center justify-center relative group transition-colors",
                                  getCellClass(cell),
                                  selectedCells.includes(key) && "ring-2 ring-primary"
                                )}
                                onClick={() => {
                                  if (!cell?.exists) {
                                    createVariantMutation.mutate({ row, col });
                                  } else {
                                    toggleCellSelection(key);
                                  }
                                }}
                              >
                                {cell?.exists ? (
                                  <div className="text-center">
                                    <p className="text-xs font-mono text-muted-foreground">
                                      {cell.sku?.slice(0, 8) || '-'}
                                    </p>
                                    <p className="text-sm font-semibold">
                                      {cell.stock ?? 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      en stock
                                    </p>
                                  </div>
                                ) : (
                                  <Plus className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100" />
                                )}

                                {cell?.exists && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (cell.variantId) {
                                        deleteVariantMutation.mutate(cell.variantId);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {cell?.exists ? (
                                <div className="text-sm">
                                  <p><strong>SKU:</strong> {cell.sku || 'N/A'}</p>
                                  <p><strong>Stock:</strong> {cell.stock ?? 0}</p>
                                  <p><strong>Prix:</strong> {cell.price?.toFixed(2) || 'N/A'} €</p>
                                  <p><strong>Statut:</strong> {cell.status || 'N/A'}</p>
                                </div>
                              ) : (
                                <p>Cliquer pour créer cette variante</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                <span>En stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                <span>Stock faible (&lt;5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                <span>Rupture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border-dashed border" />
                <span>Non créée</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : selectedProduct ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune variante</h3>
            <p className="text-muted-foreground text-sm">
              Ce produit n'a pas encore de variantes configurées
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Sélectionnez un produit</h3>
            <p className="text-muted-foreground text-sm">
              Choisissez un produit pour afficher sa matrice de variantes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
