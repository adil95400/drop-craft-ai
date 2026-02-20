import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const loadXLSX = () => import('xlsx');

interface ImportOptions {
  format: 'csv' | 'json' | 'excel';
  delimiter?: string;
  skipRows?: number;
}

export function useImportExport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch import history
  const { data: importHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Import mutation with optimistic updates
  const importMutation = useMutation({
    mutationFn: async ({ 
      file, 
      options 
    }: { 
      file: File; 
      options: ImportOptions 
    }) => {
      setIsProcessing(true);
      setProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const text = await file.text();
        let data: any[];

        // Parse based on format
        switch (options.format) {
          case 'csv':
            const rows = text.split('\n').filter(r => r.trim());
            const headers = rows[0].split(options.delimiter || ',');
            data = rows.slice(options.skipRows || 1).map(row => {
              const values = row.split(options.delimiter || ',');
              return headers.reduce((obj, header, i) => {
                obj[header.trim()] = values[i]?.trim();
                return obj;
              }, {} as any);
            });
            break;

          case 'json':
            data = JSON.parse(text);
            break;

          case 'excel':
            const xlsxMod = await loadXLSX();
            const workbook = xlsxMod.read(text, { type: 'string' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            data = xlsxMod.utils.sheet_to_json(firstSheet);
            break;

          default:
            throw new Error('Unsupported format');
        }

        // Batch insert to database
        const batchSize = 100;
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
          batches.push(data.slice(i, i + batchSize));
        }

        let imported = 0;
        for (const batch of batches) {
          const products = batch.map(item => ({
            user_id: user.id,
            name: item.name || item.title || 'Sans nom',
            sku: item.sku || item.reference || null,
            price: parseFloat(item.price || '0'),
            cost_price: parseFloat(item.cost_price || item.cost || '0'),
            stock: parseInt(item.stock || item.quantity || '0'),
            category: item.category || null,
            description: item.description || null,
            image_url: item.image_url || item.image || null,
          }));

          const { error } = await supabase
            .from('imported_products')
            .insert(products);

          if (error) throw error;
          imported += batch.length;
          setProgress(Math.floor((imported / data.length) * 100));
        }

        clearInterval(progressInterval);
        return { imported, total: data.length };
      } finally {
        clearInterval(progressInterval);
        setIsProcessing(false);
      }
    },
    onSuccess: (result) => {
      setProgress(100);
      toast({
        title: 'Import réussi',
        description: `${result.imported} produits importés avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      setTimeout(() => setProgress(0), 2000);
    },
    onError: (error) => {
      setProgress(0);
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // Export with caching
  const exportData = useCallback(async (
    format: 'csv' | 'json' | 'excel',
    tableName: string = 'imported_products'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucune donnée à exporter',
          variant: 'destructive',
        });
        return;
      }

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'csv':
          const headers = Object.keys(data[0] || {});
          const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => row[h]).join(','))
          ].join('\n');
          blob = new Blob([csv], { type: 'text/csv' });
          filename = `export-${tableName}-${Date.now()}.csv`;
          break;

        case 'json':
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `export-${tableName}-${Date.now()}.json`;
          break;

        case 'excel':
          const xlsxMod = await loadXLSX();
          const ws = xlsxMod.utils.json_to_sheet(data);
          const wb = xlsxMod.utils.book_new();
          xlsxMod.utils.book_append_sheet(wb, ws, 'Data');
          const excelBuffer = xlsxMod.write(wb, { bookType: 'xlsx', type: 'array' });
          blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          filename = `export-${tableName}-${Date.now()}.xlsx`;
          break;

        default:
          throw new Error('Format non supporté');
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: `${data.length} éléments exportés`,
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, []);

  return {
    importData: importMutation.mutate,
    exportData,
    isImporting: importMutation.isPending || isProcessing,
    progress,
    importHistory,
    historyLoading,
  };
}
