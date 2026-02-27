import { supabase } from '@/integrations/supabase/client';

export interface CRMIntegration {
  id: string;
  provider: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'freshworks';
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  credentials: Record<string, any>;
  sync_settings: {
    frequency: 'realtime' | 'hourly' | 'daily';
    entities: string[];
    last_sync: string | null;
  };
  configuration: Record<string, any>;
}

export interface CRMSyncResult {
  success: boolean;
  contacts_synced: number;
  deals_synced: number;
  companies_synced: number;
  errors: string[];
  sync_time_ms: number;
}

export class CRMConnector {
  private static instance: CRMConnector;
  
  public static getInstance(): CRMConnector {
    if (!this.instance) {
      this.instance = new CRMConnector();
    }
    return this.instance;
  }

  // Connect to CRM system
  async connectCRM(integration: Partial<CRMIntegration>): Promise<CRMIntegration> {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'connect_crm',
          provider: integration.provider,
          credentials: integration.credentials,
          configuration: integration.configuration
        }
      });

      if (error) throw error;
      
      return data.integration;
    } catch (error) {
      console.error('CRM connection failed:', error);
      throw error;
    }
  }

  // Salesforce Integration
  async connectSalesforce(credentials: {
    client_id: string;
    client_secret: string;
    username: string;
    password: string;
    security_token: string;
    sandbox: boolean;
  }): Promise<CRMIntegration> {
    return this.connectCRM({
      provider: 'salesforce',
      name: 'Salesforce',
      credentials,
      configuration: {
        api_version: '58.0',
        objects: ['Account', 'Contact', 'Opportunity', 'Product2'],
        instance_url: credentials.sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
      }
    });
  }

  // HubSpot Integration
  async connectHubSpot(credentials: {
    access_token: string;
    refresh_token: string;
    portal_id: string;
  }): Promise<CRMIntegration> {
    return this.connectCRM({
      provider: 'hubspot',
      name: 'HubSpot',
      credentials,
      configuration: {
        api_base: 'https://api.hubapi.com',
        endpoints: {
          contacts: '/crm/v3/objects/contacts',
          deals: '/crm/v3/objects/deals',
          companies: '/crm/v3/objects/companies',
          products: '/crm/v3/objects/products'
        }
      }
    });
  }

  // Pipedrive Integration
  async connectPipedrive(credentials: {
    api_token: string;
    company_domain: string;
  }): Promise<CRMIntegration> {
    return this.connectCRM({
      provider: 'pipedrive',
      name: 'Pipedrive',
      credentials,
      configuration: {
        api_base: `https://${credentials.company_domain}.pipedrive.com/api/v1`,
        entities: ['persons', 'deals', 'organizations', 'products']
      }
    });
  }

  // Sync CRM data
  async syncCRMData(integrationId: string, entities: string[] = []): Promise<CRMSyncResult> {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'sync_crm',
          integration_id: integrationId,
          entities
        }
      });

      if (error) throw error;
      
      return data.sync_result;
    } catch (error) {
      console.error('CRM sync failed:', error);
      throw error;
    }
  }

  // Bidirectional sync - push data to CRM
  async pushToCRM(integrationId: string, entity: string, data: any[]): Promise<any> {
    try {
      const { data: result, error } = await supabase.functions.invoke('enterprise-integrations', {
        body: {
          action: 'push_to_crm',
          integration_id: integrationId,
          entity,
          data
        }
      });

      if (error) throw error;
      
      return result;
    } catch (error) {
      console.error('Push to CRM failed:', error);
      throw error;
    }
  }

  // Transform CRM data to our format
  transformCRMData(provider: string, rawData: any[], entity: string): any[] {
    switch (provider) {
      case 'salesforce':
        return this.transformSalesforceData(rawData, entity);
      case 'hubspot':
        return this.transformHubSpotData(rawData, entity);
      case 'pipedrive':
        return this.transformPipedriveData(rawData, entity);
      default:
        return rawData;
    }
  }

  private transformSalesforceData(data: any[], entity: string): any[] {
    switch (entity) {
      case 'contacts':
        return data.map(contact => ({
          external_id: contact.Id,
          name: `${contact.FirstName || ''} ${contact.LastName || ''}`.trim(),
          email: contact.Email,
          phone: contact.Phone,
          company: contact.Account?.Name,
          title: contact.Title,
          lead_score: contact.Lead_Score__c || 0,
          lifecycle_stage: contact.Lead_Status,
          source: contact.LeadSource
        }));
      case 'companies':
        return data.map(account => ({
          external_id: account.Id,
          name: account.Name,
          website: account.Website,
          industry: account.Industry,
          employees: account.NumberOfEmployees,
          annual_revenue: account.AnnualRevenue,
          address: {
            street: account.BillingStreet,
            city: account.BillingCity,
            state: account.BillingState,
            postal_code: account.BillingPostalCode,
            country: account.BillingCountry
          }
        }));
      default:
        return data;
    }
  }

  private transformHubSpotData(data: any[], entity: string): any[] {
    switch (entity) {
      case 'contacts':
        return data.map(contact => ({
          external_id: contact.id,
          name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
          email: contact.properties.email,
          phone: contact.properties.phone,
          company: contact.properties.company,
          title: contact.properties.jobtitle,
          lead_score: contact.properties.hubspotscore || 0,
          lifecycle_stage: contact.properties.lifecyclestage,
          source: contact.properties.hs_analytics_source
        }));
      default:
        return data;
    }
  }

  private transformPipedriveData(data: any[], entity: string): any[] {
    switch (entity) {
      case 'contacts':
        return data.map(person => ({
          external_id: person.id,
          name: person.name,
          email: person.primary_email,
          phone: person.phone?.[0]?.value,
          company: person.org_name,
          lead_score: 0,
          lifecycle_stage: 'lead',
          source: 'pipedrive'
        }));
      default:
        return data;
    }
  }

  // Get CRM integrations
  async getCRMIntegrations(userId: string): Promise<CRMIntegration[]> {
    try {
      const { data, error } = await (supabase.from('enterprise_integrations') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('integration_type', 'crm');

      if (error) throw error;
      
      // Transform database records to CRMIntegration format
      return (data || []).map((item: any) => ({
        id: item.id,
        provider: item.name as any,
        name: item.name,
        status: item.sync_status as any,
        credentials: (item.config || {}) as any,
        sync_settings: {
          frequency: 'daily' as any,
          entities: [],
          last_sync: item.last_sync_at
        },
        configuration: (item.config || {}) as any
      }));
    } catch (error) {
      console.error('Failed to fetch CRM integrations:', error);
      return [];
    }
  }

  // Webhook handling for real-time updates
  async handleCRMWebhook(provider: string, payload: any): Promise<void> {
    try {
      const transformedData = this.transformWebhookData(provider, payload);
      
      // Update local data based on webhook
      await this.updateLocalData(transformedData);
      
    } catch (error) {
      console.error('CRM webhook handling failed:', error);
    }
  }

  private transformWebhookData(provider: string, payload: any): any {
    switch (provider) {
      case 'salesforce':
        return {
          id: payload.sobject.Id,
          type: payload.sobject.attributes.type,
          action: payload.eventType,
          data: payload.sobject
        };
      case 'hubspot':
        return {
          id: payload.objectId,
          type: payload.subscriptionType,
          action: payload.changeFlag,
          data: payload.properties
        };
      default:
        return payload;
    }
  }

  private async updateLocalData(_data: any): Promise<void> {
    // Update local database based on CRM changes
    // TODO: Implement actual CRM data sync to local DB
  }
}

export const crmConnector = CRMConnector.getInstance();