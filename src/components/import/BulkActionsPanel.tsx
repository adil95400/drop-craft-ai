import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Download,
  Upload,
  Eye,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsPanelProps {
  selectedCount: number;
  selectedProducts: string[];
  onClearSelection: () => void;
}

export const BulkActionsPanel = ({ 
  selectedCount, 
  selectedProducts, 
  onClearSelection 
}: BulkActionsPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleBulkAction = async (action: string) => {
    setIsProcessing(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      switch (action) {
        case 'approve': {
          const { error } = await supabase
            .from('imported_products')
            .update({ review_status: 'approved', updated_at: new Date().toISOString() })
            .in('id', selectedProducts);
          
          if (error) throw error;
          
          toast({
            title: "Produits approuvés",
            description: `${selectedCount} produits ont été approuvés avec succès.`,
          });
          break;
        }
        
        case 'publish': {
          const { error } = await supabase
            .from('imported_products')
            .update({ status: 'published', updated_at: new Date().toISOString() })
            .in('id', selectedProducts);
          
          if (error) throw error;
          
          toast({
            title: "Produits publiés",
            description: `${selectedCount} produits ont été publiés avec succès.`,
          });
          break;
        }
        
        case 'reject': {
          const { error } = await supabase
            .from('imported_products')
            .update({ review_status: 'rejected', updated_at: new Date().toISOString() })
            .in('id', selectedProducts);
          
          if (error) throw error;
          
          toast({
            title: "Produits rejetés",
            description: `${selectedCount} produits ont été rejetés.`,
          });
          break;
        }
        
        case 'delete': {
          const { error } = await supabase
            .from('imported_products')
            .delete()
            .in('id', selectedProducts);
          
          if (error) throw error;
          
          toast({
            title: "Produits supprimés",
            description: `${selectedCount} produits ont été supprimés.`,
            variant: "destructive",
          });
          break;
        }
        
        case 'export': {
          const { data: products, error } = await supabase
            .from('imported_products')
            .select('*')
            .in('id', selectedProducts);
          
          if (error) throw error;
          
          // Create CSV export
          const csv = [
            ['Name', 'SKU', 'Price', 'Category', 'Status'],
            ...products.map((p: any) => [p.name, p.sku, p.price, p.category, p.status])
          ].map(row => row.join(',')).join('\n');
          
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products-export-${Date.now()}.csv`;
          a.click();
          
          toast({
            title: "Export réussi",
            description: `${selectedCount} produits ont été exportés.`,
          });
          break;
        }
        
        default:
          if (action.startsWith('category-')) {
            const category = action.replace('category-', '');
            const { error } = await supabase
              .from('imported_products')
              .update({ category, updated_at: new Date().toISOString() })
              .in('id', selectedProducts);
            
            if (error) throw error;
            
            toast({
              title: "Catégories mises à jour",
              description: `${selectedCount} produits ont été recatégorisés.`,
            });
          }
      }
      
      onClearSelection();
    } catch (error) {
      console.error('Erreur bulk action:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'opération.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-sm">
              {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </Badge>
            
            <div className="flex items-center gap-2">
              {/* Approval Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('approve')}
                disabled={isProcessing}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approuver tout
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('publish')}
                disabled={isProcessing}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-1" />
                Publier tout
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                disabled={isProcessing}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeter tout
              </Button>

              {/* Export Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 mr-1" />
                Exporter
              </Button>

              {/* Category Change */}
              <Select onValueChange={(value) => handleBulkAction(`category-${value}`)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Changer catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Électronique</SelectItem>
                  <SelectItem value="clothing">Vêtements</SelectItem>
                  <SelectItem value="home">Maison & Jardin</SelectItem>
                  <SelectItem value="sports">Sports & Loisirs</SelectItem>
                  <SelectItem value="beauty">Beauté & Santé</SelectItem>
                  <SelectItem value="automotive">Automobile</SelectItem>
                </SelectContent>
              </Select>

              {/* Delete Action */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer {selectedCount} produit{selectedCount > 1 ? 's' : ''} ? 
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleBulkAction('delete')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Désélectionner tout
          </Button>
        </div>

        {isProcessing && (
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Traitement en cours...
          </div>
        )}
      </CardContent>
    </Card>
  );
};