/**
 * ImportCSVPreview — Preview live CSV avec mapping colonnes et validation
 */
import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  FileSpreadsheet, Upload, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Columns, Eye, Sparkles, RefreshCw, Download, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface ColumnMapping {
  csvColumn: string
  targetField: string
  auto: boolean
}

const targetFields = [
  { value: 'name', label: 'Nom du produit', required: true },
  { value: 'price', label: 'Prix de vente', required: true },
  { value: 'cost_price', label: 'Prix d\'achat' },
  { value: 'description', label: 'Description' },
  { value: 'sku', label: 'SKU' },
  { value: 'category', label: 'Catégorie' },
  { value: 'brand', label: 'Marque' },
  { value: 'stock_quantity', label: 'Stock' },
  { value: 'image_url', label: 'URL Image' },
  { value: 'weight', label: 'Poids' },
  { value: 'tags', label: 'Tags' },
  { value: 'compare_at_price', label: 'Prix barré' },
  { value: 'seo_title', label: 'Titre SEO' },
  { value: 'seo_description', label: 'Description SEO' },
  { value: 'ignore', label: '— Ignorer —' },
]

function autoDetectMapping(header: string): string {
  const h = header.toLowerCase().trim()
  if (/^(name|title|nom|titre|product.?name)$/i.test(h)) return 'name'
  if (/^(price|prix|sale.?price|prix.?vente)$/i.test(h)) return 'price'
  if (/^(cost|cost.?price|prix.?achat|purchase)$/i.test(h)) return 'cost_price'
  if (/^(desc|description|body|content)$/i.test(h)) return 'description'
  if (/^(sku|ref|reference|article)$/i.test(h)) return 'sku'
  if (/^(cat|category|catégorie|categorie|type)$/i.test(h)) return 'category'
  if (/^(brand|marque|vendor|manufacturer)$/i.test(h)) return 'brand'
  if (/^(stock|quantity|qty|inventaire|inventory)$/i.test(h)) return 'stock_quantity'
  if (/^(image|img|photo|picture|image.?url)$/i.test(h)) return 'image_url'
  if (/^(weight|poids|masse)$/i.test(h)) return 'weight'
  if (/^(tags?|étiquette)$/i.test(h)) return 'tags'
  if (/^(compare|compare.?at|prix.?barré|original)$/i.test(h)) return 'compare_at_price'
  return 'ignore'
}

interface ImportCSVPreviewProps {
  className?: string
  onImport?: (data: any[], mapping: Record<string, string>) => void
}

export function ImportCSVPreview({ className, onImport }: ImportCSVPreviewProps) {
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [hasHeader, setHasHeader] = useState(true)
  const [previewRows, setPreviewRows] = useState(10)

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileName(file.name)

    Papa.parse(file, {
      complete: (result) => {
        const rows = result.data as string[][]
        if (rows.length === 0) {
          toast.error('Fichier vide')
          return
        }
        const hdrs = rows[0] || []
        setHeaders(hdrs)
        setCsvData(rows.slice(1).filter(r => r.some(c => c?.trim())))
        setMappings(hdrs.map(h => ({
          csvColumn: h,
          targetField: autoDetectMapping(h),
          auto: autoDetectMapping(h) !== 'ignore',
        })))
        toast.success(`${rows.length - 1} lignes détectées`)
      },
      error: () => toast.error('Erreur de lecture du fichier'),
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls', '.xlsx'] },
    maxFiles: 1,
  })

  const updateMapping = (index: number, targetField: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, targetField, auto: false } : m))
  }

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    const requiredFields = targetFields.filter(f => f.required).map(f => f.value)
    const mapped = mappings.map(m => m.targetField).filter(f => f !== 'ignore')
    requiredFields.forEach(f => {
      if (!mapped.includes(f)) errors.push(`Champ requis manquant : ${targetFields.find(t => t.value === f)?.label}`)
    })
    return errors
  }, [mappings])

  const mappedCount = mappings.filter(m => m.targetField !== 'ignore').length
  const autoMappedCount = mappings.filter(m => m.auto && m.targetField !== 'ignore').length

  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast.error('Corrigez les erreurs de mapping avant d\'importer')
      return
    }
    const mappingRecord: Record<string, string> = {}
    mappings.forEach(m => {
      if (m.targetField !== 'ignore') mappingRecord[m.csvColumn] = m.targetField
    })
    onImport?.(csvData, mappingRecord)
    toast.success(`Import de ${csvData.length} produits lancé`)
  }

  const previewData = csvData.slice(0, previewRows)

  if (headers.length === 0) {
    return (
      <Card className={cn('border-2 border-dashed', className)}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              'flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed transition-all cursor-pointer',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <div className="p-4 bg-primary/10 rounded-2xl mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Glissez votre fichier CSV ici</h3>
            <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner — CSV, XLS, XLSX</p>
            <Badge variant="outline" className="text-xs">Mapping intelligent automatique</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Preview CSV — {fileName}
            </CardTitle>
            <CardDescription>
              {csvData.length} lignes • {headers.length} colonnes • {mappedCount} mappées ({autoMappedCount} auto)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setHeaders([]); setCsvData([]); setMappings([]); }}>
              <Trash2 className="w-4 h-4 mr-1" />
              Effacer
            </Button>
            <Button size="sm" onClick={handleImport} disabled={validationErrors.length > 0}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Importer {csvData.length} produits
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-1">
            {validationErrors.map((err, i) => (
              <p key={i} className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {err}
              </p>
            ))}
          </div>
        )}

        {/* Column mapping */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Columns className="w-4 h-4" /> Mapping des colonnes
            {autoMappedCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" /> {autoMappedCount} auto-détectées
              </Badge>
            )}
          </h4>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {mappings.map((mapping, index) => (
                <div key={index} className="flex flex-col gap-1.5 min-w-[160px]">
                  <div className="text-[11px] font-medium text-muted-foreground truncate px-1">
                    {mapping.csvColumn}
                  </div>
                  <Select value={mapping.targetField} onValueChange={(v) => updateMapping(index, v)}>
                    <SelectTrigger className={cn(
                      'h-8 text-xs',
                      mapping.auto && mapping.targetField !== 'ignore' && 'border-emerald-500/40 bg-emerald-500/5',
                      mapping.targetField === 'ignore' && 'opacity-50'
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetFields.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs">
                          {f.label} {f.required && <span className="text-destructive">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.auto && mapping.targetField !== 'ignore' && (
                    <span className="text-[9px] text-emerald-600 px-1 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Auto
                    </span>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <Separator />

        {/* Data preview table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" /> Aperçu des données
            </h4>
            <Select value={String(previewRows)} onValueChange={v => setPreviewRows(Number(v))}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 lignes</SelectItem>
                <SelectItem value="10">10 lignes</SelectItem>
                <SelectItem value="25">25 lignes</SelectItem>
                <SelectItem value="50">50 lignes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="max-h-[400px] border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    {headers.map((h, i) => {
                      const mapping = mappings[i]
                      const target = targetFields.find(f => f.value === mapping?.targetField)
                      return (
                        <th key={i} className={cn(
                          'px-3 py-2 text-left font-medium whitespace-nowrap',
                          mapping?.targetField === 'ignore' ? 'text-muted-foreground/40' : 'text-foreground'
                        )}>
                          <div>{h}</div>
                          {target && target.value !== 'ignore' && (
                            <div className="text-[9px] text-primary font-normal">→ {target.label}</div>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-t hover:bg-accent/30">
                      <td className="px-3 py-1.5 text-muted-foreground">{rowIdx + 1}</td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className={cn(
                          'px-3 py-1.5 max-w-[200px] truncate',
                          mappings[colIdx]?.targetField === 'ignore' && 'opacity-30'
                        )}>
                          {cell || <span className="text-muted-foreground italic">vide</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
