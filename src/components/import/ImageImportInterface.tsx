import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { Upload, Camera, Search, Zap, Eye, Download } from 'lucide-react'
import { productionLogger } from '@/utils/productionLogger'
import { supabase } from '@/integrations/supabase/client'

interface DetectedProduct {
  id: string
  name: string
  price: number
  currency: string
  source: string
  imageUrl: string
  confidence: number
  category: string
  brand?: string
  specifications: Record<string, any>
}

interface ImageImportProps {
  onProductsFound: (products: DetectedProduct[]) => void
}

export function ImageImportInterface({ onProductsFound }: ImageImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([])
  const [searchUrl, setSearchUrl] = useState('')
  const [ocrText, setOcrText] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Convert image to base64
      const base64 = await fileToBase64(file)
      
      // Call image recognition edge function
      const { data, error } = await supabase.functions.invoke('image-recognition', {
        body: { 
          image: base64,
          options: {
            enableOCR: true,
            enableReverseSearch: true,
            enableBrandDetection: true
          }
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (error) throw error

      const { ocrText: extractedText, products, brandInfo } = data

      setOcrText(extractedText)
      setDetectedProducts(products)
      onProductsFound(products)

      toast({
        title: "Image analysée avec succès",
        description: `${products.length} produits trouvés via reverse search et OCR`
      })

    } catch (error) {
      productionLogger.error('Image processing failed', error as Error, 'ImageImportInterface');
      toast({
        title: "Erreur lors de l'analyse",
        description: "Impossible d'analyser l'image",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [onProductsFound])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const handleUrlSearch = async () => {
    if (!searchUrl) return

    setIsProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('reverse-image-search', {
        body: { imageUrl: searchUrl }
      })

      if (error) throw error

      setDetectedProducts(data.products)
      onProductsFound(data.products)

      toast({
        title: "Recherche terminée",
        description: `${data.products.length} produits similaires trouvés`
      })
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de traiter l'URL de l'image",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const importProduct = async (product: DetectedProduct) => {
    try {
      const { error } = await supabase.functions.invoke('import-product', {
        body: { 
          product,
          source: 'image_recognition',
          autoOptimize: true
        }
      })

      if (error) throw error

      toast({
        title: "Produit importé",
        description: `${product.name} ajouté à votre catalogue`
      })
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Image Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Import par Image + OCR
          </CardTitle>
          <CardDescription>
            Uploadez une image pour identifier des produits similaires et extraire le texte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${isProcessing ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Déposez l\'image ici' : 'Glissez une image ou cliquez pour sélectionner'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formats supportés: JPEG, PNG, WebP (max 10MB)
              </p>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Analyse en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted-foreground">OU</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="image-url">URL de l'image</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUrlSearch}
                disabled={!searchUrl || isProcessing}
                className="mt-6"
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR Results */}
      {ocrText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Texte détecté (OCR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{ocrText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected Products */}
      {detectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Produits détectés ({detectedProducts.length})
            </CardTitle>
            <CardDescription>
              Produits similaires trouvés via reverse image search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="space-y-2">
                    <h4 className="font-medium line-clamp-2">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">
                        {product.price.toFixed(2)} {product.currency}
                      </span>
                      <Badge variant="secondary">{product.source}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{product.category}</span>
                      <span>{Math.round(product.confidence * 100)}% confiance</span>
                    </div>
                    {product.brand && (
                      <Badge variant="outline" className="text-xs">
                        {product.brand}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => importProduct(product)}
                    size="sm" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = error => reject(error)
  })
}