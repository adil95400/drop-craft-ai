import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Palette, Plus, ExternalLink, Download, Copy, Loader2,
  Image, Layers, RefreshCw, Wand2
} from 'lucide-react';

interface CanvaDesign {
  id: string;
  title: string;
  design_type: string;
  design_url?: string;
  thumbnail_url?: string;
  status: string;
  metadata?: any;
  created_at: string;
}

const AD_FORMATS = [
  { value: 'story', label: 'Story / Reel', dimensions: '1080×1920', icon: '📱' },
  { value: 'square', label: 'Carré (Feed)', dimensions: '1080×1080', icon: '⬜' },
  { value: 'landscape', label: 'Paysage (Banner)', dimensions: '1200×628', icon: '🖼️' },
  { value: 'banner', label: 'Bannière Display', dimensions: '728×90', icon: '📐' },
  { value: 'pinterest', label: 'Pinterest Pin', dimensions: '1000×1500', icon: '📌' },
];

export function AdsCanvaStudio() {
  const { toast } = useToast();
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [designTitle, setDesignTitle] = useState('');
  const [adFormat, setAdFormat] = useState('square');
  const [productName, setProductName] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    loadDesigns();
    loadProducts();
  }, []);

  const loadDesigns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('canva-create-design', {
        body: { action: 'list_designs' },
      });
      if (error) throw error;
      setDesigns(data?.designs || []);
    } catch (err) {
      // Silently fail if no designs
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_urls')
      .eq('user_id', user.id)
      .limit(30);
    setProducts(data || []);
  };

  const createDesign = async () => {
    if (!designTitle.trim() && !selectedProduct) {
      toast({ title: 'Saisissez un titre ou sélectionnez un produit', variant: 'destructive' });
      return;
    }
    setIsCreating(true);

    try {
      const product = products.find(p => p.id === selectedProduct);
      const { data, error } = await supabase.functions.invoke('canva-create-design', {
        body: product ? {
          action: 'create_from_product',
          productName: product.name,
          productPrice: product.price,
          productImage: product.image_urls?.[0],
          adFormat,
        } : {
          action: 'create_design',
          title: designTitle,
          designType: 'Whiteboard',
        },
      });

      if (error) throw error;

      if (data?.editUrl) {
        window.open(data.editUrl, '_blank');
        toast({ title: 'Design créé !', description: 'Canva s\'est ouvert dans un nouvel onglet' });
      } else {
        toast({ title: 'Design créé', description: 'ID: ' + data?.designId });
      }

      loadDesigns();
    } catch (err: any) {
      const isNotConnected = err.message?.includes('NO_CREDENTIALS') || err.message?.includes('No Canva');
      toast({
        title: isNotConnected ? 'Canva non connecté' : 'Erreur',
        description: isNotConnected
          ? 'Connectez votre compte Canva dans Paramètres > Intégrations'
          : err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const exportDesign = async (designId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('canva-create-design', {
        body: { action: 'export_design', designId, format: 'png' },
      });
      if (error) throw error;

      if (data?.urls?.length > 0) {
        window.open(data.urls[0], '_blank');
        toast({ title: 'Export prêt !', description: 'Téléchargement démarré' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur d\'export', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Design */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-5 w-5 text-primary" />
            Canva Studio
          </CardTitle>
          <CardDescription>
            Créez des visuels publicitaires professionnels avec Canva et synchronisez-les avec vos campagnes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Produit (optionnel)</label>
              <Select value={selectedProduct} onValueChange={v => {
                setSelectedProduct(v);
                const p = products.find(p => p.id === v);
                if (p) setDesignTitle(`Ad - ${p.name}`);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Titre du design</label>
              <Input
                placeholder="Mon visuel publicitaire"
                value={designTitle}
                onChange={e => setDesignTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Format</label>
              <Select value={adFormat} onValueChange={setAdFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_FORMATS.map(f => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.icon} {f.label} ({f.dimensions})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createDesign} disabled={isCreating} className="w-full" size="lg">
            {isCreating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création en cours…</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-2" />Créer dans Canva</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {AD_FORMATS.map(f => (
          <button
            key={f.value}
            onClick={() => setAdFormat(f.value)}
            className={cn(
              'p-4 rounded-xl border-2 text-center transition-all hover:shadow-md',
              adFormat === f.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            )}
          >
            <span className="text-2xl block mb-1">{f.icon}</span>
            <p className="font-medium text-xs">{f.label}</p>
            <p className="text-[10px] text-muted-foreground">{f.dimensions}</p>
          </button>
        ))}
      </div>

      {/* Existing Designs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-primary" />
              Mes designs ({designs.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadDesigns} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Aucun design Canva encore créé</p>
              <p className="text-xs text-muted-foreground mt-1">Créez votre premier visuel publicitaire ci-dessus</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {designs.map(design => (
                <Card key={design.id} className="overflow-hidden group hover:shadow-md transition-all">
                  {design.thumbnail_url ? (
                    <div className="aspect-video bg-muted relative">
                      <img src={design.thumbnail_url} alt={design.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {design.design_url && (
                          <Button size="sm" variant="secondary" onClick={() => window.open(design.design_url!, '_blank')}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Éditer
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => exportDesign(design.id)}>
                          <Download className="h-3.5 w-3.5 mr-1" />Export
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                      <Palette className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{design.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-[10px]">{design.design_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(design.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
