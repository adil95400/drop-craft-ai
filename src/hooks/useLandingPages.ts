/**
 * Landing Page Hooks
 * React Query hooks pour le page builder
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  LandingPageService, 
  CreatePageInput,
  LandingPage,
  PageBlock
} from '@/services/LandingPageService';

// ========== PAGES ==========

export function useLandingPages(status?: string) {
  return useQuery({
    queryKey: ['landing-pages', status],
    queryFn: () => LandingPageService.getPages(status),
    staleTime: 30 * 1000,
  });
}

export function useLandingPage(pageId: string) {
  return useQuery({
    queryKey: ['landing-page', pageId],
    queryFn: () => LandingPageService.getPage(pageId),
    enabled: !!pageId,
    staleTime: 10 * 1000,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePageInput) => LandingPageService.createPage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-stats'] });
      toast.success('Page créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, updates }: { pageId: string; updates: Partial<LandingPage> }) => 
      LandingPageService.updatePage(pageId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Page mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => LandingPageService.deletePage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-stats'] });
      toast.success('Page supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function usePublishLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => LandingPageService.publishPage(pageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Page publiée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUnpublishLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => LandingPageService.unpublishPage(pageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Page dépubliée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDuplicateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => LandingPageService.duplicatePage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Page dupliquée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== CONTENT ==========

export function useUpdatePageContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, content }: { pageId: string; content: PageBlock[] }) => 
      LandingPageService.updateContent(pageId, content),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAddPageBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, block, position }: { pageId: string; block: PageBlock; position?: number }) => 
      LandingPageService.addBlock(pageId, block, position),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Bloc ajouté');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdatePageBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, blockId, updates }: { pageId: string; blockId: string; updates: Partial<PageBlock> }) => 
      LandingPageService.updateBlock(pageId, blockId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRemovePageBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, blockId }: { pageId: string; blockId: string }) => 
      LandingPageService.removeBlock(pageId, blockId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Bloc supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useReorderPageBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, blockIds }: { pageId: string; blockIds: string[] }) => 
      LandingPageService.reorderBlocks(pageId, blockIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== STATS ==========

export function useLandingPagesStats() {
  return useQuery({
    queryKey: ['landing-pages-stats'],
    queryFn: () => LandingPageService.getStats(),
    staleTime: 60 * 1000,
  });
}
