import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportMapping {
  source_field: string;
  target_field: string;
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'number' | 'boolean';
  default_value?: any;
}

export interface BatchImportConfig {
  file_type: 'csv' | 'excel' | 'json' | 'xml';
  has_header: boolean;
  delimiter?: string; // For CSV
  sheet_name?: string; // For Excel
  mappings: ImportMapping[];
  validation_rules?: {
    required_fields?: string[];
    unique_fields?: string[];
    custom_validator?: (row: any) => { valid: boolean; errors: string[] };
  };
  conflict_resolution: 'skip' | 'update' | 'error';
  batch_size: number;
  dry_run?: boolean;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field?: string; message: string }>;
  preview?: any[]; // For dry run
}

/**
 * Professional Batch Import Service
 * Standards: ChannelEngine (CSV/Excel), Sellercloud (Bulk operations)
 */
export class BatchImportService {
  private static instance: BatchImportService;

  private constructor() {}

  static getInstance(): BatchImportService {
    if (!BatchImportService.instance) {
      BatchImportService.instance = new BatchImportService();
    }
    return BatchImportService.instance;
  }

  /**
   * Import from file (CSV, Excel, JSON)
   */
  async importFromFile(
    file: File,
    config: BatchImportConfig,
    targetTable: string,
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Parse file
      const rawData = await this.parseFile(file, config);
      result.total = rawData.length;

      // Validate data
      const validatedData = this.validateData(rawData, config);
      result.errors.push(...validatedData.errors);

      if (config.dry_run) {
        result.preview = validatedData.data.slice(0, 10); // Preview first 10 rows
        return result;
      }

      // Transform and map data
      const mappedData = this.transformData(validatedData.data, config.mappings);

      // Import in batches
      const batches = this.createBatches(mappedData, config.batch_size);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length}`);

        try {
          const batchResult = await this.processBatch(
            batch,
            targetTable,
            userId,
            config.conflict_resolution
          );

          result.imported += batchResult.imported;
          result.updated += batchResult.updated;
          result.skipped += batchResult.skipped;
        } catch (error: any) {
          result.errors.push({
            row: i * config.batch_size,
            message: `Batch ${i + 1} failed: ${error.message}`,
          });
        }

        // Rate limiting between batches
        await this.delay(100);
      }

      // Log import activity
      await this.logImportActivity(userId, targetTable, result);

      return result;

    } catch (error: any) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Parse file based on type
   */
  private async parseFile(file: File, config: BatchImportConfig): Promise<any[]> {
    const fileContent = await file.text();

    switch (config.file_type) {
      case 'csv':
        return this.parseCSV(fileContent, config);
      
      case 'excel':
        return this.parseExcel(await file.arrayBuffer(), config);
      
      case 'json':
        return JSON.parse(fileContent);
      
      case 'xml':
        return this.parseXML(fileContent);
      
      default:
        throw new Error(`Unsupported file type: ${config.file_type}`);
    }
  }

  /**
   * Parse CSV file
   */
  private parseCSV(content: string, config: BatchImportConfig): any[] {
    const result = Papa.parse(content, {
      header: config.has_header,
      delimiter: config.delimiter || ',',
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    return result.data;
  }

  /**
   * Parse Excel file
   */
  private parseExcel(buffer: ArrayBuffer, config: BatchImportConfig): any[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = config.sheet_name || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(sheet, {
      header: config.has_header ? undefined : 1,
      defval: null,
    });
  }

  /**
   * Parse XML file (basic implementation)
   */
  private parseXML(content: string): any[] {
    // Simplified XML parsing - would need a proper XML parser library
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    const items = xmlDoc.getElementsByTagName('item');
    const result: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const obj: any = {};
      
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        obj[child.tagName] = child.textContent;
      }
      
      result.push(obj);
    }

    return result;
  }

  /**
   * Validate data
   */
  private validateData(
    data: any[],
    config: BatchImportConfig
  ): { data: any[]; errors: ImportResult['errors'] } {
    const errors: ImportResult['errors'] = [];
    const validData: any[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Check required fields
      if (config.validation_rules?.required_fields) {
        config.validation_rules.required_fields.forEach(field => {
          if (!row[field] || row[field] === '') {
            rowErrors.push(`Missing required field: ${field}`);
          }
        });
      }

      // Custom validation
      if (config.validation_rules?.custom_validator) {
        const validation = config.validation_rules.custom_validator(row);
        if (!validation.valid) {
          rowErrors.push(...validation.errors);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, message: rowErrors.join(', ') });
      } else {
        validData.push(row);
      }
    });

    return { data: validData, errors };
  }

  /**
   * Transform data using mappings
   */
  private transformData(data: any[], mappings: ImportMapping[]): any[] {
    return data.map(row => {
      const transformed: any = {};

      mappings.forEach(mapping => {
        let value = row[mapping.source_field];

        // Apply transformations
        if (mapping.transformation) {
          value = this.applyTransformation(value, mapping.transformation);
        }

        // Use default value if empty
        if ((value === null || value === undefined || value === '') && mapping.default_value !== undefined) {
          value = mapping.default_value;
        }

        transformed[mapping.target_field] = value;
      });

      return transformed;
    });
  }

  /**
   * Apply field transformation
   */
  private applyTransformation(value: any, transformation: ImportMapping['transformation']): any {
    if (value === null || value === undefined) return value;

    switch (transformation) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Create batches
   */
  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process single batch
   */
  private async processBatch(
    batch: any[],
    targetTable: string,
    userId: string,
    conflictResolution: BatchImportConfig['conflict_resolution']
  ): Promise<{ imported: number; updated: number; skipped: number }> {
    const result = { imported: 0, updated: 0, skipped: 0 };

    // Add user_id to each row
    const batchWithUserId = batch.map(row => ({ ...row, user_id: userId }));

    try {
      if (conflictResolution === 'update') {
        // Upsert (insert or update if exists)
        const { data, error } = await supabase
          .from(targetTable)
          .upsert(batchWithUserId, { onConflict: 'sku' })
          .select();

        if (error) throw error;
        
        // Count as updated if exists, imported if new
        result.imported = data?.length || 0;
      } else if (conflictResolution === 'skip') {
        // Insert only (skip duplicates)
        const { data, error } = await supabase
          .from(targetTable)
          .insert(batchWithUserId)
          .select();

        if (error) {
          // If unique constraint violation, count as skipped
          if (error.code === '23505') {
            result.skipped = batch.length;
          } else {
            throw error;
          }
        } else {
          result.imported = data?.length || 0;
        }
      } else {
        // Error on conflict
        const { data, error } = await supabase
          .from(targetTable)
          .insert(batchWithUserId)
          .select();

        if (error) throw error;
        result.imported = data?.length || 0;
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }

    return result;
  }

  /**
   * Export to CSV (works with existing product tables)
   */
  async exportToCSV(userId: string, filters?: any): Promise<string> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .limit(1000);

    if (error) throw error;

    const csv = Papa.unparse(data || []);
    return csv;
  }

  /**
   * Export to Excel
   */
  async exportToExcel(userId: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .limit(1000);

    if (error) throw error;

    const worksheet = XLSX.utils.json_to_sheet(data || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return buffer;
  }

  /**
   * Log import activity
   */
  private async logImportActivity(
    userId: string,
    targetTable: string,
    result: ImportResult
  ): Promise<void> {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'batch_import',
        description: `Imported ${result.imported} records to ${targetTable}`,
        entity_type: targetTable,
        metadata: {
          total: result.total,
          imported: result.imported,
          updated: result.updated,
          skipped: result.skipped,
          error_count: result.errors.length,
        },
      });
    } catch (error) {
      console.error('Failed to log import activity:', error);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
