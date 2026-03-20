/**
 * ImageCropTool - Interactive crop overlay for the media editor
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Crop } from 'lucide-react';

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropToolProps {
  imageUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: 'Libre', value: 'free' },
  { label: '1:1 (Carré)', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '3:2', value: '3:2' },
];

export function ImageCropTool({ imageUrl, onCrop, onCancel }: ImageCropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<CropRegion>({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatio, setAspectRatio] = useState('free');
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-br' | 'resize-tl' | 'resize-tr' | 'resize-bl' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: crop });

  const getAspectValue = (ratio: string): number | null => {
    if (ratio === 'free') return null;
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  const constrainCrop = useCallback((c: CropRegion, ratio: string): CropRegion => {
    const aspect = getAspectValue(ratio);
    let { x, y, width, height } = c;
    width = Math.max(5, Math.min(width, 100 - x));
    height = Math.max(5, Math.min(height, 100 - y));
    x = Math.max(0, Math.min(x, 100 - width));
    y = Math.max(0, Math.min(y, 100 - height));
    if (aspect) {
      height = width / aspect;
      if (y + height > 100) {
        height = 100 - y;
        width = height * aspect;
      }
    }
    return { x, y, width, height };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, type: typeof dragType) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !dragType) return;
      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
      const sc = dragStart.crop;

      let newCrop: CropRegion;
      if (dragType === 'move') {
        newCrop = { ...sc, x: sc.x + dx, y: sc.y + dy };
      } else if (dragType === 'resize-br') {
        newCrop = { ...sc, width: sc.width + dx, height: sc.height + dy };
      } else if (dragType === 'resize-tl') {
        newCrop = { x: sc.x + dx, y: sc.y + dy, width: sc.width - dx, height: sc.height - dy };
      } else if (dragType === 'resize-tr') {
        newCrop = { ...sc, y: sc.y + dy, width: sc.width + dx, height: sc.height - dy };
      } else {
        newCrop = { ...sc, x: sc.x + dx, width: sc.width - dx, height: sc.height + dy };
      }
      setCrop(constrainCrop(newCrop, aspectRatio));
    };

    const handleUp = () => { setIsDragging(false); setDragType(null); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, dragType, dragStart, aspectRatio, constrainCrop]);

  const applyCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sx = (crop.x / 100) * img.naturalWidth;
      const sy = (crop.y / 100) * img.naturalHeight;
      const sw = (crop.width / 100) * img.naturalWidth;
      const sh = (crop.height / 100) * img.naturalHeight;
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      onCrop(canvas.toDataURL('image/png'));
    };
    img.src = imageUrl;
  };

  const handleRatioChange = (v: string) => {
    setAspectRatio(v);
    setCrop(constrainCrop(crop, v));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Crop className="h-4 w-4 text-primary" />
        <Label className="font-semibold">Recadrage</Label>
        <Select value={aspectRatio} onValueChange={handleRatioChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={containerRef} className="relative rounded-lg overflow-hidden bg-black/90 select-none" style={{ cursor: isDragging ? 'grabbing' : 'default' }}>
        <img src={imageUrl} alt="Crop preview" className="w-full opacity-40 pointer-events-none" draggable={false} />
        
        {/* Crop overlay */}
        <div
          className="absolute border-2 border-primary shadow-lg"
          style={{
            left: `${crop.x}%`, top: `${crop.y}%`,
            width: `${crop.width}%`, height: `${crop.height}%`,
            cursor: 'grab',
          }}
          onMouseDown={e => handleMouseDown(e, 'move')}
        >
          {/* Visible cropped area */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={imageUrl}
              alt="Crop region"
              className="absolute pointer-events-none"
              draggable={false}
              style={{
                left: `-${(crop.x / crop.width) * 100}%`,
                top: `-${(crop.y / crop.height) * 100}%`,
                width: `${100 / crop.width * 100}%`,
                height: `${100 / crop.height * 100}%`,
              }}
            />
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
          </div>

          {/* Resize handles */}
          {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
            <div
              key={pos}
              className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white shadow-md"
              style={{
                ...(pos.includes('t') ? { top: -6 } : { bottom: -6 }),
                ...(pos.includes('l') ? { left: -6 } : { right: -6 }),
                cursor: pos === 'tl' || pos === 'br' ? 'nwse-resize' : 'nesw-resize',
              }}
              onMouseDown={e => handleMouseDown(e, `resize-${pos}` as typeof dragType)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />Annuler
        </Button>
        <Button size="sm" className="flex-1 gap-1.5" onClick={applyCrop}>
          <Check className="h-3.5 w-3.5" />Appliquer
        </Button>
      </div>
    </div>
  );
}
