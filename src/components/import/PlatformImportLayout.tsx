/**
 * PlatformImportLayout — Shared 4-tab import layout for all platforms
 * Matches the Shopify import standard: URL, Bulk, CSV, Options
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Link, Upload, Package, Zap, CheckCircle2, RefreshCw, Download,
  Star, TrendingUp, Globe, Search, Settings2, Clock, Layers,
  FileSpreadsheet, Image, Tag, Sparkles, Copy, ArrowRight, Tags
} from 'lucide-react';
import { useUrlImport } from '@/hooks/useUrlImport';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// ─── Platform config type ────────────────────────
export interface PlatformConfig {
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string; // e.g. '#FF9900' for Amazon
  urlPlaceholder: string;
  urlExamples?: string[];
  extractedData: string[];
  bonusData?: string[];
  stats: Array<{ label: string; value: string; icon: LucideIcon }>;
  /** Optional: marketplace selector */
  marketplaces?: Array<{ code: string; name: string; domain: string; flag: string }>;
  /** Optional: secondary ID field (ASIN, SKU, etc.) */
  secondaryId?: { label: string; placeholder: string; prefix: string };
}

// ─── Stats hook ──────────────────────────────────
function usePlatformStats(platformSlug: string) {
  return useQuery({
    queryKey: ['platform-import-stats', platformSlug],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, reviews: 0, lastImport: null };

      const [productsRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('id, created_at', { count: 'exact' })
          .eq('user_id', user.id).eq('source_type', platformSlug as any) as any,
        supabase.from('product_reviews').select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ]);

      return {
        total: productsRes.count || 0,
        reviews: reviewsRes.count || 0,
        lastImport: productsRes.data?.[0]?.created_at || null,
      };
    },
  });
}

// ─── Recent imports ──────────────────────────────
function useRecentImports(platformSlug: string) {
  return useQuery({
    queryKey: ['platform-recent-imports', platformSlug],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, name, image_url, price, status, created_at, brand, category')
        .eq('user_id', user.id)
        .eq('source_type', platformSlug as any)
        .order('created_at', { ascending: false })
        .limit(6) as any;
      return data || [];
    },
  });
}

// ─── Component ───────────────────────────────────
export default function PlatformImportLayout({ config }: { config: PlatformConfig }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [activeTab, setActiveTab] = useState('url');
  const [marketplace, setMarketplace] = useState(config.marketplaces?.[0]?.code || '');
  const [secondaryId, setSecondaryId] = useState('');

  const [importOptions, setImportOptions] = useState({
    importVariants: true,
    importReviews: true,
    importImages: true,
    importSEO: true,
    autoOptimize: false,
    priceMultiplier: 1.5,
    autoPublish: false,
  });

  const { handleImport, isImporting, progress, progressMessage, isSuccess, importResult, reset } = useUrlImport(config.name);
  const { data: stats } = usePlatformStats(config.slug);
  const { data: recentImports } = useRecentImports(config.slug);

  // ─── Secondary ID import (ASIN, SKU) ─────
  const handleSecondaryImport = () => {
    if (!secondaryId.trim() || !config.secondaryId) return;
    const selectedMp = config.marketplaces?.find(m => m.code === marketplace);
    const domain = selectedMp?.domain || '';
    handleImport(`${config.secondaryId.prefix.replace('{domain}', domain)}${secondaryId.trim()}`);
  };

  // ─── Bulk import ──────────────────────────
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, importing: false });

  const handleBulkImport = useCallback(async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0 && u.startsWith('http'));
    if (urls.length === 0) {
      toast.error('Aucune URL valide détectée');
      return;
    }
    setBulkProgress({ current: 0, total: urls.length, importing: true });
    let success = 0, failed = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('quick-import-url', {
          body: { url: urls[i], action: 'preview', price_multiplier: importOptions.priceMultiplier },
        });
        if (error || !data?.success) failed++;
        else success++;
      } catch { failed++; }
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
    }
    setBulkProgress(prev => ({ ...prev, importing: false }));
    if (success > 0) toast.success(`${success} produit(s) importé(s)${failed > 0 ? `, ${failed} erreur(s)` : ''}`);
    else toast.error(`Import échoué : ${failed} erreur(s)`);
  }, [bulkUrls, importOptions.priceMultiplier]);

  // ─── CSV import handler ───────────────────
  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const Papa = await import('papaparse');
    Papa.default.parse(file, {
      header: true,
      complete: (results) => {
        const urls = results.data
          .map((row: any) => row.url || row.URL || row.link || row.Link || '')
          .filter((u: string) => u.startsWith('http'));
        if (urls.length > 0) {
          setBulkUrls(urls.join('\n'));
          setActiveTab('bulk');
          toast.success(`${urls.length} URL(s) extraites du CSV`);
        } else {
          toast.error('Aucune colonne URL trouvée dans le CSV');
        }
      },
    });
  }, []);

  const copyExample = (example: string) => {
    setUrl(example);
    toast.success('URL copiée dans le champ');
  };

  const accentStyle = { color: config.color };
  const accentBg = { backgroundColor: `${config.color}15` };

  return (
    <ChannablePageWrapper
      title={`Import ${config.name}`}
      description={`Importez produits, variantes, avis et métadonnées depuis ${config.name}`}
      heroImage="import"
      badge={{ label: config.name, icon: config.icon }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/import/history')}>
            <Clock className="w-4 h-4 mr-2" />Historique
          </Button>
        </div>
      }
    >
      {/* ═══ Stats Dashboard ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: `Produits ${config.name}`, value: stats?.total?.toLocaleString() || '0', icon: Package, color: 'text-primary' },
          { label: 'Avis importés', value: stats?.reviews?.toLocaleString() || '0', icon: Star, color: 'text-warning' },
          { label: 'Dernier import', value: stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString('fr-FR') : 'Jamais', icon: Clock, color: 'text-muted-foreground' },
          { label: 'Import rapide', value: '<3s', icon: Zap, color: 'text-success' },
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
          <TabsTrigger value="url" className="gap-1.5"><Link className="w-3.5 h-3.5" />URL</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Masse</TabsTrigger>
          <TabsTrigger value="csv" className="gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" />CSV</TabsTrigger>
          <TabsTrigger value="options" className="gap-1.5"><Settings2 className="w-3.5 h-3.5" />Options</TabsTrigger>
        </TabsList>

        {/* ─── Tab: URL Import ─── */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="w-5 h-5" style={accentStyle} />
                Import par URL {config.name}
              </CardTitle>
              <CardDescription>
                Collez l'URL d'un produit {config.name}. Variantes, images, avis et SEO sont automatiquement extraits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {config.marketplaces && (
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {config.marketplaces.map((mp) => (
                        <SelectItem key={mp.code} value={mp.code}>
                          <span className="flex items-center gap-2"><span>{mp.flag}</span><span>{mp.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={config.urlPlaceholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleImport(url)}
                  />
                </div>
                <Button onClick={() => handleImport(url)} disabled={isImporting || !url.trim()} style={{ backgroundColor: config.color, color: '#fff' }} className="hover:opacity-90">
                  {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Importer
                </Button>
              </div>

              {/* Secondary ID (ASIN, SKU) */}
              {config.secondaryId && (
                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">{config.secondaryId.label} :</Label>
                  <Input
                    placeholder={config.secondaryId.placeholder}
                    value={secondaryId}
                    onChange={(e) => setSecondaryId(e.target.value)}
                    className="flex-1 max-w-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleSecondaryImport()}
                  />
                  <Button variant="outline" size="sm" onClick={handleSecondaryImport} disabled={isImporting}>
                    <Download className="w-4 h-4 mr-1" />Importer
                  </Button>
                </div>
              )}

              {/* Progress */}
              <AnimatePresence>
                {isImporting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{progressMessage || 'Import en cours...'}</p>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {isSuccess && importResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">Import réussi !</span>
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
              <div className="rounded-lg p-4" style={accentBg}>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={accentStyle} />
                  Données extraites automatiquement :
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {config.extractedData.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example URLs */}
              {config.urlExamples && config.urlExamples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exemples d'URL supportées</p>
                  {config.urlExamples.map(example => (
                    <button key={example} onClick={() => copyExample(example)} className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50 group">
                      <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <code className="text-xs">{example}</code>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Bulk Import ─── */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5" style={accentStyle} />
                Import en masse
              </CardTitle>
              <CardDescription>
                Collez plusieurs URLs de produits {config.name} (une par ligne) pour les importer tous en une seule fois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`${config.urlPlaceholder}\n${config.urlPlaceholder.replace(/product.*/, 'product-2')}\n${config.urlPlaceholder.replace(/product.*/, 'product-3')}`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {bulkUrls.split('\n').filter(u => u.trim()).length} URL(s) détectée(s)
                </p>
                <Button onClick={handleBulkImport} disabled={bulkProgress.importing || !bulkUrls.trim()} style={{ backgroundColor: config.color, color: '#fff' }} className="hover:opacity-90">
                  {bulkProgress.importing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Importer tout
                </Button>
              </div>

              {bulkProgress.importing && (
                <div className="space-y-2">
                  <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {bulkProgress.current} / {bulkProgress.total} traité(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: CSV Import ─── */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5" style={accentStyle} />
                Import CSV
              </CardTitle>
              <CardDescription>
                Importez un fichier CSV contenant des URLs de produits {config.name} ou des données produits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Déposez votre fichier CSV ici</p>
                <p className="text-xs text-muted-foreground mb-4">Format accepté : .csv avec colonnes URL, titre, prix, etc.</p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span><Upload className="w-4 h-4 mr-2" />Choisir un fichier</span>
                  </Button>
                </label>
              </div>

              <div className="rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Colonnes supportées :</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['url / URL', 'name / title', 'price / prix', 'sku / SKU', 'category', 'brand', 'image_url', 'description'].map(col => (
                    <code key={col} className="text-xs bg-background px-2 py-1 rounded border">{col}</code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Options ─── */}
        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="w-5 h-5" style={accentStyle} />
                Options d'import
              </CardTitle>
              <CardDescription>
                Configurez le comportement par défaut de l'import {config.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'importVariants' as const, icon: Layers, label: 'Importer les variantes', desc: 'Couleurs, tailles, options' },
                  { key: 'importReviews' as const, icon: Star, label: 'Importer les avis', desc: 'Notes et commentaires clients' },
                  { key: 'importImages' as const, icon: Image, label: 'Importer les images', desc: 'Images HD du produit' },
                  { key: 'importSEO' as const, icon: Globe, label: 'Données SEO', desc: 'Meta title, description, tags' },
                  { key: 'autoOptimize' as const, icon: Sparkles, label: 'Auto-optimisation IA', desc: 'Optimiser titres et descriptions' },
                  { key: 'autoPublish' as const, icon: Upload, label: 'Publication automatique', desc: 'Publier directement après import' },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-muted rounded-md"><opt.icon className="w-4 h-4 text-primary" /></div>
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

              {/* Price multiplier */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Multiplicateur de prix</p>
                    <p className="text-xs text-muted-foreground">Marge appliquée au prix fournisseur</p>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">×{importOptions.priceMultiplier.toFixed(1)}</Badge>
                </div>
                <Slider
                  value={[importOptions.priceMultiplier]}
                  onValueChange={([v]) => setImportOptions(prev => ({ ...prev, priceMultiplier: v }))}
                  min={1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>×1.0 (coûtant)</span>
                  <span>×2.5 (recommandé)</span>
                  <span>×5.0 (premium)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ Recent imports ═══ */}
      {recentImports && recentImports.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Derniers imports {config.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/import/history')}>
                Voir tout <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recentImports.map((product: any) => (
                <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.price ? `${product.price} €` : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Platform stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {config.stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={accentBg}><stat.icon className="w-5 h-5" style={accentStyle} /></div>
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
    </ChannablePageWrapper>
  );
}
