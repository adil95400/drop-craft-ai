import { useState, useCallback } from 'react';
import { ConnectorFactory } from '@/services/connectors/ConnectorFactory';
import { BaseConnector } from '@/services/connectors/BaseConnector';
import { JobQueueManager } from '@/services/JobQueue';
import { 
  SupplierConnector, 
  SupplierCredentials, 
  SupplierProduct,
  ConnectorAuth 
} from '@/types/suppliers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useSupplierConnectors = () => {
  const [loading, setLoading] = useState(false);
  const [connectors, setConnectors] = useState<SupplierConnector[]>([]);
  const [activeConnectors, setActiveConnectors] = useState<Map<string, BaseConnector>>(new Map());
  const { user } = useAuth();
  const { toast } = useToast();
  const jobManager = JobQueueManager.getInstance();

  const loadAvailableConnectors = useCallback(() => {
    const available = ConnectorFactory.getAvailableConnectors();
    setConnectors(available);
    return available;
  }, []);

  const connectSupplier = useCallback(async (
    connectorId: string,
    credentials: SupplierCredentials
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to connect suppliers.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Validate credentials format
      if (!ConnectorFactory.validateCredentials(connectorId, credentials)) {
        toast({
          title: "Invalid Credentials",
          description: "Please provide all required credential fields.",
          variant: "destructive",
        });
        return false;
      }

      // Create connector instance
      const connectorInstance = ConnectorFactory.createConnectorInstance(connectorId, credentials);
      if (!connectorInstance) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      // Test connection
      const isValid = await connectorInstance.validateCredentials();
      if (!isValid) {
        toast({
          title: "Connection Failed",
          description: "Invalid credentials or connection error.",
          variant: "destructive",
        });
        return false;
      }

      // Save to database (encrypted)
      const { error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          platform_type: 'supplier',
          platform_name: connectorId,
          connection_status: 'connected',
          encrypted_credentials: credentials, // This should be encrypted in production
          is_active: true,
        });

      if (error) {
        throw error;
      }

      // Store active connector
      setActiveConnectors(prev => new Map(prev).set(connectorId, connectorInstance));

      toast({
        title: "Supplier Connected",
        description: `Successfully connected to ${ConnectorFactory.getConnector(connectorId)?.displayName}.`,
      });

      return true;
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to supplier. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const disconnectSupplier = useCallback(async (connectorId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);

      // Update database
      const { error } = await supabase
        .from('integrations')
        .update({
          connection_status: 'disconnected',
          is_active: false,
        })
        .eq('user_id', user.id)
        .eq('platform_name', connectorId);

      if (error) {
        throw error;
      }

      // Remove from active connectors
      setActiveConnectors(prev => {
        const newMap = new Map(prev);
        newMap.delete(connectorId);
        return newMap;
      });

      toast({
        title: "Supplier Disconnected",
        description: `Successfully disconnected from ${ConnectorFactory.getConnector(connectorId)?.displayName}.`,
      });

      return true;
    } catch (error) {
      console.error('Disconnection error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect supplier.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const syncProducts = useCallback(async (
    connectorId: string,
    options: {
      fullSync?: boolean;
      category?: string;
      limit?: number;
    } = {}
  ): Promise<string | null> => {
    if (!user) return null;

    const connector = activeConnectors.get(connectorId);
    if (!connector) {
      toast({
        title: "Connector Not Found",
        description: "Please connect to the supplier first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create a job for product sync
      const jobId = await jobManager.addJob('imports', {
        userId: user.id,
        supplierId: connectorId,
        type: options.fullSync ? 'full_sync' : 'incremental',
        priority: 'normal',
        scheduledAt: new Date(),
        totalItems: options.limit || 1000,
        metadata: {
          category: options.category,
          connector: connectorId,
        },
      });

      toast({
        title: "Sync Started",
        description: `Product sync job created. Job ID: ${jobId}`,
      });

      return jobId;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to start product sync.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, activeConnectors, jobManager, toast]);

  const fetchProductPreview = useCallback(async (
    connectorId: string,
    limit: number = 10
  ): Promise<SupplierProduct[]> => {
    const connector = activeConnectors.get(connectorId);
    if (!connector) return [];

    try {
      setLoading(true);
      const products = await connector.fetchProducts({ limit });
      return products;
    } catch (error) {
      console.error('Preview fetch error:', error);
      toast({
        title: "Preview Error",
        description: "Failed to fetch product preview.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeConnectors, toast]);

  const getConnectorStatus = useCallback(async (connectorId: string): Promise<string> => {
    if (!user) return 'disconnected';

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('connection_status, is_active')
        .eq('user_id', user.id)
        .eq('platform_name', connectorId)
        .single();

      if (error || !data) return 'disconnected';
      
      return data.is_active ? data.connection_status : 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  }, [user]);

  const loadActiveConnectors = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('platform_name, encrypted_credentials')
        .eq('user_id', user.id)
        .eq('platform_type', 'supplier')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const newActiveConnectors = new Map<string, BaseConnector>();
      
      for (const integration of data || []) {
        const connector = ConnectorFactory.createConnectorInstance(
          integration.platform_name,
          integration.encrypted_credentials as SupplierCredentials
        );
        if (connector) {
          newActiveConnectors.set(integration.platform_name, connector);
        }
      }

      setActiveConnectors(newActiveConnectors);
    } catch (error) {
      console.error('Failed to load active connectors:', error);
    }
  }, [user]);

  return {
    loading,
    connectors,
    activeConnectors: Array.from(activeConnectors.keys()),
    loadAvailableConnectors,
    connectSupplier,
    disconnectSupplier,
    syncProducts,
    fetchProductPreview,
    getConnectorStatus,
    loadActiveConnectors,
  };
};