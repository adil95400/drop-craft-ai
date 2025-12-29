import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, RotateCcw, Sun, Contrast, Droplets, Thermometer, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageEnhancerToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImage?: string;
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  blur: number;
  sharpness: number;
}

const defaultFilters: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  blur: 0,
  sharpness: 0
};

const presets = [
  { name: 'Original', filters: { ...defaultFilters } },
  { name: 'Éclatant', filters: { brightness: 110, contrast: 115, saturation: 130, temperature: 10, blur: 0, sharpness: 20 } },
  { name: 'Vintage', filters: { brightness: 95, contrast: 90, saturation: 70, temperature: 20, blur: 0, sharpness: 0 } },
  { name: 'Noir & Blanc', filters: { brightness: 105, contrast: 120, saturation: 0, temperature: 0, blur: 0, sharpness: 10 } },
  { name: 'Cinématique', filters: { brightness: 95, contrast: 125, saturation: 90, temperature: -10, blur: 0, sharpness: 15 } },
  { name: 'Lumineux', filters: { brightness: 120, contrast: 100, saturation: 110, temperature: 5, blur: 0, sharpness: 0 } },
];

export function ImageEnhancerTool({ open, onOpenChange, initialImage }: ImageEnhancerToolProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [filters, setFilters] = useState<ImageFilters>({ ...defaultFilters });
  const [activePreset, setActivePreset] = useState<string>('Original');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSourceImage(url);
      setFilters({ ...defaultFilters });
      setActivePreset('Original');
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setFilters(preset.filters);
    setActivePreset(preset.name);
  };

  const updateFilter = (key: keyof ImageFilters, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActivePreset('');
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters });
    setActivePreset('Original');
  };

  const getFilterString = () => {
    const { brightness, contrast, saturation, blur } = filters;
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (blur > 0) filterStr += ` blur(${blur}px)`;
    // Temperature approximation using sepia and hue-rotate
    if (filters.temperature > 0) {
      filterStr += ` sepia(${filters.temperature}%)`;
    } else if (filters.temperature < 0) {
      filterStr += ` hue-rotate(${filters.temperature * 2}deg)`;
    }
    return filterStr;
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
        ctx.filter = getFilterString();
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `enhanced-${Date.now()}.png`;
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Éditeur d'images
          </DialogTitle>
          <DialogDescription>
            Ajustez la luminosité, le contraste et appliquez des filtres professionnels
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview */}
          <div className="lg:col-span-2 space-y-3">
            <div 
              className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border"
              onClick={() => !sourceImage && fileInputRef.current?.click()}
            >
              {sourceImage ? (
                <img 
                  src={sourceImage} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  style={{ filter: getFilterString() }}
                />
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

            {/* Presets */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={activePreset === preset.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="whitespace-nowrap"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Tabs defaultValue="adjust">
              <TabsList className="w-full">
                <TabsTrigger value="adjust" className="flex-1">Ajuster</TabsTrigger>
                <TabsTrigger value="effects" className="flex-1">Effets</TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Luminosité
                    </Label>
                    <span className="text-sm text-muted-foreground">{filters.brightness}%</span>
                  </div>
                  <Slider
                    value={[filters.brightness]}
                    onValueChange={([v]) => updateFilter('brightness', v)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Contrast className="h-4 w-4" />
                      Contraste
                    </Label>
                    <span className="text-sm text-muted-foreground">{filters.contrast}%</span>
                  </div>
                  <Slider
                    value={[filters.contrast]}
                    onValueChange={([v]) => updateFilter('contrast', v)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Saturation
                    </Label>
                    <span className="text-sm text-muted-foreground">{filters.saturation}%</span>
                  </div>
                  <Slider
                    value={[filters.saturation]}
                    onValueChange={([v]) => updateFilter('saturation', v)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Température
                    </Label>
                    <span className="text-sm text-muted-foreground">{filters.temperature}</span>
                  </div>
                  <Slider
                    value={[filters.temperature]}
                    onValueChange={([v]) => updateFilter('temperature', v)}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Flou</Label>
                    <span className="text-sm text-muted-foreground">{filters.blur}px</span>
                  </div>
                  <Slider
                    value={[filters.blur]}
                    onValueChange={([v]) => updateFilter('blur', v)}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Netteté</Label>
                    <span className="text-sm text-muted-foreground">{filters.sharpness}%</span>
                  </div>
                  <Slider
                    value={[filters.sharpness]}
                    onValueChange={([v]) => updateFilter('sharpness', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
