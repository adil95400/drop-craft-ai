import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Star,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MediaGalleryManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  isLoading?: boolean;
}

export function MediaGalleryManager({
  images,
  onImagesChange,
  isLoading = false,
}: MediaGalleryManagerProps) {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleImageSelection = useCallback((index: number) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((_, i) => i)));
    }
  }, [images.length, selectedImages.size]);

  const handleAddImage = useCallback(() => {
    if (!newImageUrl.trim()) {
      toast.error('Veuillez entrer une URL valide');
      return;
    }

    try {
      new URL(newImageUrl);
    } catch {
      toast.error('URL invalide');
      return;
    }

    onImagesChange([...images, newImageUrl.trim()]);
    setNewImageUrl('');
    setAddDialogOpen(false);
    toast.success('Image ajoutée');
  }, [newImageUrl, images, onImagesChange]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedImages.size === 0) return;

    setIsDeleting(true);
    try {
      const newImages = images.filter((_, index) => !selectedImages.has(index));
      onImagesChange(newImages);
      setSelectedImages(new Set());
      setDeleteDialogOpen(false);
      toast.success(`${selectedImages.size} image(s) supprimée(s)`);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedImages, images, onImagesChange]);

  const handleSetPrimary = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newImages = [...images];
      const [primary] = newImages.splice(index, 1);
      newImages.unshift(primary);
      onImagesChange(newImages);
      setSelectedImages(new Set());
      toast.success('Image définie comme principale');
    },
    [images, onImagesChange]
  );

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {images.length > 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="gap-2"
              >
                <Checkbox
                  checked={selectedImages.size === images.length && images.length > 0}
                  className="pointer-events-none"
                />
                {selectedImages.size === images.length ? 'Désélectionner' : 'Tout sélectionner'}
              </Button>

              <AnimatePresence>
                {selectedImages.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Badge variant="secondary" className="font-medium">
                      {selectedImages.size} sélectionné(s)
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedImages.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer ({selectedImages.size})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.length === 0 ? (
          <Card className="col-span-full p-8 flex flex-col items-center justify-center text-center border-dashed">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Aucune image</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une image
            </Button>
          </Card>
        ) : (
          images.map((image, index) => (
            <motion.div
              key={`${image}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card
                className={cn(
                  'relative group overflow-hidden cursor-pointer transition-all',
                  selectedImages.has(index) && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => toggleImageSelection(index)}
              >
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principale
                  </div>
                )}

                {/* Selection Checkbox */}
                <div
                  className={cn(
                    'absolute top-2 right-2 p-1 rounded-md transition-all',
                    selectedImages.has(index)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/80 text-foreground opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(index);
                  }}
                >
                  {selectedImages.has(index) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 border-2 rounded-sm" />
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(index);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Principale
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Image Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter une image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL de l'image</Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  placeholder="https://exemple.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Entrez l'URL complète de l'image que vous souhaitez ajouter
              </p>
            </div>

            {newImageUrl && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Aperçu</p>
                <img
                  src={newImageUrl}
                  alt="Aperçu"
                  className="w-full h-32 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddImage} className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Ajouter l'image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedImages.size} image(s) ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
