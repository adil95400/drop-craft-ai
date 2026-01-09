/**
 * Hook pour gérer les Product Feeds - connecté à Supabase
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductFeed {
  id: string;
  name: string;
  feed_type: string;
  feed_url: string | null;
  product_count: number | null;
  last_generated_at: string | null;
  generation_status: string | null;
  validation_errors: unknown[] | null;
  settings: Record<string, unknown> | null;
  campaign_id: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFeedInput {
  name: string;
  feed_type: string;
  settings?: Record<string, unknown>;
  campaign_id?: string;
}

export interface UpdateFeedInput {
  name?: string;
  feed_type?: string;
  feed_url?: string;
  settings?: Record<string, unknown>;
  generation_status?: string;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user;
}

export function useProductFeeds() {
  const queryClient = useQueryClient();

  // Fetch all feeds for current user
  const { data: feeds = [], isLoading, error } = useQuery({
    queryKey: ['product-feeds'],
    queryFn: async (): Promise<ProductFeed[]> => {
      const user = await getCurrentUser();
      
      const { data, error } = await supabase
        .from('campaign_product_feeds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductFeed[];
    }
  });

  // Create a new feed
  const createFeedMutation = useMutation({
    mutationFn: async (input: CreateFeedInput) => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from('campaign_product_feeds')
        .insert([{
          name: input.name,
          feed_type: input.feed_type,
          settings: (input.settings || {}) as unknown as null,
          campaign_id: input.campaign_id || null,
          user_id: user.id,
          generation_status: 'pending',
          product_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data as ProductFeed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      toast.success('Feed créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Update a feed
  const updateFeedMutation = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: UpdateFeedInput }) => {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.feed_type) updatePayload.feed_type = updateData.feed_type;
      if (updateData.feed_url) updatePayload.feed_url = updateData.feed_url;
      if (updateData.generation_status) updatePayload.generation_status = updateData.generation_status;
      if (updateData.settings) updatePayload.settings = updateData.settings as unknown as null;

      const { error } = await supabase
        .from('campaign_product_feeds')
        .update(updatePayload as { name?: string; feed_type?: string; feed_url?: string; generation_status?: string; updated_at?: string })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      toast.success('Feed mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Delete a feed
  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_product_feeds')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      toast.success('Feed supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Generate/sync a feed
  const generateFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      // Update status to generating
      await supabase
        .from('campaign_product_feeds')
        .update({ generation_status: 'generating' })
        .eq('id', feedId);

      // Call edge function for actual generation
      const { data, error } = await supabase.functions.invoke('feed-manager', {
        body: { action: 'generate_feed', feed_id: feedId }
      });

      if (error) {
        // Revert status on error
        await supabase
          .from('campaign_product_feeds')
          .update({ 
            generation_status: 'error',
            validation_errors: [{ error: error.message }]
          })
          .eq('id', feedId);
        throw error;
      }

      // Update with result
      await supabase
        .from('campaign_product_feeds')
        .update({
          generation_status: 'completed',
          last_generated_at: new Date().toISOString(),
          product_count: data?.products_count || 0,
          feed_url: data?.feed_url || null
        })
        .eq('id', feedId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      toast.success(`Feed généré: ${data?.products_count || 0} produits`);
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ['product-feeds'] });
      toast.error(`Erreur de génération: ${error.message}`);
    }
  });

  // Stats calculation
  const stats = {
    totalFeeds: feeds.length,
    activeFeeds: feeds.filter(f => f.generation_status === 'completed').length,
    totalProducts: feeds.reduce((sum, f) => sum + (f.product_count || 0), 0),
    pendingFeeds: feeds.filter(f => f.generation_status === 'pending').length,
    errorFeeds: feeds.filter(f => f.generation_status === 'error').length
  };

  return {
    feeds,
    isLoading,
    error,
    stats,
    createFeed: createFeedMutation.mutate,
    isCreating: createFeedMutation.isPending,
    updateFeed: updateFeedMutation.mutate,
    isUpdating: updateFeedMutation.isPending,
    deleteFeed: deleteFeedMutation.mutate,
    isDeleting: deleteFeedMutation.isPending,
    generateFeed: generateFeedMutation.mutate,
    isGenerating: generateFeedMutation.isPending
  };
}
