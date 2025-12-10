// BARRE D'ACTIONS GROUPÉES AMÉLIORÉE
// Toutes les actions avec feedbacks visuels, loaders et confirmations
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Copy,
  Tag,
  DollarSign,
  Power,
  Upload,
  ImagePlus,
  Sparkles,
  X,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBulkActions } from '@/hooks/useBulkActions';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedBulkActionsBarProps {
  selectedProducts: Array<{ id: string; name: string }>;
  onClearSelection: () => void;
  onRefresh: () => void;
}

type ActionState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

interface ActionProgress {
  current: number;
  total: number;
  action: string;
}

export const EnhancedBulkActionsBar = memo(({
  selectedProducts,
  onClearSelection,
  onRefresh
}: EnhancedBulkActionsBarProps) => {
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [progress, setProgress] = useState<ActionProgress | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState('1.1');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const {
    bulkDelete,
    bulkDuplicate,
    bulkUpdateCategory,
    bulkUpdatePrices,
    bulkUpdateStatus,
    isDeleting,
    isDuplicating,
    isUpdatingCategory,
    isUpdatingPrices,
    isUpdatingStatus
  } = useBulkActions();

  const selectedIds = selectedProducts.map(p => p.id);
  const count = selectedProducts.length;

  const isProcessing = isDeleting || isDuplicating || isUpdatingCategory || isUpdatingPrices || isUpdatingStatus;

  // Suppression en masse
  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setCurrentAction('delete');
    setActionState('processing');
    
    const toastId = toast.loading(`Suppression de ${count} produit(s)...`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        bulkDelete(selectedIds, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`${count} produit(s) supprimé(s)`, { id: toastId });
      setActionState('success');
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la suppression', { id: toastId });
      setActionState('error');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Duplication en masse
  const handleDuplicate = async () => {
    setCurrentAction('duplicate');
    setActionState('processing');
    
    const toastId = toast.loading(`Duplication de ${count} produit(s)...`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        bulkDuplicate(selectedIds, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`${count} produit(s) dupliqué(s)`, { id: toastId });
      setActionState('success');
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la duplication', { id: toastId });
      setActionState('error');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Mise à jour des prix
  const handlePriceUpdate = async () => {
    setShowPriceDialog(false);
    setCurrentAction('price');
    setActionState('processing');
    
    const multiplier = parseFloat(priceMultiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      toast.error('Multiplicateur invalide');
      return;
    }
    
    const toastId = toast.loading(`Mise à jour des prix (x${multiplier})...`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        bulkUpdatePrices({ productIds: selectedIds, multiplier }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`Prix mis à jour pour ${count} produit(s)`, { id: toastId });
      setActionState('success');
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des prix', { id: toastId });
      setActionState('error');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Mise à jour catégorie
  const handleCategoryUpdate = async () => {
    if (!newCategory.trim()) {
      toast.error('Veuillez entrer une catégorie');
      return;
    }
    
    setShowCategoryDialog(false);
    setCurrentAction('category');
    setActionState('processing');
    
    const toastId = toast.loading(`Mise à jour de la catégorie...`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        bulkUpdateCategory({ productIds: selectedIds, category: newCategory }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`Catégorie mise à jour pour ${count} produit(s)`, { id: toastId });
      setActionState('success');
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour', { id: toastId });
      setActionState('error');
    } finally {
      setNewCategory('');
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Activation/Désactivation
  const handleStatusUpdate = async (status: 'active' | 'inactive' | 'draft') => {
    setCurrentAction('status');
    setActionState('processing');
    
    const statusLabels = { active: 'activé', inactive: 'désactivé', draft: 'mis en brouillon' };
    const toastId = toast.loading(`Mise à jour du statut...`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        bulkUpdateStatus({ productIds: selectedIds, status }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`${count} produit(s) ${statusLabels[status]}`, { id: toastId });
      setActionState('success');
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour', { id: toastId });
      setActionState('error');
    } finally {
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Génération d'images IA
  const handleGenerateImages = async () => {
    setCurrentAction('images');
    setActionState('processing');
    setProgress({ current: 0, total: count, action: 'Génération des images' });
    
    const toastId = toast.loading(`Génération d'images IA pour ${count} produit(s)...`);
    
    try {
      let successCount = 0;
      
      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        setProgress({ current: i + 1, total: count, action: `Image ${i + 1}/${count}` });
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-product-image', {
            body: { productId: product.id, productName: product.name }
          });
          
          if (!error && data?.imageUrl) {
            successCount++;
          }
        } catch {
          // Continue avec le suivant
        }
      }
      
      toast.success(`${successCount} image(s) générée(s)`, { id: toastId });
      setActionState('success');
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la génération', { id: toastId });
      setActionState('error');
    } finally {
      setProgress(null);
      onClearSelection();
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  // Optimisation IA
  const handleAIOptimize = async () => {
    setCurrentAction('optimize');
    setActionState('processing');
    setProgress({ current: 0, total: count, action: 'Optimisation IA' });
    
    const toastId = toast.loading(`Optimisation IA de ${count} produit(s)...`);
    
    try {
      let successCount = 0;
      
      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        setProgress({ current: i + 1, total: count, action: `Produit ${i + 1}/${count}` });
        
        try {
          const { error } = await supabase.functions.invoke('optimize-product', {
            body: { productId: product.id }
          });
          
          if (!error) {
            successCount++;
          }
        } catch {
          // Continue
        }
      }
      
      toast.success(`${successCount} produit(s) optimisé(s)`, { id: toastId });
      setActionState('success');
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de l\'optimisation', { id: toastId });
      setActionState('error');
    } finally {
      setProgress(null);
      onClearSelection();
      setTimeout(() => setActionState('idle'), 2000);
    }
  };

  if (count === 0) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={cn(
            "bg-card border border-border rounded-xl shadow-2xl p-3 md:p-4",
            "flex flex-wrap items-center gap-2 md:gap-3",
            "max-w-[95vw] md:max-w-3xl"
          )}>
            {/* Compteur */}
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <Badge variant="secondary" className="text-sm font-semibold">
                {count}
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                sélectionné{count > 1 ? 's' : ''}
              </span>
            </div>

            {/* Progress bar si en cours */}
            {progress && (
              <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {progress.action}
                </span>
              </div>
            )}

            {/* Actions principales */}
            {!progress && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  {isDuplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">Dupliquer</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPriceDialog(true)}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  {isUpdatingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  <span className="hidden sm:inline">Prix</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCategoryDialog(true)}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  {isUpdatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                  <span className="hidden sm:inline">Catégorie</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isProcessing} className="gap-1.5">
                      <Power className="h-4 w-4" />
                      <span className="hidden sm:inline">Statut</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatusUpdate('active')}>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Activer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusUpdate('inactive')}>
                      <X className="h-4 w-4 mr-2 text-red-500" />
                      Désactiver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusUpdate('draft')}>
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                      Brouillon
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="default" disabled={isProcessing} className="gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">IA</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleAIOptimize}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Optimiser titres & descriptions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateImages}>
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Générer images
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </>
            )}

            {/* Bouton fermer */}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClearSelection}
              className="h-8 w-8 ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer définitivement <strong>{count} produit(s)</strong>.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer {count} produit(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog mise à jour prix */}
      <AlertDialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Modifier les prix
            </AlertDialogTitle>
            <AlertDialogDescription>
              Appliquer un multiplicateur aux prix de {count} produit(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="multiplier">Multiplicateur</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="multiplier"
                type="number"
                step="0.01"
                min="0.01"
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                × {priceMultiplier} = {parseFloat(priceMultiplier) > 1 ? 'augmentation' : 'réduction'}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              {[0.9, 0.95, 1.1, 1.2, 1.5].map(m => (
                <Button
                  key={m}
                  size="sm"
                  variant={priceMultiplier === String(m) ? 'default' : 'outline'}
                  onClick={() => setPriceMultiplier(String(m))}
                >
                  ×{m}
                </Button>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePriceUpdate}>
              Appliquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog mise à jour catégorie */}
      <AlertDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Modifier la catégorie
            </AlertDialogTitle>
            <AlertDialogDescription>
              Définir une nouvelle catégorie pour {count} produit(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="category">Nouvelle catégorie</Label>
            <Input
              id="category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ex: Électronique, Mode, Maison..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCategoryUpdate}>
              Appliquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

EnhancedBulkActionsBar.displayName = 'EnhancedBulkActionsBar';

export default EnhancedBulkActionsBar;
