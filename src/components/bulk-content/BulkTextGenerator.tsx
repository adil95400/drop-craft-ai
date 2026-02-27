import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBulkContentGeneration } from '@/hooks/useBulkContentGeneration';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Sparkles, Database, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ContentType = 'description' | 'title' | 'seo' | 'bullet_points';

export function BulkTextGenerator() {
  const { createBulkJob, isCreatingJob } = useBulkContentGeneration();
  const { toast } = useToast();
  const [source, setSource] = useState<'catalog' | 'manual'>('catalog');
  const [manualList, setManualList] = useState('');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('fr');
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [contentTypes, setContentTypes] = useState<ContentType[]>(['description', 'title']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch products from catalog
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['bulk-text-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category, price, sku, stock_quantity')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const toggleContentType = (type: ContentType) => {
    setContentTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedProductIds(filteredProducts.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedProductIds([]);
  };

  const handleGenerate = () => {
    let productsToProcess: any[] = [];

    if (source === 'catalog') {
      if (selectedProductIds.length === 0) {
        toast({ title: 'Aucun produit sélectionné', variant: 'destructive' });
        return;
      }
      productsToProcess = products
        .filter(p => selectedProductIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          sku: p.sku,
        }));
    } else {
      const lines = manualList.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        toast({ title: 'Liste vide', variant: 'destructive' });
        return;
      }
      productsToProcess = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          name: parts[0] || '',
          description: parts[1] || '',
          category: parts[2] || '',
          features: parts[3] || '',
        };
      });
    }

    if (contentTypes.length === 0) {
      toast({ title: 'Sélectionnez au moins un type de contenu', variant: 'destructive' });
      return;
    }

    createBulkJob({
      jobType: 'descriptions' as any,
      inputData: {
        products: productsToProcess,
        contentTypes,
        tone,
        language,
        templatePrompt,
      }
    });
  };

  const contentTypeOptions: { key: ContentType; label: string; desc: string }[] = [
    { key: 'description', label: 'Description produit', desc: 'Description persuasive 150-250 mots' },
    { key: 'title', label: 'Titre optimisé', desc: 'Titre SEO accrocheur (70 car.)' },
    { key: 'seo', label: 'Métadonnées SEO', desc: 'Meta title, meta desc, mots-clés' },
    { key: 'bullet_points', label: 'Points clés', desc: '5-7 bénéfices produit' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Génération de Texte en Masse
        </h2>
        <p className="text-muted-foreground mt-1">
          Générez descriptions, titres et métadonnées SEO pour tous vos produits
        </p>
      </div>

      {/* Content types selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Types de contenu à générer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {contentTypeOptions.map(opt => (
              <label
                key={opt.key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  contentTypes.includes(opt.key) ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Checkbox
                  checked={contentTypes.includes(opt.key)}
                  onCheckedChange={() => toggleContentType(opt.key)}
                />
                <div>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source selection */}
      <div className="flex gap-2">
        <Button
          variant={source === 'catalog' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSource('catalog')}
        >
          <Database className="mr-2 h-4 w-4" />
          Depuis le catalogue
        </Button>
        <Button
          variant={source === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSource('manual')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Saisie manuelle
        </Button>
      </div>

      {source === 'catalog' ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sélectionner les produits</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Toutes catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={selectAll}>Tout</Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>Aucun</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredProducts.map(product => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedProductIds.includes(product.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.category || 'Sans catégorie'} • {product.price}€
                        {product.sku ? ` • ${product.sku}` : ''}
                      </span>
                    </div>
                  </label>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">Aucun produit trouvé</p>
                )}
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary">
                {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Label>Liste de produits (un par ligne)</Label>
          <Textarea
            value={manualList}
            onChange={(e) => setManualList(e.target.value)}
            placeholder={`Casque Audio Premium | Casque sans fil Bluetooth 5.3 | Électronique | ANC, 30h batterie
Montre Sport | Montre connectée étanche | Accessoires | GPS, cardio, 7 jours`}
            rows={8}
            className="font-mono text-sm mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: <code>Nom | Description | Catégorie | Caractéristiques</code> — {manualList.trim().split('\n').filter(l => l.trim()).length} produits
          </p>
        </div>
      )}

      {/* Generation settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Ton</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professionnel</SelectItem>
              <SelectItem value="casual">Décontracté</SelectItem>
              <SelectItem value="luxury">Luxe</SelectItem>
              <SelectItem value="enthusiastic">Enthousiaste</SelectItem>
              <SelectItem value="technical">Technique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Langue</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Instructions template (optionnel)</Label>
          <Textarea
            value={templatePrompt}
            onChange={(e) => setTemplatePrompt(e.target.value)}
            placeholder="Ex: Mets en avant le rapport qualité-prix..."
            rows={2}
            className="text-sm"
          />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isCreatingJob} size="lg" className="w-full">
        {isCreatingJob ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Lancement en cours...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Générer le contenu pour {source === 'catalog' ? selectedProductIds.length : manualList.trim().split('\n').filter(l => l.trim()).length} produits
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        💡 Le contenu généré est sauvegardé en brouillon. Retrouvez-le dans l'onglet "Jobs" et validez avant application.
      </p>
    </div>
  );
}
