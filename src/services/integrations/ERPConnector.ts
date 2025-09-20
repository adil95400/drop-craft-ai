import { supabase } from '@/integrations/supabase/client';

export interface ERPIntegration {
  id: string;
  provider: 'sap' | 'oracle' | 'microsoft' | 'sage' | 'netsuite';
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  credentials: Record<string, any>;
  sync_settings: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    entities: string[];
    last_sync: string | null;
  };
  configuration: Record<string, any>;
}

export interface ERPSyncResult {
  success: boolean;
  entities_synced: number;
  errors: string[];
  sync_time_ms: number;
  next_sync_at: string;
}

export class ERPConnector {
  private static instance: ERPConnector;
  
  public static getInstance(): ERPConnector {
    if (!this.instance) {
      this.instance = new ERPConnector();
    }
    return this.instance;
  }

  // Connect to ERP system
  async connectERP(integration: Partial<ERPIntegration>): Promise<ERPIntegration> {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'connect_erp',
          provider: integration.provider,
          credentials: integration.credentials,
          configuration: integration.configuration
        }
      });

      if (error) throw error;
      
      return data.integration;
    } catch (error) {
      console.error('ERP connection failed:', error);
      throw error;
    }
  }

  // Sync data from ERP
  async syncERPData(integrationId: string, entities: string[] = []): Promise<ERPSyncResult> {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'sync_erp',
          integration_id: integrationId,
          entities
        }
      });

      if (error) throw error;
      
      return data.sync_result;
    } catch (error) {
      console.error('ERP sync failed:', error);
      throw error;
    }
  }

  // SAP-specific methods
  async connectSAP(credentials: {
    server_url: string;
    client: string;
    username: string;
    password: string;
    system_number: string;
  }): Promise<ERPIntegration> {
    return this.connectERP({
      provider: 'sap',
      name: 'SAP ERP',
      credentials,
      configuration: {
        modules: ['SD', 'MM', 'FI'], // Sales, Materials, Finance
        data_mapping: {
          products: 'MARA',
          customers: 'KNA1',
          orders: 'VBAK'
        }
      }
    });
  }

  // Oracle ERP Cloud methods
  async connectOracle(credentials: {
    instance_url: string;
    username: string;
    password: string;
    api_version: string;
  }): Promise<ERPIntegration> {
    return this.connectERP({
      provider: 'oracle',
      name: 'Oracle ERP Cloud',
      credentials,
      configuration: {
        modules: ['SCM', 'CRM', 'HCM'],
        rest_endpoints: {
          items: '/fscmRestApi/resources/11.13.18.05/items',
          customers: '/crmRestApi/resources/11.13.18.05/accounts',
          orders: '/fscmRestApi/resources/11.13.18.05/salesOrders'
        }
      }
    });
  }

  // Microsoft Dynamics 365 methods
  async connectDynamics365(credentials: {
    tenant_id: string;
    client_id: string;
    client_secret: string;
    resource_url: string;
  }): Promise<ERPIntegration> {
    return this.connectERP({
      provider: 'microsoft',
      name: 'Microsoft Dynamics 365',
      credentials,
      configuration: {
        entities: ['products', 'customers', 'salesorders', 'invoices'],
        odata_version: '4.0'
      }
    });
  }

  // Get ERP integrations for user
  async getERPIntegrations(userId: string): Promise<ERPIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_type', 'erp');

      if (error) throw error;
      
      // Transform database records to ERPIntegration format
      return (data || []).map(item => ({
        id: item.id,
        provider: item.provider_name as any,
        name: item.provider_name,
        status: item.sync_status as any,
        credentials: item.authentication_data as any,
        sync_settings: {
          frequency: 'daily' as any,
          entities: [],
          last_sync: item.last_sync_at
        },
        configuration: item.configuration as any
      }));
    } catch (error) {
      console.error('Failed to fetch ERP integrations:', error);
      return [];
    }
  }

  // Real-time sync monitoring
  async startRealtimeSync(integrationId: string): Promise<void> {
    try {
      await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'start_realtime_sync',
          integration_id: integrationId
        }
      });
    } catch (error) {
      console.error('Failed to start realtime sync:', error);
      throw error;
    }
  }

  // Data transformation and mapping
  transformERPData(provider: string, rawData: any[], entity: string): any[] {
    switch (provider) {
      case 'sap':
        return this.transformSAPData(rawData, entity);
      case 'oracle':
        return this.transformOracleData(rawData, entity);
      case 'microsoft':
        return this.transformDynamicsData(rawData, entity);
      default:
        return rawData;
    }
  }

  private transformSAPData(data: any[], entity: string): any[] {
    // SAP-specific data transformation logic
    switch (entity) {
      case 'products':
        return data.map(item => ({
          external_id: item.MATNR,
          name: item.MAKTX,
          sku: item.MATNR,
          price: parseFloat(item.NETPR || 0),
          category: item.MTART,
          description: item.MAKTG || item.MAKTX
        }));
      case 'customers':
        return data.map(customer => ({
          external_id: customer.KUNNR,
          name: customer.NAME1,
          email: customer.SMTP_ADDR,
          phone: customer.TELF1,
          address: {
            street: customer.STRAS,
            city: customer.ORT01,
            postal_code: customer.PSTLZ,
            country: customer.LAND1
          }
        }));
      default:
        return data;
    }
  }

  private transformOracleData(data: any[], entity: string): any[] {
    // Oracle ERP Cloud transformation logic
    switch (entity) {
      case 'products':
        return data.map(item => ({
          external_id: item.ItemNumber,
          name: item.ItemDescription,
          sku: item.ItemNumber,
          price: parseFloat(item.ListPrice || 0),
          category: item.ItemClass,
          description: item.LongDescription
        }));
      default:
        return data;
    }
  }

  private transformDynamicsData(data: any[], entity: string): any[] {
    // Microsoft Dynamics 365 transformation logic
    switch (entity) {
      case 'products':
        return data.map(product => ({
          external_id: product.productnumber,
          name: product.name,
          sku: product.productnumber,
          price: parseFloat(product.price || 0),
          category: product.productstructure,
          description: product.description
        }));
      default:
        return data;
    }
  }

  // Error handling and retry logic
  async handleSyncError(integrationId: string, error: any): Promise<void> {
    console.error(`ERP sync error for integration ${integrationId}:`, error);
    
    // Log error to system logs
    console.log('Integration error logged:', {
      integration_id: integrationId,
      error_type: 'sync_error',
      error_message: error.message,
      error_details: error,
      occurred_at: new Date().toISOString()
    });

    // Notify admin users via notifications service
    try {
      await supabase.functions.invoke('notifications', {
        body: {
          type: 'integration_error',
          integration_id: integrationId,
          error: error.message
        }
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }
}

export const erpConnector = ERPConnector.getInstance();