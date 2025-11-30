import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportFromURLProps {
  onPreview: (data: any) => void;
}

export function ImportFromURL({ onPreview }: ImportFromURLProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!url) {
      setError('Veuillez entrer une URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('analyze-supplier', {
        body: { url }
      });

      if (functionError) throw functionError;

      // Simuler des données de preview pour l'instant
      const previewData = {
        source: 'url',
        url,
        products: [
          {
            id: '1',
            title: data?.name || 'Produit importé',
            price: 29.99,
            supplier: data?.supplier_name || 'Fournisseur externe',
            image: data?.logo_url || '/placeholder.svg',
            stock: 'En stock',
            errors: []
          }
        ],
        summary: {
          total: 1,
          valid: 1,
          errors: 0,
          warnings: 0
        }
      };

      onPreview(previewData);
      
      toast({
        title: "✅ Analyse terminée",
        description: "Passez à l'aperçu pour vérifier les données"
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse de l\'URL');
      toast({
        title: "❌ Erreur",
        description: "Impossible d'analyser cette URL",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product-url">URL du produit</Label>
        <Input
          id="product-url"
          type="url"
          placeholder="https://www.aliexpress.com/item/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Collez l'URL d'un produit depuis AliExpress, Amazon, BigBuy, etc.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading || !url}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Analyser et prévisualiser
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          💡 <strong>Astuce :</strong> Vous pouvez importer plusieurs produits à la fois en utilisant l'import CSV
        </AlertDescription>
      </Alert>
    </div>
  );
}
