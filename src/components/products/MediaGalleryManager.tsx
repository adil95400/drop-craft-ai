/**
 * MediaGalleryManager — Advanced Image Gallery with drag-drop, bulk URL, zoom
 */
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, Image as ImageIcon, Link as LinkIcon, X, Check, Star,
  Loader2, Upload, ZoomIn, Download, GripVertical, Layers, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MediaGalleryManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  isLoading?: boolean;
}

export function MediaGalleryManager({
  images, onImagesChange, isLoading = false,
}: MediaGalleryManagerProps) {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleImageSelection = useCallback((index: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedImages(prev =>
      prev.size === images.length ? new Set() : new Set(images.map((_, i) => i))
    );
  }, [images.length]);

  const handleAddImage = useCallback(() => {
    if (!newImageUrl.trim()) { toast.error('URL requise'); return; }
    try { new URL(newImageUrl); } catch { toast.error('URL invalide'); return; }
    onImagesChange([...images, newImageUrl.trim()]);
    setNewImageUrl('');
    setAddDialogOpen(false);
    toast.success('Image ajoutée');
  }, [newImageUrl, images, onImagesChange]);

  const handleBulkAdd = useCallback(() => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => {
      try { new URL(u); return true; } catch { return false; }
    });
    if (urls.length === 0) { toast.error('Aucune URL valide'); return; }
    onImagesChange([...images, ...urls]);
    setBulkUrls('');
    setAddDialogOpen(false);
    toast.success(`${urls.length} image(s) ajoutée(s)`);
  }, [bulkUrls, images, onImagesChange]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) onImagesChange([...images, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} fichier(s) ajouté(s)`);
  }, [images, onImagesChange]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedImages.size === 0) return;
    setIsDeleting(true);
    try {
      onImagesChange(images.filter((_, i) => !selectedImages.has(i)));
      setSelectedImages(new Set());
      setDeleteDialogOpen(false);
      toast.success(`${selectedImages.size} image(s) supprimée(s)`);
    } finally { setIsDeleting(false); }
  }, [selectedImages, images, onImagesChange]);

  const handleSetPrimary = useCallback((index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [primary] = newImages.splice(index, 1);
    newImages.unshift(primary);
    onImagesChange(newImages);
    setSelectedImages(new Set());
    toast.success('Image définie comme principale');
  }, [images, onImagesChange]);

  // Drag and drop reorder
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newImages = [...images];
    const [moved] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, moved);
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = 'image'; a.target = '_blank'; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Layers className="h-3 w-3" /> {images.length} image{images.length !== 1 ? 's' : ''}
          </Badge>
          {images.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="gap-1.5 text-xs h-8">
              <Checkbox checked={selectedImages.size === images.length && images.length > 0} className="pointer-events-none h-3.5 w-3.5" />
              {selectedImages.size === images.length ? 'Désélectionner' : 'Tout'}
            </Button>
          )}
          <AnimatePresence>
            {selectedImages.size > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2">
                <Badge variant="secondary" className="font-medium text-xs">{selectedImages.size} sélectionné(s)</Badge>
                <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="gap-1.5 text-xs h-8">
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5 text-xs h-8">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
          <Button type="button" size="sm" onClick={() => { setAddMode('single'); setAddDialogOpen(true); }} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.length === 0 ? (
          <Card className="col-span-full p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-muted-foreground/20">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Aucune image dans la galerie</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Uploader
              </Button>
              <Button type="button" size="sm" onClick={() => { setAddMode('bulk'); setAddDialogOpen(true); }} className="gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Ajouter par URL
              </Button>
            </div>
          </Card>
        ) : (
          images.map((image, index) => (
            <motion.div
              key={`${image}-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
            >
              <Card className={cn(
                'relative group overflow-hidden cursor-pointer transition-all border-2',
                selectedImages.has(index) ? 'ring-2 ring-primary border-primary' : 'border-transparent hover:border-muted-foreground/20',
                dragOverIndex === index && 'border-primary border-dashed',
                draggedIndex === index && 'opacity-50'
              )}>
                {/* Drag handle */}
                <div className="absolute top-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background/80 backdrop-blur rounded p-0.5 cursor-grab">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <img
                  src={image} alt={`Image ${index + 1}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                  onClick={() => toggleImageSelection(index)}
                />

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" /> Principale
                  </div>
                )}

                {/* Selection Checkbox */}
                <div className={cn(
                  'absolute top-1.5 right-1.5 p-0.5 rounded transition-all',
                  selectedImages.has(index) ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground opacity-0 group-hover:opacity-100'
                )} onClick={(e) => { e.stopPropagation(); toggleImageSelection(index); }}>
                  {selectedImages.has(index) ? <Check className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 border-2 rounded-sm" />}
                </div>

                {/* Hover Actions */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setZoomImage(image); }}
                      className="p-1 rounded bg-white/20 backdrop-blur hover:bg-white/40 transition-colors">
                      <ZoomIn className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                      className="p-1 rounded bg-white/20 backdrop-blur hover:bg-white/40 transition-colors">
                      <Download className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                  {index !== 0 && (
                    <button onClick={(e) => { e.stopPropagation(); handleSetPrimary(index); }}
                      className="px-2 py-1 rounded bg-white/20 backdrop-blur hover:bg-white/40 transition-colors text-[10px] text-white font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" /> Principale
                    </button>
                  )}
                </div>

                {/* Position badge */}
                <div className="absolute bottom-1.5 left-1.5 bg-background/70 backdrop-blur text-[10px] px-1 py-0.5 rounded font-mono opacity-0 group-hover:opacity-0 transition-opacity">
                  {index + 1}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="sm:max-w-3xl p-2">
          {zoomImage && (
            <img src={zoomImage} alt="Zoom" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Image Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Ajouter des images
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button variant={addMode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('single')} className="text-xs">
              URL unique
            </Button>
            <Button variant={addMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('bulk')} className="text-xs">
              Import en masse
            </Button>
          </div>

          {addMode === 'single' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">URL de l'image</Label>
                <Input id="image-url" placeholder="https://exemple.com/image.jpg" value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddImage()} />
              </div>
              {newImageUrl && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
                  <img src={newImageUrl} alt="Aperçu" className="w-full h-32 object-contain rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URLs (une par ligne)</Label>
                <Textarea rows={6} placeholder={"https://exemple.com/image1.jpg\nhttps://exemple.com/image2.jpg\nhttps://exemple.com/image3.jpg"}
                  value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground">
                  {bulkUrls.split('\n').filter(u => u.trim()).length} URL(s) détectée(s)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={addMode === 'single' ? handleAddImage : handleBulkAdd} className="gap-2">
              <LinkIcon className="h-4 w-4" />
              {addMode === 'single' ? "Ajouter" : `Ajouter ${bulkUrls.split('\n').filter(u => u.trim()).length} images`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedImages.size} image(s) ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</> : <><Trash2 className="h-4 w-4 mr-2" />Supprimer</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
