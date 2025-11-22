import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useOptimizedImport } from '@/hooks/useOptimizedImport'
import { FileSpreadsheet, Link as LinkIcon, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function QuickImport() {
  const navigate = useNavigate()
  const { importData, isImporting, progress, status, details } = useOptimizedImport()
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file')
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['csv', 'xlsx', 'xls', 'json'].includes(ext || '')) {
        toast.error('Format de fichier non supporté. Utilisez CSV, Excel ou JSON.')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleFileImport = () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    const format = ext === 'xlsx' || ext === 'xls' ? 'excel' : ext === 'json' ? 'json' : 'csv'

    importData(selectedFile, {
      format,
      delimiter: ',',
      skipRows: 0,
      batchSize: 50
    })
  }

  const handleUrlImport = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL')
      return
    }

    try {
      new URL(url)
      toast.info('Analyse de l\'URL en cours...')
      
      const { data, error } = await supabase.functions.invoke('import-from-url', {
        body: { url }
      })
      
      if (error) throw error
      toast.success('Import réussi')
    } catch (error) {
      toast.error(error instanceof Error && error.message === 'Invalid URL' 
        ? 'URL invalide' 
        : 'Erreur lors de l\'import')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Import Rapide</h1>
          <p className="text-muted-foreground">
            Importez vos produits en quelques clics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/products/import/manage')}>
            Gérer les imports
          </Button>
          <Button variant="outline" onClick={() => navigate('/import')}>
            Retour au Hub
          </Button>
        </div>
      </div>

      {/* Progression globale */}
      {isImporting && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Import en cours...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{details.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{details.processed}</p>
                <p className="text-sm text-muted-foreground">Traités</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{details.failed}</p>
                <p className="text-sm text-muted-foreground">Échecs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de succès */}
      {status === 'success' && (
        <Card className="border-green-500 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold">Import terminé avec succès !</p>
                <p className="text-sm text-muted-foreground">
                  {details.processed} produits importés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interface d'import */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'file' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Fichier
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>

        {/* Import par fichier */}
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Import par fichier</CardTitle>
              <CardDescription>
                Téléchargez un fichier CSV, Excel ou JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Glissez votre fichier ici'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Formats supportés: CSV, Excel (.xlsx, .xls), JSON (max 20MB)
                  </p>
                </div>
                <Label
                  htmlFor="file-upload"
                  className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
                >
                  Sélectionner un fichier
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isImporting}
                  />
                </Label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-4 bg-accent/50 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isImporting}
                  >
                    Retirer
                  </Button>
                </div>
              )}

              <Button
                onClick={handleFileImport}
                disabled={!selectedFile || isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Lancer l'import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import par URL */}
        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Import par URL</CardTitle>
              <CardDescription>
                Importez des produits depuis une page web ou un flux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">URL de la source</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/products.csv"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isImporting}
                />
                <p className="text-sm text-muted-foreground">
                  L'URL doit pointer vers un fichier CSV, JSON ou une page de produits
                </p>
              </div>

              <Button
                onClick={handleUrlImport}
                disabled={!url || isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Analyser l'URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Aide */}
      <Card>
        <CardHeader>
          <CardTitle>Besoin d'aide ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Format CSV</h4>
              <p className="text-muted-foreground">
                Première ligne = en-têtes de colonnes. Colonnes requises: nom, prix, SKU
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Format Excel</h4>
              <p className="text-muted-foreground">
                Fichiers .xlsx et .xls supportés. Même structure que CSV
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Import URL</h4>
              <p className="text-muted-foreground">
                Détection automatique du format. Analyse intelligente de la page
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
