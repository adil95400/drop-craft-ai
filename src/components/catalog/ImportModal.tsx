import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, Link, Image, FileText, 
  CheckCircle, AlertCircle, Bot, Download 
} from 'lucide-react'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importMethod, setImportMethod] = useState('csv')
  const [url, setUrl] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)

  const handleFileImport = async () => {
    if (!csvFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier CSV.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setProgress(0)

    // Simulation d'import
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setLoading(false)
          toast({
            title: "Import terminé",
            description: "Les produits ont été importés avec succès."
          })
          onClose()
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleUrlImport = async () => {
    if (!url) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une URL valide.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setProgress(0)

    // Simulation d'import depuis URL
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setLoading(false)
          toast({
            title: "Import terminé",
            description: "Les produits ont été extraits et importés depuis l'URL."
          })
          onClose()
          return 100
        }
        return prev + 8
      })
    }, 400)
  }

  const handleImageImport = async () => {
    if (!imageFiles || imageFiles.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner des images.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setProgress(0)

    // Simulation d'analyse d'images avec IA
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setLoading(false)
          toast({
            title: "Analyse terminée",
            description: `${imageFiles.length} produits extraits des images avec IA.`
          })
          onClose()
          return 100
        }
        return prev + 6
      })
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des Produits
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="csv">CSV/Excel</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="images">Images IA</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Import CSV/Excel</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Importez vos produits depuis un fichier CSV ou Excel
              </p>
              
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="mb-4"
              />
              
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Modèle CSV
                </Button>
                <Button onClick={handleFileImport} disabled={loading || !csvFile}>
                  {loading ? 'Import en cours...' : 'Importer'}
                </Button>
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Import en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Import depuis URL</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extrayez automatiquement les produits depuis une page web
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">URL de la page produit</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://exemple.com/produits"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue placeholder="Type de site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Détection automatique</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="generic">Site générique</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={handleUrlImport} disabled={loading || !url} className="w-full">
                  {loading ? 'Extraction en cours...' : 'Extraire les produits'}
                </Button>
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Extraction depuis l'URL...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Analyse IA d'Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                L'IA analyse vos images pour créer automatiquement les produits
              </p>
              
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(e.target.files)}
                className="mb-4"
              />
              
              <div className="text-xs text-muted-foreground mb-4">
                ✓ Détection automatique du nom, prix, descriptions<br/>
                ✓ Classification par catégorie<br/>
                ✓ Optimisation SEO automatique
              </div>
              
              <Button onClick={handleImageImport} disabled={loading || !imageFiles} className="w-full">
                {loading ? 'Analyse IA en cours...' : `Analyser ${imageFiles?.length || 0} images`}
              </Button>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyse IA des images...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Import API</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez-vous directement aux APIs de vos fournisseurs
              </p>
              
              <div className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="dropship">Dropship Central</SelectItem>
                    <SelectItem value="wholesale">Wholesale Central</SelectItem>
                    <SelectItem value="custom">API personnalisée</SelectItem>
                  </SelectContent>
                </Select>
                
                <div>
                  <Label htmlFor="api-key">Clé API</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Votre clé API"
                  />
                </div>
                
                <Button className="w-full" disabled>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Fonctionnalité bientôt disponible
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}