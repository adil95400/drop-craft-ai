import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, RefreshCw, Image, Type, Video, Wand2, Eye, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdVariant {
  headline: string;
  primary_text: string;
  description: string;
  cta_text: string;
  angle: string;
}

const AD_TEMPLATES = [
  { id: 'product_promo', name: 'Promo Produit', desc: 'Mise en avant d\'un produit', format: '1080×1080', icon: '🛍️', platform: 'Meta Ads' },
  { id: 'story', name: 'Story / Reel', desc: 'Format vertical immersif', format: '1080×1920', icon: '📱', platform: 'Instagram' },
  { id: 'carousel', name: 'Carrousel', desc: 'Plusieurs visuels à swiper', format: '1080×1080 ×5', icon: '🎠', platform: 'Meta Ads' },
  { id: 'search', name: 'Annonce Search', desc: 'Google Search responsive', format: 'Texte', icon: '🔍', platform: 'Google Ads' },
  { id: 'video_short', name: 'Vidéo Courte', desc: 'TikTok / Reels', format: '1080×1920', icon: '🎬', platform: 'TikTok' },
  { id: 'collection', name: 'Collection', desc: 'Hero + grille produits', format: '1200×628', icon: '📦', platform: 'Meta Ads' },
  { id: 'display', name: 'Bannière Display', desc: 'Google Display Network', format: '728×90', icon: '🖼️', platform: 'Google Ads' },
  { id: 'shopping', name: 'Shopping Ads', desc: 'Google Shopping feed', format: 'Feed', icon: '🛒', platform: 'Google Ads' },
];

const COPY_TONES = [
  { id: 'professional', label: 'Professionnel', emoji: '👔' },
  { id: 'casual', label: 'Décontracté', emoji: '😎' },
  { id: 'urgency', label: 'Urgence', emoji: '⏰' },
  { id: 'premium', label: 'Premium', emoji: '✨' },
  { id: 'playful', label: 'Ludique', emoji: '🎉' },
  { id: 'storytelling', label: 'Storytelling', emoji: '📖' },
];

const OBJECTIVES = [
  { value: 'conversions', label: 'Conversions' },
  { value: 'traffic', label: 'Trafic' },
  { value: 'awareness', label: 'Notoriété' },
  { value: 'leads', label: 'Leads' },
  { value: 'engagement', label: 'Engagement' },
];

const ANGLE_COLORS: Record<string, string> = {
  émotion: 'bg-pink-500/10 text-pink-600 border-pink-200',
  urgence: 'bg-orange-500/10 text-orange-600 border-orange-200',
  preuve: 'bg-blue-500/10 text-blue-600 border-blue-200',
  bénéfice: 'bg-green-500/10 text-green-600 border-green-200',
  curiosité: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

export function AdsCreativeStudio() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [tone, setTone] = useState('Professionnel');
  const [platform, setPlatform] = useState('Meta Ads');
  const [objective, setObjective] = useState('conversions');
  const [productName, setProductName] = useState('');
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<number | null>(null);

  const generateCopy = async () => {
    if (!productName.trim()) {
      toast({ title: 'Saisissez un produit', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setVariants([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: { productName, tone, platform, objective, language: 'français' },
      });

      if (error) throw error;

      if (data?.variants && Array.isArray(data.variants)) {
        setVariants(data.variants);
        toast({ title: `${data.variants.length} variantes générées !` });
      } else {
        toast({ title: 'Erreur', description: 'Format de réponse inattendu', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur IA', description: err.message || 'Impossible de générer', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = (variant: AdVariant) => {
    const text = `${variant.headline}\n\n${variant.primary_text}\n\n${variant.description}\n\n[${variant.cta_text}]`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié dans le presse-papiers !' });
  };

  const selectedTpl = AD_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-5 w-5 text-primary" />
            Format publicitaire
          </CardTitle>
          <CardDescription>Choisissez un format pour adapter la génération IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {AD_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t.id); setPlatform(t.platform); }}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  selectedTemplate === t.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <p className="font-medium text-sm">{t.name}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">{t.format}</Badge>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{t.platform}</Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Copy Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Copywriter IA
          </CardTitle>
          <CardDescription>Générez des textes publicitaires professionnels avec l'IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Produit / Offre *</Label>
              <Input
                placeholder="Ex: Montre connectée Sport Pro"
                value={productName}
                onChange={e => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Objectif</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Plateforme</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Ton</Label>
            <div className="flex flex-wrap gap-2">
              {COPY_TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.label)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                    tone === t.label ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                  )}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateCopy} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Génération IA en cours…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Générer 5 variantes avec l'IA</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Variants */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{variants.length} variantes générées</h3>
            <Button variant="outline" size="sm" onClick={generateCopy} disabled={isGenerating}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
              Régénérer
            </Button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {variants.map((v, i) => {
              const angleColor = Object.entries(ANGLE_COLORS).find(([k]) =>
                v.angle.toLowerCase().includes(k)
              )?.[1] || 'bg-muted text-muted-foreground';

              return (
                <Card key={i} className={cn(
                  'overflow-hidden transition-all hover:shadow-lg group',
                  previewVariant === i && 'ring-2 ring-primary'
                )}>
                  {/* Ad Preview Header */}
                  <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">V{i + 1}</Badge>
                      <Badge className={cn('text-[10px]', angleColor)}>{v.angle}</Badge>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewVariant(previewVariant === i ? null : i)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAll(v)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Headline */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Titre</p>
                      <p className="font-bold text-base leading-tight">{v.headline}</p>
                    </div>

                    {/* Primary Text */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Texte principal</p>
                      <p className="text-sm text-foreground/90 leading-relaxed">{v.primary_text}</p>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Description</p>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>

                    {/* CTA Preview */}
                    <div className="pt-2 border-t">
                      <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-2 rounded-md">
                        {v.cta_text}
                      </div>
                    </div>

                    {/* Char counts */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                      <span>Titre: {v.headline.length} chars</span>
                      <span>Texte: {v.primary_text.length} chars</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Creation Tools */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Générateur d'images IA</p>
              <p className="text-xs text-muted-foreground">Visuels produit optimisés</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
        </Card>
        <Card className="p-5 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Landing Pages IA</p>
              <p className="text-xs text-muted-foreground">Pages de vente optimisées</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
        </Card>
      </div>
    </div>
  );
}
