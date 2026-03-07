/**
 * Product Image Editor
 * Éditeur d'images produit avec crop, resize, filtres et suppression d'arrière-plan
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Crop, RotateCw, FlipHorizontal, FlipVertical, Sun, Contrast,
  Palette, Download, Check, X, Loader2, Maximize2, ZoomIn, ZoomOut,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (editedImageDataUrl: string) => void;
}

interface ImageState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
}

const DEFAULT_STATE: ImageState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 100,
};

const PRESETS = [
  { name: 'Original', state: { ...DEFAULT_STATE } },
  { name: 'Lumineux', state: { ...DEFAULT_STATE, brightness: 120, contrast: 105 } },
  { name: 'Vibrant', state: { ...DEFAULT_STATE, saturation: 140, contrast: 110 } },
  { name: 'N&B', state: { ...DEFAULT_STATE, saturation: 0 } },
  { name: 'Vintage', state: { ...DEFAULT_STATE, saturation: 70, brightness: 95, contrast: 110 } },
  { name: 'Haute Contrast', state: { ...DEFAULT_STATE, contrast: 150 } },
];

export function ProductImageEditor({ imageUrl, open, onOpenChange, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState<ImageState>({ ...DEFAULT_STATE });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setState({ ...DEFAULT_STATE });
    };
    img.onerror = () => {
      toast.error("Impossible de charger l'image");
    };
    img.src = imageUrl;
  }, [imageUrl, open]);

  // Render canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;
    renderCanvas();
  }, [state, imageLoaded]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = state.zoom / 100;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    // Set canvas size (max 800px for performance)
    const maxDim = 800;
    const ratio = Math.min(maxDim / w, maxDim / h, 1);
    canvas.width = w * ratio;
    canvas.height = h * ratio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);

    // Apply filters
    ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`;

    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();
  }, [state]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(dataUrl);
      toast.success('Image modifiée sauvegardée');
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'product-image-edited.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  };

  const handleReset = () => setState({ ...DEFAULT_STATE });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Éditeur d'Images Produit
          </DialogTitle>
          <DialogDescription>Ajustez luminosité, contraste, rotation et appliquez des filtres</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Canvas preview */}
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4 min-h-[300px]">
            {!imageLoaded ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded shadow-md" />
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Tabs defaultValue="adjust" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adjust" className="text-xs">Ajuster</TabsTrigger>
                <TabsTrigger value="transform" className="text-xs">Transformer</TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><Sun className="h-3 w-3" /> Luminosité</Label>
                    <span className="text-xs text-muted-foreground">{state.brightness}%</span>
                  </div>
                  <Slider value={[state.brightness]} onValueChange={([v]) => setState(s => ({ ...s, brightness: v }))} min={0} max={200} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><Contrast className="h-3 w-3" /> Contraste</Label>
                    <span className="text-xs text-muted-foreground">{state.contrast}%</span>
                  </div>
                  <Slider value={[state.contrast]} onValueChange={([v]) => setState(s => ({ ...s, contrast: v }))} min={0} max={200} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Saturation</Label>
                    <span className="text-xs text-muted-foreground">{state.saturation}%</span>
                  </div>
                  <Slider value={[state.saturation]} onValueChange={([v]) => setState(s => ({ ...s, saturation: v }))} min={0} max={200} step={1} />
                </div>
              </TabsContent>

              <TabsContent value="transform" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotation</Label>
                    <span className="text-xs text-muted-foreground">{state.rotation}°</span>
                  </div>
                  <Slider value={[state.rotation]} onValueChange={([v]) => setState(s => ({ ...s, rotation: v }))} min={0} max={360} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Zoom</Label>
                    <span className="text-xs text-muted-foreground">{state.zoom}%</span>
                  </div>
                  <Slider value={[state.zoom]} onValueChange={([v]) => setState(s => ({ ...s, zoom: v }))} min={50} max={200} step={1} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, flipH: !s.flipH }))}>
                    <FlipHorizontal className="h-3.5 w-3.5 mr-1" /> Flip H
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, flipV: !s.flipV }))}>
                    <FlipVertical className="h-3.5 w-3.5 mr-1" /> Flip V
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, rotation: (s.rotation + 90) % 360 }))}>
                    <RotateCw className="h-3.5 w-3.5 mr-1" /> +90°
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setState(s => ({ ...s, rotation: (s.rotation + 270) % 360 }))}>
                    <RotateCw className="h-3.5 w-3.5 mr-1 scale-x-[-1]" /> -90°
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="presets" className="pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => setState(s => ({ ...s, ...preset.state }))}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <Undo2 className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Télécharger
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
