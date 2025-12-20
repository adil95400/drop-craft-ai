import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Download } from 'lucide-react'
import { toast } from 'sonner'
import { csvImportService, ImportPreview, ConflictResolution } from '@/services/csvImportService'
import { ImportPreviewDialog } from './ImportPreviewDialog'
import { supabase } from '@/integrations/supabase/client'
import { Product } from '@/lib/supabase'

interface AdvancedCSVImportProps {
  existingProducts: Product[]
  onImportComplete: () => void
}

export function AdvancedCSVImport({ existingProducts, onImportComplete }: AdvancedCSVImportProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.name.endsWith('.csv')) {
      toast.error('Format invalide', {
        description: 'Veuillez sélectionner un fichier CSV'
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Parser le CSV
      const rows = await csvImportService.parseShopifyCSV(file)
      
      if (rows.length === 0) {
        toast.error('Fichier vide', {
          description: 'Le fichier CSV ne contient aucune donnée'
        })
        return
      }

      // Analyser les différences
      const analysisResult = csvImportService.analyzeImport(rows, existingProducts)
      setPreview(analysisResult)
      setShowPreview(true)

      const stats = csvImportService.getImportStats(analysisResult)
      toast.success('Analyse terminée', {
        description: `${stats.new} nouveaux, ${stats.updates} mises à jour, ${stats.conflicts} conflits, ${stats.errors} erreurs`
      })
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Erreur d\'analyse', {
        description: error instanceof Error ? error.message : 'Impossible d\'analyser le fichier'
      })
    } finally {
      setIsAnalyzing(false)
      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImport = async (resolutions: ConflictResolution[]) => {
    if (!preview) return

    setIsImporting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let successCount = 0
      let errorCount = 0

      // Importer les nouveaux produits
      for (const product of preview.new) {
        try {
          const productData = {
            title: product.name || 'Produit sans nom',
            description: product.description || null,
            price: product.price || 0,
            cost_price: product.cost_price || 0,
            category: product.category || null,
            stock_quantity: product.stock_quantity || 0,
            status: product.status || 'draft',
            image_url: product.image_url || null,
            sku: product.sku || null,
            weight: product.weight || null,
            tags: product.tags || null,
            user_id: user.id
          }

          const { error } = await supabase
            .from('products')
            .insert(productData)

          if (error) throw error
          successCount++
        } catch (error) {
          console.error('Error creating product:', error)
          errorCount++
        }
      }

      // Mettre à jour les produits existants
      for (const update of preview.updates) {
        try {
          const { error } = await supabase
            .from('products')
            .update({
              title: update.product.name,
              description: update.product.description,
              price: update.product.price,
              cost_price: update.product.cost_price,
              category: update.product.category,
              stock_quantity: update.product.stock_quantity,
              status: update.product.status,
              image_url: update.product.image_url,
              sku: update.product.sku,
              weight: update.product.weight,
              tags: update.product.tags
            })
            .eq('id', update.existingProduct.id)

          if (error) throw error
          successCount++
        } catch (error) {
          console.error('Error updating product:', error)
          errorCount++
        }
      }

      // Gérer les conflits selon les résolutions
      for (let i = 0; i < preview.conflicts.length; i++) {
        const conflict = preview.conflicts[i]
        const resolution = resolutions.find(r => r.productIndex === i)

        if (!resolution || resolution.action === 'skip') continue

        try {
          if (resolution.action === 'update') {
            // Mettre à jour le produit existant
            const { error } = await supabase
              .from('products')
              .update({
                title: conflict.product.name,
                description: conflict.product.description,
                price: conflict.product.price,
                cost_price: conflict.product.cost_price,
                category: conflict.product.category,
                stock_quantity: conflict.product.stock_quantity
              })
              .eq('id', conflict.existingProduct.id)

            if (error) throw error
            successCount++
          } else if (resolution.action === 'create_new') {
            // Créer un nouveau produit (modifier le SKU pour éviter le conflit)
            const newProduct = {
              title: conflict.product.name || 'Produit sans nom',
              description: conflict.product.description || null,
              price: conflict.product.price || 0,
              cost_price: conflict.product.cost_price || 0,
              category: conflict.product.category || null,
              stock_quantity: conflict.product.stock_quantity || 0,
              status: conflict.product.status || 'draft',
              sku: conflict.product.sku ? `${conflict.product.sku}-NEW` : null,
              user_id: user.id
            }

            const { error } = await supabase
              .from('products')
              .insert(newProduct)

            if (error) throw error
            successCount++
          }
        } catch (error) {
          console.error('Error resolving conflict:', error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success('Import terminé', {
          description: `${successCount} produit(s) importé(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`
        })
        onImportComplete()
        setShowPreview(false)
        setPreview(null)
      } else {
        throw new Error('Aucun produit n\'a pu être importé')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Erreur d\'import', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    // Télécharger le template Shopify
    const link = document.createElement('a')
    link.href = '/templates/shopify_product_template.csv'
    link.download = 'shopify_product_template.csv'
    link.click()
    
    toast.success('Template téléchargé', {
      description: 'Utilisez ce template pour préparer vos produits'
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import CSV avancé</CardTitle>
          <CardDescription>
            Importez ou mettez à jour vos produits depuis un fichier CSV au format Shopify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              {isAnalyzing ? 'Analyse en cours...' : 'Sélectionner un fichier CSV'}
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Télécharger le template
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-medium">Format requis: CSV Shopify</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Le système détectera automatiquement les nouveaux produits et les mises à jour</li>
                  <li>• Les produits sont identifiés par leur SKU ou leur nom</li>
                  <li>• Vous pourrez prévisualiser tous les changements avant validation</li>
                  <li>• Les conflits seront signalés et devront être résolus manuellement</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ImportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        preview={preview}
        onConfirm={handleImport}
        isImporting={isImporting}
      />
    </>
  )
}
