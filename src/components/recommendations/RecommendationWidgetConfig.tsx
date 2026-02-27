import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings, Layout, Palette, Zap, Target, ShoppingCart, Sparkles, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WidgetConfig {
  enabled: boolean;
  position: 'below_product' | 'sidebar' | 'cart_page' | 'checkout';
  maxItems: number;
  title: string;
  layout: 'grid' | 'carousel' | 'list';
  showPrice: boolean;
  showDiscount: boolean;
  confidenceThreshold: number;
}

interface StrategyConfig {
  cross_sell: { enabled: boolean; weight: number; minConfidence: number };
  upsell: { enabled: boolean; weight: number; minConfidence: number };
  bundle: { enabled: boolean; weight: number; minConfidence: number };
  similar: { enabled: boolean; weight: number; minConfidence: number };
  personalized: { enabled: boolean; weight: number; minConfidence: number };
}

const defaultWidget: WidgetConfig = {
  enabled: true,
  position: 'below_product',
  maxItems: 4,
  title: 'Produits recommandés',
  layout: 'grid',
  showPrice: true,
  showDiscount: true,
  confidenceThreshold: 60,
};

const defaultStrategies: StrategyConfig = {
  cross_sell: { enabled: true, weight: 30, minConfidence: 50 },
  upsell: { enabled: true, weight: 25, minConfidence: 60 },
  bundle: { enabled: true, weight: 20, minConfidence: 55 },
  similar: { enabled: true, weight: 15, minConfidence: 40 },
  personalized: { enabled: true, weight: 10, minConfidence: 70 },
};

const strategyInfo = {
  cross_sell: { label: 'Cross-sell', desc: 'Produits complémentaires souvent achetés ensemble', icon: Target, color: 'text-blue-500' },
  upsell: { label: 'Up-sell', desc: 'Versions premium ou supérieures du produit consulté', icon: Zap, color: 'text-amber-500' },
  bundle: { label: 'Bundles', desc: 'Offres groupées avec réduction pour paniers plus élevés', icon: ShoppingCart, color: 'text-emerald-500' },
  similar: { label: 'Similaires', desc: 'Produits de même catégorie ou caractéristiques proches', icon: Sparkles, color: 'text-purple-500' },
  personalized: { label: 'Personnalisé', desc: 'Basé sur l\'historique de navigation du client', icon: Sparkles, color: 'text-primary' },
};

export function RecommendationWidgetConfig() {
  const { toast } = useToast();
  const [widget, setWidget] = useState<WidgetConfig>(defaultWidget);
  const [strategies, setStrategies] = useState<StrategyConfig>(defaultStrategies);
  const [algorithm, setAlgorithm] = useState('hybrid');

  const totalWeight = Object.values(strategies).reduce((s, v) => s + (v.enabled ? v.weight : 0), 0);

  const handleSave = () => {
    if (totalWeight !== 100) {
      toast({ title: 'Poids total doit être 100%', description: `Actuellement: ${totalWeight}%`, variant: 'destructive' });
      return;
    }
    toast({ title: 'Configuration sauvegardée ✓', description: 'Les paramètres seront appliqués aux prochaines recommandations.' });
  };

  const handleReset = () => {
    setWidget(defaultWidget);
    setStrategies(defaultStrategies);
    setAlgorithm('hybrid');
    toast({ title: 'Configuration réinitialisée' });
  };

  return (
    <div className="space-y-6">
      {/* Algorithm selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Algorithme de recommandation
          </CardTitle>
          <CardDescription>Choisissez le moteur qui génère vos recommandations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { key: 'collaborative', label: 'Collaborative Filtering', desc: 'Basé sur les co-achats et le comportement utilisateur' },
              { key: 'content_based', label: 'Content-Based', desc: 'Basé sur les caractéristiques et attributs produits' },
              { key: 'hybrid', label: 'Hybride (recommandé)', desc: 'Combine collaborative filtering + IA pour les meilleurs résultats' },
            ].map(a => (
              <label
                key={a.key}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  algorithm === a.key ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setAlgorithm(a.key)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-3 w-3 rounded-full ${algorithm === a.key ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="font-semibold text-sm">{a.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pondération des stratégies
            <Badge variant={totalWeight === 100 ? 'default' : 'destructive'} className="ml-auto">
              {totalWeight}%
            </Badge>
          </CardTitle>
          <CardDescription>Ajustez le poids de chaque type de recommandation (total = 100%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(strategies) as [keyof StrategyConfig, StrategyConfig[keyof StrategyConfig]][]).map(([key, config]) => {
            const info = strategyInfo[key];
            const Icon = info.icon;
            return (
              <div key={key} className="flex items-center gap-4">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={v => setStrategies(s => ({ ...s, [key]: { ...s[key], enabled: v } }))}
                />
                <Icon className={`h-4 w-4 ${info.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{info.label}</span>
                    <span className="text-xs text-muted-foreground hidden md:inline">{info.desc}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Label className="text-xs text-muted-foreground w-16 shrink-0">Poids</Label>
                    <Slider
                      value={[config.weight]}
                      max={100}
                      step={5}
                      disabled={!config.enabled}
                      onValueChange={([v]) => setStrategies(s => ({ ...s, [key]: { ...s[key], weight: v } }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10 text-right">{config.weight}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Widget config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Configuration du widget
          </CardTitle>
          <CardDescription>Personnalisez l'affichage des recommandations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Widget activé</Label>
            <Switch checked={widget.enabled} onCheckedChange={v => setWidget(w => ({ ...w, enabled: v }))} />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre affiché</Label>
              <Input value={widget.title} onChange={e => setWidget(w => ({ ...w, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Position</Label>
              <Select value={widget.position} onValueChange={(v: any) => setWidget(w => ({ ...w, position: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="below_product">Sous le produit</SelectItem>
                  <SelectItem value="sidebar">Barre latérale</SelectItem>
                  <SelectItem value="cart_page">Page panier</SelectItem>
                  <SelectItem value="checkout">Checkout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disposition</Label>
              <Select value={widget.layout} onValueChange={(v: any) => setWidget(w => ({ ...w, layout: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grille</SelectItem>
                  <SelectItem value="carousel">Carrousel</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre max de produits</Label>
              <Input type="number" min={1} max={12} value={widget.maxItems} onChange={e => setWidget(w => ({ ...w, maxItems: parseInt(e.target.value) || 4 }))} className="mt-1" />
            </div>
          </div>
          <Separator />
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={widget.showPrice} onCheckedChange={v => setWidget(w => ({ ...w, showPrice: v }))} />
              <Label>Afficher le prix</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={widget.showDiscount} onCheckedChange={v => setWidget(w => ({ ...w, showDiscount: v }))} />
              <Label>Afficher les réductions</Label>
            </div>
          </div>
          <div>
            <Label>Seuil de confiance minimum: {widget.confidenceThreshold}%</Label>
            <Slider
              value={[widget.confidenceThreshold]}
              max={100}
              step={5}
              onValueChange={([v]) => setWidget(w => ({ ...w, confidenceThreshold: v }))}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Seules les recommandations avec un score ≥ {widget.confidenceThreshold}% seront affichées.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
