import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  Upload,
  Link,
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Globe,
  ShoppingCart
} from 'lucide-react'

export interface ImportInterfaceProps {
  onImportComplete?: () => void
}

export const ImportInterface: React.FC<ImportInterfaceProps> = ({ onImportComplete }) => {
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  
  // URL Import states
  const [importUrl, setImportUrl] = useState('')
  
  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  
  // Supplier Import states
  const [selectedSupplier, setSelectedSupplier] = useState('')
  
  const suppliers = [
    { id: 'aliexpress', name: 'AliExpress', status: 'connected' },
    { id: 'bigbuy', name: 'BigBuy', status: 'connected' },
    { id: 'dropshipping_copilot', name: 'Dropshipping Copilot', status: 'available' },
    { id: 'spocket', name: 'Spocket', status: 'available' }
  ]

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez saisir une URL valide",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('import-products', {
        body: {
          source: 'url',
          data: {
            url: importUrl,
            config: { extract_images: true, analyze_content: true }
          }
        }
      })

      if (error) throw error

      toast({
        title: "Import réussi !",
        description: `${data.products_imported} produits importés depuis l'URL`
      })

      setImportUrl('')
      onImportComplete?.()

    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Importer des Produits</h2>
        <p className="text-muted-foreground">
          Importez vos produits depuis différentes sources pour enrichir votre catalogue
        </p>
      </div>

      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            URL/Site Web
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Fichier CSV
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Fournisseurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Import depuis URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  URL du produit ou de la page
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/product-page"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleUrlImport}
                disabled={isImporting || !importUrl.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Importer depuis l'URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}