/**
 * PPC Feed Link Hooks
 * React Query hooks pour la liaison PPC-Feed
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  PPCFeedLinkService, 
  CreatePPCLinkInput,
  PPCFeedLink,
} from '@/services/PPCFeedLinkService';

// ========== LINKS ==========

export function usePPCFeedLinks(platform?: string) {
  return useQuery({
    queryKey: ['ppc-feed-links', platform],
    queryFn: () => PPCFeedLinkService.getLinks(platform),
    staleTime: 30 * 1000,
  });
}

export function usePPCFeedLink(linkId: string) {
  return useQuery({
    queryKey: ['ppc-feed-link', linkId],
    queryFn: () => PPCFeedLinkService.getLink(linkId),
    enabled: !!linkId,
    staleTime: 10 * 1000,
  });
}

export function useCreatePPCFeedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePPCLinkInput) => PPCFeedLinkService.createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-links'] });
      queryClient.invalidateQueries({ queryKey: ['ppc-stats'] });
      toast.success('Liaison PPC créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdatePPCFeedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, updates }: { linkId: string; updates: Partial<PPCFeedLink> }) => 
      PPCFeedLinkService.updateLink(linkId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-links'] });
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-link', data.id] });
      toast.success('Liaison mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeletePPCFeedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => PPCFeedLinkService.deleteLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-links'] });
      queryClient.invalidateQueries({ queryKey: ['ppc-stats'] });
      toast.success('Liaison supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useTogglePPCFeedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, isActive }: { linkId: string; isActive: boolean }) => 
      PPCFeedLinkService.toggleLink(linkId, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-links'] });
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-link', data.id] });
      toast.success(data.is_active ? 'Liaison activée' : 'Liaison désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== SYNC ==========

export function useSyncPPCFeedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, syncType }: { linkId: string; syncType?: 'full' | 'incremental' | 'manual' }) => 
      PPCFeedLinkService.syncLink(linkId, syncType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ppc-feed-links'] });
      queryClient.invalidateQueries({ queryKey: ['ppc-sync-logs'] });
      toast.success(`Synchronisation terminée: ${data.products_processed} produits traités`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur de sync: ${error.message}`);
    },
  });
}

// ========== PERFORMANCE ==========

export function usePPCLinkPerformance(linkId: string, days?: number) {
  return useQuery({
    queryKey: ['ppc-performance', linkId, days],
    queryFn: () => PPCFeedLinkService.getPerformance(linkId, days),
    enabled: !!linkId,
    staleTime: 60 * 1000,
  });
}

export function usePPCAggregatedPerformance(linkId?: string) {
  return useQuery({
    queryKey: ['ppc-aggregated-performance', linkId],
    queryFn: () => PPCFeedLinkService.getAggregatedPerformance(linkId),
    staleTime: 60 * 1000,
  });
}

// ========== SYNC LOGS ==========

export function usePPCSyncLogs(linkId?: string, limit?: number) {
  return useQuery({
    queryKey: ['ppc-sync-logs', linkId, limit],
    queryFn: () => PPCFeedLinkService.getSyncLogs(linkId, limit),
    staleTime: 30 * 1000,
  });
}

// ========== STATS ==========

export function usePPCStats() {
  return useQuery({
    queryKey: ['ppc-stats'],
    queryFn: () => PPCFeedLinkService.getStats(),
    staleTime: 60 * 1000,
  });
}

// ========== OPTIONS ==========

export function usePlatformOptions() {
  return PPCFeedLinkService.getPlatformOptions();
}

export function useFrequencyOptions() {
  return PPCFeedLinkService.getFrequencyOptions();
}
