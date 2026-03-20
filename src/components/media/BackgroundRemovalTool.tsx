/**
 * BackgroundRemovalTool - AI-powered background removal via edge function
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Scissors, Loader2, Download, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackgroundRemovalToolProps {
  imageUrl: string;
  onResult: (resultDataUrl: string) => void;
}

export function BackgroundRemovalTool({ imageUrl, onResult }: BackgroundRemovalToolProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const removeBackground = async () => {
    setIsProcessing(true);
    setProgress(20);

    try {
      // Convert to base64 if it's a blob URL
      let base64Image = imageUrl;
      if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      setProgress(40);

      const { data, error } = await supabase.functions.invoke('ai-image-enhancer', {
        body: {
          imageUrl: base64Image,
          enhancementType: 'background',
          productContext: 'Remove background, keep subject only with transparent background',
        },
      });

      setProgress(80);

      if (error) throw error;

      const resultImage = data?.enhancedImageUrl || data?.result?.url;
      if (resultImage) {
        setResultUrl(resultImage);
        onResult(resultImage);
        toast.success('Arrière-plan supprimé avec succès');
      } else {
        // Fallback: client-side simple bg removal using canvas
        await clientSideBgRemoval();
      }
    } catch (err) {
      console.error('BG removal error:', err);
      // Fallback to client-side
      await clientSideBgRemoval();
    } finally {
      setProgress(100);
      setIsProcessing(false);
    }
  };

  const clientSideBgRemoval = async () => {
    toast.info('Utilisation du mode local pour la suppression d\'arrière-plan');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data: pixels } = imageData;

    // Simple chroma-key: remove near-white/near-gray backgrounds
    const samplePoints = [
      [0, 0], [canvas.width - 1, 0],
      [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1],
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    for (const [sx, sy] of samplePoints) {
      const idx = (sy * canvas.width + sx) * 4;
      bgR += pixels[idx]; bgG += pixels[idx + 1]; bgB += pixels[idx + 2];
    }
    bgR /= 4; bgG /= 4; bgB /= 4;

    const tolerance = 60;
    for (let i = 0; i < pixels.length; i += 4) {
      const dr = Math.abs(pixels[i] - bgR);
      const dg = Math.abs(pixels[i + 1] - bgG);
      const db = Math.abs(pixels[i + 2] - bgB);
      if (dr < tolerance && dg < tolerance && db < tolerance) {
        pixels[i + 3] = 0; // transparent
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const result = canvas.toDataURL('image/png');
    setResultUrl(result);
    onResult(result);
    toast.success('Arrière-plan supprimé (mode local)');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Scissors className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Suppression d'arrière-plan</span>
        <Badge variant="secondary" className="text-[10px]">IA</Badge>
      </div>

      {isProcessing && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Traitement en cours...</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={removeBackground}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scissors className="h-3.5 w-3.5" />
          )}
          {isProcessing ? 'Traitement...' : 'Supprimer le fond'}
        </Button>

        {resultUrl && (
          <Button size="sm" variant="ghost" onClick={() => { setResultUrl(null); }} title="Réessayer">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {resultUrl && (
        <div className="rounded-lg overflow-hidden bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:12px_12px] p-2">
          <img src={resultUrl} alt="Sans arrière-plan" className="max-h-32 mx-auto object-contain" />
        </div>
      )}
    </div>
  );
}
