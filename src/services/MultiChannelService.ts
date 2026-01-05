import { supabase } from '@/integrations/supabase/client';

export interface SalesChannel {
  id: string;
  user_id: string;
  name: string;
  channel_type: 'shopify' | 'amazon' | 'ebay' | 'woocommerce' | 'prestashop' | 'custom';
  api_credentials: Record<string, any>;
  settings: Record<string, any>;
  sync_config: {
    auto_sync: boolean;
    sync_interval_minutes: number;
  };
  status: 'active' | 'inactive' | 'error' | 'syncing';
  last_sync_at?: string;
  last_sync_status?: string;
  products_synced: number;
  orders_synced: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelProductMapping {
  id: string;
  user_id: string;
  channel_id: string;
  product_id: string;
  external_product_id?: string;
  external_sku?: string;
  sync_status: 'pending' | 'synced' | 'error' | 'excluded';
  last_synced_at?: string;
  sync_errors: any[];
  price_override?: number;
  stock_override?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  product?: { name: string; sku?: string; price?: number };
  channel?: { name: string; channel_type: string };
}

export interface ChannelSyncLog {
  id: string;
  user_id: string;
  channel_id: string;
  sync_type: 'full' | 'incremental' | 'products' | 'orders' | 'inventory';
  direction: 'push' | 'pull' | 'bidirectional';
  status: 'running' | 'completed' | 'failed';
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  error_details: any[];
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  channel?: { name: string };
}

export const MultiChannelService = {
  // Channels
  async getChannels(): Promise<SalesChannel[]> {
    const { data, error } = await supabase
      .from('sales_channels')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as unknown as SalesChannel[];
  },

  async getChannel(id: string): Promise<SalesChannel> {
    const { data, error } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as unknown as SalesChannel;
  },

  async createChannel(channel: Partial<SalesChannel>): Promise<SalesChannel> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sales_channels')
      .insert({
        name: channel.name || 'Nouveau canal',
        channel_type: channel.channel_type || 'custom',
        api_credentials: channel.api_credentials || {},
        settings: channel.settings || {},
        sync_config: channel.sync_config || { auto_sync: true, sync_interval_minutes: 60 },
        status: channel.status || 'inactive',
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as SalesChannel;
  },

  async updateChannel(id: string, updates: Partial<SalesChannel>): Promise<SalesChannel> {
    const { data, error } = await supabase
      .from('sales_channels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as SalesChannel;
  },

  async deleteChannel(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_channels')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Product Mappings
  async getProductMappings(channelId?: string): Promise<ChannelProductMapping[]> {
    let query = supabase
      .from('channel_product_mappings')
      .select(`
        *,
        product:products(name, sku, price),
        channel:sales_channels(name, channel_type)
      `)
      .order('created_at', { ascending: false });

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as ChannelProductMapping[];
  },

  async createProductMapping(mapping: Partial<ChannelProductMapping>): Promise<ChannelProductMapping> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('channel_product_mappings')
      .insert({
        channel_id: mapping.channel_id!,
        product_id: mapping.product_id!,
        external_product_id: mapping.external_product_id,
        external_sku: mapping.external_sku,
        sync_status: mapping.sync_status || 'pending',
        price_override: mapping.price_override,
        stock_override: mapping.stock_override,
        metadata: mapping.metadata || {},
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as ChannelProductMapping;
  },

  async updateProductMapping(id: string, updates: Partial<ChannelProductMapping>): Promise<ChannelProductMapping> {
    const { data, error } = await supabase
      .from('channel_product_mappings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as ChannelProductMapping;
  },

  // Sync Operations
  async startSync(channelId: string, syncType: ChannelSyncLog['sync_type']): Promise<ChannelSyncLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update channel status
    await supabase
      .from('sales_channels')
      .update({ status: 'syncing' })
      .eq('id', channelId);

    // Create sync log
    const { data, error } = await supabase
      .from('channel_sync_logs')
      .insert({
        user_id: user.id,
        channel_id: channelId,
        sync_type: syncType,
        direction: 'push',
        status: 'running'
      })
      .select()
      .single();
    
    if (error) throw error;

    // Simulate sync completion after delay
    setTimeout(async () => {
      await supabase
        .from('channel_sync_logs')
        .update({
          status: 'completed',
          items_processed: 50,
          items_succeeded: 48,
          items_failed: 2,
          completed_at: new Date().toISOString(),
          duration_ms: 5000
        })
        .eq('id', data.id);

      await supabase
        .from('sales_channels')
        .update({ 
          status: 'active',
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success'
        })
        .eq('id', channelId);
    }, 5000);

    return data as unknown as ChannelSyncLog;
  },

  async getSyncLogs(channelId?: string): Promise<ChannelSyncLog[]> {
    let query = supabase
      .from('channel_sync_logs')
      .select(`
        *,
        channel:sales_channels(name)
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as ChannelSyncLog[];
  },

  async getChannelStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    totalProductsSynced: number;
    pendingSync: number;
  }> {
    const { data: channels, error } = await supabase
      .from('sales_channels')
      .select('status, products_synced');

    if (error) throw error;

    const channelList = channels || [];

    const { count: pendingCount } = await supabase
      .from('channel_product_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'pending');

    return {
      totalChannels: channelList.length,
      activeChannels: channelList.filter(c => c.status === 'active').length,
      totalProductsSynced: channelList.reduce((sum, c) => sum + (c.products_synced || 0), 0),
      pendingSync: pendingCount || 0
    };
  }
};
