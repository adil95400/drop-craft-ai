import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OptimizationProgress {
  current: number;
  total: number;
  message: string;
}

export function useGlobalOptimization() {
  const [progress, setProgress] = useState<OptimizationProgress>({
    current: 0,
    total: 0,
    message: ''
  });
  const queryClient = useQueryClient();

  const optimizationMutation = useMutation({
    mutationFn: async (options: string[]) => {
      const totalSteps = options.length;
      setProgress({ current: 0, total: totalSteps, message: 'Démarrage de l\'optimisation...' });

      const results = [];

      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        setProgress({ 
          current: i + 1, 
          total: totalSteps, 
          message: `Optimisation ${option}...` 
        });

        try {
          const { data, error } = await supabase.functions.invoke('unified-ai', {
            body: { 
              endpoint: 'optimizer',
              type: option,
              action: 'optimize_all'
            }
          });

          if (error) throw error;
          results.push({ option, success: true, data });
        } catch (error) {
          console.error(`Error optimizing ${option}:`, error);
          results.push({ option, success: false, error });
        }

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      toast.success(
        `Optimisation terminée avec succès!`,
        {
          description: `${successCount}/${totalCount} optimisations appliquées`
        }
      );

      // Refresh site health data
      queryClient.invalidateQueries({ queryKey: ['site-health'] });
      
      setProgress({ current: 0, total: 0, message: '' });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'optimisation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      setProgress({ current: 0, total: 0, message: '' });
    }
  });

  return {
    optimizeSite: optimizationMutation.mutate,
    isOptimizing: optimizationMutation.isPending,
    progress
  };
}
