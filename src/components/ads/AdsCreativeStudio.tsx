import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, RefreshCw, Image, Type, Video, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AD_TEMPLATES = [
  { id: 'product_promo', name: 'Promo Produit', desc: 'Mise en avant d\'un produit', format: '1080x1080' },
  { id: 'story', name: 'Story / Reel', desc: 'Format vertical immersif', format: '1080x1920' },
  { id: 'carousel', name: 'Carrousel', desc: 'Plusieurs visuels à swiper', format: '1080x1080 x5' },
  { id: 'banner', name: 'Bannière Display', desc: 'Google Display Network', format: '728x90' },
  { id: 'video_short', name: 'Vidéo Courte', desc: 'TikTok / Reels < 30s', format: '1080x1920' },
  { id: 'collection', name: 'Collection', desc: 'Hero + grille produits', format: '1200x628' },
];

const COPY_TONES = ['Professionnel', 'Décontracté', 'Urgence', 'Premium', 'Ludique'];

export function AdsCreativeStudio() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [tone, setTone] = useState('Professionnel');
  const [productName, setProductName] = useState('');
  const [generatedCopies, setGeneratedCopies] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCopy = async () => {
    if (!productName.trim()) {
      toast({ title: 'Saisissez un produit', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 1200));
    const copies = [
      `🔥 ${productName} — L'indispensable de la saison ! -20% avec le code FLASH20. Livraison offerte dès 49€.`,
      `✨ Découvrez ${productName}. Qualité premium, prix imbattable. Stock limité → Commandez maintenant !`,
      `💯 ${productName} | Celui que tout le monde s'arrache. +2 500 avis 5⭐. Profitez-en avant rupture.`,
    ];
    setGeneratedCopies(copies);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié !' });
  };

  return (
    <div className="space-y-6">
      {/* Templates grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Templates créatifs
          </CardTitle>
          <CardDescription>Choisissez un format puis personnalisez avec l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AD_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  selectedTemplate === t.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                )}
              >
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">{t.format}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Copywriter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Copywriter IA
          </CardTitle>
          <CardDescription>Générez des textes publicitaires optimisés pour la conversion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produit / Offre</Label>
              <Input
                placeholder="Ex: Montre connectée Sport Pro"
                value={productName}
                onChange={e => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ton</Label>
              <div className="flex flex-wrap gap-2">
                {COPY_TONES.map(t => (
                  <Badge
                    key={t}
                    variant={tone === t ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={generateCopy} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Génération en cours…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Générer 3 variantes</>
            )}
          </Button>

          {generatedCopies.length > 0 && (
            <div className="space-y-3 mt-4">
              {generatedCopies.map((copy, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                  <p className="text-sm flex-1">{copy}</p>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(copy)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick visual formats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Générateur d'images</p>
              <p className="text-xs text-muted-foreground">Visuels IA pour vos pubs</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
        </Card>
        <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Clips vidéo courts</p>
              <p className="text-xs text-muted-foreground">{"Montage auto < 30s"}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
        </Card>
        <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Optimisation créative</p>
              <p className="text-xs text-muted-foreground">IA analyse & améliore</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
        </Card>
      </div>
    </div>
  );
}
