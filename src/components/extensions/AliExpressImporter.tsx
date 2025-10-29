import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Package, Star, Upload, ShoppingCart } from 'lucide-react'

export const AliExpressImporter: React.FC = () => {
  const [reviewFile, setReviewFile] = useState<File | null>(null)
  const [productFile, setProductFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleReviewImport = async () => {
    if (!reviewFile) {
      toast({
        title: "Fichier requis",
        description: "Veuillez sélectionner un fichier d'avis",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const text = await reviewFile.text()
      let data = []
      
      if (reviewFile.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else {
        // Parse CSV
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',')
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = values[i]?.trim()
          })
          return obj
        })
      }

      const { data: result, error } = await supabase.functions.invoke(
        'extension-review-importer',
        {
          body: {
            source: 'aliexpress',
            data
          }
        }
      )

      if (error) throw error

      toast({
        title: "Import réussi",
        description: `${result.imported} avis AliExpress importés`
      })

      setReviewFile(null)
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProductImport = async () => {
    if (!productFile) {
      toast({
        title: "Fichier requis",
        description: "Veuillez sélectionner un fichier de produits",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const text = await productFile.text()
      let products = []
      
      if (productFile.name.endsWith('.json')) {
        products = JSON.parse(text)
      } else {
        // Parse CSV
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        products = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',')
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = values[i]?.trim()
          })
          return obj
        })
      }

      const { data: result, error } = await supabase.functions.invoke(
        'extension-sync-realtime',
        {
          body: {
            action: 'import_products',
            products,
            source: 'aliexpress'
          }
        }
      )

      if (error) throw error

      toast({
        title: "Import réussi",
        description: `${result.imported} produits AliExpress importés`
      })

      setProductFile(null)
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">Import AliExpress</h3>
          <p className="text-sm text-muted-foreground">
            Importez des produits et avis depuis AliExpress
          </p>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Avis Clients
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <div className="space-y-2">
            <Label>Fichier d'avis (CSV ou JSON)</Label>
            <Input
              type="file"
              accept=".csv,.json"
              onChange={(e) => e.target.files && setReviewFile(e.target.files[0])}
            />
            {reviewFile && (
              <p className="text-sm text-muted-foreground">
                {reviewFile.name} ({(reviewFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format attendu: product_name, customer_name, rating, comment, review_date
            </p>
          </div>

          <Button
            onClick={handleReviewImport}
            disabled={!reviewFile || loading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Import en cours...' : 'Importer les avis'}
          </Button>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="space-y-2">
            <Label>Fichier de produits (CSV ou JSON)</Label>
            <Input
              type="file"
              accept=".csv,.json"
              onChange={(e) => e.target.files && setProductFile(e.target.files[0])}
            />
            {productFile && (
              <p className="text-sm text-muted-foreground">
                {productFile.name} ({(productFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format attendu: name, sku, price, supplier_price, image_url, description
            </p>
          </div>

          <Button
            onClick={handleProductImport}
            disabled={!productFile || loading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Import en cours...' : 'Importer les produits'}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
