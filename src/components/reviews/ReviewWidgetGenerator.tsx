/**
 * Review Widget Generator - Génère du code embed pour afficher les avis
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Code, Copy, Star, Layout, Palette, Eye } from 'lucide-react';
import { toast } from 'sonner';

type WidgetStyle = 'grid' | 'carousel' | 'list' | 'badge' | 'stars-only';

export function ReviewWidgetGenerator() {
  const [style, setStyle] = useState<WidgetStyle>('grid');
  const [maxReviews, setMaxReviews] = useState(6);
  const [minRating, setMinRating] = useState(4);
  const [showPhotos, setShowPhotos] = useState(true);
  const [showVerified, setShowVerified] = useState(true);
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [darkMode, setDarkMode] = useState(false);

  const generateEmbedCode = () => {
    const config = JSON.stringify({
      style, maxReviews, minRating,
      showPhotos, showVerified, accentColor, darkMode,
    });

    return `<!-- ShopOpti+ Reviews Widget -->
<div id="shopopti-reviews" data-config='${config}'></div>
<script src="https://shopopti.io/widgets/reviews.js" async></script>`;
  };

  const generateCSSWidget = () => {
    const bg = darkMode ? '#1e293b' : '#ffffff';
    const text = darkMode ? '#f8fafc' : '#0f172a';
    const muted = darkMode ? '#94a3b8' : '#64748b';

    return `<style>
.so-reviews { font-family: system-ui, sans-serif; background: ${bg}; color: ${text}; padding: 24px; border-radius: 12px; }
.so-reviews-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.so-reviews-stars { color: #eab308; }
.so-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.so-review-card { border: 1px solid ${darkMode ? '#334155' : '#e2e8f0'}; border-radius: 8px; padding: 16px; }
.so-review-author { font-weight: 600; font-size: 14px; }
.so-review-text { color: ${muted}; font-size: 14px; margin-top: 8px; }
.so-review-verified { color: ${accentColor}; font-size: 12px; }
</style>

<div class="so-reviews">
  <div class="so-reviews-header">
    <span class="so-reviews-stars">★★★★★</span>
    <span style="font-weight: 700; font-size: 18px;">4.8/5</span>
    <span style="color: ${muted}; font-size: 14px;">basé sur 127 avis</span>
  </div>
  <div class="so-reviews-grid">
    <!-- Reviews dynamically loaded -->
    <div class="so-review-card">
      <div class="so-reviews-stars">★★★★★</div>
      <p class="so-review-author">Marie L.</p>
      <p class="so-review-text">Excellent produit, livraison rapide !</p>
      <span class="so-review-verified">✓ Achat vérifié</span>
    </div>
  </div>
</div>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copié dans le presse-papiers');
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Config Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Style d'affichage</Label>
              <Select value={style} onValueChange={v => setStyle(v as WidgetStyle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grille</SelectItem>
                  <SelectItem value="carousel">Carrousel</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                  <SelectItem value="badge">Badge compact</SelectItem>
                  <SelectItem value="stars-only">Étoiles seules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre max d'avis</Label>
              <Input type="number" value={maxReviews} onChange={e => setMaxReviews(Number(e.target.value))} min={1} max={50} />
            </div>
            <div>
              <Label>Note minimale</Label>
              <Select value={String(minRating)} onValueChange={v => setMinRating(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}+ étoiles</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Couleur d'accent</Label>
              <div className="flex gap-2">
                <Input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-12 h-9 p-0.5" />
                <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Photos</Label>
              <Switch checked={showPhotos} onCheckedChange={setShowPhotos} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Badge vérifié</Label>
              <Switch checked={showVerified} onCheckedChange={setShowVerified} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mode sombre</Label>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Preview & Code */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="h-5 w-5 text-warning fill-yellow-500" />
                    ))}
                  </div>
                  <span className="font-bold text-lg">4.8/5</span>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>127 avis</span>
                </div>
                <div className={`grid gap-3 ${style === 'list' ? 'grid-cols-1' : style === 'badge' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {[
                    { author: 'Marie L.', rating: 5, text: 'Excellent produit, je recommande !', verified: true },
                    { author: 'Thomas D.', rating: 5, text: 'Qualité top, livraison express.', verified: true },
                    { author: 'Sophie M.', rating: 4, text: 'Très bien dans l\'ensemble.', verified: false },
                  ].slice(0, style === 'badge' ? 1 : 3).map((r, i) => (
                    <div key={i} className={`p-3 rounded border ${darkMode ? 'border-slate-600' : 'border-border'}`}>
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-warning fill-yellow-500' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{r.author}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>{r.text}</p>
                      {showVerified && r.verified && (
                        <p className="text-xs mt-1" style={{ color: accentColor }}>✓ Achat vérifié</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />Code d'intégration
              </CardTitle>
              <CardDescription>Copiez ce code dans votre boutique</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="embed">
                <TabsList className="mb-3">
                  <TabsTrigger value="embed">Embed JS</TabsTrigger>
                  <TabsTrigger value="html">HTML/CSS</TabsTrigger>
                </TabsList>
                <TabsContent value="embed" className="space-y-2">
                  <Textarea readOnly value={generateEmbedCode()} rows={4} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => copyToClipboard(generateEmbedCode())}>
                    <Copy className="h-4 w-4" />Copier
                  </Button>
                </TabsContent>
                <TabsContent value="html" className="space-y-2">
                  <Textarea readOnly value={generateCSSWidget()} rows={10} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => copyToClipboard(generateCSSWidget())}>
                    <Copy className="h-4 w-4" />Copier
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
