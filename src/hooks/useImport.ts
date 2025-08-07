import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
  errors?: string[]
  result_data?: any
  created_at: string
  updated_at: string
}

export const useImport = () => {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({})
  const [previewData, setPreviewData] = useState<any[]>([])

  const { data: importJobs = [], isLoading } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ImportJob[]
    }
  })

  const processFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (file.name.endsWith('.csv')) {
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = values[index] || ''
              })
              return obj
            })
          resolve({ headers, data })
        } else {
          reject(new Error('Format de fichier non supporté'))
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const startImport = useMutation({
    mutationFn: async (params: {
      sourceType: ImportJob['source_type']
      fileData?: any
      mappingConfig: Record<string, string>
    }) => {
      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          source_type: params.sourceType,
          file_data: params.fileData,
          mapping_config: params.mappingConfig,
          status: 'pending',
          total_rows: params.fileData?.length || 0
        }])
        .select()
        .single()
      
      if (error) throw error

      // Process the import
      await supabase.functions.invoke('process-import', {
        body: { import_job_id: data.id }
      })

      return data
    },
    onSuccess: () => {
      toast({
        title: "Import lancé",
        description: "L'import de vos produits a commencé.",
      })
      setCurrentStep(1)
      setImportFile(null)
      setImportData([])
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

  const urlImport = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setImportData(data.products || [])
      setCurrentStep(2)
      toast({
        title: "Données récupérées",
        description: `${data.products?.length || 0} produits trouvés.`,
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

  return {
    importJobs,
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
    urlImport: urlImport.mutate,
    generateMapping,
    isImporting: startImport.isPending,
    isUrlImporting: urlImport.isPending
  }
}