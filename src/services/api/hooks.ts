/**
 * React Query hooks for ShopOpti API
 * Use these hooks in components for data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from './ShopOptiApiClient';
import { toast } from 'sonner';

// ==========================================
// SUPPLIER HOOKS
// ==========================================

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await shopOptiApi.listSuppliers();
      if (!response.success) throw new Error(response.error);
      return response.data?.suppliers || [];
    },
  });
}

export function useSupplierStatus(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-status', supplierId],
    queryFn: async () => {
      const response = await shopOptiApi.getSupplierStatus(supplierId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!supplierId,
  });
}

export function useConnectSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierType, apiKey, config }: {
      supplierType: string;
      apiKey: string;
      config?: Record<string, any>;
    }) => {
      const response = await shopOptiApi.connectSupplier(supplierType, apiKey, config);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur connecté avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur de connexion: ${error.message}`);
    },
  });
}

export function useSyncSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, syncType, options }: {
      supplierId: string;
      syncType?: string;
      options?: { limit?: number; categoryFilter?: string };
    }) => {
      const response = await shopOptiApi.syncSupplier(supplierId, syncType, options);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Synchronisation lancée (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });
}

// ==========================================
// PRODUCT HOOKS
// ==========================================

export function useProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  supplierId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await shopOptiApi.getProducts(params);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Parameters<typeof shopOptiApi.createProduct>[0]) => {
      const response = await shopOptiApi.createProduct(product);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, updates }: {
      productId: string;
      updates: Parameters<typeof shopOptiApi.updateProduct>[1];
    }) => {
      const response = await shopOptiApi.updateProduct(productId, updates);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useBulkUpdatePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, adjustmentType, adjustmentValue }: {
      productIds: string[];
      adjustmentType: 'percentage' | 'fixed';
      adjustmentValue: number;
    }) => {
      const response = await shopOptiApi.bulkUpdatePrices(productIds, adjustmentType, adjustmentValue);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data?.updated_count || 0} prix mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// ORDER HOOKS
// ==========================================

export function useOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await shopOptiApi.getOrders(params);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useFulfillOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, supplierId }: {
      orderId: string;
      supplierId?: string;
    }) => {
      const response = await shopOptiApi.fulfillOrder(orderId, supplierId);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Fulfillment lancé (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// SYNC HOOKS
// ==========================================

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ syncType, options }: {
      syncType: 'products' | 'stock' | 'orders' | 'full';
      options?: { supplierId?: string; platformId?: string };
    }) => {
      const response = await shopOptiApi.triggerSync(syncType, options);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Synchronisation lancée (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// SCRAPING HOOKS
// ==========================================

export function useScrapeUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, options }: {
      url: string;
      options?: { extractVariants?: boolean; enrichWithAi?: boolean };
    }) => {
      const response = await shopOptiApi.scrapeUrl(url, options);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Extraction lancée (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useImportFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedUrl, feedType, mappingConfig }: {
      feedUrl: string;
      feedType: 'xml' | 'csv' | 'json';
      mappingConfig?: Record<string, string>;
    }) => {
      const response = await shopOptiApi.importFeed(feedUrl, feedType, mappingConfig);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Import lancé (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// AI HOOKS
// ==========================================

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, contentTypes, options }: {
      productId: string;
      contentTypes: string[];
      options?: { language?: string; tone?: string };
    }) => {
      const response = await shopOptiApi.generateContent(productId, contentTypes, options);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Génération lancée (Job: ${data.job_id})`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useOptimizeSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, options }: {
      productIds: string[];
      options?: { targetKeywords?: string[]; language?: string };
    }) => {
      const response = await shopOptiApi.optimizeSeo(productIds, options);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      toast.success('Optimisation SEO lancée');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// JOB HOOKS
// ==========================================

export function useJobs(params?: {
  status?: string;
  jobType?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const response = await shopOptiApi.getJobs(params);
      if (!response.success) throw new Error(response.error);
      return response.data?.jobs || [];
    },
    refetchInterval: 5000, // Poll every 5 seconds for job updates
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await shopOptiApi.getJob(jobId);
      if (!response.success) throw new Error(response.error);
      return response.data?.job;
    },
    enabled: !!jobId,
    refetchInterval: ({ state }) => {
      // Stop polling when job is complete
      const jobData = state.data;
      if (jobData?.status === 'completed' || jobData?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds while running
    },
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const response = await shopOptiApi.getJobStats();
      if (!response.success) throw new Error(response.error);
      return response.data?.stats;
    },
    refetchInterval: 10000,
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await shopOptiApi.cancelJob(jobId);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job annulé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await shopOptiApi.retryJob(jobId);
      if (!response.success) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job relancé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ==========================================
// HEALTH CHECK
// ==========================================

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await shopOptiApi.healthCheck();
      return response;
    },
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });
}
