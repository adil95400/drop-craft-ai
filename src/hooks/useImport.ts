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

// Enhanced auto-mapping for comprehensive CSV columns
const generateColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {}
  const mappings: Record<string, string[]> = {
    // Basic product info
    name: ['name', 'title', 'product_name', 'nom', 'titre', 'product'],
    description: ['description', 'desc', 'details', 'content'],
    sku: ['sku', 'reference', 'ref', 'code', 'product_id'],
    category: ['category', 'categorie', 'type', 'cat'],
    sub_category: ['sub_category', 'subcategory', 'sous_categorie'],
    brand: ['brand', 'marque', 'vendor'],
    
    // Pricing
    price: ['price', 'prix', 'selling_price', 'amount'],
    cost_price: ['cost', 'cost_price', 'cout', 'purchase_price'],
    compare_at_price: ['compare_at_price', 'original_price', 'prix_barre'],
    suggested_price: ['suggested_price', 'prix_suggere', 'recommended_price'],
    currency: ['currency', 'devise', 'curr'],
    
    // Inventory
    stock_quantity: ['stock', 'quantity', 'qty', 'quantite', 'inventory'],
    min_order: ['min_order', 'minimum_order', 'commande_min'],
    max_order: ['max_order', 'maximum_order', 'commande_max'],
    
    // Physical attributes
    weight: ['weight', 'poids', 'wt'],
    weight_unit: ['weight_unit', 'unite_poids'],
    length: ['length', 'longueur', 'l'],
    width: ['width', 'largeur', 'w'],
    height: ['height', 'hauteur', 'h'],
    dimension_unit: ['dimension_unit', 'unite_dimension'],
    
    // Product attributes
    condition: ['condition', 'etat', 'state'],
    color: ['color', 'couleur', 'colour'],
    size: ['size', 'taille', 'sz'],
    material: ['material', 'materiau', 'matiere'],
    style: ['style', 'design'],
    
    // Images and media
    image_url: ['image', 'photo', 'picture', 'img', 'main_image_url'],
    image_urls: ['images', 'image_urls', 'additional_image_urls', 'photos'],
    video_urls: ['video_url', 'video_urls', 'video', 'vid'],
    
    // SEO and marketing
    seo_title: ['seo_title', 'titre_seo', 'meta_title'],
    seo_description: ['seo_description', 'meta_description', 'desc_seo'],
    seo_keywords: ['seo_keywords', 'keywords', 'mots_cles', 'tags'],
    meta_tags: ['meta_tags', 'tags_meta'],
    
    // Variants
    variant_group: ['variant_group', 'groupe_variante'],
    variant_name: ['variant_name', 'nom_variante'],
    variant_sku: ['variant_sku', 'sku_variante'],
    
    // Supplier info
    supplier_name: ['supplier', 'fournisseur', 'vendor'],
    supplier_sku: ['supplier_sku', 'sku_fournisseur'],
    supplier_price: ['supplier_price', 'prix_fournisseur'],
    supplier_url: ['supplier_link', 'supplier_url', 'lien_fournisseur'],
    
    // Shipping
    shipping_time: ['shipping_time', 'delai_livraison', 'delivery_time'],
    shipping_cost: ['shipping_cost', 'cout_livraison', 'frais_port'],
    
    // Codes
    barcode: ['barcode', 'code_barre'],
    ean: ['ean', 'ean13'],
    upc: ['upc', 'upc_code'],
    gtin: ['gtin', 'gtin14'],
    
    // Localization
    country_of_origin: ['country_of_origin', 'pays_origine'],
    language: ['language', 'langue', 'lang']
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

          // Map each header to product field with enhanced mapping
          headers.forEach((header, headerIndex) => {
            const field = mapping[header]
            let value = row[headerIndex]?.trim()
            
            if (field && value) {
              // Handle numeric fields with validation and overflow protection
              if (['price', 'cost_price', 'compare_at_price', 'suggested_price', 'weight', 'length', 'width', 'height', 'supplier_price', 'shipping_cost'].includes(field)) {
                // Clean numeric value - replace comma with dot for European format
                const cleanValue = value.replace(',', '.').replace(/[^\d.-]/g, '')
                let numValue = parseFloat(cleanValue) || 0
                
                // Limit to reasonable ranges to prevent overflow (max 999999.99)
                if (numValue > 999999.99) numValue = 999999.99
                if (numValue < 0) numValue = 0
                
                product[field] = Math.round(numValue * 100) / 100 // Round to 2 decimals
              }
              // Handle integer fields with validation
              else if (['stock_quantity', 'min_order', 'max_order'].includes(field)) {
                const cleanValue = value.replace(/[^\d]/g, '')
                let intValue = parseInt(cleanValue) || 0
                
                // Limit to reasonable ranges (max 999999)
                if (intValue > 999999) intValue = 999999
                if (intValue < 0) intValue = 0
                
                product[field] = intValue
              }
              // Handle array fields (split by semicolon)
              else if (['image_urls', 'video_urls', 'seo_keywords', 'tags'].includes(field)) {
                product[field] = value.split(';').map(item => item.trim()).filter(Boolean)
              }
              // Handle special image mapping
              else if (field === 'image_url' || field === 'main_image_url') {
                if (!product.image_urls) product.image_urls = []
                product.image_urls.unshift(value) // Put main image first
              }
              // Handle additional images
              else if (field === 'additional_image_urls') {
                const additionalImages = value.split(';').map(item => item.trim()).filter(Boolean)
                if (!product.image_urls) product.image_urls = []
                product.image_urls.push(...additionalImages)
              }
              // Handle video URL mapping (singular to plural)
              else if (header.toLowerCase().includes('video_url') && !header.toLowerCase().includes('video_urls')) {
                if (!product.video_urls) product.video_urls = []
                product.video_urls.push(value)
              }
              // Handle boolean fields
              else if (['ai_optimized'].includes(field)) {
                product[field] = value.toLowerCase() === 'true' || value === '1'
              }
              // Handle text fields
              else {
                product[field] = value
              }
            }
          })

          // Validate required fields with better error handling
          if (!product.name || product.name.length === 0) {
            console.log(`Produit ligne ${index + 1}:`, { name: product.name, price: product.price, row })
            throw new Error(`Ligne ${index + 1}: Nom du produit requis (reçu: "${product.name}")`)
          }
          if (!product.price || product.price <= 0) {
            console.log(`Prix invalide ligne ${index + 1}:`, { price: product.price, rawPrice: row[headers.indexOf('price')] })
            throw new Error(`Ligne ${index + 1}: Prix valide requis (reçu: ${product.price})`)
          }

          // Ensure user_id and import_id are set
          if (!product.user_id) {
            throw new Error(`Ligne ${index + 1}: user_id manquant`)
          }
          if (!product.import_id) {
            throw new Error(`Ligne ${index + 1}: import_id manquant`)
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