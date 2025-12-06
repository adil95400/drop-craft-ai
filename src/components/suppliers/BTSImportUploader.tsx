import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImportResult {
  success: boolean;
  job_id?: string;
  total?: number;
  processed?: number;
  failed?: number;
  status?: string;
  error?: string;
}

export function BTSImportUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-bts-csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      setProgress(80);

      const data: ImportResult = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(`${data.processed} produits importés avec succès!`);
        setProgress(100);
      } else {
        toast.error(data.error || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
      setResult({ success: false, error: error.message });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const resetUploader = () => {
    setResult(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import BTSWholesaler CSV
        </CardTitle>
        <CardDescription>
          Importez vos produits BTSWholesaler au format CSV Shopify
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Import en cours...</p>
                  <Progress value={progress} className="w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier CSV'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour sélectionner
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>📋 Format attendu: CSV Shopify (Handle, Title, Variant SKU, Price, etc.)</p>
              <p>🔄 Les produits existants seront mis à jour (basé sur SKU)</p>
              <p>📦 Maximum: 50 000 produits par import</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {result.success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-lg">Import terminé!</p>
                  <p className="text-muted-foreground">
                    {result.processed} produits importés sur {result.total}
                  </p>
                  {result.failed && result.failed > 0 && (
                    <p className="text-yellow-600">
                      {result.failed} produits en échec
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetUploader}>
                    Nouvel import
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/products">Voir les produits</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <div>
                  <p className="font-medium text-lg">Erreur d'import</p>
                  <p className="text-muted-foreground">{result.error}</p>
                </div>
                <Button onClick={resetUploader}>
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
