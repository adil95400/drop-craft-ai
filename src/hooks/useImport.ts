import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { importJobsApi } from '@/services/api/client'

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

// Enhanced auto-mapping for comprehensive CSV columns
const generateColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {}
  const mappings: Record<string, string[]> = {
    name: ['name', 'title', 'product_name', 'nom', 'titre', 'product'],
    description: ['description', 'desc', 'details', 'content'],
    sku: ['sku', 'reference', 'ref', 'code', 'product_id'],
    category: ['category', 'categorie', 'type', 'cat'],
    sub_category: ['sub_category', 'subcategory', 'sous_categorie'],
    brand: ['brand', 'marque', 'vendor'],
    price: ['price', 'prix', 'selling_price', 'amount'],
    cost_price: ['cost', 'cost_price', 'cout', 'purchase_price'],
    compare_at_price: ['compare_at_price', 'original_price', 'prix_barre'],
    suggested_price: ['suggested_price', 'prix_suggere', 'recommended_price'],
    currency: ['currency', 'devise', 'curr'],
    stock_quantity: ['stock', 'quantity', 'qty', 'quantite', 'inventory'],
    min_order: ['min_order', 'minimum_order', 'commande_min'],
    max_order: ['max_order', 'maximum_order', 'commande_max'],
    weight: ['weight', 'poids', 'wt'],
    image_url: ['image', 'photo', 'picture', 'img', 'main_image_url'],
    image_urls: ['images', 'image_urls', 'additional_image_urls', 'photos'],
    seo_title: ['seo_title', 'titre_seo', 'meta_title'],
    seo_description: ['seo_description', 'meta_description', 'desc_seo'],
    seo_keywords: ['seo_keywords', 'keywords', 'mots_cles', 'tags'],
    supplier_name: ['supplier', 'fournisseur', 'vendor'],
    supplier_url: ['supplier_link', 'supplier_url', 'lien_fournisseur'],
    barcode: ['barcode', 'code_barre'],
    ean: ['ean', 'ean13'],
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
      try {
        const resp = await importJobsApi.list({ per_page: 50 })
        return resp.items || []
      } catch {
        return []
      }
    }
  })

  // Import from CSV - uses API V1 for job creation, direct insert for products
  const importFromCsv = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })

      const { headers, rows } = parseCSV(text)
      const mapping = generateColumnMapping(headers)

      // Create job via API V1
      const jobResp = await importJobsApi.create({
        source: 'csv_import',
        settings: { mapping, total: rows.length },
      })

      // Process each row
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      const productsToInsert: any[] = []

      rows.forEach((row, index) => {
        try {
          const product: any = {
            user_id: user.id,
            import_id: jobResp.job_id,
            status: 'draft',
            review_status: 'pending'
          }

          headers.forEach((header, headerIndex) => {
            const field = mapping[header]
            let value = row[headerIndex]?.trim()

            if (field && value) {
              if (['price', 'cost_price', 'compare_at_price', 'suggested_price', 'weight'].includes(field)) {
                const cleanValue = value.replace(',', '.').replace(/[^\d.-]/g, '')
                let numValue = parseFloat(cleanValue) || 0
                if (numValue > 999999.99) numValue = 999999.99
                if (numValue < 0) numValue = 0
                product[field] = Math.round(numValue * 100) / 100
              } else if (['stock_quantity', 'min_order', 'max_order'].includes(field)) {
                const cleanValue = value.replace(/[^\d]/g, '')
                let intValue = parseInt(cleanValue) || 0
                if (intValue > 999999) intValue = 999999
                product[field] = intValue
              } else if (['image_urls', 'seo_keywords'].includes(field)) {
                product[field] = value.split(';').map(item => item.trim()).filter(Boolean)
              } else if (field === 'image_url') {
                if (!product.image_urls) product.image_urls = []
                product.image_urls.unshift(value)
              } else {
                product[field] = value
              }
            }
          })

          if (!product.name || product.name.length === 0) {
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

      if (productsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)

        if (insertError) {
          throw new Error(`Erreur insertion produits: ${insertError.message}`)
        }
      }

      return {
        products_imported: successCount,
        total_processed: rows.length,
        errors: errorCount,
        import_job_id: jobResp.job_id
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
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: { url, action: 'import', price_multiplier: 1.5 }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setImportData(data)
      setCurrentStep(2)
      toast({
        title: "Import réussi !",
        description: `${data.products?.length || 0} produits analysés.`,
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

  const generateMapping = (headers: string[]) => generateColumnMapping(headers)

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

  const startImport = useMutation({
    mutationFn: async (params: {
      sourceType: ImportJob['source_type']
      fileData?: any
      mappingConfig: Record<string, string>
    }) => {
      if (params.sourceType === 'csv' && importFile) {
        return importFromCsv.mutateAsync(importFile)
      }
      throw new Error('Type d\'import non supporté')
    },
    onSuccess: () => {
      toast({ title: "Import lancé", description: "L'import de vos produits a commencé." })
      setCurrentStep(1)
      setImportFile(null)
      setImportData(null)
      setMappingConfig({})
    },
    onError: () => {
      toast({ title: "Erreur d'import", description: "Impossible de lancer l'import.", variant: "destructive" })
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
