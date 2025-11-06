import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImageIssue {
  type: 'size' | 'format' | 'dimensions' | 'alt' | 'responsive';
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ImageAuditResult {
  url: string;
  size: number;
  format: string;
  dimensions: { width: number; height: number };
  alt?: string;
  issues: ImageIssue[];
  source: 'products' | 'blog' | 'pages' | 'other';
}

export interface ScanResults {
  totalImages: number;
  images: ImageAuditResult[];
  totalSize: number;
  potentialSavings: number;
}

export interface OptimizationProgress {
  current: number;
  total: number;
  message: string;
}

export function useGlobalImageOptimization() {
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState<OptimizationProgress | null>(null);

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('global-image-optimizer', {
        body: { action: 'audit' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setScanResults(data.results);
      toast.success('Scan terminé', {
        description: `${data.results.totalImages} images analysées`
      });
    },
    onError: (error) => {
      toast.error('Erreur lors du scan', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!scanResults) throw new Error('Aucun résultat de scan disponible');

      const imagesToOptimize = scanResults.images.filter(img => img.issues.length > 0);
      const total = imagesToOptimize.length;

      setOptimizationProgress({ current: 0, total, message: 'Démarrage...' });

      const results = [];

      for (let i = 0; i < imagesToOptimize.length; i++) {
        const image = imagesToOptimize[i];
        
        setOptimizationProgress({
          current: i + 1,
          total,
          message: `Optimisation de ${image.url.split('/').pop()}...`
        });

        try {
          const { data, error } = await supabase.functions.invoke('global-image-optimizer', {
            body: {
              action: 'optimize',
              imageUrl: image.url,
              issues: image.issues,
              source: image.source
            }
          });

          if (error) throw error;
          results.push({ success: true, data });
        } catch (error) {
          console.error(`Error optimizing ${image.url}:`, error);
          results.push({ success: false, error });
        }

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      toast.success('Optimisation terminée', {
        description: `${successCount}/${totalCount} images optimisées avec succès`
      });

      setOptimizationProgress(null);
      // Re-scan after optimization
      scanMutation.mutate();
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'optimisation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      setOptimizationProgress(null);
    }
  });

  const downloadReport = () => {
    if (!scanResults) return;

    const report = {
      date: new Date().toISOString(),
      summary: {
        totalImages: scanResults.totalImages,
        totalSize: `${(scanResults.totalSize / 1024 / 1024).toFixed(2)} MB`,
        potentialSavings: `${(scanResults.potentialSavings / 1024 / 1024).toFixed(2)} MB`,
        imagesWithIssues: scanResults.images.filter(img => img.issues.length > 0).length
      },
      images: scanResults.images
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rapport téléchargé');
  };

  return {
    isScanning: scanMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    scanResults,
    optimizationProgress,
    auditImages: scanMutation.mutate,
    optimizeAllImages: optimizeMutation.mutate,
    downloadReport
  };
}
