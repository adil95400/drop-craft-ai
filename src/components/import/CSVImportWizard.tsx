import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, FileText, Check, AlertTriangle, X, Download, Eye, Sparkles, Wand2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface CSVData {
  headers: string[]
  rows: any[]
  fileName: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
  value?: string
}

interface ProductMapping {
  [csvColumn: string]: string
}

interface MappingSuggestion {
  field: string
  confidence: number
  matched_pattern: string
}

type ImportOutcome = {
  jobId?: string
  imported: number
  failed: number
  errors: string[]
}

// Shopify FR CSV headers mapping - based on ILA_csv_shopify_fr.csv template
const PRODUCT_FIELDS = {
  name: { 
    label: 'Nom du produit', 
    required: true, 
    aliases: [
      'title', 'Title', 'product_name', 'product', 'nom', 'titre', 
      'handle', 'Handle', 'product_title', 'item_name', 'designation'
    ] 
  },
  description: { 
    label: 'Description', 
    required: false, 
    aliases: [
      'body', 'body_html', 'Body (HTML)', 'body (html)', 'Body HTML', 
      'content', 'desc', 'product_description', 'long_description', 'detail', 'details'
    ] 
  },
  price: { 
    label: 'Prix', 
    required: true, 
    aliases: [
      'variant_price', 'Variant Price', 'sale_price', 'cost', 'prix', 
      'price_eur', 'amount', 'unit_price', 'retail_price', 'Price'
    ] 
  },
  compare_at_price: { 
    label: 'Prix barré', 
    required: false, 
    aliases: [
      'compare_price', 'Variant Compare At Price', 'compare at price',
      'original_price', 'msrp', 'list_price', 'regular_price', 'was_price'
    ] 
  },
  sku: { 
    label: 'SKU/Référence', 
    required: false, 
    aliases: [
      'variant_sku', 'Variant SKU', 'reference', 'ref', 'product_id', 
      'external_id', 'item_sku', 'code', 'article', 'SKU'
    ] 
  },
  category: { 
    label: 'Catégorie', 
    required: false, 
    aliases: [
      'type', 'Type', 'product_type', 'categorie', 'collection', 
      'product_category', 'group', 'classification',
      'Google Shopping / Google Product Category'
    ] 
  },
  brand: { 
    label: 'Marque', 
    required: false, 
    aliases: [
      'vendor', 'Vendor', 'manufacturer', 'fabricant', 'fournisseur', 
      'supplier', 'brand_name', 'make', 'Brand'
    ] 
  },
  stock_quantity: { 
    label: 'Stock', 
    required: false, 
    aliases: [
      'inventory_quantity', 'Variant Inventory Qty', 'qty', 'quantity', 
      'stock', 'inventory', 'available', 'units', 'Inventory Qty'
    ] 
  },
  image_url: { 
    label: 'URL Image', 
    required: false, 
    aliases: [
      'image_src', 'Image Src', 'image', 'img', 'picture', 'photo', 
      'thumbnail', 'images', 'main_image', 'variant_image', 'Variant Image'
    ] 
  },
  weight: { 
    label: 'Poids', 
    required: false, 
    aliases: [
      'variant_weight', 'Variant Grams', 'poids', 'mass', 'weight_kg', 
      'weight_g', 'shipping_weight', 'Variant Weight Unit'
    ] 
  },
  tags: { 
    label: 'Tags', 
    required: false, 
    aliases: [
      'tags', 'Tags', 'keywords', 'labels', 'mots_cles', 'product_tags'
    ] 
  },
  published: { 
    label: 'Publié', 
    required: false, 
    aliases: [
      'published', 'Published', 'status', 'active', 'visible', 'enabled', 'is_active'
    ] 
  },
  variant_option1_name: { 
    label: 'Option 1 Nom', 
    required: false, 
    aliases: ['option1_name', 'Option1 Name', 'option1 name'] 
  },
  variant_option1_value: { 
    label: 'Option 1 Valeur', 
    required: false, 
    aliases: ['option1_value', 'Option1 Value', 'option1 value', 'size', 'taille'] 
  },
  variant_option2_name: { 
    label: 'Option 2 Nom', 
    required: false, 
    aliases: ['option2_name', 'Option2 Name', 'option2 name'] 
  },
  variant_option2_value: { 
    label: 'Option 2 Valeur', 
    required: false, 
    aliases: ['option2_value', 'Option2 Value', 'option2 value', 'color', 'couleur'] 
  },
  variant_option3_name: { 
    label: 'Option 3 Nom', 
    required: false, 
    aliases: ['option3_name', 'Option3 Name', 'option3 name'] 
  },
  variant_option3_value: { 
    label: 'Option 3 Valeur', 
    required: false, 
    aliases: ['option3_value', 'Option3 Value', 'option3 value'] 
  },
  barcode: { 
    label: 'Code-barre', 
    required: false, 
    aliases: [
      'barcode', 'Variant Barcode', 'ean', 'upc', 'gtin', 'isbn'
    ] 
  },
  handle: { 
    label: 'Handle (URL)', 
    required: false, 
    aliases: ['handle', 'Handle', 'url_handle', 'slug'] 
  },
  seo_title: { 
    label: 'Titre SEO', 
    required: false, 
    aliases: ['seo_title', 'SEO Title', 'meta_title'] 
  },
  seo_description: { 
    label: 'Description SEO', 
    required: false, 
    aliases: ['seo_description', 'SEO Description', 'meta_description'] 
  },
  image_alt: { 
    label: 'Alt Image', 
    required: false, 
    aliases: ['image_alt', 'Image Alt Text', 'alt_text', 'image alt text'] 
  },
  gift_card: { 
    label: 'Carte cadeau', 
    required: false, 
    aliases: ['gift_card', 'Gift Card', 'is_gift_card'] 
  },
  taxable: { 
    label: 'Taxable', 
    required: false, 
    aliases: ['taxable', 'Variant Taxable', 'variant taxable'] 
  },
  requires_shipping: { 
    label: 'Expédition requise', 
    required: false, 
    aliases: ['requires_shipping', 'Variant Requires Shipping', 'variant requires shipping'] 
  },
  fulfillment_service: { 
    label: 'Service de livraison', 
    required: false, 
    aliases: ['fulfillment_service', 'Variant Fulfillment Service', 'variant fulfillment service'] 
  },
  inventory_policy: { 
    label: 'Politique inventaire', 
    required: false, 
    aliases: ['inventory_policy', 'Variant Inventory Policy', 'variant inventory policy'] 
  },
  inventory_tracker: { 
    label: 'Suivi inventaire', 
    required: false, 
    aliases: ['inventory_tracker', 'Variant Inventory Tracker', 'variant inventory tracker'] 
  },
  google_gender: { 
    label: 'Google Genre', 
    required: false, 
    aliases: ['google_gender', 'Google Shopping / Gender', 'google shopping gender'] 
  },
  google_age_group: { 
    label: 'Google Age', 
    required: false, 
    aliases: ['google_age_group', 'Google Shopping / Age Group', 'google shopping age group'] 
  },
  google_mpn: { 
    label: 'Google MPN', 
    required: false, 
    aliases: ['google_mpn', 'Google Shopping / MPN', 'google shopping mpn'] 
  },
  google_condition: { 
    label: 'Google État', 
    required: false, 
    aliases: ['google_condition', 'Google Shopping / Condition', 'google shopping condition'] 
  }
}

function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

// Accepts: "1 234", "1\u00A0234", "1.234", "1,234", "12,50", "€12,50", "12.50"
function parseLocaleNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const raw = toCleanString(value)
  if (!raw) return null

  // Keep digits, separators, minus
  let s = raw
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/[^0-9,.-]/g, '')

  // If both comma and dot exist, assume last separator is decimal and remove the other as thousands
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      // comma is decimal
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // dot is decimal
      s = s.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    // comma as decimal
    s = s.replace(',', '.')
  }

  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function parseLocaleInt(value: unknown): number | null {
  const n = parseLocaleNumber(value)
  if (n === null) return null
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// Intelligent mapping algorithm
function autoDetectMapping(headers: string[], sampleRow: any): { mapping: ProductMapping; suggestions: Record<string, MappingSuggestion> } {
  const mapping: ProductMapping = {}
  const suggestions: Record<string, MappingSuggestion> = {}
  const usedFields = new Set<string>()

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[\s_-]+/g, '_')
    let bestMatch: { field: string; confidence: number; pattern: string } | null = null

    Object.entries(PRODUCT_FIELDS).forEach(([field, config]) => {
      if (usedFields.has(field)) return

      // Exact match on field name
      if (normalizedHeader === field) {
        bestMatch = { field, confidence: 100, pattern: 'exact' }
        return
      }

      // Check aliases
      for (const alias of config.aliases) {
        const normalizedAlias = alias.toLowerCase().replace(/[\s_-]+/g, '_')
        
        // Exact alias match
        if (normalizedHeader === normalizedAlias) {
          if (!bestMatch || bestMatch.confidence < 95) {
            bestMatch = { field, confidence: 95, pattern: `alias:${alias}` }
          }
          return
        }
        
        // Contains alias
        if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          const confidence = Math.min(85, 60 + (normalizedAlias.length / normalizedHeader.length) * 25)
          if (!bestMatch || bestMatch.confidence < confidence) {
            bestMatch = { field, confidence, pattern: `contains:${alias}` }
          }
        }
      }

      // Fuzzy match on label
      const normalizedLabel = config.label.toLowerCase().replace(/[\s_-]+/g, '_')
      if (normalizedHeader.includes(normalizedLabel) || normalizedLabel.includes(normalizedHeader)) {
        if (!bestMatch || bestMatch.confidence < 70) {
          bestMatch = { field, confidence: 70, pattern: `label:${config.label}` }
        }
      }
    })

    if (bestMatch && bestMatch.confidence >= 60) {
      mapping[header] = bestMatch.field
      usedFields.add(bestMatch.field)
      suggestions[header] = {
        field: bestMatch.field,
        confidence: bestMatch.confidence,
        matched_pattern: bestMatch.pattern
      }
    }
  })

  return { mapping, suggestions }
}

export function CSVImportWizard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'import'>('upload')
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [mapping, setMapping] = useState<ProductMapping>({})
  const [mappingSuggestions, setMappingSuggestions] = useState<Record<string, MappingSuggestion>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validProducts, setValidProducts] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [autoMappedCount, setAutoMappedCount] = useState(0)
  const [importOutcome, setImportOutcome] = useState<ImportOutcome | null>(null)

  const requiredFields = useMemo(() => {
    return Object.entries(PRODUCT_FIELDS)
      .filter(([, cfg]) => cfg.required)
      .map(([field]) => field)
  }, [])

  const hasRequiredMappings = useMemo(() => {
    const mappedFields = new Set(Object.values(mapping).filter(Boolean))
    return requiredFields.every((f) => mappedFields.has(f))
  }, [mapping, requiredFields])

  // Auto-detect mapping when CSV data changes
  useEffect(() => {
    if (csvData && csvData.headers.length > 0) {
      const { mapping: autoMapping, suggestions } = autoDetectMapping(csvData.headers, csvData.rows[0])
      setMapping(autoMapping)
      setMappingSuggestions(suggestions)
      setAutoMappedCount(Object.keys(autoMapping).length)
      
      if (Object.keys(autoMapping).length > 0) {
        toast({
          title: "🪄 Mapping automatique",
          description: `${Object.keys(autoMapping).length} colonnes détectées automatiquement`,
        })
      }
    }
  }, [csvData, toast])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({
            title: "Erreur de parsing",
            description: "Le fichier CSV contient des erreurs de format",
            variant: "destructive"
          })
          return
        }

        setCsvData({
          headers: results.meta.fields || [],
          rows: results.data,
          fileName: file.name
        })
        setStep('mapping')
      },
      error: (error) => {
        toast({
          title: "Erreur",
          description: `Impossible de lire le fichier: ${error.message}`,
          variant: "destructive"
        })
      }
    })
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  const handleMappingChange = (csvColumn: string, productField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: productField
    }))
  }

  const validateData = () => {
    if (!csvData) return

    const errors: ValidationError[] = []
    const products: any[] = []

    csvData.rows.forEach((row, index) => {
      const product: any = {}
      let hasRequiredFields = true

      // Map CSV columns to product fields
      Object.entries(mapping).forEach(([csvColumn, productField]) => {
        if (productField && productField !== 'ignore') {
          product[productField] = row[csvColumn]
        }
      })

       // Validate required fields
       Object.entries(PRODUCT_FIELDS).forEach(([field, config]) => {
         if (config.required && (!toCleanString(product[field]))) {
          errors.push({
            row: index + 1,
            field,
            message: `${config.label} est requis`,
            severity: 'error'
          })
          hasRequiredFields = false
        }
      })

       // Validate price format (accept comma decimals)
       const parsedPrice = parseLocaleNumber(product.price)
       if (toCleanString(product.price) && parsedPrice === null) {
        errors.push({
          row: index + 1,
          field: 'price',
           message: 'Prix invalide (ex: 12.50 ou 12,50)',
           severity: 'error',
           value: toCleanString(product.price)
        })
        hasRequiredFields = false
      }

       // Validate stock quantity: only warn when non-empty and non-numeric
       const rawStock = toCleanString(product.stock_quantity)
       const parsedStock = parseLocaleInt(product.stock_quantity)
       if (rawStock && parsedStock === null) {
        errors.push({
          row: index + 1,
          field: 'stock_quantity',
           message: 'Quantité de stock invalide (doit être un nombre)',
           severity: 'warning',
           value: rawStock
        })
      }

      if (hasRequiredFields) {
        products.push({
          ...product,
          row_number: index + 1,
           price: parsedPrice ?? 0,
           stock_quantity: parsedStock ?? 0
        })
      }
    })

    setValidationErrors(errors)
    setValidProducts(products)
    setStep('validation')
  }

  const startImport = async () => {
    if (validProducts.length === 0) return

    setIsImporting(true)
    setImportProgress(0)
    setImportOutcome(null)
    setStep('import')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setImportProgress(10)
      const { data, error } = await supabase.functions.invoke('bulk-import-products', {
        body: {
          products: validProducts,
          source: 'csv',
          options: {
            auto_optimize: false,
            auto_publish: false
          }
        }
      })
      setImportProgress(90)

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || "Import échoué")

      const outcome: ImportOutcome = {
        jobId: data.job_id,
        imported: data.succeeded || 0,
        failed: data.failed || 0,
        errors: Array.isArray(data.errors) ? data.errors : []
      }
      setImportOutcome(outcome)
      setImportProgress(100)

      toast({
        title: outcome.failed > 0 ? 'Import terminé avec erreurs' : 'Import réussi',
        description:
          outcome.failed > 0
            ? `${outcome.imported} importés • ${outcome.failed} échecs (voir détails)`
            : `${outcome.imported} produits importés avec succès`,
        variant: outcome.failed > 0 ? 'default' : 'default'
      })
    } catch (error) {
      console.error('Import failed:', error)
      setImportOutcome({
        imported: 0,
        failed: validProducts.length,
        errors: [error instanceof Error ? error.message : "Erreur lors de l'import"],
      })
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'import des produits",
        variant: "destructive"
      })
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  const resetWizard = () => {
    setStep('upload')
    setCsvData(null)
    setMapping({})
    setValidationErrors([])
    setValidProducts([])
    setImportProgress(0)
    setIsImporting(false)
    setImportOutcome(null)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Assistant d'Import CSV
        </CardTitle>
        <CardDescription>
          Importez vos produits depuis un fichier CSV avec mapping automatique des colonnes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={step !== 'upload'}>
              1. Upload
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={step !== 'mapping'}>
              2. Mapping
            </TabsTrigger>
            <TabsTrigger value="validation" disabled={step !== 'validation'}>
              3. Validation
            </TabsTrigger>
            <TabsTrigger value="import" disabled={step !== 'import'}>
              4. Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier CSV'}
              </h3>
              <p className="text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <Badge variant="outline">CSV, XLS, XLSX acceptés</Badge>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {csvData && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      Mapping des colonnes
                      {autoMappedCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                          <Sparkles className="w-3 h-3" />
                          {autoMappedCount} auto-détectées
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Fichier: {csvData.fileName} ({csvData.rows.length} lignes)
                    </p>
                  </div>
                  <Button onClick={() => setStep('upload')} variant="outline">
                    Changer de fichier
                  </Button>
                </div>

                {/* Auto-mapping summary */}
                {autoMappedCount > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Mapping intelligent activé</p>
                      <p className="text-xs text-muted-foreground">
                        {autoMappedCount} colonnes mappées automatiquement. Vérifiez et ajustez si nécessaire.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.entries(PRODUCT_FIELDS)
                        .filter(([key]) => Object.values(mapping).includes(key))
                        .slice(0, 4)
                        .map(([key, config]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        ))}
                      {Object.values(mapping).length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.values(mapping).length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-3">
                    {csvData.headers.map((header, index) => {
                      const suggestion = mappingSuggestions[header]
                      const isAutoMapped = !!suggestion
                      const confidence = suggestion?.confidence || 0
                      
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-center gap-4 p-3 border rounded-lg transition-colors",
                            isAutoMapped && "border-primary/30 bg-primary/5",
                            !isAutoMapped && mapping[header] && "border-green-500/30 bg-green-500/5"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium truncate">{header}</Label>
                              {isAutoMapped && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    confidence >= 90 ? "bg-green-500/20 text-green-700" :
                                    confidence >= 70 ? "bg-primary/20 text-primary" :
                                    "bg-yellow-500/20 text-yellow-700"
                                  )}
                                >
                                  {confidence >= 90 ? <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> : null}
                                  {confidence}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              Exemple: {csvData.rows[0]?.[header]?.toString().substring(0, 60) || '(vide)'}
                              {csvData.rows[0]?.[header]?.toString().length > 60 ? '...' : ''}
                            </p>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          
                          <div className="w-52 shrink-0">
                            <Select
                              value={mapping[header] || ''}
                              onValueChange={(value) => handleMappingChange(header, value)}
                            >
                              <SelectTrigger className={cn(
                                mapping[header] && "border-primary"
                              )}>
                                <SelectValue placeholder="Sélectionner un..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <X className="w-3 h-3" />
                                    Ignorer
                                  </span>
                                </SelectItem>
                                {Object.entries(PRODUCT_FIELDS).map(([field, config]) => (
                                  <SelectItem key={field} value={field}>
                                    <span className="flex items-center gap-2">
                                      {config.label}
                                      {config.required && <span className="text-destructive">*</span>}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{Object.values(mapping).filter(v => v && v !== 'ignore').length}</span> colonnes mappées sur {csvData.headers.length}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setStep('upload')} variant="outline">
                      Retour
                    </Button>
                    <Button onClick={validateData} disabled={!hasRequiredMappings} className="gap-2">
                      Valider les données
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Validation des données</h3>
                <p className="text-sm text-muted-foreground">
                  {validProducts.length} produits valides, {validationErrors.filter(e => e.severity === 'error').length} erreurs
                </p>
              </div>
              <Button onClick={() => setStep('mapping')} variant="outline">
                Modifier le mapping
              </Button>
            </div>

            {validationErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Erreurs de validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                       {validationErrors.slice(0, 50).map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {error.severity === 'error' ? (
                            <X className="w-4 h-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                           <span className="font-medium">Ligne {error.row}:</span>
                           <span>
                             {error.message}
                             {error.value ? (
                               <span className="text-muted-foreground"> — valeur: “{error.value}”</span>
                             ) : null}
                           </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  Aperçu des produits valides ({validProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Catégorie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validProducts.slice(0, 10).map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.price}€</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep('mapping')} variant="outline">
                Retour
              </Button>
              <Button 
                onClick={startImport} 
                disabled={validProducts.length === 0 || validationErrors.some(e => e.severity === 'error')}
              >
                Importer {validProducts.length} produits
              </Button>
            </div>
          </TabsContent>

           <TabsContent value="import" className="space-y-4">
             <div className="text-center space-y-4">
               <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
                 {isImporting ? (
                   <Upload className="w-8 h-8 text-primary" />
                 ) : (
                   <Check className="w-8 h-8 text-primary" />
                 )}
               </div>

               <h3 className="text-lg font-medium">
                 {isImporting ? 'Import en cours…' : 'Import terminé'}
               </h3>

               {importOutcome ? (
                 <div className="space-y-2">
                   <p className="text-muted-foreground">
                     {importOutcome.imported} importés • {importOutcome.failed} échecs
                     {importOutcome.jobId ? (
                       <span className="text-muted-foreground"> • Job: {importOutcome.jobId}</span>
                     ) : null}
                   </p>
                   {importOutcome.errors?.length ? (
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-base flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-yellow-500" />
                           Détails des erreurs (extrait)
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <ScrollArea className="h-40">
                           <div className="space-y-2 text-sm">
                             {importOutcome.errors.slice(0, 20).map((e, idx) => (
                               <div key={idx} className="flex items-start gap-2">
                                 <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                 <span>{e}</span>
                               </div>
                             ))}
                           </div>
                         </ScrollArea>
                       </CardContent>
                     </Card>
                   ) : null}
                 </div>
               ) : (
                 <p className="text-muted-foreground">
                   Préparation de l'import…
                 </p>
               )}

               <div className="space-y-2">
                 <Progress value={importProgress} className="w-full" />
                 <p className="text-sm text-muted-foreground">{Math.round(importProgress)}%</p>
               </div>

               <div className="flex gap-2 justify-center">
                 <Button onClick={resetWizard} variant="outline" disabled={isImporting}>
                   Nouvel import
                 </Button>
                 <Button onClick={() => navigate('/import/history')} disabled={isImporting}>
                   Voir l'historique
                 </Button>
               </div>
             </div>
           </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}