// IMPORT CSV INTELLIGENT
// Validation robuste, prévisualisation, gestion des erreurs
import { memo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  X,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface ParsedProduct {
  row: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
}

interface SmartCSVImportProps {
  onImportComplete: () => void;
}

// Règles de validation
const REQUIRED_FIELDS = ['name'];
const NUMERIC_FIELDS = ['price', 'compare_at_price', 'stock_quantity', 'weight'];
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

export const SmartCSVImport = memo(({ onImportComplete }: SmartCSVImportProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation d'un produit
  const validateProduct = useCallback((data: Record<string, any>, row: number): ParsedProduct => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Champs requis
    REQUIRED_FIELDS.forEach(field => {
      if (!data[field] || String(data[field]).trim() === '') {
        errors.push(`Champ "${field}" manquant`);
      }
    });

    // Validation du nom
    if (data.name && String(data.name).length > MAX_NAME_LENGTH) {
      errors.push(`Nom trop long (max ${MAX_NAME_LENGTH} caractères)`);
    }

    // Validation de la description
    if (data.description && String(data.description).length > MAX_DESCRIPTION_LENGTH) {
      warnings.push(`Description tronquée (max ${MAX_DESCRIPTION_LENGTH} caractères)`);
    }

    // Validation des champs numériques
    NUMERIC_FIELDS.forEach(field => {
      if (data[field] !== undefined && data[field] !== '') {
        const value = parseFloat(String(data[field]).replace(',', '.').replace('€', '').trim());
        if (isNaN(value)) {
          errors.push(`"${field}" doit être un nombre`);
        } else if (value < 0) {
          errors.push(`"${field}" ne peut pas être négatif`);
        }
      }
    });

    // Prix à 0 = warning
    if (data.price && parseFloat(String(data.price).replace(',', '.')) === 0) {
      warnings.push('Prix à 0€');
    }

    // URL image
    if (data.image_url && !isValidUrl(data.image_url)) {
      warnings.push('URL image invalide');
    }

    // SKU unique (sera vérifié côté serveur)
    if (data.sku && String(data.sku).length < 3) {
      warnings.push('SKU trop court');
    }

    return {
      row,
      data,
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }, []);

  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Parse le fichier CSV
  const parseFile = useCallback(async (file: File): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normaliser les headers (Handle, Title -> name, etc.)
          const mappings: Record<string, string> = {
            'handle': 'handle',
            'title': 'name',
            'name': 'name',
            'body (html)': 'description',
            'body_html': 'description',
            'description': 'description',
            'vendor': 'vendor',
            'type': 'category',
            'product_type': 'category',
            'category': 'category',
            'tags': 'tags',
            'published': 'status',
            'status': 'status',
            'option1 name': 'option1_name',
            'option1 value': 'option1_value',
            'option2 name': 'option2_name',
            'option2 value': 'option2_value',
            'variant sku': 'sku',
            'sku': 'sku',
            'variant price': 'price',
            'price': 'price',
            'variant compare at price': 'compare_at_price',
            'compare_at_price': 'compare_at_price',
            'variant inventory qty': 'stock_quantity',
            'stock_quantity': 'stock_quantity',
            'inventory_quantity': 'stock_quantity',
            'variant weight': 'weight',
            'weight': 'weight',
            'image src': 'image_url',
            'image_url': 'image_url',
            'image alt text': 'image_alt',
            'seo title': 'seo_title',
            'seo description': 'seo_description',
          };
          const normalized = header.toLowerCase().trim();
          return mappings[normalized] || normalized;
        },
        complete: (results) => {
          const products = results.data.map((row: any, index: number) => 
            validateProduct(row, index + 2) // +2 car header = ligne 1
          );
          resolve(products);
        },
        error: (error) => {
          reject(new Error(`Erreur de parsing: ${error.message}`));
        }
      });
    });
  }, [validateProduct]);

  // Gestion du fichier
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Format invalide', { description: 'Seuls les fichiers CSV sont acceptés' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      toast.error('Fichier trop volumineux', { description: 'Maximum 10MB' });
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    setParsedProducts([]);
    setStats(null);

    try {
      const products = await parseFile(file);
      
      const newStats: ImportStats = {
        total: products.length,
        valid: products.filter(p => p.isValid).length,
        invalid: products.filter(p => !p.isValid).length,
        warnings: products.filter(p => p.warnings.length > 0).length
      };

      setParsedProducts(products);
      setStats(newStats);
      setShowPreview(true);

      if (newStats.invalid > 0) {
        toast.warning(`${newStats.invalid} produit(s) avec erreurs`, {
          description: 'Corrigez les erreurs avant l\'import'
        });
      } else {
        toast.success(`${newStats.valid} produit(s) prêts à importer`);
      }
    } catch (error) {
      toast.error('Erreur d\'analyse', {
        description: error instanceof Error ? error.message : 'Fichier invalide'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [parseFile]);

  // Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Import des produits valides
  const handleImport = async () => {
    const validProducts = parsedProducts.filter(p => p.isValid);
    if (validProducts.length === 0) {
      toast.error('Aucun produit valide à importer');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const toastId = toast.loading(`Import de ${validProducts.length} produit(s)...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let imported = 0;
      let errors = 0;
      const batchSize = 50;
      const batches = Math.ceil(validProducts.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batch = validProducts.slice(i * batchSize, (i + 1) * batchSize);
        
        const productsToInsert = batch.map(p => ({
          user_id: user.id,
          name: String(p.data.name || '').trim().slice(0, MAX_NAME_LENGTH),
          description: String(p.data.description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH),
          price: parseFloat(String(p.data.price || '0').replace(',', '.').replace('€', '')) || 0,
          compare_at_price: p.data.compare_at_price 
            ? parseFloat(String(p.data.compare_at_price).replace(',', '.').replace('€', '')) 
            : null,
          sku: p.data.sku || null,
          category: p.data.category || null,
          vendor: p.data.vendor || null,
          stock_quantity: parseInt(String(p.data.stock_quantity || '0')) || 0,
          image_url: p.data.image_url || null,
          status: p.data.status === 'false' || p.data.status === 'inactive' ? 'inactive' : 'active',
          handle: p.data.handle || null,
          tags: p.data.tags || null
        }));

        const { error } = await supabase.from('products').insert(productsToInsert);
        
        if (error) {
          console.error('Batch error:', error);
          errors += batch.length;
        } else {
          imported += batch.length;
        }

        setImportProgress(Math.round(((i + 1) / batches) * 100));
      }

      if (imported > 0) {
        toast.success(`${imported} produit(s) importé(s)`, { id: toastId });
        onImportComplete();
        setShowPreview(false);
        setParsedProducts([]);
        setStats(null);
        setSelectedFile(null);
      } else {
        throw new Error('Aucun produit importé');
      }

      if (errors > 0) {
        toast.warning(`${errors} produit(s) en erreur`);
      }
    } catch (error) {
      toast.error('Erreur d\'import', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Télécharger le template
  const downloadTemplate = () => {
    const template = `name,description,price,compare_at_price,sku,category,vendor,stock_quantity,image_url,status,tags
"iPhone 15 Pro","Smartphone Apple dernière génération",1199.99,1299.99,IPH15PRO,Électronique,Apple,50,https://example.com/iphone.jpg,active,"tech,smartphone,apple"
"MacBook Air M3","Ordinateur portable léger et puissant",1299.00,,MBA-M3-256,Informatique,Apple,25,https://example.com/macbook.jpg,active,"laptop,apple"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_produits.csv';
    link.click();
    
    toast.success('Template téléchargé');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import CSV intelligent
          </CardTitle>
          <CardDescription>
            Importez vos produits avec validation automatique et détection d'erreurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zone de drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              isAnalyzing && "pointer-events-none opacity-50"
            )}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyse du fichier...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "p-4 rounded-full transition-colors",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier CSV'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou cliquez pour sélectionner (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fichier sélectionné */}
          {selectedFile && stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {stats.total} produits
                    </Badge>
                    {stats.valid > 0 && (
                      <Badge className="text-xs bg-green-500/20 text-green-600">
                        {stats.valid} valides
                      </Badge>
                    )}
                    {stats.invalid > 0 && (
                      <Badge className="text-xs bg-red-500/20 text-red-600">
                        {stats.invalid} erreurs
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Prévisualiser
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={stats.valid === 0 || isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Importer {stats.valid}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Progress bar d'import */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Import en cours... {importProgress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger template
            </Button>
            <div className="text-sm text-muted-foreground">
              Compatible Shopify, WooCommerce, format standard
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Prévisualisation de l'import
            </DialogTitle>
            <DialogDescription>
              {stats && (
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline">{stats.total} produits</Badge>
                  <Badge className="bg-green-500/20 text-green-600">{stats.valid} valides</Badge>
                  {stats.invalid > 0 && (
                    <Badge className="bg-red-500/20 text-red-600">{stats.invalid} erreurs</Badge>
                  )}
                  {stats.warnings > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-600">{stats.warnings} avertissements</Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ligne</TableHead>
                  <TableHead className="w-16">Statut</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Problèmes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedProducts.map((product, index) => (
                  <TableRow 
                    key={index}
                    className={cn(
                      !product.isValid && "bg-red-500/5",
                      product.warnings.length > 0 && product.isValid && "bg-amber-500/5"
                    )}
                  >
                    <TableCell className="font-mono text-xs">{product.row}</TableCell>
                    <TableCell>
                      {product.isValid ? (
                        product.warnings.length > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {product.data.name || <span className="text-muted-foreground italic">Vide</span>}
                    </TableCell>
                    <TableCell>
                      {product.data.price ? `${product.data.price}€` : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.data.sku || '-'}
                    </TableCell>
                    <TableCell>
                      {product.errors.length > 0 && (
                        <div className="text-xs text-red-500">
                          {product.errors.join(', ')}
                        </div>
                      )}
                      {product.warnings.length > 0 && (
                        <div className="text-xs text-amber-500">
                          {product.warnings.join(', ')}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fermer
            </Button>
            <Button
              onClick={handleImport}
              disabled={!stats || stats.valid === 0 || isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importer {stats?.valid || 0} produit(s) valide(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

SmartCSVImport.displayName = 'SmartCSVImport';

export default SmartCSVImport;
