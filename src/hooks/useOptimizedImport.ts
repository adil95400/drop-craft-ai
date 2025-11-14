import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileParserService, ProductImport } from '@/services/fileParserService';

interface ImportOptions {
  format: 'csv' | 'json' | 'excel';
  delimiter?: string;
  skipRows?: number;
  batchSize?: number;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export function useOptimizedImport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [details, setDetails] = useState({ total: 0, processed: 0, failed: 0 });

  const importMutation = useMutation({
    mutationFn: async ({ 
      file, 
      options 
    }: { 
      file: File; 
      options: ImportOptions 
    }): Promise<ImportResult> => {
      setStatus('processing');
      setProgress(0);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Parse le fichier selon le format
      let parseResult;
      
      if (options.format === 'excel') {
        const arrayBuffer = await file.arrayBuffer();
        parseResult = await FileParserService.parseExcel(arrayBuffer);
      } else {
        const text = await file.text();
        if (options.format === 'csv') {
          parseResult = await FileParserService.parseCSV(
            text, 
            options.delimiter, 
            options.skipRows
          );
        } else {
          parseResult = await FileParserService.parseJSON(text);
        }
      }

      setDetails({
        total: parseResult.data.length,
        processed: 0,
        failed: parseResult.errors.length
      });

      // Import par batch
      const batchSize = options.batchSize || 50;
      const batches = [];
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        batches.push(parseResult.data.slice(i, i + batchSize));
      }

      let imported = 0;
      let failed = parseResult.errors.length;
      const allErrors = [...parseResult.errors];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          const products = batch.map((item: ProductImport) => ({
            user_id: user.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            cost_price: item.cost_price || 0,
            stock_quantity: item.stock || 0,
            category: item.category,
            description: item.description,
            image_urls: item.image_url ? [item.image_url] : [],
            supplier_name: 'Import manuel',
            status: 'draft' as const,
          }));

          const { error } = await supabase
            .from('imported_products')
            .insert(products);

          if (error) {
            console.error('❌ Erreur insertion batch:', error);
            failed += batch.length;
            allErrors.push({
              row: i * batchSize,
              error: error.message || 'Erreur d\'insertion dans la base de données'
            });
          } else {
            imported += batch.length;
          }
        } catch (error) {
          failed += batch.length;
          allErrors.push({
            row: i * batchSize,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }

        const progressPercent = Math.floor(((i + 1) / batches.length) * 100);
        setProgress(progressPercent);
        setDetails({
          total: parseResult.data.length,
          processed: imported,
          failed
        });
      }

      return { imported, failed, errors: allErrors };
    },
    onSuccess: (result) => {
      setProgress(100);
      setStatus('success');
      
      if (result.failed > 0) {
        toast({
          title: 'Import terminé avec des erreurs',
          description: `${result.imported} produits importés, ${result.failed} échecs`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Import réussi',
          description: `${result.imported} produits importés avec succès`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      
      setTimeout(() => {
        setProgress(0);
        setStatus('idle');
        setDetails({ total: 0, processed: 0, failed: 0 });
      }, 3000);
    },
    onError: (error) => {
      setProgress(0);
      setStatus('error');
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
      
      setTimeout(() => {
        setStatus('idle');
        setDetails({ total: 0, processed: 0, failed: 0 });
      }, 3000);
    },
  });

  const importData = useCallback((file: File, options: ImportOptions) => {
    importMutation.mutate({ file, options });
  }, [importMutation]);

  return {
    importData,
    isImporting: importMutation.isPending,
    progress,
    status,
    details,
  };
}
