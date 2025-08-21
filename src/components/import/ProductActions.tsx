import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  Zap,
  Copy
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImportedProduct } from '@/hooks/useImportUltraPro';

interface ProductActionsProps {
  product: ImportedProduct;
  onEdit: (product: ImportedProduct) => void;
  onRefresh?: () => void;
}

export const ProductActions = ({ product, onEdit, onRefresh }: ProductActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateProductStatus = async (status: 'draft' | 'published' | 'archived') => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ 
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Produit ${status === 'published' ? 'publié' : status === 'archived' ? 'archivé' : 'mis en brouillon'} avec succès`,
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateReviewStatus = async (reviewStatus: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ 
          review_status: reviewStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Révision mise à jour",
        description: `Produit ${reviewStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès`,
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la révision",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProduct = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('imported_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le produit",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
    }
  };

  const duplicateProduct = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('imported_products')
        .insert([{
          ...product,
          id: undefined,
          name: `${product.name} (Copie)`,
          sku: product.sku ? `${product.sku}-copy` : undefined,
          status: 'draft',
          review_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Produit dupliqué",
        description: "Une copie du produit a été créée",
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer le produit",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Actions rapides */}
        {product.review_status === 'pending' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateReviewStatus('approved')}
              disabled={isUpdating}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateReviewStatus('rejected')}
              disabled={isUpdating}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}

        {product.status === 'draft' && product.review_status === 'approved' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateProductStatus('published')}
            disabled={isUpdating}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Globe className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>

        {/* Menu déroulant pour plus d'actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => duplicateProduct()}>
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {product.status === 'draft' && (
              <DropdownMenuItem onClick={() => updateProductStatus('published')}>
                <Globe className="mr-2 h-4 w-4" />
                Publier
              </DropdownMenuItem>
            )}

            {product.status === 'published' && (
              <DropdownMenuItem onClick={() => updateProductStatus('draft')}>
                <Edit className="mr-2 h-4 w-4" />
                Remettre en brouillon
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => updateProductStatus('archived')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Archiver
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer définitivement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement "{product.name}" ? 
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={isUpdating}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};