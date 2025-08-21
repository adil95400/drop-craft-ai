import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// CSV parsing utility
const parseCSV = (text: string): { headers: string[], rows: string[][] } => {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) throw new Error('Fichier CSV vide')
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  )
  
  return { headers, rows }
}

// Auto-mapping for common CSV columns
const generateColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {}
  const mappings: Record<string, string[]> = {
    name: ['name', 'title', 'product_name', 'nom', 'titre', 'product'],
    description: ['description', 'desc', 'details', 'content'],
    price: ['price', 'prix', 'cost', 'amount', 'tarif'],
    sku: ['sku', 'reference', 'ref', 'code', 'id'],
    category: ['category', 'categorie', 'type', 'cat'],
    image_url: ['image', 'photo', 'url', 'picture', 'img'],
    supplier_name: ['supplier', 'fournisseur', 'brand', 'marque']
  }
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase()
    for (const [field, patterns] of Object.entries(mappings)) {
      if (patterns.some(pattern => lowerHeader.includes(pattern))) {
        mapping[header] = field
        break
      }
    }
  })
  
  return mapping
}

export const useImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Import from URL - Real Supabase implementation  
  const importFromUrl = useMutation({
    mutationFn: async (url: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // For now, URL import is not implemented with real scraping
      // This would require a backend service or Edge Function
      throw new Error('Import URL pas encore implémenté. Utilisez l\'import CSV pour l\'instant.')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Import réussi",
        description: `${data.products_imported || 0} produits importés depuis l'URL.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer depuis cette URL.",
        variant: "destructive",
      })
    }
  })

  // Import from CSV - Real Supabase implementation
  const importFromCsv = useMutation({
    mutationFn: async (file: File) => {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Read and parse CSV file
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })

      const { headers, rows } = parseCSV(text)
      const mapping = generateColumnMapping(headers)

      // Create import job
      const { data: importJob, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          source_type: 'csv',
          status: 'processing',
          total_rows: rows.length,
          processed_rows: 0,
          success_rows: 0,
          error_rows: 0,
          mapping_config: mapping
        })
        .select()
        .single()

      if (jobError) throw new Error(`Erreur création job: ${jobError.message}`)

      // Process each row
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      const productsToInsert: any[] = []

      rows.forEach((row, index) => {
        try {
          // Map CSV row to product object
          const product: any = {
            user_id: user.id,
            import_id: importJob.id,
            status: 'draft',
            review_status: 'pending'
          }

          // Map each header to product field
          headers.forEach((header, headerIndex) => {
            const field = mapping[header]
            const value = row[headerIndex]?.trim()
            
            if (field && value) {
              if (field === 'price' || field === 'cost_price') {
                product[field] = parseFloat(value) || 0
              } else if (field === 'image_url') {
                product.image_urls = [value]
              } else {
                product[field] = value
              }
            }
          })

          // Validate required fields
          if (!product.name) {
            throw new Error(`Ligne ${index + 1}: Nom du produit requis`)
          }
          if (!product.price || product.price <= 0) {
            throw new Error(`Ligne ${index + 1}: Prix valide requis`)
          }

          productsToInsert.push(product)
          successCount++
        } catch (error) {
          errorCount++
          errors.push((error as Error).message)
        }
      })

      // Insert all valid products
      if (productsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)

        if (insertError) {
          throw new Error(`Erreur insertion produits: ${insertError.message}`)
        }
      }

      // Update import job with final results
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          processed_rows: rows.length,
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors,
          result_data: {
            total: rows.length,
            success: successCount,
            errors: errorCount,
            completion_time: new Date().toISOString()
          }
        })
        .eq('id', importJob.id)

      return {
        products_imported: successCount,
        total_processed: rows.length,
        errors: errorCount,
        import_job_id: importJob.id
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      toast({
        title: "Import CSV réussi",
        description: `${data.products_imported} produits importés sur ${data.total_processed} lignes traitées.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import CSV",
        description: error.message || "Impossible d'importer le fichier CSV.",
        variant: "destructive",
      })
    }
  })

  // Import from XML feed - Not implemented yet
  const importFromXml = useMutation({
    mutationFn: async ({ url, mapping }: { url: string, mapping?: any }) => {
      throw new Error('Import XML pas encore implémenté. Utilisez l\'import CSV pour l\'instant.')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Import XML réussi",
        description: `${data.products_imported || 0} produits importés depuis le feed XML.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import XML",
        description: error.message || "Impossible d'importer le feed XML.",
        variant: "destructive",
      })
    }
  })

  // BigBuy sync - Not implemented yet
  const syncBigBuy = useMutation({
    mutationFn: async (options: { categories?: string[], limit?: number } = {}) => {
      throw new Error('Synchronisation BigBuy pas encore implémentée. Utilisez l\'import CSV pour l\'instant.')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Synchronisation BigBuy réussie",
        description: `${data.products_imported || 0} produits synchronisés depuis BigBuy.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur BigBuy",
        description: error.message || "Impossible de synchroniser avec BigBuy.",
        variant: "destructive",
      })
    }
  })

  // Get import history from Supabase
  const { data: importHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        console.warn('Import history error:', error)
        return []
      }
      
      return data || []
    }
  })

  return {
    importFromUrl: importFromUrl.mutate,
    importFromCsv: importFromCsv.mutate,
    importFromXml: importFromXml.mutate,
    syncBigBuy: syncBigBuy.mutate,
    importHistory,
    isImportingUrl: importFromUrl.isPending,
    isImportingCsv: importFromCsv.isPending,
    isImportingXml: importFromXml.isPending,
    isSyncingBigBuy: syncBigBuy.isPending,
    isLoadingHistory
  }
}