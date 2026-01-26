/**
 * FeedURLImporter - Import universel par URL de flux
 * Supporte CSV (Shopify), XML, JSON avec détection automatique
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, 
  Search, 
  FileSpreadsheet, 
  FileCode, 
  FileJson, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  XCircle,
  Zap,
  Settings,
  Clock
} from 'lucide-react';

interface FeedURLImporterProps {
  onImportComplete?: (result: { success: boolean; count: number; jobId?: string }) => void;
  className?: string;
}

interface PreviewData {
  success: boolean;
  format: 'csv' | 'json' | 'xml';
  total_products: number;
  sample_products: any[];
  columns_detected: string[];
  content_preview: string;
  parse_error?: string;
  preset_applied: string;
}

const PRESETS = [
  { value: 'auto', label: 'Auto-détection', icon: Sparkles },
  { value: 'shopify', label: 'Shopify CSV', icon: FileSpreadsheet },
  { value: 'matterhorn', label: 'Matterhorn', icon: Package },
  { value: 'google', label: 'Google Shopping', icon: FileCode },
  { value: 'custom', label: 'Personnalisé', icon: Settings },
];

const FORMAT_ICONS: Record<string, React.ElementType> = {
  csv: FileSpreadsheet,
  json: FileJson,
  xml: FileCode,
};

const FORMAT_COLORS: Record<string, string> = {
  csv: 'text-green-500 bg-green-500/10',
  json: 'text-blue-500 bg-blue-500/10',
  xml: 'text-purple-500 bg-purple-500/10',
};

export function FeedURLImporter({ onImportComplete, className }: FeedURLImporterProps) {
  const { toast } = useToast();
  
  // State
  const [feedUrl, setFeedUrl] = useState('');
  const [preset, setPreset] = useState('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'complete'>('input');

  // Analyze the feed URL
  const handleAnalyze = useCallback(async () => {
    if (!feedUrl.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer une URL de flux", variant: "destructive" });
      return;
    }

    try {
      new URL(feedUrl);
    } catch {
      toast({ title: "URL invalide", description: "Veuillez entrer une URL valide", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setPreviewData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Non connecté", description: "Veuillez vous connecter", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('feed-url-import', {
        body: { feedUrl, mode: 'preview', preset }
      });

      if (error) throw error;

      setPreviewData(data);
      setStep('preview');

      if (data.success) {
        toast({
          title: "Analyse terminée",
          description: `${data.total_products} produits détectés (format ${data.format.toUpperCase()})`,
        });
      } else {
        toast({
          title: "Attention",
          description: data.parse_error || "Aucun produit détecté",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Analyze error:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser le flux",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [feedUrl, preset, toast]);

  // Import products
  const handleImport = useCallback(async () => {
    if (!previewData?.success) return;

    setIsImporting(true);
    setStep('importing');
    setImportProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non connecté');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('feed-url-import', {
        body: { feedUrl, mode: 'import', preset }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setImportProgress(100);
      setImportResult(data);
      setStep('complete');

      if (data.success) {
        toast({
          title: "Import réussi !",
          description: `${data.data.products_imported} produits importés avec succès`,
        });
        onImportComplete?.({ 
          success: true, 
          count: data.data.products_imported,
          jobId: data.data.job_id 
        });
      } else {
        throw new Error(data.error || "L'import a échoué");
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: error.message || "L'import a échoué",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  }, [feedUrl, preset, previewData, toast, onImportComplete]);

  // Reset
  const handleReset = useCallback(() => {
    setFeedUrl('');
    setPreviewData(null);
    setImportResult(null);
    setImportProgress(0);
    setStep('input');
  }, []);

  // Render format badge
  const renderFormatBadge = (format: string) => {
    const Icon = FORMAT_ICONS[format] || FileCode;
    const colorClass = FORMAT_COLORS[format] || 'text-gray-500 bg-gray-500/10';
    
    return (
      <Badge className={`${colorClass} gap-1`}>
        <Icon className="w-3 h-3" />
        {format.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Import par URL Feed</CardTitle>
              <CardDescription>
                Importez des produits depuis CSV, XML ou JSON via URL directe
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600">
            <Zap className="w-3 h-3 mr-1" />
            Universel
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <label className="text-sm font-medium">URL du flux</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/products.csv ou .xml ou .json"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <p.icon className="w-4 h-4" />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={!feedUrl.trim() || isAnalyzing}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyser le flux
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  CSV / Shopify
                </div>
                <div className="flex items-center gap-1">
                  <FileCode className="w-4 h-4 text-purple-500" />
                  XML / RSS
                </div>
                <div className="flex items-center gap-1">
                  <FileJson className="w-4 h-4 text-blue-500" />
                  JSON / API
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && previewData && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  {renderFormatBadge(previewData.format)}
                  <div>
                    <p className="font-medium">{previewData.total_products} produits détectés</p>
                    <p className="text-sm text-muted-foreground">
                      {previewData.columns_detected.length} colonnes • Preset: {previewData.preset_applied}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nouveau flux
                </Button>
              </div>

              {previewData.parse_error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Attention</AlertTitle>
                  <AlertDescription>{previewData.parse_error}</AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              {previewData.sample_products.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">Aperçu des produits</span>
                      <Badge variant="outline">{previewData.sample_products.length} premiers</Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">#</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Catégorie</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.sample_products.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {product.name || product.title || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {product.sku || product.variant_sku || '-'}
                            </TableCell>
                            <TableCell>
                              {product.price || product.variant_price ? 
                                `${parseFloat(product.price || product.variant_price || 0).toFixed(2)} €` : '-'}
                            </TableCell>
                            <TableCell>
                              {product.stock_quantity || product.variant_inventory_qty || '0'}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {product.category || product.product_type || product.type || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Detected columns */}
              <Tabs defaultValue="columns">
                <TabsList>
                  <TabsTrigger value="columns">Colonnes détectées</TabsTrigger>
                  <TabsTrigger value="raw">Contenu brut</TabsTrigger>
                </TabsList>
                <TabsContent value="columns" className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {previewData.columns_detected.slice(0, 20).map(col => (
                      <Badge key={col} variant="outline" className="font-mono text-xs">
                        {col}
                      </Badge>
                    ))}
                    {previewData.columns_detected.length > 20 && (
                      <Badge variant="secondary">
                        +{previewData.columns_detected.length - 20} autres
                      </Badge>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="raw" className="mt-3">
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px] font-mono">
                    {previewData.content_preview}
                  </pre>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!previewData.success || previewData.total_products === 0}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Importer {previewData.total_products} produits
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-8"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Import en cours...</h3>
                  <p className="text-muted-foreground">
                    {previewData?.total_products} produits en cours de traitement
                  </p>
                </div>
              </div>
              <Progress value={importProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {importProgress}% - Veuillez patienter...
              </p>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && importResult && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-6"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-green-600">Import terminé !</h3>
                  <p className="text-muted-foreground">
                    {importResult.data?.products_imported} produits importés avec succès
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.data?.products_imported || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Importés</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {importResult.data?.total_processed || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.data?.errors || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              </div>

              {/* Error details */}
              {importResult.data?.error_details?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Erreurs rencontrées</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {importResult.data.error_details.slice(0, 5).map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Nouveau import
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.location.href = '/products/import/manage'}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Voir les produits
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default FeedURLImporter;
