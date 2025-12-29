import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Type, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TextOverlayToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImage?: string;
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Impact', label: 'Impact' },
];

export function TextOverlayTool({ open, onOpenChange, initialImage }: TextOverlayToolProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const selectedLayer = textLayers.find(l => l.id === selectedLayerId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSourceImage(url);
    }
  };

  const addTextLayer = () => {
    const newLayer: TextLayer = {
      id: crypto.randomUUID(),
      text: 'Votre texte',
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: 'Inter',
      color: '#ffffff',
      fontWeight: 'bold'
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLayer = (id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleDownload = () => {
    if (!sourceImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        // Draw text layers
        textLayers.forEach(layer => {
          ctx.font = `${layer.fontWeight} ${layer.fontSize * (img.naturalWidth / 400)}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.textAlign = 'center';
          ctx.fillText(
            layer.text,
            (layer.x / 100) * canvas.width,
            (layer.y / 100) * canvas.height
          );
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `text-overlay-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: "Image téléchargée" });
          }
        }, 'image/png');
      }
    };
    
    img.src = sourceImage;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Ajouter du texte
          </DialogTitle>
          <DialogDescription>
            Ajoutez des textes personnalisés sur vos images
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview */}
          <div className="lg:col-span-2 space-y-3">
            <div 
              className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border relative"
              onClick={() => !sourceImage && fileInputRef.current?.click()}
            >
              {sourceImage ? (
                <>
                  <img 
                    src={sourceImage} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  {textLayers.map(layer => (
                    <div
                      key={layer.id}
                      className={`absolute cursor-move ${selectedLayerId === layer.id ? 'ring-2 ring-primary' : ''}`}
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${layer.fontSize}px`,
                        fontFamily: layer.fontFamily,
                        fontWeight: layer.fontWeight as any,
                        color: layer.color,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayerId(layer.id);
                      }}
                    >
                      {layer.text}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center p-8">
                  <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Cliquez pour importer une image</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Button onClick={addTextLayer} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un texte
            </Button>

            {/* Layer list */}
            <div className="space-y-2">
              {textLayers.map((layer, index) => (
                <div 
                  key={layer.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selectedLayerId === layer.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <span className="flex-1 truncate text-sm">{layer.text}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {selectedLayer && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Texte</Label>
                  <Input
                    value={selectedLayer.text}
                    onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Police</Label>
                  <Select 
                    value={selectedLayer.fontFamily}
                    onValueChange={(v) => updateLayer(selectedLayer.id, { fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Taille</Label>
                    <span className="text-sm text-muted-foreground">{selectedLayer.fontSize}px</span>
                  </div>
                  <Slider
                    value={[selectedLayer.fontSize]}
                    onValueChange={([v]) => updateLayer(selectedLayer.id, { fontSize: v })}
                    min={12}
                    max={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position X</Label>
                    <Slider
                      value={[selectedLayer.x]}
                      onValueChange={([v]) => updateLayer(selectedLayer.id, { x: v })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position Y</Label>
                    <Slider
                      value={[selectedLayer.y]}
                      onValueChange={([v]) => updateLayer(selectedLayer.id, { y: v })}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={selectedLayer.color}
                      onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleDownload}
              disabled={!sourceImage}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
