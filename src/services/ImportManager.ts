import { supabase } from '@/integrations/supabase/client';
import { importAdvancedService } from '@/domains/commerce/services/importAdvancedService';

export interface ImportConfig {
  auto_optimize?: boolean;
  extract_images?: boolean;
  generate_seo?: boolean;
  market_analysis?: boolean;
  price_optimization?: boolean;
  validate_schema?: boolean;
  auto_detect_fields?: boolean;
  batch_size?: number;
  schedule?: string;
  auto_sync?: boolean;
  backup_enabled?: boolean;
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transformation?: 'none' | 'uppercase' | 'lowercase' | 'currency' | 'number' | 'date';
  default_value?: any;
  required?: boolean;
}

export interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  file_type: 'csv' | 'xml' | 'json' | 'api';
  field_mappings: FieldMapping[];
  validation_rules: ValidationRule[];
  config: ImportConfig;
  created_at: string;
  updated_at: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min_length' | 'max_length' | 'regex' | 'numeric' | 'email' | 'url';
  value?: any;
  message: string;
}

export interface ImportJob {
  id: string;
  user_id: string;
  source_type: 'url' | 'xml' | 'ftp' | 'csv' | 'api' | 'email';
  source_url?: string;
  file_data?: any;
  mapping_config: FieldMapping[];
  validation_rules: ValidationRule[];
  config: ImportConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  errors: string[];
  result_data?: any;
  created_at: string;
  updated_at: string;
}

export class ImportManager {
  private static instance: ImportManager;

  static getInstance(): ImportManager {
    if (!ImportManager.instance) {
      ImportManager.instance = new ImportManager();
    }
    return ImportManager.instance;
  }

  // Import Templates Management
  async createTemplate(template: Omit<ImportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ImportTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // For now, store templates in localStorage until table is created
    const templates = this.getStoredTemplates();
    const newTemplate: ImportTemplate = {
      ...template,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    templates.push(newTemplate);
    localStorage.setItem('import_templates', JSON.stringify(templates));
    return newTemplate;
  }

  async getTemplates(): Promise<ImportTemplate[]> {
    // For now, get templates from localStorage until table is created
    return this.getStoredTemplates();
  }

  async updateTemplate(id: string, updates: Partial<ImportTemplate>): Promise<ImportTemplate> {
    // For now, update templates in localStorage until table is created
    const templates = this.getStoredTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');
    
    templates[index] = { ...templates[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('import_templates', JSON.stringify(templates));
    return templates[index];
  }

  async deleteTemplate(id: string): Promise<void> {
    // For now, delete templates from localStorage until table is created
    const templates = this.getStoredTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('import_templates', JSON.stringify(filtered));
  }

  // Field Mapping and Validation
  async autoDetectFields(sampleData: any[], fileType: string): Promise<FieldMapping[]> {
    if (!sampleData.length) return [];

    const firstRow = sampleData[0];
    const mappings: FieldMapping[] = [];

    // Standard field mappings based on common field names
    const fieldMappingMap: Record<string, string> = {
      'title': 'name',
      'name': 'name',
      'product_name': 'name',
      'description': 'description',
      'desc': 'description',
      'price': 'price',
      'amount': 'price',
      'cost': 'price',
      'sku': 'sku',
      'product_code': 'sku',
      'code': 'sku',
      'stock': 'stock_quantity',
      'quantity': 'stock_quantity',
      'inventory': 'stock_quantity',
      'category': 'category',
      'cat': 'category',
      'brand': 'brand',
      'manufacturer': 'brand',
      'image': 'image_url',
      'photo': 'image_url',
      'picture': 'image_url',
      'weight': 'weight',
      'currency': 'currency',
      'ean': 'ean',
      'upc': 'upc',
      'barcode': 'ean',
    };

    Object.keys(firstRow).forEach(sourceField => {
      const normalizedField = sourceField.toLowerCase().replace(/[_\s-]/g, '');
      let targetField = null;

      // Try exact match first
      if (fieldMappingMap[sourceField.toLowerCase()]) {
        targetField = fieldMappingMap[sourceField.toLowerCase()];
      } else {
        // Try fuzzy matching
        for (const [pattern, target] of Object.entries(fieldMappingMap)) {
          if (normalizedField.includes(pattern.replace(/[_\s-]/g, ''))) {
            targetField = target;
            break;
          }
        }
      }

      if (targetField) {
        mappings.push({
          source_field: sourceField,
          target_field: targetField,
          transformation: this.detectTransformation(firstRow[sourceField], targetField),
          required: ['name', 'price', 'sku'].includes(targetField),
        });
      }
    });

    return mappings;
  }

  private detectTransformation(sampleValue: any, targetField: string): FieldMapping['transformation'] {
    if (!sampleValue) return 'none';

    const strValue = String(sampleValue).toLowerCase();

    if (targetField === 'price' && !isNaN(parseFloat(strValue))) {
      return 'number';
    }

    if (targetField === 'currency' && strValue.length <= 3) {
      return 'uppercase';
    }

    if (strValue.includes('@')) {
      return 'lowercase';
    }

    return 'none';
  }

  // Unified Import Methods
  async importFromUrl(url: string, template?: ImportTemplate, config?: ImportConfig): Promise<ImportJob> {
    const effectiveConfig = { ...template?.config, ...config };
    const mappings = template?.field_mappings || [];

    const result = await importAdvancedService.importFromUrl({
      url,
      config: effectiveConfig,
    });

    return this.createImportJob('url', { url }, mappings, template?.validation_rules || [], effectiveConfig, result);
  }

  async importFromXml(xmlUrl: string, template?: ImportTemplate, config?: ImportConfig): Promise<ImportJob> {
    const effectiveConfig = { ...template?.config, ...config };
    const mappings = template?.field_mappings || [];
    const mapping = this.fieldMappingsToRecord(mappings);

    const result = await importAdvancedService.importFromXml({
      xmlUrl,
      mapping,
      config: effectiveConfig,
    });

    return this.createImportJob('xml', { xmlUrl }, mappings, template?.validation_rules || [], effectiveConfig, result);
  }

  async importFromFtp(
    ftpUrl: string,
    username: string,
    password: string,
    filePath: string,
    fileType: 'csv' | 'xml' | 'json',
    template?: ImportTemplate,
    config?: ImportConfig
  ): Promise<ImportJob> {
    const effectiveConfig = { ...template?.config, ...config };
    const mappings = template?.field_mappings || [];

    const result = await importAdvancedService.importFromFtp({
      ftpUrl,
      username,
      password,
      filePath,
      fileType,
      config: effectiveConfig,
    });

    return this.createImportJob('ftp', { ftpUrl, filePath, fileType }, mappings, template?.validation_rules || [], effectiveConfig, result);
  }

  async importFromCsv(fileData: any[], template?: ImportTemplate, config?: ImportConfig): Promise<ImportJob> {
    const effectiveConfig = { ...template?.config, ...config };
    let mappings = template?.field_mappings || [];

    // Auto-detect fields if no template provided
    if (!template && fileData.length > 0) {
      mappings = await this.autoDetectFields(fileData, 'csv');
    }

    // Process the CSV data
    const processedData = this.processDataWithMappings(fileData, mappings);
    const validationErrors = this.validateData(processedData, template?.validation_rules || []);

    const result = {
      total_rows: fileData.length,
      processed_rows: processedData.length,
      success_rows: processedData.length - validationErrors.length,
      error_rows: validationErrors.length,
      errors: validationErrors,
      data: processedData,
    };

    return this.createImportJob('csv', { fileData }, mappings, template?.validation_rules || [], effectiveConfig, result);
  }

  // Email Import (for dropshipping suppliers sending catalogs via email)
  async importFromEmail(emailData: any, template?: ImportTemplate, config?: ImportConfig): Promise<ImportJob> {
    const effectiveConfig = { ...template?.config, ...config };
    const mappings = template?.field_mappings || [];

    // Extract attachments and parse them
    const attachments = emailData.attachments || [];
    let allData: any[] = [];

    for (const attachment of attachments) {
      if (attachment.contentType?.includes('csv')) {
        const csvData = this.parseCsv(attachment.content);
        allData = [...allData, ...csvData];
      } else if (attachment.contentType?.includes('xml')) {
        const xmlData = this.parseXml(attachment.content);
        allData = [...allData, ...xmlData];
      }
    }

    const processedData = this.processDataWithMappings(allData, mappings);
    const validationErrors = this.validateData(processedData, template?.validation_rules || []);

    const result = {
      total_rows: allData.length,
      processed_rows: processedData.length,
      success_rows: processedData.length - validationErrors.length,
      error_rows: validationErrors.length,
      errors: validationErrors,
      data: processedData,
    };

    return this.createImportJob('email', emailData, mappings, template?.validation_rules || [], effectiveConfig, result);
  }

  // Data Processing Helpers
  private processDataWithMappings(data: any[], mappings: FieldMapping[]): any[] {
    return data.map(row => {
      const processedRow: any = {};

      mappings.forEach(mapping => {
        let value = row[mapping.source_field];

        // Apply default value if missing
        if (value === undefined || value === null || value === '') {
          value = mapping.default_value;
        }

        // Apply transformation
        if (value !== undefined && value !== null) {
          switch (mapping.transformation) {
            case 'uppercase':
              value = String(value).toUpperCase();
              break;
            case 'lowercase':
              value = String(value).toLowerCase();
              break;
            case 'number':
              value = parseFloat(String(value).replace(/[^\d.-]/g, ''));
              break;
            case 'currency':
              const numericValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
              value = isNaN(numericValue) ? 0 : numericValue;
              break;
            case 'date':
              value = new Date(value).toISOString();
              break;
          }
        }

        processedRow[mapping.target_field] = value;
      });

      return processedRow;
    });
  }

  private validateData(data: any[], rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    data.forEach((row, index) => {
      rules.forEach(rule => {
        const value = row[rule.field];
        let isValid = true;

        switch (rule.type) {
          case 'required':
            isValid = value !== undefined && value !== null && value !== '';
            break;
          case 'min_length':
            isValid = String(value || '').length >= (rule.value || 0);
            break;
          case 'max_length':
            isValid = String(value || '').length <= (rule.value || Infinity);
            break;
          case 'numeric':
            isValid = !isNaN(parseFloat(value));
            break;
          case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            break;
          case 'url':
            try {
              new URL(value);
            } catch {
              isValid = false;
            }
            break;
          case 'regex':
            isValid = new RegExp(rule.value).test(value);
            break;
        }

        if (!isValid) {
          errors.push(`Row ${index + 1}: ${rule.message}`);
        }
      });
    });

    return errors;
  }

  private async createImportJob(
    sourceType: ImportJob['source_type'],
    sourceData: any,
    mappings: FieldMapping[],
    validationRules: ValidationRule[],
    config: ImportConfig,
    result: any
  ): Promise<ImportJob> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Create a simplified job for demo (would save to database in production)
    const job: ImportJob = {
      id: crypto.randomUUID(),
      user_id: user.user.id,
      source_type: sourceType,
      source_url: sourceData.url || sourceData.xmlUrl || sourceData.ftpUrl,
      file_data: sourceData.fileData || sourceData,
      mapping_config: mappings,
      validation_rules: validationRules,
      config: config,
      total_rows: result?.total_rows || 0,
      processed_rows: result?.processed_rows || 0,
      success_rows: result?.success_rows || 0,
      error_rows: result?.error_rows || 0,
      errors: result?.errors || [],
      result_data: result,
      status: (result?.error_rows || 0) > 0 ? 'completed' : 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return job;
  }

  private fieldMappingsToRecord(mappings: FieldMapping[]): Record<string, string> {
    const record: Record<string, string> = {};
    mappings.forEach(mapping => {
      record[mapping.source_field] = mapping.target_field;
    });
    return record;
  }

  private parseCsv(content: string): any[] {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  }

  private parseXml(content: string): any[] {
    // Simple XML parsing - in production, use a proper XML parser
    const data: any[] = [];
    // This is a simplified implementation
    // You would use DOMParser or similar in production
    return data;
  }

  // Helper method for localStorage templates
  private getStoredTemplates(): ImportTemplate[] {
    try {
      const stored = localStorage.getItem('import_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export const importManager = ImportManager.getInstance();