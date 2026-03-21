/**
 * MediaAssetDetailPanel - Slide-out panel with integrated editing tools
 * Includes: preview, metadata editing, crop, bg removal, watermark, resize
 */
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Info, Crop, Scissors, Type, Download, Copy, Trash2,
  Star, StarOff, ExternalLink, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropTool } from './ImageCropTool';
import { BackgroundRemovalTool } from './BackgroundRemovalTool';
import { cn } from '@/lib/utils';

interface MediaAsset {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  media_type: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  category: string | null;
  folder_path: string;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
}

interface MediaAssetDetailPanelProps {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<MediaAsset> & { id: string }) => void;
  onDelete: (id: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export function MediaAssetDetailPanel({ asset, open, onOpenChange, onUpdate, onDelete }: MediaAssetDetailPanelProps) {
  const [editedAsset, setEditedAsset] = useState<MediaAsset | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);

  // Sync when asset changes
  if (asset && (!editedAsset || editedAsset.id !== asset.id)) {
    setEditedAsset(asset);
    setEditedImageUrl(null);
  }

  if (!asset || !editedAsset) return null;

  const currentImageUrl = editedImageUrl || asset.file_url;
  const isImage = asset.media_type === 'image';

  const handleSave = () => {
    onUpdate({
      id: editedAsset.id,
      title: editedAsset.title,
      alt_text: editedAsset.alt_text,
      description: editedAsset.description,
      tags: editedAsset.tags,
      is_favorite: editedAsset.is_favorite,
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(asset.file_url);
    toast.success('URL copiée dans le presse-papier');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base truncate pr-4">
              {editedAsset.original_name}
            </SheetTitle>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditedAsset({ ...editedAsset, is_favorite: !editedAsset.is_favorite });
                }}
              >
                {editedAsset.is_favorite ? (
                  <Star className="h-4 w-4 text-warning fill-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <SheetDescription className="text-xs">
            {formatFileSize(asset.file_size)} • {asset.mime_type}
            {asset.width && asset.height && ` • ${asset.width}×${asset.height}px`}
          </SheetDescription>
        </SheetHeader>

        {/* Preview */}
        <div className="px-6 py-3">
          <div className="rounded-xl overflow-hidden bg-muted border aspect-video flex items-center justify-center relative group">
            {isImage ? (
              <img
                src={currentImageUrl}
                alt={editedAsset.alt_text || ''}
                className="max-w-full max-h-full object-contain"
              />
            ) : asset.media_type === 'video' ? (
              <video src={asset.file_url} controls className="max-w-full max-h-full" />
            ) : (
              <div className="text-muted-foreground text-sm">Aperçu non disponible</div>
            )}
            {editedImageUrl && (
              <Badge className="absolute top-2 right-2 bg-primary/90">Modifié</Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6">
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger value="info" className="flex-1 gap-1.5 text-xs">
                <Info className="h-3.5 w-3.5" />Infos
              </TabsTrigger>
              {isImage && (
                <>
                  <TabsTrigger value="crop" className="flex-1 gap-1.5 text-xs">
                    <Crop className="h-3.5 w-3.5" />Recadrer
                  </TabsTrigger>
                  <TabsTrigger value="bg" className="flex-1 gap-1.5 text-xs">
                    <Scissors className="h-3.5 w-3.5" />Fond
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="seo" className="flex-1 gap-1.5 text-xs">
                <Type className="h-3.5 w-3.5" />SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              <TabsContent value="info" className="mt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Titre</Label>
                  <Input
                    value={editedAsset.title || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset, title: e.target.value })}
                    placeholder="Titre du média"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={editedAsset.description || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset, description: e.target.value })}
                    placeholder="Description détaillée"
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags (séparés par des virgules)</Label>
                  <Input
                    value={editedAsset.tags?.join(', ') || ''}
                    onChange={(e) => setEditedAsset({
                      ...editedAsset,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="produit, hero, marketing"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Utilisations</p>
                    <p className="text-lg font-bold">{asset.usage_count}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dossier</p>
                    <p className="text-sm font-medium truncate">{asset.folder_path || '/'}</p>
                  </div>
                </div>
              </TabsContent>

              {isImage && (
                <>
                  <TabsContent value="crop" className="mt-0">
                    <ImageCropTool
                      imageUrl={currentImageUrl}
                      onCrop={(cropped) => {
                        setEditedImageUrl(cropped);
                        toast.success('Image recadrée');
                      }}
                      onCancel={() => setActiveTab('info')}
                    />
                  </TabsContent>

                  <TabsContent value="bg" className="mt-0">
                    <BackgroundRemovalTool
                      imageUrl={currentImageUrl}
                      onResult={(result) => {
                        setEditedImageUrl(result);
                      }}
                    />
                  </TabsContent>
                </>
              )}

              <TabsContent value="seo" className="mt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Texte alternatif (alt)</Label>
                  <Textarea
                    value={editedAsset.alt_text || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset, alt_text: e.target.value })}
                    placeholder="Description pour les moteurs de recherche et l'accessibilité"
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Le texte alt améliore votre SEO et l'accessibilité. Décrivez l'image en 125 caractères max.
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  editedAsset.alt_text ? "bg-success/5 border-emerald-500/20" : "bg-warning/5 border-amber-500/20"
                )}>
                  <p className="text-xs font-medium">
                    {editedAsset.alt_text ? '✅ Texte alt renseigné' : '⚠️ Texte alt manquant'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {editedAsset.alt_text
                      ? `${editedAsset.alt_text.length} caractères`
                      : 'Ajoutez un texte descriptif pour améliorer votre référencement'
                    }
                  </p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer actions */}
        <div className="border-t px-6 py-3 flex items-center gap-2">
          <Button onClick={handleSave} className="flex-1">
            Enregistrer
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={asset.file_url} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onDelete(asset.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
