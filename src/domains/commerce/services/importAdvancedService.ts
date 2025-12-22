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
  /**
   * Import depuis une URL avec validation
   */
  async importFromUrl(options: ImportFromUrlOptions) {
    try {
      // Validation de l'URL
      if (!options.url) {
        throw new Error('URL is required')
      }

      // Vérifier que c'est une URL valide
      try {
        new URL(options.url)
      } catch {
        throw new Error('Invalid URL format')
      }

      console.log('[ImportAdvanced] Starting URL import', { url: options.url })

      const { data, error } = await supabase.functions.invoke('url-import', {
        body: {
          url: options.url,
          config: options.config || {}
        }
      })

      if (error) {
        console.error('[ImportAdvanced] URL import error', error)
        throw new Error(`Import failed: ${error.message}`)
      }

      console.log('[ImportAdvanced] URL import success', data)
      return data
    } catch (error) {
      console.error('[ImportAdvanced] URL import error:', error)
      throw error
    }
  },

  /**
   * Import depuis XML/RSS avec validation
   */
  async importFromXml(options: ImportFromXmlOptions) {
    try {
      // Validation
      if (!options.xmlUrl) {
        throw new Error('XML URL is required')
      }

      // Vérifier que c'est une URL valide
      try {
        new URL(options.xmlUrl)
      } catch {
        throw new Error('Invalid XML URL format')
      }

      console.log('[ImportAdvanced] Starting XML import', { 
        url: options.xmlUrl,
        has_mapping: !!options.mapping 
      })

      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: {
          sourceUrl: options.xmlUrl,
          sourceType: 'xml',
          mapping: options.mapping || {},
          config: options.config || {}
        }
      })

      if (error) {
        console.error('[ImportAdvanced] XML import error', error)
        throw new Error(`XML import failed: ${error.message}`)
      }

      console.log('[ImportAdvanced] XML import success', data)
      return data
    } catch (error) {
      console.error('[ImportAdvanced] XML import error:', error)
      throw error
    }
  },

  async importFromFtp(options: ImportFromFtpOptions) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create FTP connector using integrations table
      const { data: connector, error: connectorError } = await supabase
        .from('integrations' as any)
        .insert({
          user_id: user.id,
          platform: 'ftp',
          platform_name: `FTP Import - ${new URL(options.ftpUrl).hostname}`,
          config: {
            url: options.ftpUrl,
            file_path: options.filePath,
            file_type: options.fileType,
            username: options.username,
            ...options.config
          },
          is_active: true
        })
        .select()
        .single();

      if (connectorError) throw connectorError;

      // Trigger FTP import
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          connectorId: (connector as any).id,
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
        .from('integrations')
        .select('*')
        .in('platform', ['ftp', 'sftp', 'api', 'webhook'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map to include name and provider for Connector type
      return (data || []).map((d: any) => ({
        ...d,
        name: d.platform_name || d.platform || 'Connector',
        provider: d.platform || 'unknown'
      }));
    } catch (error) {
      console.error('Import connectors error:', error);
      throw error;
    }
  },

  async updateConnector(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('integrations')
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
        .from('integrations')
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
