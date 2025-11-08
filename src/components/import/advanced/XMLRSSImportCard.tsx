import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FileCode2, Loader2 } from 'lucide-react'
import { ImportFromXmlOptions } from '@/domains/commerce/services/importAdvancedService'

interface XMLRSSImportCardProps {
  onImport: (options: ImportFromXmlOptions) => void
  isLoading?: boolean
}

export const XMLRSSImportCard = ({ onImport, isLoading }: XMLRSSImportCardProps) => {
  const [xmlUrl, setXmlUrl] = useState('')
  const [config, setConfig] = useState({
    validate_schema: true,
    auto_detect_fields: true,
    batch_size: 50
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!xmlUrl.trim()) return
    
    onImport({ xmlUrl: xmlUrl.trim(), config })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5" />
          Import XML/RSS Feed
        </CardTitle>
        <CardDescription>
          Importez des produits depuis un flux XML ou RSS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="xml-url">URL du flux XML/RSS</Label>
            <Input
              id="xml-url"
              type="url"
              placeholder="https://example.com/feed.xml"
              value={xmlUrl}
              onChange={(e) => setXmlUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Options de parsing</p>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="validate-schema" className="text-sm">
                Valider le schéma XML
              </Label>
              <Switch
                id="validate-schema"
                checked={config.validate_schema}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, validate_schema: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-detect" className="text-sm">
                Détection automatique des champs
              </Label>
              <Switch
                id="auto-detect"
                checked={config.auto_detect_fields}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_detect_fields: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-size" className="text-sm">
                Taille des lots ({config.batch_size} produits)
              </Label>
              <Input
                id="batch-size"
                type="number"
                min="10"
                max="200"
                value={config.batch_size}
                onChange={(e) => setConfig(prev => ({ ...prev, batch_size: parseInt(e.target.value) || 50 }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !xmlUrl.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing en cours...
              </>
            ) : (
              'Démarrer l\'import XML'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
