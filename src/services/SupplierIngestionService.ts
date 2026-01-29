import { supabase } from '@/integrations/supabase/client';

// Interface temporaire pour les jobs d'ingestion
// En attendant la création des vraies tables
export interface IngestionJob {
  id: string;
  supplier_feed_id: string;
  job_type: 'full_sync' | 'incremental' | 'validation' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_items: number;
  processed_items: number;
  success_count: number;
  error_count: number;
  started_at?: string;
  completed_at?: string;
  error_details?: any;
  job_config: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductIngestionResult {
  success: boolean;
  productId?: string;
  errors?: string[];
  warnings?: string[];
}

export class SupplierIngestionService {
  private static instance: SupplierIngestionService;

  public static getInstance(): SupplierIngestionService {
    if (!SupplierIngestionService.instance) {
      SupplierIngestionService.instance = new SupplierIngestionService();
    }
    return SupplierIngestionService.instance;
  }

  async createIngestionJob(
    supplierFeedId: string,
    jobType: 'full_sync' | 'incremental' | 'validation' | 'cleanup',
    config: any = {}
  ): Promise<IngestionJob | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Simulation temporaire - en attendant la vraie table ingestion_jobs
      const mockJob: IngestionJob = {
        id: crypto.randomUUID(),
        supplier_feed_id: supplierFeedId,
        job_type: jobType,
        status: 'pending',
        progress: 0,
        total_items: 0,
        processed_items: 0,
        success_count: 0,
        error_count: 0,
        job_config: config,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return mockJob;
    } catch (error) {
      console.error('Erreur création job ingestion:', error);
      return null;
    }
  }

  async updateJobProgress(
    jobId: string,
    progress: number,
    processedItems: number,
    successCount: number,
    errorCount: number
  ): Promise<boolean> {
    try {
      // Simulation temporaire
      console.log(`Job ${jobId} progression: ${progress}%, ${processedItems} items traités`);
      return true;
    } catch (error) {
      console.error('Erreur mise à jour progression:', error);
      return false;
    }
  }

  async completeJob(
    jobId: string,
    status: 'completed' | 'failed' | 'cancelled',
    errorDetails?: any
  ): Promise<boolean> {
    try {
      // Simulation temporaire
      console.log(`Job ${jobId} terminé avec statut: ${status}`);
      return true;
    } catch (error) {
      console.error('Erreur finalisation job:', error);
      return false;
    }
  }

  async getActiveJobs(userId?: string): Promise<IngestionJob[]> {
    try {
      // Simulation temporaire
      return [];
    } catch (error) {
      console.error('Erreur récupération jobs actifs:', error);
      return [];
    }
  }

  async ingestProduct(
    supplierFeedId: string,
    rawProductData: any,
    fieldMapping: Record<string, string> = {}
  ): Promise<ProductIngestionResult> {
    try {
      // Appliquer le mapping des champs
      const mappedData = this.applyFieldMapping(rawProductData, fieldMapping);
      
      // Valider les données
      const validation = this.validateProductData(mappedData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Normaliser les données
      const normalizedData = this.normalizeProductData(mappedData);

      // Vérifier les doublons
      const existingProduct = await this.findExistingProduct(
        normalizedData.sku,
        normalizedData.supplier_product_id
      );

      let productId: string;

      if (existingProduct) {
        // Mise à jour
        const { data, error } = await supabase
          .from('supplier_products')
          .update({
            ...normalizedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProduct.id)
          .select('id')
          .single();

        if (error) throw error;
        productId = data.id;
      } else {
        // Création
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await supabase
          .from('supplier_products')
          .insert({
            ...normalizedData,
            supplier_feed_id: supplierFeedId,
            user_id: user.id,
          })
          .select('id')
          .single();

        if (error) throw error;
        productId = data.id;
      }

      return {
        success: true,
        productId,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('Erreur ingestion produit:', error);
      return {
        success: false,
        errors: [`Erreur ingestion: ${error}`],
      };
    }
  }

  private applyFieldMapping(rawData: any, mapping: Record<string, string>): any {
    const mappedData: any = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const value = this.getNestedValue(rawData, sourceField);
      if (value !== undefined) {
        mappedData[targetField] = value;
      }
    }

    // Copier les champs non mappés
    for (const [key, value] of Object.entries(rawData)) {
      if (!Object.values(mapping).includes(key) && mappedData[key] === undefined) {
        mappedData[key] = value;
      }
    }

    return mappedData;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private validateProductData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validations obligatoires
    if (!data.name && !data.title) {
      errors.push('Nom du produit manquant');
    }

    if (!data.price && !data.cost_price) {
      errors.push('Prix du produit manquant');
    }

    if (!data.sku && !data.supplier_product_id) {
      errors.push('SKU ou ID produit fournisseur manquant');
    }

    // Validations de format
    if (data.price && (isNaN(data.price) || data.price < 0)) {
      errors.push('Prix invalide');
    }

    if (data.stock_quantity && (isNaN(data.stock_quantity) || data.stock_quantity < 0)) {
      warnings.push('Quantité en stock invalide');
    }

    // Validations d'URLs d'images
    if (data.image_urls && Array.isArray(data.image_urls)) {
      data.image_urls.forEach((url: string, index: number) => {
        if (url && !this.isValidUrl(url)) {
          warnings.push(`URL d'image ${index + 1} invalide: ${url}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private normalizeProductData(data: any): any {
    return {
      name: data.name || data.title || 'Produit sans nom',
      description: data.description || '',
      price: parseFloat(data.price) || 0,
      cost_price: parseFloat(data.cost_price) || null,
      currency: data.currency || 'EUR',
      sku: data.sku || data.supplier_product_id,
      supplier_product_id: data.supplier_product_id || data.sku,
      category: data.category || 'Général',
      subcategory: data.subcategory || null,
      brand: data.brand || '',
      stock_quantity: parseInt(data.stock_quantity) || 0,
      image_urls: Array.isArray(data.image_urls) 
        ? data.image_urls.filter((url: string) => this.isValidUrl(url))
        : [],
      weight: parseFloat(data.weight) || null,
      dimensions: data.dimensions || null,
      attributes: data.attributes || {},
      status: 'active',
    };
  }

  private async findExistingProduct(sku: string, supplierProductId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id')
        .or(`sku.eq.${sku},supplier_product_id.eq.${supplierProductId}`)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Méthodes pour la gestion en lot
  async batchIngestProducts(
    supplierFeedId: string,
    products: any[],
    fieldMapping: Record<string, string> = {},
    jobId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const batchSize = 50;

    try {
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        for (const product of batch) {
          try {
            const result = await this.ingestProduct(supplierFeedId, product, fieldMapping);
            
            if (result.success) {
              success++;
            } else {
              failed++;
              if (result.errors) {
                errors.push(...result.errors);
              }
            }
          } catch (error) {
            failed++;
            errors.push(`Erreur produit: ${error}`);
          }
        }

        // Mettre à jour la progression si job fourni
        if (jobId) {
          const progress = Math.round((i + batch.length) / products.length * 100);
          await this.updateJobProgress(jobId, progress, i + batch.length, success, failed);
        }

        // Petite pause entre les lots
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('Erreur ingestion en lot:', error);
      return { success, failed, errors: [...errors, `Erreur générale: ${error}`] };
    }
  }

  async scheduleIngestion(
    supplierFeedId: string,
    schedule: string, // CRON expression
    config: any = {}
  ): Promise<boolean> {
    try {
      // Ici on pourrait utiliser un système de tâches programmées
      // Pour l'instant, on simule avec une entrée dans une table de configuration
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await (supabase as any)
        .from('supplier_feeds')
        .update({
          sync_schedule: schedule,
          sync_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierFeedId)
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error('Erreur programmation ingestion:', error);
      return false;
    }
  }
}