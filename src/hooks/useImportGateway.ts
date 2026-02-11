/**
 * Hook pour utiliser le Gateway d'import dans les composants React
 * Fournit une API simple avec état et gestion d'erreurs
 */

import { useState, useCallback, useMemo } from 'react'
import { importGateway } from '@/services/import'
import { 
  ImportRequest, 
  ImportResult, 
  ImportSource, 
  NormalizedProduct 
} from '@/services/import/types'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useLogAction } from '@/hooks/useTrackedAction'

export interface UseImportGatewayState {
  isImporting: boolean
  progress: number
  status: 'idle' | 'processing' | 'success' | 'error'
  lastResult: ImportResult | null
  importedProducts: NormalizedProduct[]
  error: string | null
}

export interface UseImportGatewayActions {
  importFromUrl: (url: string, options?: ImportRequest['options']) => Promise<ImportResult>
  importFromFile: (file: File, source: ImportSource, options?: ImportRequest['options']) => Promise<ImportResult>
  importFromData: (data: any, source: ImportSource, options?: ImportRequest['options']) => Promise<ImportResult>
  saveToDatabase: (products: NormalizedProduct[]) => Promise<{ success: number; failed: number }>
  reset: () => void
}

export function useImportGateway(): UseImportGatewayState & UseImportGatewayActions {
  const { toast } = useToast()
  const logAction = useLogAction()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [lastResult, setLastResult] = useState<ImportResult | null>(null)
  const [importedProducts, setImportedProducts] = useState<NormalizedProduct[]>([])
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setIsImporting(false)
    setProgress(0)
    setStatus('idle')
    setLastResult(null)
    setImportedProducts([])
    setError(null)
  }, [])

  const processImport = useCallback(async (request: ImportRequest): Promise<ImportResult> => {
    setIsImporting(true)
    setStatus('processing')
    setProgress(10)
    setError(null)

    try {
      setProgress(30)
      const result = await importGateway.import(request)
      setProgress(80)

      if (result.success && result.products) {
        setImportedProducts(result.products)
        setStatus('success')
        setProgress(100)
        
        logAction('imports_monthly', 'product_import', { 
          count: result.products.length, 
          source: request.source 
        })
        
        toast({
          title: '✅ Import réussi',
          description: `${result.products.length} produit(s) importé(s) avec succès`,
        })
      } else {
        setStatus('error')
        setError(result.error?.message || 'Erreur inconnue')
        
        toast({
          title: 'Erreur d\'import',
          description: result.error?.message || 'Une erreur est survenue',
          variant: 'destructive',
        })
      }

      setLastResult(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setStatus('error')
      setError(errorMessage)
      setProgress(0)
      
      toast({
        title: 'Erreur d\'import',
        description: errorMessage,
        variant: 'destructive',
      })
      
      return {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: errorMessage
        }
      }
    } finally {
      setIsImporting(false)
    }
  }, [toast])

  const importFromUrl = useCallback(async (
    url: string, 
    options?: ImportRequest['options']
  ): Promise<ImportResult> => {
    const request: ImportRequest = {
      source: 'api', // Will be auto-detected
      url,
      options: {
        autoDetect: true,
        ...options
      }
    }
    return processImport(request)
  }, [processImport])

  const importFromFile = useCallback(async (
    file: File, 
    source: ImportSource,
    options?: ImportRequest['options']
  ): Promise<ImportResult> => {
    const request: ImportRequest = {
      source,
      file,
      options
    }
    return processImport(request)
  }, [processImport])

  const importFromData = useCallback(async (
    data: any, 
    source: ImportSource,
    options?: ImportRequest['options']
  ): Promise<ImportResult> => {
    const request: ImportRequest = {
      source,
      data,
      options
    }
    return processImport(request)
  }, [processImport])

  const saveToDatabase = useCallback(async (
    products: NormalizedProduct[]
  ): Promise<{ success: number; failed: number }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    let success = 0
    let failed = 0

    for (const product of products) {
      try {
        const { error: dbError } = await supabase
          .from('imported_products')
          .insert({
            user_id: user.id,
            name: product.title,
            description: product.description,
            price: product.price,
            cost_price: product.costPrice,
            sku: product.sku,
            category: product.category,
            image_urls: product.images,
            video_urls: product.videos,
            tags: product.tags,
            supplier_name: product.supplier?.name,
            supplier_url: product.sourceUrl,
            supplier_product_id: product.sourceId,
            source_platform: product.sourcePlatform,
            source_url: product.sourceUrl,
            status: product.status === 'ready' ? 'draft' : 'draft',
            import_quality_score: product.completenessScore,
            meta_title: product.seoTitle,
            meta_description: product.seoDescription,
          })

        if (dbError) {
          console.error('DB insert error:', dbError)
          failed++
        } else {
          success++
        }
      } catch (err) {
        console.error('Product save error:', err)
        failed++
      }
    }

    if (success > 0) {
      toast({
        title: '✅ Sauvegarde terminée',
        description: `${success} produit(s) enregistré(s)${failed > 0 ? `, ${failed} erreur(s)` : ''}`,
      })
    }

    return { success, failed }
  }, [toast])

  return {
    // State
    isImporting,
    progress,
    status,
    lastResult,
    importedProducts,
    error,
    
    // Actions
    importFromUrl,
    importFromFile,
    importFromData,
    saveToDatabase,
    reset,
  }
}
