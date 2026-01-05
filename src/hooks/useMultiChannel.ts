import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MultiChannelService, SalesChannel, ChannelProductMapping, ChannelSyncLog } from '@/services/MultiChannelService';
import { toast } from 'sonner';

export function useSalesChannels() {
  return useQuery({
    queryKey: ['sales-channels'],
    queryFn: () => MultiChannelService.getChannels(),
  });
}

export function useSalesChannel(id: string) {
  return useQuery({
    queryKey: ['sales-channels', id],
    queryFn: () => MultiChannelService.getChannel(id),
    enabled: !!id,
  });
}

export function useCreateSalesChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (channel: Partial<SalesChannel>) => MultiChannelService.createChannel(channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Canal de vente créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateSalesChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SalesChannel> }) => 
      MultiChannelService.updateChannel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Canal mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteSalesChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => MultiChannelService.deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      toast.success('Canal supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useChannelProductMappings(channelId?: string) {
  return useQuery({
    queryKey: ['channel-product-mappings', channelId],
    queryFn: () => MultiChannelService.getProductMappings(channelId),
  });
}

export function useCreateProductMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mapping: Partial<ChannelProductMapping>) => MultiChannelService.createProductMapping(mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-product-mappings'] });
      toast.success('Mapping créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateProductMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ChannelProductMapping> }) => 
      MultiChannelService.updateProductMapping(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-product-mappings'] });
      toast.success('Mapping mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useStartChannelSync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ channelId, syncType }: { channelId: string; syncType: ChannelSyncLog['sync_type'] }) => 
      MultiChannelService.startSync(channelId, syncType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel-sync-logs'] });
      toast.success('Synchronisation démarrée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useChannelSyncLogs(channelId?: string) {
  return useQuery({
    queryKey: ['channel-sync-logs', channelId],
    queryFn: () => MultiChannelService.getSyncLogs(channelId),
  });
}

export function useChannelStats() {
  return useQuery({
    queryKey: ['channel-stats'],
    queryFn: () => MultiChannelService.getChannelStats(),
  });
}
