import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface DuplicateProduct {
  id: string;
  title: string;
  sku: string | null;
  price: number | null;
  images: string[] | null;
  category: string | null;
  brand: string | null;
  source_url: string | null;
  created_at: string;
}

export interface DuplicateMatch extends DuplicateProduct {
  similarity: number;
  reasons: string[];
}

export interface DuplicateGroup {
  groupId: string;
  primary: DuplicateProduct;
  duplicates: DuplicateMatch[];
  matchType: 'exact_sku' | 'title_similarity';
}

export interface DuplicateScanStats {
  totalProducts: number;
  duplicateGroups: number;
  totalDuplicates: number;
  executionMs: number;
  byType: { exact_sku: number; title_similarity: number };
}

export function useDuplicateDetection() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState<DuplicateScanStats | null>(null);
  const queryClient = useQueryClient();

  const scanDuplicates = async (threshold = 0.75) => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: { action: 'scan', threshold },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Scan failed');

      setGroups(data.groups || []);
      setStats(data.stats || null);

      const dupCount = data.stats?.totalDuplicates || 0;
      if (dupCount > 0) {
        toast.warning(`${dupCount} doublon(s) détecté(s) dans ${data.stats?.duplicateGroups} groupe(s)`);
      } else {
        toast.success('Aucun doublon détecté !');
      }
      return data;
    } catch (err: any) {
      toast.error('Erreur lors du scan', { description: err.message });
      throw err;
    } finally {
      setIsScanning(false);
    }
  };

  const mergeGroup = async (keepId: string, removeIds: string[]) => {
    setIsMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: { action: 'merge', keepId, removeIds },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Merge failed');

      // Remove merged group from local state
      setGroups((prev) => prev.filter((g) => {
        const allIds = [g.primary.id, ...g.duplicates.map((d) => d.id)];
        return !removeIds.some((id) => allIds.includes(id));
      }));

      toast.success(`${removeIds.length} doublon(s) fusionné(s)`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      return data;
    } catch (err: any) {
      toast.error('Erreur lors de la fusion', { description: err.message });
      throw err;
    } finally {
      setIsMerging(false);
    }
  };

  const dismissGroup = async (groupId: string, productIds: string[]) => {
    try {
      await supabase.functions.invoke('detect-duplicates', {
        body: { action: 'dismiss', groupId, productIds },
      });
      setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
      toast.info('Groupe ignoré');
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    }
  };

  return { groups, stats, isScanning, isMerging, scanDuplicates, mergeGroup, dismissGroup };
}
