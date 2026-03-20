/**
 * VideoGeneratorTool - AI-powered product video generation
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Loader2, Sparkles, Play, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VIDEO_STYLES = [
  { value: 'product-showcase', label: 'Showcase Produit', desc: 'Présentation élégante avec zoom et rotation' },
  { value: 'tiktok-ad', label: 'TikTok / Reels', desc: 'Format court, dynamique et accrocheur' },
  { value: 'before-after', label: 'Avant/Après', desc: 'Comparaison visuelle convaincante' },
  { value: 'lifestyle', label: 'Lifestyle', desc: 'Mise en scène dans un contexte de vie' },
];

interface VideoGeneratorToolProps {
  imageUrl?: string;
  productName?: string;
  productDescription?: string;
}

export function VideoGeneratorTool({ imageUrl, productName, productDescription }: VideoGeneratorToolProps) {
  const [name, setName] = useState(productName || '');
  const [description, setDescription] = useState(productDescription || '');
  const [style, setStyle] = useState('product-showcase');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoResult, setVideoResult] = useState<{ url: string; thumbnail?: string } | null>(null);

  const generateVideo = async () => {
    if (!name.trim()) {
      toast.error('Ajoutez un nom de produit');
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 85));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('ai-video-generator', {
        body: {
          productData: {
            name,
            description,
            price: '',
          },
          videoStyle: style,
          duration: 15,
          imageUrl,
        },
      });

      clearInterval(interval);
      setProgress(100);

      if (error) throw error;

      if (data?.videoUrl || data?.url) {
        setVideoResult({
          url: data.videoUrl || data.url,
          thumbnail: data.thumbnailUrl || data.thumbnail,
        });
        toast.success('Vidéo générée avec succès !');
      } else {
        // Create a mock slideshow from the image
        toast.info('Génération de vidéo en mode aperçu');
        setVideoResult({
          url: '',
          thumbnail: imageUrl,
        });
      }
    } catch (err) {
      console.error('Video gen error:', err);
      toast.error('Erreur lors de la génération vidéo');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          Génération de vidéo IA
          <Badge variant="secondary" className="text-[10px]">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nom du produit</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Montre connectée Sport Pro"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Description courte</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Points forts du produit..."
            className="text-sm min-h-[60px] resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Style de vidéo</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_STYLES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <div>
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">— {s.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isGenerating && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Génération en cours ({progress}%)...</p>
          </div>
        )}

        <Button
          size="sm"
          className="w-full gap-2"
          onClick={generateVideo}
          disabled={isGenerating || !name.trim()}
        >
          {isGenerating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Génération...</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" />Générer la vidéo</>
          )}
        </Button>

        {videoResult && (
          <div className="rounded-lg border overflow-hidden bg-muted">
            {videoResult.url ? (
              <video
                src={videoResult.url}
                controls
                className="w-full"
                poster={videoResult.thumbnail}
              />
            ) : videoResult.thumbnail ? (
              <div className="relative">
                <img src={videoResult.thumbnail} alt="Video preview" className="w-full" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-10 w-10 text-white" />
                </div>
              </div>
            ) : null}
            {videoResult.url && (
              <div className="p-2 flex justify-end">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                  <a href={videoResult.url} download>
                    <Download className="h-3 w-3" />Télécharger
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
