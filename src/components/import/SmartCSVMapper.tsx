import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  FileSpreadsheet, ArrowRight, CheckCircle2, AlertTriangle, 
  Wand2, Upload, RefreshCw, Eye, Download, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface CSVColumn {
  name: string
  samples: string[]
  suggestedMapping: string | null
  confidence: number
}

interface FieldMapping {
  csvColumn: string
  targetField: string
  transform?: string
}

const TARGET_FIELDS = [
  { id: 'name', label: 'Nom du produit', required: true },
  { id: 'description', label: 'Description', required: false },
  { id: 'price', label: 'Prix', required: true },
  { id: 'cost_price', label: 'Prix d\'achat', required: false },
  { id: 'sku', label: 'SKU', required: false },
  { id: 'barcode', label: 'Code-barres (EAN/UPC)', required: false },
  { id: 'category', label: 'Catégorie', required: false },
  { id: 'brand', label: 'Marque', required: false },
  { id: 'stock_quantity', label: 'Stock', required: false },
  { id: 'weight', label: 'Poids', required: false },
  { id: 'image_url', label: 'URL image principale', required: false },
  { id: 'images', label: 'URLs images additionnelles', required: false },
  { id: 'variant_title', label: 'Variante (titre)', required: false },
  { id: 'variant_sku', label: 'Variante (SKU)', required: false },
  { id: 'variant_price', label: 'Variante (prix)', required: false },
  { id: 'tags', label: 'Tags', required: false },
  { id: 'status', label: 'Statut', required: false },
  { id: 'seo_title', label: 'Titre SEO', required: false },
  { id: 'seo_description', label: 'Meta description', required: false },
]

// Patterns pour la reconnaissance automatique
const COLUMN_PATTERNS: Record<string, RegExp[]> = {
  name: [/^(product[_\s]?)?name$/i, /^title$/i, /^nom$/i, /^titre$/i, /^produit$/i],
  description: [/^desc(ription)?$/i, /^body(_html)?$/i, /^content$/i],
  price: [/^price$/i, /^prix$/i, /^variant[_\s]?price$/i, /^retail[_\s]?price$/i],
  cost_price: [/^cost$/i, /^cout$/i, /^cost[_\s]?price$/i, /^prix[_\s]?achat$/i],
  sku: [/^sku$/i, /^variant[_\s]?sku$/i, /^ref(erence)?$/i, /^article$/i],
  barcode: [/^(bar)?code$/i, /^ean$/i, /^upc$/i, /^gtin$/i],
  category: [/^categ(ory|orie)?$/i, /^type$/i, /^product[_\s]?type$/i],
  brand: [/^brand$/i, /^marque$/i, /^vendor$/i, /^manufacturer$/i],
  stock_quantity: [/^stock$/i, /^quantity$/i, /^inventory$/i, /^qty$/i],
  weight: [/^weight$/i, /^poids$/i, /^variant[_\s]?weight$/i],
  image_url: [/^image$/i, /^img$/i, /^image[_\s]?url$/i, /^photo$/i, /^image[_\s]?src$/i],
  images: [/^images$/i, /^additional[_\s]?images$/i, /^gallery$/i],
  tags: [/^tags?$/i, /^keywords?$/i, /^mots[_\s]?cl[ée]s?$/i],
  status: [/^status$/i, /^statut$/i, /^published$/i, /^active$/i],
}

function suggestMapping(columnName: string): { field: string | null; confidence: number } {
  const normalizedName = columnName.toLowerCase().trim()
  
  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        return { field, confidence: 95 }
      }
    }
  }
  
  // Fuzzy matching
  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    const fieldLower = field.toLowerCase()
    if (normalizedName.includes(fieldLower) || fieldLower.includes(normalizedName)) {
      return { field, confidence: 70 }
    }
  }
  
  return { field: null, confidence: 0 }
}

interface SmartCSVMapperProps {
  csvData: string[][]
  onMappingComplete: (mappings: FieldMapping[], data: Record<string, any>[]) => void
  onCancel: () => void
}

export function SmartCSVMapper({ csvData, onMappingComplete, onCancel }: SmartCSVMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([])

  const columns: CSVColumn[] = useMemo(() => {
    if (!csvData.length) return []
    
    const headers = csvData[0]
    return headers.map((header, idx) => {
      const samples = csvData.slice(1, 4).map(row => row[idx] || '').filter(Boolean)
      const suggestion = suggestMapping(header)
      
      return {
        name: header,
        samples,
        suggestedMapping: suggestion.field,
        confidence: suggestion.confidence
      }
    })
  }, [csvData])

  // Auto-apply suggestions on mount
  useEffect(() => {
    const autoMappings: Record<string, string> = {}
    columns.forEach(col => {
      if (col.suggestedMapping && col.confidence >= 70) {
        autoMappings[col.name] = col.suggestedMapping
      }
    })
    setMappings(autoMappings)
  }, [columns])

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setMappings(prev => ({
      ...prev,
      [csvColumn]: targetField === 'ignore' ? '' : targetField
    }))
  }

  const autoMapAll = () => {
    const newMappings: Record<string, string> = {}
    columns.forEach(col => {
      if (col.suggestedMapping) {
        newMappings[col.name] = col.suggestedMapping
      }
    })
    setMappings(newMappings)
    toast.success('Mapping automatique appliqué')
  }

  const mappingProgress = useMemo(() => {
    const requiredFields = TARGET_FIELDS.filter(f => f.required).map(f => f.id)
    const mappedRequired = requiredFields.filter(f => 
      Object.values(mappings).includes(f)
    ).length
    return (mappedRequired / requiredFields.length) * 100
  }, [mappings])

  const missingRequired = useMemo(() => {
    const requiredFields = TARGET_FIELDS.filter(f => f.required).map(f => f.id)
    return requiredFields.filter(f => !Object.values(mappings).includes(f))
  }, [mappings])

  const generatePreview = () => {
    if (!csvData.length) return
    
    const headers = csvData[0]
    const preview = csvData.slice(1, 6).map(row => {
      const item: Record<string, any> = {}
      
      headers.forEach((header, idx) => {
        const targetField = mappings[header]
        if (targetField) {
          item[targetField] = row[idx]
        }
      })
      
      return item
    })
    
    setPreviewData(preview)
  }

  const handleComplete = async () => {
    if (missingRequired.length > 0) {
      toast.error('Veuillez mapper tous les champs obligatoires')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const headers = csvData[0]
      const transformedData = csvData.slice(1).map(row => {
        const item: Record<string, any> = {}
        
        headers.forEach((header, idx) => {
          const targetField = mappings[header]
          if (targetField) {
            const rawValue = row[idx]
            let finalValue: string | number = rawValue
            
            // Basic transformations
            if (targetField === 'price' || targetField === 'cost_price') {
              finalValue = parseFloat(rawValue?.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
            }
            if (targetField === 'stock_quantity') {
              finalValue = parseInt(rawValue) || 0
            }
            
            item[targetField] = finalValue
          }
        })
        
        return item
      }).filter(item => item.name) // Filter out empty rows
      
      const fieldMappings: FieldMapping[] = Object.entries(mappings)
        .filter(([, target]) => target)
        .map(([csv, target]) => ({ csvColumn: csv, targetField: target }))
      
      onMappingComplete(fieldMappings, transformedData)
      toast.success(`${transformedData.length} produits prêts à importer`)
    } catch (error) {
      toast.error('Erreur lors du traitement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Mapping intelligent CSV
          </h2>
          <p className="text-muted-foreground">
            {csvData.length - 1} lignes détectées • {columns.length} colonnes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoMapAll}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-mapper
          </Button>
          <Button variant="outline" onClick={generatePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression du mapping</span>
            <span className="text-sm text-muted-foreground">{Math.round(mappingProgress)}%</span>
          </div>
          <Progress value={mappingProgress} className="h-2" />
          {missingRequired.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Champs obligatoires manquants: {missingRequired.map(f => 
                TARGET_FIELDS.find(tf => tf.id === f)?.label
              ).join(', ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des colonnes</CardTitle>
          <CardDescription>
            Associez chaque colonne CSV à un champ produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{col.name}</span>
                      {col.confidence >= 90 && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      {col.confidence >= 70 && col.confidence < 90 && (
                        <Badge variant="secondary">Suggéré</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Ex: {col.samples.slice(0, 2).join(', ') || 'N/A'}
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  
                  <Select
                    value={mappings[col.name] || 'ignore'}
                    onValueChange={(v) => handleMappingChange(col.name, v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ignorer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignorer cette colonne</SelectItem>
                      {TARGET_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                          {field.required && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu des données</CardTitle>
            <CardDescription>
              Premiers {previewData.length} produits après transformation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {previewData.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium">{item.name || 'Sans nom'}</div>
                    <div className="text-muted-foreground flex flex-wrap gap-2 mt-1">
                      {item.price && <Badge variant="outline">Prix: {String(item.price)}€</Badge>}
                      {item.sku && <Badge variant="secondary">SKU: {String(item.sku)}</Badge>}
                      {item.category && <Badge variant="secondary">{String(item.category)}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={isProcessing || missingRequired.length > 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Importer {csvData.length - 1} produits
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
