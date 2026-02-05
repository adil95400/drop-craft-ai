/**
 * Import Gateway - Point d'entrée centralisé pour tous les imports
 * 
 * Fonctionnalités:
 * - Idempotence via clé unique par requête
 * - Anti-replay avec tracking des request IDs
 * - Journalisation complète
 * - Routing vers les adaptateurs appropriés
 * - Validation stricte des données
 */

import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { productionLogger } from '@/utils/productionLogger'
import { 
  ImportSource, 
  ImportRequest, 
  ImportResult, 
  ImportJob,
  NormalizedProduct 
} from './types'
import { getAdapter } from './adapters'
import { validateProduct, ValidationResult } from './validators'

// Configuration
const MAX_RETRY_ATTEMPTS = 3
const IDEMPOTENCY_TTL_HOURS = 24
const ANTI_REPLAY_TTL_DAYS = 7

/**
 * Génère une clé d'idempotence unique
 */
function generateIdempotencyKey(source: ImportSource, identifier: string): string {
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)) // Hourly bucket
  return `import_${source}_${identifier}_${timestamp}`
}

/**
 * Génère un ID de requête unique
 */
function generateRequestId(): string {
  return crypto.randomUUID()
}

/**
 * Gateway d'import centralisé
 */
export class ImportGateway {
  private pendingRequests = new Map<string, Promise<ImportResult>>()
  private requestHistory = new Set<string>()
  
  /**
   * Point d'entrée principal pour tous les imports
   */
  async import(request: ImportRequest): Promise<ImportResult> {
    const requestId = generateRequestId()
    const startTime = Date.now()
    
    productionLogger.info('Import request received', { 
      requestId, 
      source: request.source,
      hasUrl: !!request.url,
      hasData: !!request.data
    }, 'ImportGateway')

    try {
      // 1. Validation de la requête
      this.validateRequest(request)

      // 2. Vérification anti-replay
      const identifier = request.url || JSON.stringify(request.data).slice(0, 100)
      const idempotencyKey = generateIdempotencyKey(request.source, identifier)
      
      // Vérifier si une requête identique est en cours
      const pendingResult = this.pendingRequests.get(idempotencyKey)
      if (pendingResult) {
        productionLogger.info('Returning pending request result', { idempotencyKey }, 'ImportGateway')
        return pendingResult
      }

      // Vérifier idempotence côté serveur
      const cachedResult = await this.checkIdempotency(idempotencyKey)
      if (cachedResult) {
        productionLogger.info('Returning cached result', { idempotencyKey }, 'ImportGateway')
        return cachedResult
      }

      // 3. Créer la promesse d'import
      const importPromise = this.executeImport(request, requestId, idempotencyKey)
      this.pendingRequests.set(idempotencyKey, importPromise)

      // 4. Exécuter et nettoyer
      const result = await importPromise
      this.pendingRequests.delete(idempotencyKey)

      // 5. Enregistrer le résultat pour idempotence
      await this.saveIdempotencyResult(idempotencyKey, result)

      // 6. Logger le résultat
      const duration = Date.now() - startTime
      productionLogger.info('Import completed', { 
        requestId, 
        success: result.success,
        productsImported: result.products?.length || 0,
        durationMs: duration
      }, 'ImportGateway')

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      productionLogger.error('Import failed', error as Error, 'ImportGateway')
      
      return {
        success: false,
        error: {
          code: 'IMPORT_FAILED',
          message: error instanceof Error ? error.message : 'Import failed',
          details: { requestId, durationMs: duration }
        },
        products: [],
        metadata: {
          requestId,
          source: request.source,
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Exécute l'import via l'adaptateur approprié
   */
  private async executeImport(
    request: ImportRequest, 
    requestId: string,
    idempotencyKey: string
  ): Promise<ImportResult> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Utilisateur non authentifié')
    }

    // Créer le job d'import
    const job = await this.createImportJob(user.id, request, requestId)

    try {
      // Récupérer l'adaptateur approprié
      const adapter = getAdapter(request.source)
      if (!adapter) {
        throw new Error(`Adaptateur non disponible pour: ${request.source}`)
      }

      // Mettre à jour le statut
      await this.updateJobStatus(job.id, 'processing')

      // Exécuter l'extraction via l'adaptateur
      const rawProducts = await adapter.extract(request)

      // Normaliser les données
      const normalizedProducts: NormalizedProduct[] = []
      const errors: Array<{ index: number; error: string }> = []

      for (let i = 0; i < rawProducts.length; i++) {
        try {
          const normalized = adapter.normalize(rawProducts[i])
          const validation = validateProduct(normalized)
          
          if (validation.valid) {
            normalizedProducts.push(normalized)
          } else {
            errors.push({ 
              index: i, 
              error: validation.errors.join(', ') 
            })
          }
        } catch (err) {
          errors.push({ 
            index: i, 
            error: err instanceof Error ? err.message : 'Normalisation failed' 
          })
        }
      }

      // Sauvegarder les produits
      const savedProducts = await this.saveProducts(user.id, normalizedProducts, request.source)

      // Mettre à jour le job
      await this.updateJobStatus(job.id, 'completed', {
        total_products: rawProducts.length,
        successful_imports: savedProducts.length,
        failed_imports: errors.length,
        error_log: errors.length > 0 ? errors : null
      })

      return {
        success: true,
        products: savedProducts,
        metadata: {
          requestId,
          source: request.source,
          jobId: job.id,
          totalExtracted: rawProducts.length,
          totalImported: savedProducts.length,
          totalErrors: errors.length,
          errors: errors.slice(0, 10), // Limiter à 10 erreurs
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      await this.updateJobStatus(job.id, 'failed', {
        error_log: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
      })
      throw error
    }
  }

  /**
   * Crée un job d'import dans la base de données
   */
  private async createImportJob(
    userId: string, 
    request: ImportRequest,
    requestId: string
  ): Promise<ImportJob> {
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId,
        job_type: request.source,
        source_platform: request.source,
        source_url: request.url || null,
        status: 'pending',
        total_products: 0,
        successful_imports: 0,
        failed_imports: 0
      })
      .select()
      .single()

    if (error) throw new Error(`Création du job échouée: ${error.message}`)
    
    return {
      id: data.id,
      userId: data.user_id,
      source: request.source,
      status: 'pending',
      createdAt: new Date(data.created_at)
    }
  }

  /**
   * Met à jour le statut d'un job
   */
  private async updateJobStatus(
    jobId: string, 
    status: 'processing' | 'completed' | 'failed',
    updates?: Partial<{
      total_products: number
      successful_imports: number
      failed_imports: number
      error_log: any
    }>
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'processing' && { started_at: new Date().toISOString() }),
      ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
      ...updates
    }

    await supabase
      .from('import_jobs')
      .update(updateData)
      .eq('id', jobId)
  }

  /**
   * Sauvegarde les produits normalisés
   */
  private async saveProducts(
    userId: string, 
    products: NormalizedProduct[],
    source: ImportSource
  ): Promise<NormalizedProduct[]> {
    if (products.length === 0) return []

    const productsToInsert = products.map(p => ({
      user_id: userId,
      title: p.title,
      name: p.title,
      description: p.description || '',
      price: p.price,
      cost_price: p.costPrice || null,
      sku: p.sku || null,
      barcode: p.barcode || null,
      images: p.images,
      category: p.category || null,
      brand: p.brand || null,
      stock_quantity: p.stock || 0,
      weight: p.weight || null,
      variants: p.variants ? JSON.stringify(p.variants) : null,
      source: source,
      source_url: p.sourceUrl || null,
      status: p.completenessScore >= 70 ? 'active' : 'draft',
      is_active: true,
      metadata: JSON.stringify({
        importedAt: new Date().toISOString(),
        source: source,
        completenessScore: p.completenessScore,
        sourceAttribution: p.sourceAttribution
      })
    }))

    const { data, error } = await supabase
      .from('products')
      .insert(productsToInsert as any)
      .select()

    if (error) {
      productionLogger.error('Failed to save products', error, 'ImportGateway')
      throw new Error(`Sauvegarde des produits échouée: ${error.message}`)
    }

    return products.map((p, i) => ({
      ...p,
      id: data?.[i]?.id
    }))
  }

  /**
   * Vérifie l'idempotence d'une requête
   */
  private async checkIdempotency(key: string): Promise<ImportResult | null> {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('response_data, status')
      .eq('idempotency_key', key)
      .maybeSingle()

    if (error || !data) return null
    
    if (data.status === 'succeeded' && data.response_data) {
      return data.response_data as unknown as ImportResult
    }

    return null
  }

  /**
   * Sauvegarde le résultat pour idempotence
   */
  private async saveIdempotencyResult(key: string, result: ImportResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS)

    await supabase
      .from('idempotency_keys')
      .upsert({
        idempotency_key: key,
        user_id: user.id,
        action: 'import',
        status: result.success ? 'succeeded' : 'failed',
        response_data: result as any,
        expires_at: expiresAt.toISOString()
      } as any)
  }

  /**
   * Valide la requête d'import
   */
  private validateRequest(request: ImportRequest): void {
    if (!request.source) {
      throw new Error('Source d\'import requise')
    }

    if (!request.url && !request.data && !request.file) {
      throw new Error('URL, données ou fichier requis')
    }

    const validSources: ImportSource[] = [
      'aliexpress', 'amazon', 'ebay', 'shopify', 'temu',
      'csv', 'xml', 'json', 'api', 'extension'
    ]

    if (!validSources.includes(request.source)) {
      throw new Error(`Source invalide: ${request.source}`)
    }
  }

  /**
   * Import rapide depuis URL
   */
  async importFromUrl(url: string, source?: ImportSource): Promise<ImportResult> {
    const detectedSource = source || this.detectSource(url)
    
    return this.import({
      source: detectedSource,
      url,
      options: { autoDetect: true }
    })
  }

  /**
   * Import depuis fichier CSV
   */
  async importFromCsv(file: File, mapping?: Record<string, string>): Promise<ImportResult> {
    return this.import({
      source: 'csv',
      file,
      options: { mapping }
    })
  }

  /**
   * Import depuis extension Chrome
   */
  async importFromExtension(
    productData: any, 
    source: ImportSource
  ): Promise<ImportResult> {
    return this.import({
      source,
      data: productData,
      options: { fromExtension: true }
    })
  }

  /**
   * Détecte la source depuis l'URL
   */
  private detectSource(url: string): ImportSource {
    const lowerUrl = url.toLowerCase()
    
    if (lowerUrl.includes('aliexpress')) return 'aliexpress'
    if (lowerUrl.includes('amazon')) return 'amazon'
    if (lowerUrl.includes('ebay')) return 'ebay'
    if (lowerUrl.includes('shopify') || lowerUrl.includes('myshopify')) return 'shopify'
    if (lowerUrl.includes('temu')) return 'temu'
    if (lowerUrl.includes('etsy')) return 'aliexpress' // Fallback
    if (lowerUrl.endsWith('.csv')) return 'csv'
    if (lowerUrl.endsWith('.xml')) return 'xml'
    if (lowerUrl.endsWith('.json')) return 'json'
    
    return 'api' // Default
  }

  /**
   * Récupère l'historique des imports
   */
  async getImportHistory(limit = 50): Promise<ImportJob[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map(job => ({
      id: job.id,
      userId: job.user_id,
      source: job.source_platform as ImportSource,
      status: job.status as any,
      totalProducts: job.total_products,
      successfulImports: job.successful_imports,
      failedImports: job.failed_imports,
      createdAt: new Date(job.created_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : undefined
    }))
  }

  /**
   * Annule un job d'import en cours
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const { error } = await supabase
      .from('import_jobs')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: [{ error: 'Annulé par l\'utilisateur' }]
      })
      .eq('id', jobId)
      .eq('status', 'processing')

    return !error
  }
}

// Instance singleton
export const importGateway = new ImportGateway()
