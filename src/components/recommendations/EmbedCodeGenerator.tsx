import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Code, Copy, Check, ExternalLink, Palette, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedConfig {
  widgetType: 'similar' | 'bought_together' | 'bundle' | 'upsell';
  layout: 'grid' | 'carousel' | 'compact';
  maxItems: number;
  showPrice: boolean;
  showRating: boolean;
  primaryColor: string;
  borderRadius: number;
  title: string;
}

const DEFAULT_CONFIG: EmbedConfig = {
  widgetType: 'similar',
  layout: 'grid',
  maxItems: 4,
  showPrice: true,
  showRating: true,
  primaryColor: '#7c3aed',
  borderRadius: 12,
  title: 'Produits recommandés',
};

export function EmbedCodeGenerator() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EmbedConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('script');

  const shopId = 'YOUR_SHOP_ID';

  const scriptCode = `<!-- Drop Craft AI - Widget de recommandation -->
<div id="dc-reco-widget"
  data-widget="${config.widgetType}"
  data-layout="${config.layout}"
  data-max-items="${config.maxItems}"
  data-show-price="${config.showPrice}"
  data-show-rating="${config.showRating}"
  data-color="${config.primaryColor}"
  data-radius="${config.borderRadius}"
  data-title="${config.title}">
</div>
<script src="https://cdn.dropcraft.ai/widgets/v1/recommendations.js"
  data-shop-id="${shopId}"
  async>
</script>`;

  const liquidCode = `{% comment %}
  Drop Craft AI - Widget de recommandation
  Placez ce snippet dans product.liquid ou cart.liquid
{% endcomment %}

<div id="dc-reco-widget"
  data-widget="${config.widgetType}"
  data-layout="${config.layout}"
  data-max-items="${config.maxItems}"
  data-product-id="{{ product.id }}"
  data-collection-id="{{ collection.id }}"
  data-show-price="${config.showPrice}"
  data-show-rating="${config.showRating}"
  data-color="${config.primaryColor}"
  data-radius="${config.borderRadius}"
  data-title="${config.title}"
  data-currency="{{ cart.currency.iso_code }}">
</div>

{{ 'https://cdn.dropcraft.ai/widgets/v1/recommendations.js' | script_tag }}`;

  const reactCode = `import { RecommendationWidget } from '@dropcraft/react';

export function ProductPage({ productId }) {
  return (
    <RecommendationWidget
      shopId="${shopId}"
      productId={productId}
      widget="${config.widgetType}"
      layout="${config.layout}"
      maxItems={${config.maxItems}}
      showPrice={${config.showPrice}}
      showRating={${config.showRating}}
      primaryColor="${config.primaryColor}"
      borderRadius={${config.borderRadius}}
      title="${config.title}"
    />
  );
}`;

  const codes: Record<string, string> = { script: scriptCode, liquid: liquidCode, react: reactCode };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(codes[key]);
    setCopied(key);
    toast({ title: 'Code copié ✓', description: 'Collez-le dans votre boutique.' });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Paramètres du widget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Type de widget</Label>
              <Select value={config.widgetType} onValueChange={(v: any) => setConfig(c => ({ ...c, widgetType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="similar">Produits similaires</SelectItem>
                  <SelectItem value="bought_together">Achetés ensemble</SelectItem>
                  <SelectItem value="bundle">Offres groupées</SelectItem>
                  <SelectItem value="upsell">Up-sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disposition</Label>
              <Select value={config.layout} onValueChange={(v: any) => setConfig(c => ({ ...c, layout: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grille</SelectItem>
                  <SelectItem value="carousel">Carrousel</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titre</Label>
              <Input value={config.title} onChange={e => setConfig(c => ({ ...c, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Max produits</Label>
              <Input type="number" min={1} max={12} value={config.maxItems} onChange={e => setConfig(c => ({ ...c, maxItems: parseInt(e.target.value) || 4 }))} className="mt-1" />
            </div>
            <div>
              <Label>Couleur primaire</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="w-12 h-9 p-1 cursor-pointer" />
                <Input value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Rayon de bordure</Label>
              <Input type="number" min={0} max={24} value={config.borderRadius} onChange={e => setConfig(c => ({ ...c, borderRadius: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Switch checked={config.showPrice} onCheckedChange={v => setConfig(c => ({ ...c, showPrice: v }))} />
              <Label>Prix</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={config.showRating} onCheckedChange={v => setConfig(c => ({ ...c, showRating: v }))} />
              <Label>Note / avis</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Output */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code d'intégration
          </CardTitle>
          <CardDescription>Copiez et collez le code dans votre boutique</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="script">HTML / JS</TabsTrigger>
                <TabsTrigger value="liquid">Shopify Liquid</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>
              <Button size="sm" variant="outline" onClick={() => handleCopy(activeTab)}>
                {copied === activeTab ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied === activeTab ? 'Copié !' : 'Copier'}
              </Button>
            </div>

            {Object.entries(codes).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <pre className="bg-muted/50 border rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  <code>{code}</code>
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
