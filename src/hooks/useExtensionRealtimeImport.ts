import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ExtensionProduct {
  source_url: string;
  source_platform: 'aliexpress' | 'amazon' | 'ebay' | 'temu' | 'shein' | 'shopify' | 'etsy' | 'walmart';
  source_product_id?: string;
  title: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  currency?: string;
  images: string[];
  videos?: string[];
  variants?: Array<{
    title: string;
    sku?: string;
    price: number;
    option1?: string;
    option2?: string;
    option3?: string;
    inventory_quantity?: number;
  }>;
  supplier_name?: string;
  supplier_rating?: number;
  shipping_time?: string;
  category?: string;
  tags?: string[];
  rating?: number;
  review_count?: number;
  quality_score?: number;
}

interface ImportOptions {
  auto_publish?: boolean;
  apply_pricing_rules?: boolean;
  pricing_multiplier?: number;
  fixed_margin?: number;
  round_prices?: boolean;
  import_as_draft?: boolean;
  trigger_ai_enrichment?: boolean;
  category_mapping?: Record<string, string>;
}

interface ImportResult {
  success: boolean;
  product_id?: string;
  message?: string;
  error?: string;
}

interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  product_ids: string[];
}

export function useExtensionRealtimeImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Import single product (1-click)
  const importProduct = useMutation({
    mutationFn: async ({ 
      product, 
      options 
    }: { 
      product: ExtensionProduct; 
      options?: ImportOptions 
    }): Promise<ImportResult> => {
      const { data, error } = await supabase.functions.invoke('extension-realtime-import', {
        body: { action: 'import_single', product, options }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Produit importé', {
        description: 'Ajouté à votre catalogue'
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'import', {
        description: error.message
      });
    }
  });

  // Bulk import products
  const bulkImport = useMutation({
    mutationFn: async ({ 
      products, 
      options 
    }: { 
      products: ExtensionProduct[]; 
      options?: ImportOptions 
    }): Promise<BulkImportResult> => {
      const { data, error } = await supabase.functions.invoke('extension-realtime-import', {
        body: { action: 'import_bulk', products, options }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.imported > 0) {
        toast.success(`${data.imported} produits importés`, {
          description: data.failed > 0 ? `${data.failed} échecs` : undefined
        });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'import en masse', {
        description: error.message
      });
    }
  });

  // Get extension settings
  const { data: extensionSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['extension-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('extension-realtime-import', {
        body: { action: 'get_settings' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Save extension settings
  const saveSettings = useMutation({
    mutationFn: async (settings: any) => {
      const { data, error } = await supabase.functions.invoke('extension-realtime-import', {
        body: { action: 'save_settings', settings }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Paramètres extension sauvegardés');
      queryClient.invalidateQueries({ queryKey: ['extension-settings'] });
    }
  });

  // Heartbeat / status check
  const heartbeat = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('extension-realtime-import', {
        body: { action: 'heartbeat' }
      });

      if (error) throw error;
      return data;
    }
  });

  return {
    // Single import
    importProduct: importProduct.mutate,
    importProductAsync: importProduct.mutateAsync,
    isImporting: importProduct.isPending,

    // Bulk import
    bulkImport: bulkImport.mutate,
    bulkImportAsync: bulkImport.mutateAsync,
    isBulkImporting: bulkImport.isPending,

    // Settings
    extensionSettings,
    isLoadingSettings,
    saveSettings: saveSettings.mutate,
    isSavingSettings: saveSettings.isPending,

    // Heartbeat
    heartbeat: heartbeat.mutate,
  };
}

// Hook for extension connection status
export function useExtensionConnectionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['extension-connection', user?.id],
    queryFn: async () => {
      if (!user) return { connected: false, lastSeen: null, isActive: false };

      const { data, error } = await supabase
        .from('extension_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { connected: false, lastSeen: null, isActive: false };
      }

      // Type assertion for dynamic columns
      const token = data as any;
      const lastSeenAt = token.last_seen_at;
      const isActive = token.is_active ?? false;
      
      if (!lastSeenAt) {
        return { connected: false, lastSeen: null, isActive };
      }

      const lastSeen = new Date(lastSeenAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return {
        connected: isActive && lastSeen > fiveMinutesAgo,
        lastSeen: lastSeenAt,
        isActive,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Check every 30 seconds
  });
}

// Hook for generating extension auth token
export function useGenerateExtensionToken() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Non authentifié');

      // Generate a secure token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Deactivate old tokens - use type assertion
      await supabase
        .from('extension_tokens')
        .update({ is_active: false } as any)
        .eq('user_id', user.id);

      // Create new token - use type assertion for dynamic schema
      const { data, error } = await supabase
        .from('extension_tokens')
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { token, expiresAt: expiresAt.toISOString() };
    },
    onSuccess: () => {
      toast.success('Token extension généré');
      queryClient.invalidateQueries({ queryKey: ['extension-connection'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur génération token', {
        description: error.message
      });
    }
  });
}
