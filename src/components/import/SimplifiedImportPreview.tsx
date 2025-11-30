import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Upload,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SimplifiedImportPreviewProps {
  data: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SimplifiedImportPreview({ data, onConfirm, onCancel }: SimplifiedImportPreviewProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    data.products?.map((p: any) => p.id) || []
  );
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAll = () => {
    if (selectedProducts.length === data.products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(data.products.map((p: any) => p.id));
    }
  };

  const handleImport = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit à importer",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const productsToImport = data.products.filter((p: any) =>
        selectedProducts.includes(p.id)
      );

      // Import dans imported_products
      const { error } = await supabase
        .from('imported_products')
        .insert(
          productsToImport.map((p: any) => ({
            user_id: user.id,
            name: p.title,
            price: p.price,
            supplier_name: p.supplier,
            source_url: data.url || null,
            import_source: data.source,
            status: 'pending'
          }))
        );

      if (error) throw error;

      toast({
        title: "✅ Import réussi",
        description: `${selectedProducts.length} produit(s) importé(s) avec succès`
      });

      onConfirm();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "❌ Erreur d'import",
        description: error.message || "Impossible d'importer les produits",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validProducts = data.products?.filter((p: any) => !p.errors || p.errors.length === 0) || [];
  const errorProducts = data.products?.filter((p: any) => p.errors && p.errors.length > 0) || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Aperçu de l'import</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{data.summary?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-600">{validProducts.length}</div>
              <div className="text-sm text-muted-foreground">Valides</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-600">{errorProducts.length}</div>
              <div className="text-sm text-muted-foreground">Erreurs</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{selectedProducts.length}</div>
              <div className="text-sm text-muted-foreground">Sélectionnés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits à importer</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedProducts.length === data.products.length ? 'Désélectionner tout' : 'Tout sélectionner'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.products?.map((product: any) => (
            <div
              key={product.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                selectedProducts.includes(product.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={() => toggleProduct(product.id)}
              />
              
              <img
                src={product.image}
                alt={product.title}
                className="w-16 h-16 rounded object-cover"
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{product.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {product.supplier} • {product.price}€
                </p>
                {product.errors && product.errors.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">{product.errors.join(', ')}</span>
                  </div>
                )}
              </div>
              
              {product.errors && product.errors.length > 0 ? (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Erreur
                </Badge>
              ) : (
                <Badge variant="default">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valide
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isImporting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Button
          onClick={handleImport}
          disabled={isImporting || selectedProducts.length === 0}
        >
          {isImporting ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Import en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importer {selectedProducts.length} produit(s)
            </>
          )}
        </Button>
      </div>

      {errorProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorProducts.length} produit(s) contiennent des erreurs. Corrigez-les ou désélectionnez-les avant l'import.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
