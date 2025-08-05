import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, Link, Image, Globe, FileText, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ImportInterfaceProps {
  selectedMethod: string
  isImporting: boolean
  importProgress: number
  onImport: (data: any) => void
}

export const ImportInterface = ({ selectedMethod, isImporting, importProgress, onImport }: ImportInterfaceProps) => {
  const [url, setUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
    }
  }

  const handleImport = () => {
    if (selectedMethod === "url" && url) {
      onImport({ type: "url", data: url })
    } else if (selectedMethod === "csv" && selectedFile) {
      onImport({ type: "csv", data: selectedFile })
    } else if (selectedMethod === "image" && imageFile) {
      onImport({ type: "image", data: imageFile })
    }
  }

  if (isImporting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary animate-pulse" />
            Import en cours...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={importProgress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {importProgress < 30 && "Analyse des données..."}
              {importProgress >= 30 && importProgress < 60 && "Traitement IA..."}
              {importProgress >= 60 && importProgress < 90 && "Validation et nettoyage..."}
              {importProgress >= 90 && "Finalisation..."}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderInterface = () => {
    switch (selectedMethod) {
      case "url":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Import via URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-url">URL du produit</Label>
                <Input
                  id="product-url"
                  placeholder="https://example.com/product-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: Amazon, AliExpress, Shopify, WooCommerce, et plus
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Extraction IA</Badge>
                <Badge variant="outline">Images HD</Badge>
                <Badge variant="outline">SEO Auto</Badge>
              </div>
              <Button onClick={handleImport} disabled={!url} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Extraire les données
              </Button>
            </CardContent>
          </Card>
        )

      case "csv":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import CSV/Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Fichier CSV/Excel</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {selectedFile.name} sélectionné
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Mapping Auto</Badge>
                <Badge variant="outline">Validation IA</Badge>
                <Badge variant="outline">Doublons Détectés</Badge>
              </div>
              <Button onClick={handleImport} disabled={!selectedFile} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Analyser et importer
              </Button>
            </CardContent>
          </Card>
        )

      case "image":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Import via Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image-file">Image du produit</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {imageFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {imageFile.name} sélectionné
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Reverse Search</Badge>
                <Badge variant="outline">OCR Text</Badge>
                <Badge variant="outline">Prix Détecté</Badge>
              </div>
              <Button onClick={handleImport} disabled={!imageFile} className="w-full">
                <Image className="w-4 h-4 mr-2" />
                Analyser l'image
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                Sélectionnez une méthode d'import ci-dessus
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return renderInterface()
}