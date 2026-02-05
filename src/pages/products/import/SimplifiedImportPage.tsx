import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedImportSource } from '@/components/import/UnifiedImportSource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Link2, Loader2, FileUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useOptimizedImport } from '@/hooks/useOptimizedImport';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

type ImportStep = 'source' | 'upload' | 'url' | 'preview' | 'importing';

export default function SimplifiedImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>('source');
  const [selectedSource, setSelectedSource] = useState<string>();
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [productUrl, setProductUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { importData, isImporting, progress } = useOptimizedImport();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadedFile(file);
      
      try {
        const text = await file.text();
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.some(cell => cell.trim())).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim() || '';
          });
          return obj;
        });

        const errors: Array<{ row: number; error: string }> = [];
        data.forEach((row, idx) => {
          if (!row.name && !row.title) {
            errors.push({ row: idx + 1, error: 'Missing product name' });
          }
          if (!row.price || isNaN(parseFloat(row.price as string))) {
            errors.push({ row: idx + 1, error: 'Invalid or missing price' });
          }
        });

        setPreviewData(data);
        setPreviewErrors(errors);
        setStep('preview');
      } catch {
        toast({
          title: 'Error parsing file',
          description: 'Unable to read the file. Please check the format.',
          variant: 'destructive'
        });
      }
    }
  });

  const handleSourceSelect = (sourceType: string) => {
    setSelectedSource(sourceType);
    switch (sourceType) {
      case 'csv':
        setStep('upload');
        break;
      case 'url':
        setStep('url');
        break;
      case 'supplier':
        navigate('/suppliers');
        break;
      case 'api':
        navigate('/feeds');
        break;
      case 'shopify':
        navigate('/integrations/shopify');
        break;
      default:
        setStep('upload');
    }
  };

  const handleUrlImport = async () => {
    if (!productUrl.trim()) {
      toast({
        title: 'URL required',
        description: 'Please enter a product URL',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('url-scraper', {
        body: { url: productUrl }
      });

      if (error) throw error;

      if (data?.product) {
        setPreviewData([data.product]);
        setPreviewErrors([]);
        setStep('preview');
      } else {
        toast({
          title: 'Import failed',
          description: 'Could not extract product data from URL',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('URL import error:', err);
      toast({
        title: 'Import failed',
        description: 'Error importing from URL. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;

    setStep('importing');
    
    if (uploadedFile) {
      importData(uploadedFile, {
        format: 'csv',
        batchSize: 50
      });
    } else {
      // URL import - save directly
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const productsToInsert = previewData.map(p => ({
          user_id: user.id,
          title: (p.name || p.title) as string,
          name: (p.name || p.title) as string,
          description: p.description as string || '',
          price: parseFloat((p.price as string) || '0'),
          cost_price: parseFloat((p.cost_price as string) || '0'),
          sku: p.sku as string || '',
          status: 'draft'
        }));

        const { error } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (error) throw error;
      } catch (err) {
        console.error('Import error:', err);
        toast({
          title: 'Import failed',
          description: 'Error saving products',
          variant: 'destructive'
        });
        setStep('preview');
        return;
      }
    }

    setTimeout(() => {
      toast({
        title: 'Import terminé',
        description: `${previewData.length - previewErrors.length} produits importés avec succès`
      });
      navigate('/import/products');
    }, 2000);
  };

  const resetImport = () => {
    setStep('source');
    setSelectedSource(undefined);
    setPreviewData([]);
    setPreviewErrors([]);
    setUploadedFile(null);
    setProductUrl('');
  };

  return (
    <ChannablePageWrapper
      title="Import de Produits"
      subtitle="Importez vos produits"
      description="Importez des produits depuis plusieurs sources : fichiers CSV, URLs ou fournisseurs"
      heroImage="import"
      badge={{ label: "Import", icon: FileUp }}
    >

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${['source', 'upload', 'url', 'preview', 'importing'].includes(step) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className={`h-1 w-16 ${['upload', 'url', 'preview', 'importing'].includes(step) ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${['upload', 'url', 'preview', 'importing'].includes(step) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className={`h-1 w-16 ${['preview', 'importing'].includes(step) ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${['preview', 'importing'].includes(step) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'source' && (
        <UnifiedImportSource
          onSelectSource={handleSourceSelect}
          selectedSource={selectedSource}
        />
      )}

      {step === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Drop your file here' : 'Upload CSV or Excel file'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop or click to select a file
              </p>
              <Button variant="outline">Choose File</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'url' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center mb-6">
              <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Import from URL</h3>
              <p className="text-muted-foreground">
                Paste a product URL from AliExpress, Amazon, or other suppliers
              </p>
            </div>
            
            <div className="max-w-xl mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productUrl">Product URL</Label>
                <Input
                  id="productUrl"
                  type="url"
                  placeholder="https://www.aliexpress.com/item/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetImport}>
                  Cancel
                </Button>
                <Button onClick={handleUrlImport} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Product'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{previewData.length}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{previewData.length - previewErrors.length}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{previewErrors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Preview Data */}
            {previewData.length > 0 && (
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="font-medium mb-2">Preview</h4>
                {previewData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                    <span>{(item.name || item.title) as string}</span>
                    <span className="font-medium">${item.price as string}</span>
                  </div>
                ))}
                {previewData.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    And {previewData.length - 5} more products...
                  </p>
                )}
              </div>
            )}

            {/* Errors */}
            {previewErrors.length > 0 && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="font-medium mb-2">{previewErrors.length} errors found:</p>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {previewErrors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              <Button onClick={handleConfirmImport} disabled={isImporting || (previewData.length - previewErrors.length) === 0}>
                {isImporting ? 'Importing...' : `Import ${previewData.length - previewErrors.length} Products`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Importing Products</h3>
            <p className="text-muted-foreground mb-4">Please wait while we import your products...</p>
            <div className="w-full max-w-md mx-auto bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
          </CardContent>
        </Card>
      )}
    </ChannablePageWrapper>
  );
}
