import { supabase } from '@/integrations/supabase/client';

export interface ImportFromUrlOptions {
  url: string;
  config?: {
    auto_optimize?: boolean;
    extract_images?: boolean;
    generate_seo?: boolean;
    market_analysis?: boolean;
    price_optimization?: boolean;
  };
}

export interface ImportFromXmlOptions {
  xmlUrl: string;
  mapping?: Record<string, string>;
  config?: {
    validate_schema?: boolean;
    auto_detect_fields?: boolean;
    batch_size?: number;
  };
}

export interface ImportFromFtpOptions {
  ftpUrl: string;
  username: string;
  password: string;
  filePath: string;
  fileType: 'csv' | 'xml' | 'json';
  config?: {
    schedule?: string;
    auto_sync?: boolean;
    backup_enabled?: boolean;
  };
}

export const importAdvancedService = {
  async importFromUrl(options: ImportFromUrlOptions) {
    try {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: {
          url: options.url,
          config: options.config || {}
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('URL import error:', error);
      throw error;
    }
  },

  async importFromXml(options: ImportFromXmlOptions) {
    try {
      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: {
          sourceUrl: options.xmlUrl,
          sourceType: 'xml',
          mapping: options.mapping || {},
          config: options.config || {}
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('XML import error:', error);
      throw error;
    }
  },

  async importFromFtp(options: ImportFromFtpOptions) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create FTP connector first
      const { data: connector, error: connectorError } = await supabase
        .from('import_connectors')
        .insert({
          user_id: user.id,
          name: `FTP Import - ${new URL(options.ftpUrl).hostname}`,
          provider: 'ftp',
          config: {
            url: options.ftpUrl,
            file_path: options.filePath,
            file_type: options.fileType,
            ...options.config
          },
          credentials: {
            username: options.username,
            password: options.password // In production, this should be encrypted
          }
        })
        .select()
        .single();

      if (connectorError) throw connectorError;

      // Trigger FTP import
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          connectorId: connector.id,
          immediate: true
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('FTP import error:', error);
      throw error;
    }
  },

  async getImportHistory() {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Import history error:', error);
      throw error;
    }
  },

  async getImportConnectors() {
    try {
      const { data, error } = await supabase
        .from('import_connectors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Import connectors error:', error);
      throw error;
    }
  },

  async updateConnector(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('import_connectors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update connector error:', error);
      throw error;
    }
  },

  async deleteConnector(id: string) {
    try {
      const { error } = await supabase
        .from('import_connectors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete connector error:', error);
      throw error;
    }
  },

  async testConnection(connectorId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('test-import-connection', {
        body: { connectorId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Test connection error:', error);
      throw error;
    }
  }
};