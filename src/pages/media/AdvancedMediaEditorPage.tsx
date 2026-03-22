/**
 * Advanced Media Editor - Éditeur de médias avancé
 * Crop, watermark, suppression arrière-plan, filtres, redimensionnement, vidéo IA
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Image as ImageIcon, Upload, Crop, RotateCw, FlipHorizontal, FlipVertical,
  Sun, Contrast, Palette, Download, Type, Layers, Scissors, Maximize2,
  ZoomIn, ZoomOut, Undo2, Redo2, Wand2, Sparkles, Grid3X3, Video
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropTool } from '@/components/media/ImageCropTool';
import { BackgroundRemovalTool } from '@/components/media/BackgroundRemovalTool';
import { VideoGeneratorTool } from '@/components/media/VideoGeneratorTool';

interface ImageState {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
}

const DEFAULT_STATE: ImageState = {
  brightness: 100, contrast: 100, saturation: 100, hue: 0,
  blur: 0, rotation: 0, flipH: false, flipV: false, zoom: 100,
};

const PRESETS = [
  { name: 'Original', state: DEFAULT_STATE },
  { name: 'Vibrant', state: { ...DEFAULT_STATE, saturation: 140, contrast: 115 } },
  { name: 'N&B', state: { ...DEFAULT_STATE, saturation: 0 } },
  { name: 'Vintage', state: { ...DEFAULT_STATE, saturation: 80, contrast: 90, hue: 20 } },
  { name: 'Lumineux', state: { ...DEFAULT_STATE, brightness: 120, contrast: 105 } },
  { name: 'Dramatique', state: { ...DEFAULT_STATE, contrast: 140, brightness: 90, saturation: 120 } },
  { name: 'Pastel', state: { ...DEFAULT_STATE, saturation: 60, brightness: 115 } },
  { name: 'Sépia', state: { ...DEFAULT_STATE, saturation: 50, hue: 30, contrast: 110 } },
];

const RESIZE_PRESETS = [
  { label: 'Instagram (1080×1080)', w: 1080, h: 1080 },
  { label: 'Facebook (1200×630)', w: 1200, h: 630 },
  { label: 'Shopify (2048×2048)', w: 2048, h: 2048 },
  { label: 'Amazon (1500×1500)', w: 1500, h: 1500 },
  { label: 'eBay (1600×1600)', w: 1600, h: 1600 },
  { label: 'Thumbnail (800×800)', w: 800, h: 800 },
];

export default function AdvancedMediaEditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [state, setState] = useState<ImageState>(DEFAULT_STATE);
  const [history, setHistory] = useState<ImageState[]>([DEFAULT_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushState = useCallback((newState: ImageState) => {
    setState(newState);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setState(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setState(history[historyIndex + 1]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target?.result as string);
      setState(DEFAULT_STATE);
      setHistory([DEFAULT_STATE]);
      setHistoryIndex(0);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
      renderCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => { renderCanvas(); }, [state, watermarkText, watermarkOpacity]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    const z = state.zoom / 100;
    ctx.scale(z, z);

    // Filters
    const filters = [
      `brightness(${state.brightness}%)`,
      `contrast(${state.contrast}%)`,
      `saturate(${state.saturation}%)`,
      `hue-rotate(${state.hue}deg)`,
      state.blur > 0 ? `blur(${state.blur}px)` : '',
    ].filter(Boolean).join(' ');
    ctx.filter = filters;

    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Watermark
    if (watermarkText.trim()) {
      ctx.save();
      ctx.globalAlpha = watermarkOpacity / 100;
      ctx.font = `${Math.max(canvas.width / 20, 24)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Diagonal watermark pattern
      for (let y = 0; y < canvas.height; y += canvas.height / 3) {
        for (let x = 0; x < canvas.width; x += canvas.width / 2) {
          ctx.save();
          ctx.translate(x + canvas.width / 4, y + canvas.height / 6);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }, [state, watermarkText, watermarkOpacity]);

  const downloadImage = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Optional resize
    if (resizeWidth !== naturalSize.w || resizeHeight !== naturalSize.h) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = resizeWidth;
      tempCanvas.height = resizeHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, resizeWidth, resizeHeight);
        const link = document.createElement('a');
        link.download = `edited-${imageName || 'image'}.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`, 0.92);
        link.click();
      }
    } else {
      const link = document.createElement('a');
      link.download = `edited-${imageName || 'image'}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`, 0.92);
      link.click();
    }
    toast.success(`Image exportée en ${format.toUpperCase()}`);
  };

    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('editeurMediaAvance.title')}
      description="Éditez, optimisez et préparez vos images produit pour tous vos canaux"
      heroImage="products"
      badge={{ label: 'Média', icon: ImageIcon }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Charger une image
          </Button>
          {imageUrl && (
            <Select onValueChange={v => downloadImage(v as 'png' | 'jpeg' | 'webp')}>
              <SelectTrigger className="w-36 h-8">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Exporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (qualité)</SelectItem>
                <SelectItem value="jpeg">JPEG (léger)</SelectItem>
                <SelectItem value="webp">WebP (optimisé)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      }
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {!imageUrl ? (
        <Card
          className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-20 text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium mb-1">Glissez une image ou cliquez pour charger</p>
            <p className="text-sm text-muted-foreground">JPG, PNG, WebP • Taille max 20 Mo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Canvas Preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{imageName}</CardTitle>
                  <Badge variant="secondary">{naturalSize.w}×{naturalSize.h}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={undo} disabled={historyIndex <= 0}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => pushState(DEFAULT_STATE)}>
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[600px] object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Editor Controls */}
          <div className="space-y-4">
            <Tabs defaultValue="adjust" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="adjust"><Sun className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="transform"><Crop className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="presets"><Palette className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="tools"><Wand2 className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="ai"><Sparkles className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="space-y-4 mt-4">
                {[
                  { label: 'Luminosité', key: 'brightness' as const, icon: Sun, min: 0, max: 200 },
                  { label: 'Contraste', key: 'contrast' as const, icon: Contrast, min: 0, max: 200 },
                  { label: 'Saturation', key: 'saturation' as const, icon: Palette, min: 0, max: 200 },
                  { label: 'Teinte', key: 'hue' as const, icon: Sparkles, min: -180, max: 180 },
                  { label: 'Flou', key: 'blur' as const, icon: Layers, min: 0, max: 20 },
                ].map(({ label, key, icon: Icon, min, max }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}
                      </span>
                      <span className="text-muted-foreground">{state[key]}</span>
                    </div>
                    <Slider
                      value={[state[key]]}
                      min={min} max={max} step={1}
                      onValueChange={([v]) => pushState({ ...state, [key]: v })}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="transform" className="space-y-4 mt-4">
                <div className="space-y-1">
                  <Label className="text-sm flex items-center gap-1.5">
                    <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />Zoom
                  </Label>
                  <Slider
                    value={[state.zoom]}
                    min={50} max={200} step={1}
                    onValueChange={([v]) => pushState({ ...state, zoom: v })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />Rotation
                  </Label>
                  <Slider
                    value={[state.rotation]}
                    min={-180} max={180} step={1}
                    onValueChange={([v]) => pushState({ ...state, rotation: v })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1"
                    onClick={() => pushState({ ...state, rotation: state.rotation + 90 })}>
                    <RotateCw className="h-4 w-4" />+90°
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1"
                    onClick={() => pushState({ ...state, flipH: !state.flipH })}>
                    <FlipHorizontal className="h-4 w-4" />Miroir H
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1"
                    onClick={() => pushState({ ...state, flipV: !state.flipV })}>
                    <FlipVertical className="h-4 w-4" />Miroir V
                  </Button>
                </div>

                {/* Resize */}
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />Redimensionner
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Largeur</Label>
                      <Input type="number" value={resizeWidth} onChange={e => setResizeWidth(Number(e.target.value))} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Hauteur</Label>
                      <Input type="number" value={resizeHeight} onChange={e => setResizeHeight(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {RESIZE_PRESETS.map(p => (
                      <Button key={p.label} variant="ghost" size="sm" className="text-xs justify-start h-7 px-2"
                        onClick={() => { setResizeWidth(p.w); setResizeHeight(p.h); }}>
                        {p.label.split('(')[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="presets" className="mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(preset => (
                    <Button
                      key={preset.name}
                      variant={JSON.stringify(state) === JSON.stringify(preset.state) ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => pushState(preset.state)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tools" className="space-y-4 mt-4">
                {/* Crop */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Crop className="h-3.5 w-3.5" />Recadrage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCropping ? (
                      <ImageCropTool
                        imageUrl={imageUrl!}
                        onCrop={(croppedUrl) => {
                          setImageUrl(croppedUrl);
                          setIsCropping(false);
                          toast.success('Image recadrée');
                        }}
                        onCancel={() => setIsCropping(false)}
                      />
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setIsCropping(true)}>
                        <Crop className="h-4 w-4" />Ouvrir l'outil de recadrage
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Watermark */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Type className="h-3.5 w-3.5" />Filigrane
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Texte du filigrane..."
                      value={watermarkText}
                      onChange={e => setWatermarkText(e.target.value)}
                    />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Opacité: {watermarkOpacity}%</Label>
                      <Slider
                        value={[watermarkOpacity]}
                        min={5} max={80} step={1}
                        onValueChange={([v]) => setWatermarkOpacity(v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start"
                      onClick={() => pushState({ ...DEFAULT_STATE, saturation: 0 })}>
                      <Palette className="h-4 w-4" />Noir & Blanc
                    </Button>
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start"
                      onClick={() => pushState({ ...state, brightness: 110, contrast: 115, saturation: 115 })}>
                      <Wand2 className="h-4 w-4" />Auto-améliorer
                    </Button>
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start"
                      onClick={() => {
                        setResizeWidth(800);
                        setResizeHeight(800);
                        toast.info('Dimensions mises à 800×800 pour le web');
                      }}>
                      <Grid3X3 className="h-4 w-4" />Optimiser pour le web
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-4">
                {/* Background Removal */}
                <Card>
                  <CardContent className="pt-4">
                    <BackgroundRemovalTool
                      imageUrl={imageUrl!}
                      onResult={(resultUrl) => {
                        setImageUrl(resultUrl);
                        toast.success('Arrière-plan supprimé, image mise à jour');
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Video Generation */}
                <VideoGeneratorTool
                  imageUrl={imageUrl || undefined}
                  productName={imageName?.replace(/\.\w+$/, '')}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </ChannablePageWrapper>
  );
}
