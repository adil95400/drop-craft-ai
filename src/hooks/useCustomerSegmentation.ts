import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerSegmentationService, CustomerSegment } from '@/services/CustomerSegmentationService';
import { toast } from 'sonner';

export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: () => CustomerSegmentationService.getSegments(),
  });
}

export function useCustomerSegment(id: string) {
  return useQuery({
    queryKey: ['customer-segments', id],
    queryFn: () => CustomerSegmentationService.getSegment(id),
    enabled: !!id,
  });
}

export function useCreateCustomerSegment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (segment: Partial<CustomerSegment>) => CustomerSegmentationService.createSegment(segment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateCustomerSegment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustomerSegment> }) => 
      CustomerSegmentationService.updateSegment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteCustomerSegment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => CustomerSegmentationService.deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSegmentMembers(segmentId: string) {
  return useQuery({
    queryKey: ['segment-members', segmentId],
    queryFn: () => CustomerSegmentationService.getSegmentMembers(segmentId),
    enabled: !!segmentId,
  });
}

export function useRFMScores() {
  return useQuery({
    queryKey: ['rfm-scores'],
    queryFn: () => CustomerSegmentationService.getRFMScores(),
  });
}

export function useCalculateRFMScores() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => CustomerSegmentationService.calculateRFMScores(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfm-scores'] });
      toast.success('Scores RFM recalculés');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSegmentStats() {
  return useQuery({
    queryKey: ['segment-stats'],
    queryFn: () => CustomerSegmentationService.getSegmentStats(),
  });
}
