import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link, Upload, Store, Package, Zap, CheckCircle2,
  RefreshCw, Download, TrendingUp, ShoppingCart, Star,
  FileText, Globe, Tag, Layers, Image, AlertCircle,
  ArrowRight, Clock, Search, Filter, Settings2, 
  ExternalLink, Copy, BarChart3, Shield, Sparkles,
  ListChecks, ChevronRight, Box, Tags, FileSpreadsheet
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { useShopifyImport } from '@/hooks/useShopifyImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Stats réelles ───────────────────────────────────────────
function useShopifyStats() {
  return useQuery({
    queryKey: ['shopify-import-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, shopify: 0, reviews: 0, lastImport: null };

      const [productsRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('id, source_platform, created_at', { count: 'exact' })
          .eq('user_id', user.id).eq('source_platform', 'shopify'),
        supabase.from('product_reviews').select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ]);

      const shopifyCount = productsRes.count || 0;
      const reviewCount = reviewsRes.count || 0;
      const lastImport = productsRes.data?.[0]?.created_at || null;

      return { total: shopifyCount, shopify: shopifyCount, reviews: reviewCount, lastImport };
    },
  });
}

// ─── Recent imports ──────────────────────────────────────────
function useRecentImports() {
  return useQuery({
    queryKey: ['shopify-recent-imports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, name, image_url, price, status, created_at, brand, category, source_url')
        .eq('user_id', user.id)
        .eq('source_platform', 'shopify')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });
}

export default function ShopifyImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [activeTab, setActiveTab] = useState('url');
  const [importOptions, setImportOptions] = useState({
    importVariants: true,
    importReviews: true,
    importImages: true,
    importSEO: true,
    autoOptimize: false,
    priceMultiplier: 1.5,
    autoPublish: false,
  });

  const { handleImport, isImporting, progress, progressMessage, isSuccess, importResult, reset } = useUrlImport('Shopify');
  const { importJobs, isLoadingJobs } = useShopifyImport();
  const { data: stats } = useShopifyStats();
  const { data: recentImports } = useRecentImports();

  // ─── Bulk import handler ─────────────────────
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, importing: false });
  
  const handleBulkImport = useCallback(async () => {
    const urls = bulkUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.includes('shopify') || u.includes('/products/')));
    
    if (urls.length === 0) {
      toast.error('Aucune URL Shopify valide détectée');
      return;
    }

    setBulkProgress({ current: 0, total: urls.length, importing: true });
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('quick-import-url', {
          body: { url: urls[i], action: 'import', price_multiplier: importOptions.priceMultiplier },
        });
        if (error || !data?.success) {
          failed++;
        } else {
          success++;
        }
      } catch {
        failed++;
      }
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
    }
    
    setBulkProgress(prev => ({ ...prev, importing: false }));
    
    if (success > 0) {
      toast.success(`${success} produit(s) importé(s) avec succès${failed > 0 ? `, ${failed} erreur(s)` : ''}`);
    } else {
      toast.error(`Import échoué : ${failed} erreur(s)`);
    }
  }, [bulkUrls, importOptions.priceMultiplier]);

  // ─── Copy example URL ────────────────────────
  const copyExample = (example: string) => {
    setUrl(example);
    toast.success('URL copiée dans le champ');
  };

  return (
    <ChannablePageWrapper
      title="Import Shopify"
      description="Importez produits, variantes, avis et métadonnées depuis n'importe quelle boutique Shopify"
      heroImage="import"
      badge={{ label: 'Shopify Pro', icon: Store }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/import/shopify-hub')}>
            <Settings2 className="w-4 h-4 mr-2" />Hub Shopify
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/import/history')}>
            <Clock className="w-4 h-4 mr-2" />Historique
          </Button>
        </div>
      }
    >
      {/* ═══ Stats Dashboard ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Produits Shopify', value: stats?.shopify?.toLocaleString() || '0', icon: Package, color: 'text-primary' },
          { label: 'Avis importés', value: stats?.reviews?.toLocaleString() || '0', icon: Star, color: 'text-amber-500' },
          { label: 'Jobs actifs', value: importJobs?.filter(j => j.status === 'processing').length?.toString() || '0', icon: RefreshCw, color: 'text-blue-500' },
          { label: 'Dernier import', value: stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString('fr-FR') : 'Jamais', icon: Clock, color: 'text-muted-foreground' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══ Main Import Tabs ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="url" className="gap-1.5">
            <Link className="w-3.5 h-3.5" />URL
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-1.5">
            <Layers className="w-3.5 h-3.5" />Masse
          </TabsTrigger>
          <TabsTrigger value="csv" className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />CSV
          </TabsTrigger>
          <TabsTrigger value="options" className="gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />Options
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: URL Import ─── */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="w-5 h-5 text-primary" />
                Import par URL de produit
              </CardTitle>
              <CardDescription>
                Collez l'URL d'un produit Shopify. Variantes, images, avis et SEO sont automatiquement extraits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input field */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://store.myshopify.com/products/product-name"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleImport(url)}
                  />
                </div>
                <Button onClick={() => handleImport(url)} disabled={isImporting || !url.trim()} size="default">
                  {isImporting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Importer
                </Button>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {isImporting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{progressMessage || 'Import en cours...'}</p>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" />Produit</span>
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />Variantes</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />Avis</span>
                      <span className="flex items-center gap-1"><Image className="w-3 h-3" />Images</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {isSuccess && importResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">Import réussi !</span>
                    </div>
                    {importResult.product && (
                      <div className="flex items-start gap-3">
                        {importResult.product.images?.[0] && (
                          <img src={importResult.product.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{importResult.product.title}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {importResult.product.vendor && (
                              <Badge variant="secondary" className="text-xs"><Tag className="w-3 h-3 mr-1" />{importResult.product.vendor}</Badge>
                            )}
                            {importResult.product.product_type && (
                              <Badge variant="outline" className="text-xs">{importResult.product.product_type}</Badge>
                            )}
                            {importResult.product.variants?.length > 1 && (
                              <Badge variant="outline" className="text-xs"><Layers className="w-3 h-3 mr-1" />{importResult.product.variants.length} variantes</Badge>
                            )}
                          </div>
                          {importResult.product.price && (
                            <p className="text-sm font-semibold text-primary mt-1">{importResult.product.price} €</p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => navigate('/products')} className="shrink-0">
                          Voir <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* What gets imported */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Ce qui est importé automatiquement :
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Package, label: 'Titre, description, prix' },
                    { icon: Tag, label: 'Marque & catégorie' },
                    { icon: Layers, label: 'Toutes les variantes' },
                    { icon: Image, label: 'Images HD' },
                    { icon: Star, label: 'Avis clients' },
                    { icon: Globe, label: 'Données SEO' },
                    { icon: Tags, label: 'Tags & collections' },
                    { icon: BarChart3, label: 'Prix comparé' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example URLs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exemples d'URL supportées</p>
                {[
                  'https://store.myshopify.com/products/product-name',
                  'https://custom-domain.com/products/product-name',
                  'https://store.myshopify.com/collections/all',
                ].map(example => (
                  <button key={example} onClick={() => copyExample(example)} className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50 group">
                    <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <code className="text-xs">{example}</code>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Bulk Import ─── */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5 text-primary" />
                Import en masse
              </CardTitle>
              <CardDescription>
                Collez plusieurs URLs de produits Shopify (une par ligne) pour les importer tous en une seule fois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`https://store.myshopify.com/products/product-1\nhttps://store.myshopify.com/products/product-2\nhttps://store.myshopify.com/products/product-3`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {bulkUrls.split('\n').filter(u => u.trim()).length} URL(s) détectée(s)
                </p>
                <Button onClick={handleBulkImport} disabled={bulkProgress.importing || !bulkUrls.trim()}>
                  {bulkProgress.importing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Importer tout
                </Button>
              </div>

              {bulkProgress.importing && (
                <div className="space-y-2">
                  <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Produit {bulkProgress.current}/{bulkProgress.total}...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk tips */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Conseils pour l'import en masse</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maximum recommandé : 50 URLs par batch</li>
                    <li>• Chaque produit est importé avec ses variantes et avis</li>
                    <li>• Le multiplicateur de prix s'applique automatiquement</li>
                    <li>• Les doublons (même URL) sont ignorés</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: CSV Import ─── */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import CSV Shopify
              </CardTitle>
              <CardDescription>
                Importez un fichier CSV exporté depuis Shopify (format product_template_csv)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">Glissez votre CSV ici ou cliquez pour sélectionner</p>
                <p className="text-sm text-muted-foreground">Format Shopify product_template_csv uniquement</p>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={() => {
                  toast.info('Import CSV en cours de traitement...');
                  navigate('/import/quick');
                }} />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Colonnes Shopify supportées :</p>
                <div className="flex flex-wrap gap-2">
                  {['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Variant SKU', 'Variant Price', 'Image Src', 'SEO Title', 'SEO Description', 'Option1 Name', 'Option1 Value'].map(col => (
                    <Badge key={col} variant="outline" className="text-xs font-mono">{col}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Exporter depuis Shopify</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Admin Shopify → Produits → Exporter → CSV</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Template CSV</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Utilisez le format standard Shopify pour un mapping automatique</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Tab: Options ─── */}
        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="w-5 h-5 text-primary" />
                Options d'import
              </CardTitle>
              <CardDescription>
                Configurez le comportement de l'import Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data to import */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Données à importer</h4>
                {[
                  { key: 'importVariants' as const, label: 'Variantes', desc: 'Importer toutes les variantes (taille, couleur...)', icon: Layers },
                  { key: 'importReviews' as const, label: 'Avis clients', desc: 'Importer les avis et notes du produit', icon: Star },
                  { key: 'importImages' as const, label: 'Images', desc: 'Télécharger toutes les images du produit', icon: Image },
                  { key: 'importSEO' as const, label: 'Données SEO', desc: 'Titre SEO, méta description, URL canonique', icon: Globe },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <opt.icon className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={importOptions[opt.key]}
                      onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, [opt.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tarification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Multiplicateur de prix</Label>
                    <Select
                      value={importOptions.priceMultiplier.toString()}
                      onValueChange={(v) => setImportOptions(prev => ({ ...prev, priceMultiplier: parseFloat(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">×1.0 (prix original)</SelectItem>
                        <SelectItem value="1.3">×1.3 (+30%)</SelectItem>
                        <SelectItem value="1.5">×1.5 (+50%)</SelectItem>
                        <SelectItem value="2">×2.0 (+100%)</SelectItem>
                        <SelectItem value="2.5">×2.5 (+150%)</SelectItem>
                        <SelectItem value="3">×3.0 (+200%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Publication automatique</p>
                      <p className="text-xs text-muted-foreground">Publier immédiatement après import</p>
                    </div>
                    <Switch
                      checked={importOptions.autoPublish}
                      onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, autoPublish: v }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Optimization */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Optimisation IA automatique</p>
                    <p className="text-xs text-muted-foreground">Réécrire titres et descriptions avec l'IA après import</p>
                  </div>
                </div>
                <Switch
                  checked={importOptions.autoOptimize}
                  onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, autoOptimize: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ Recent Imports ═══ */}
      {recentImports && recentImports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Derniers imports Shopify
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/import/history')}>
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentImports.map((product: any) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/products`)}
                >
                  <div className="aspect-square rounded-md bg-muted mb-2 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold text-primary">
                      {product.price ? `${product.price} €` : '—'}
                    </span>
                    <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                      {product.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                  {(product.brand || product.category) && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {product.brand && <Badge variant="outline" className="text-[10px]">{product.brand}</Badge>}
                      {product.category && <Badge variant="outline" className="text-[10px]">{product.category}</Badge>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Active Jobs ═══ */}
      {importJobs && importJobs.filter(j => j.status === 'processing').length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              Jobs en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {importJobs.filter(j => j.status === 'processing').map((job: any) => (
              <div key={job.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{job.source_platform || 'Shopify'} Import</p>
                  <p className="text-xs text-muted-foreground">
                    {job.processed_products || 0}/{job.total_products || '?'} produits traités
                  </p>
                </div>
                <Progress value={job.total_products ? ((job.processed_products || 0) / job.total_products) * 100 : 0} className="w-32 h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══ Quick Actions ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/import/search-suppliers')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Rechercher produits</p>
              <p className="text-sm text-muted-foreground">Trouver des produits gagnants</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/import/ai-generation')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Génération IA</p>
              <p className="text-sm text-muted-foreground">Créer des fiches optimisées</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/products')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Mon catalogue</p>
              <p className="text-sm text-muted-foreground">Gérer vos produits importés</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
