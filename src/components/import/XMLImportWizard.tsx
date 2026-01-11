import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, FileCode, Check, AlertTriangle, Eye, Download } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface XMLData {
  rootElement: string
  productPath: string
  rawContent: string
  fileName: string
  parsedProducts: any[]
}

interface FieldMapping {
  [xmlPath: string]: string
}

const PRODUCT_FIELDS = {
  name: { label: 'Nom du produit', required: true },
  description: { label: 'Description', required: false },
  price: { label: 'Prix', required: true },
  sku: { label: 'SKU/Référence', required: false },
  category: { label: 'Catégorie', required: false },
  brand: { label: 'Marque', required: false },
  stock_quantity: { label: 'Stock', required: false },
  image_url: { label: 'URL Image', required: false }
}

export function XMLImportWizard() {
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'configure' | 'mapping' | 'import'>('upload')
  const [xmlData, setXmlData] = useState<XMLData | null>(null)
  const [productPath, setProductPath] = useState('product')
  const [mapping, setMapping] = useState<FieldMapping>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const parseXML = (xmlText: string, fileName: string) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('XML invalide')
      }

      const rootElement = xmlDoc.documentElement.tagName
      
      setXmlData({
        rootElement,
        productPath: 'product',
        rawContent: xmlText,
        fileName,
        parsedProducts: []
      })
      setStep('configure')
      
      toast({
        title: "XML chargé",
        description: `Fichier ${fileName} analysé avec succès`
      })
    } catch (error: any) {
      toast({
        title: "Erreur de parsing XML",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const extractProducts = () => {
    if (!xmlData) return

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlData.rawContent, 'text/xml')
      
      const productNodes = xmlDoc.querySelectorAll(productPath)
      const products: any[] = []

      productNodes.forEach((node, index) => {
        const product: any = { _index: index + 1 }
        
        // Extract all text content from child elements
        node.childNodes.forEach((child) => {
          if (child.nodeType === 1) { // Element node
            const element = child as Element
            product[element.tagName] = element.textContent?.trim() || ''
          }
        })
        
        products.push(product)
      })

      setXmlData(prev => prev ? { ...prev, parsedProducts: products } : null)
      setStep('mapping')
      
      toast({
        title: "Produits extraits",
        description: `${products.length} produits trouvés`
      })
    } catch (error: any) {
      toast({
        title: "Erreur d'extraction",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const xmlText = e.target?.result as string
      parseXML(xmlText, file.name)
    }
    reader.onerror = () => {
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier",
        variant: "destructive"
      })
    }
    reader.readAsText(file)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'], 'application/xml': ['.xml'] },
    maxFiles: 1
  })

  const handleImport = async () => {
    if (!xmlData || !xmlData.parsedProducts.length) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const mappedProducts = xmlData.parsedProducts.map(product => {
        const mapped: any = { user_id: user.id }
        
        Object.entries(mapping).forEach(([xmlField, dbField]) => {
          if (dbField && product[xmlField]) {
            mapped[dbField] = product[xmlField]
          }
        })

        return {
          ...mapped,
          price: parseFloat(mapped.price || '0'),
          cost_price: parseFloat(mapped.cost_price || '0'),
          stock: parseInt(mapped.stock_quantity || '0')
        }
      })

      const batchSize = 50
      let imported = 0

      for (let i = 0; i < mappedProducts.length; i += batchSize) {
        const batch = mappedProducts.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('imported_products')
          .insert(batch)

        if (error) throw error
        
        imported += batch.length
        setImportProgress(Math.round((imported / mappedProducts.length) * 100))
      }

      toast({
        title: "Import réussi",
        description: `${imported} produits importés depuis XML`
      })

      setTimeout(() => {
        setStep('upload')
        setXmlData(null)
        setMapping({})
        setIsImporting(false)
        setImportProgress(0)
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Importer un fichier XML</CardTitle>
        <CardDescription>Glissez-déposez votre fichier XML ou cliquez pour sélectionner</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier XML'}
          </p>
          <p className="text-sm text-muted-foreground">ou cliquez pour parcourir vos fichiers</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderConfigureStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Configuration XML</CardTitle>
        <CardDescription>Configurez le chemin vers les éléments produits dans votre XML</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {xmlData && (
          <div className="space-y-4">
            <div>
              <Label>Fichier chargé</Label>
              <Input value={xmlData.fileName} disabled />
            </div>
            
            <div>
              <Label>Élément racine détecté</Label>
              <Input value={xmlData.rootElement} disabled />
            </div>

            <div>
              <Label htmlFor="product-path">Chemin vers les produits (sélecteur CSS)</Label>
              <Input
                id="product-path"
                placeholder="product, item, catalog > product"
                value={productPath}
                onChange={(e) => setProductPath(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Exemple: 'product' pour {"<product>"}, 'catalog {">"} item' pour {"<catalog><item>"}
              </p>
            </div>

            <Button onClick={extractProducts} className="w-full">
              Extraire les produits
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderMappingStep = () => {
    if (!xmlData || !xmlData.parsedProducts.length) return null

    const sampleProduct = xmlData.parsedProducts[0]
    const xmlFields = Object.keys(sampleProduct).filter(k => k !== '_index')

    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapping des champs</CardTitle>
          <CardDescription>
            Associez les champs XML aux champs de votre base de données ({xmlData.parsedProducts.length} produits trouvés)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {Object.entries(PRODUCT_FIELDS).map(([field, config]) => (
                <div key={field} className="flex items-center gap-4">
                  <Label className="w-40 flex items-center gap-2">
                    {config.label}
                    {config.required && <Badge variant="destructive" className="text-xs">Requis</Badge>}
                  </Label>
                  <Select
                    value={Object.entries(mapping).find(([_, v]) => v === field)?.[0] || 'unmapped'}
                    onValueChange={(value) => {
                      setMapping(prev => {
                        const newMapping = { ...prev }
                        // Remove any existing mapping to this db field
                        Object.keys(newMapping).forEach(key => {
                          if (newMapping[key] === field) delete newMapping[key]
                        })
                        if (value && value !== 'unmapped') newMapping[value] = field
                        return newMapping
                      })
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner un champ XML" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmapped">Non mappé</SelectItem>
                      {xmlFields.map(xmlField => (
                        <SelectItem key={xmlField} value={xmlField || `field_${Math.random()}`}>
                          {xmlField}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Aperçu du premier produit:</h4>
            <ScrollArea className="h-[200px]">
              <pre className="text-xs bg-muted p-3 rounded">
                {JSON.stringify(sampleProduct, null, 2)}
              </pre>
            </ScrollArea>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('configure')}>
              Retour
            </Button>
            <Button onClick={() => setStep('import')} className="flex-1">
              Continuer vers l'import
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderImportStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Import des produits</CardTitle>
        <CardDescription>Vérifiez et lancez l'importation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {xmlData && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <p className="text-sm text-muted-foreground">Produits à importer</p>
                <p className="text-2xl font-bold">{xmlData.parsedProducts.length}</p>
              </div>
              <div className="p-4 border rounded">
                <p className="text-sm text-muted-foreground">Champs mappés</p>
                <p className="text-2xl font-bold">{Object.keys(mapping).length}</p>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center text-muted-foreground">{importProgress}% importé</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')} disabled={isImporting}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                {isImporting ? 'Import en cours...' : 'Lancer l\'import'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" disabled={step !== 'upload'}>Upload</TabsTrigger>
          <TabsTrigger value="configure" disabled={!xmlData}>Configuration</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!xmlData?.parsedProducts.length}>Mapping</TabsTrigger>
          <TabsTrigger value="import" disabled={!xmlData?.parsedProducts.length}>Import</TabsTrigger>
        </TabsList>
      </Tabs>

      {step === 'upload' && renderUploadStep()}
      {step === 'configure' && renderConfigureStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'import' && renderImportStep()}
    </div>
  )
}
