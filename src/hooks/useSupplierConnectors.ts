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

  return {
    loading,
    connectors,
    activeConnectors: Array.from(activeConnectors.keys()),
    loadAvailableConnectors,
    connectSupplier,
    disconnectSupplier: async (connectorId: string) => true,
    syncProducts: async (connectorId: string, options?: any) => null,
    fetchProductPreview: async (connectorId: string, limit?: number) => [],
    getConnectorStatus: async (connectorId: string) => 'disconnected',
    loadActiveConnectors: async () => {},
  };
};