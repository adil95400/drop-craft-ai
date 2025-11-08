import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Globe, Loader2 } from 'lucide-react'
import { ImportFromUrlOptions } from '@/domains/commerce/services/importAdvancedService'

interface URLImportCardProps {
  onImport: (options: ImportFromUrlOptions) => void
  isLoading?: boolean
}

export const URLImportCard = ({ onImport, isLoading }: URLImportCardProps) => {
  const [url, setUrl] = useState('')
  const [config, setConfig] = useState({
    auto_optimize: true,
    extract_images: true,
    generate_seo: true,
    market_analysis: false,
    price_optimization: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    onImport({ url: url.trim(), config })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Import depuis URL
        </CardTitle>
        <CardDescription>
          Importez des produits depuis n'importe quelle URL de site e-commerce
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL du produit ou de la page</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/product/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Options d'import</p>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-optimize" className="text-sm">
                Optimisation automatique
              </Label>
              <Switch
                id="auto-optimize"
                checked={config.auto_optimize}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_optimize: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="extract-images" className="text-sm">
                Extraire les images
              </Label>
              <Switch
                id="extract-images"
                checked={config.extract_images}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, extract_images: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="generate-seo" className="text-sm">
                Générer le SEO
              </Label>
              <Switch
                id="generate-seo"
                checked={config.generate_seo}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, generate_seo: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="market-analysis" className="text-sm">
                Analyse de marché
              </Label>
              <Switch
                id="market-analysis"
                checked={config.market_analysis}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, market_analysis: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="price-opt" className="text-sm">
                Optimisation des prix
              </Label>
              <Switch
                id="price-opt"
                checked={config.price_optimization}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, price_optimization: checked }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              'Démarrer l\'import'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
