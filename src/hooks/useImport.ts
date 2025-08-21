import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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

interface ImportJob {
  id: string
  user_id: string
  source_type: 'csv' | 'excel' | 'shopify' | 'aliexpress' | 'amazon'
  source_url?: string
  file_data?: any
  mapping_config?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows?: number
  processed_rows?: number
  success_rows?: number
  error_rows?: number
  products_imported?: number
  errors_count?: number
  errors?: string[]
  result_data?: any
  created_at: string
  updated_at: string
}

export const useImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any>(null)
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({})
  const [previewData, setPreviewData] = useState<any[]>([])

  const { data: importJobs = [], isLoading } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('Import jobs error:', error)
        return []
      }
      return data || []
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
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import CSV réussi",
        description: `${data.products_imported} produits importés sur ${data.total_processed} lignes traitées.`,
      })
      setCurrentStep(1)
      setImportFile(null)
      setImportData(null)
      setMappingConfig({})
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import CSV",
        description: error.message || "Impossible d'importer le fichier CSV.",
        variant: "destructive",
      })
    }
  })

  const urlImport = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setImportData(data)
      setCurrentStep(2)
      toast({
        title: "Import réussi !",
        description: `${data.products?.length || 0} produits analysés avec IA. Confiance: ${Math.round(data.ai_confidence || 0)}%`,
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données depuis cette URL.",
        variant: "destructive",
      })
    }
  })

  const generateMapping = (headers: string[]) => {
    const mapping: Record<string, string> = {}
    const commonMappings: Record<string, string[]> = {
      'name': ['name', 'title', 'product_name', 'nom', 'titre'],
      'description': ['description', 'desc', 'details', 'contenu'],
      'price': ['price', 'prix', 'cost', 'amount'],
      'sku': ['sku', 'reference', 'ref', 'code'],
      'category': ['category', 'categorie', 'type'],
      'stock_quantity': ['stock', 'quantity', 'qty', 'quantite'],
      'image_url': ['image', 'photo', 'url', 'picture']
    }

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase()
      for (const [field, patterns] of Object.entries(commonMappings)) {
        if (patterns.some(pattern => lowerHeader.includes(pattern))) {
          mapping[header] = field
          break
        }
      }
    })

    return mapping
  }

  // Process file utility
  const processFile = async (file: File) => {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
    
    const { headers, rows } = parseCSV(text)
    return { 
      headers, 
      data: rows.map(row => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })
    }
  }

  // Legacy startImport for compatibility
  const startImport = useMutation({
    mutationFn: async (params: {
      sourceType: ImportJob['source_type']
      fileData?: any
      mappingConfig: Record<string, string>
    }) => {
      // For now, redirect to CSV import if it's a CSV
      if (params.sourceType === 'csv' && importFile) {
        return importFromCsv.mutateAsync(importFile)
      }
      throw new Error('Type d\'import non supporté')
    },
    onSuccess: () => {
      toast({
        title: "Import lancé",
        description: "L'import de vos produits a commencé.",
      })
      setCurrentStep(1)
      setImportFile(null)
      setImportData(null)
      setMappingConfig({})
    },
    onError: () => {
      toast({
        title: "Erreur d'import",
        description: "Impossible de lancer l'import.",
        variant: "destructive",
      })
    }
  })

  return {
    importJobs,
    importHistory: importJobs,
    isLoading,
    currentStep,
    setCurrentStep,
    importFile,
    setImportFile,
    importData,
    setImportData,
    mappingConfig,
    setMappingConfig,
    previewData,
    setPreviewData,
    processFile,
    startImport: startImport.mutate,
    importFromCsv: importFromCsv.mutate,
    addImportRecord: (data: any) => ({ id: 'temp-' + Date.now(), ...data }),
    updateImportRecord: (id: string, updates: any) => console.log('Update import record:', id, updates),
    urlImport: urlImport.mutate,
    generateMapping,
    isImporting: startImport.isPending || importFromCsv.isPending,
    isUrlImporting: urlImport.isPending
  }
}