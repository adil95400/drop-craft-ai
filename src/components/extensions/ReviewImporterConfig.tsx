import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Star, Upload, FileJson, Globe } from 'lucide-react'

export const ReviewImporterConfig: React.FC = () => {
  const [source, setSource] = useState<'csv' | 'json' | 'trustpilot' | 'google' | 'amazon'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      let data = null

      if (source === 'csv' || source === 'json') {
        if (!file) {
          toast({
            title: "Fichier requis",
            description: "Veuillez sélectionner un fichier",
            variant: "destructive"
          })
          return
        }

        const text = await file.text()
        if (source === 'json') {
          data = JSON.parse(text)
        } else {
          // Parse CSV simple
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          data = lines.slice(1).map(line => {
            const values = line.split(',')
            const obj: any = {}
            headers.forEach((header, i) => {
              obj[header] = values[i]?.trim()
            })
            return obj
          })
        }
      }

      const { data: result, error } = await supabase.functions.invoke(
        'extension-review-importer',
        {
          body: {
            source,
            data,
            apiUrl: ['trustpilot', 'google'].includes(source) ? apiUrl : undefined,
            apiKey: ['trustpilot', 'google'].includes(source) ? apiKey : undefined,
          }
        }
      )

      if (error) throw error

      toast({
        title: "Import réussi",
        description: `${result.imported} avis importés avec succès`
      })

      setFile(null)
      setApiUrl('')
      setApiKey('')
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
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">Import Avis Clients</h3>
          <p className="text-sm text-muted-foreground">
            Importez les avis depuis différentes plateformes
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Source d'import</Label>
          <Select value={source} onValueChange={(v: any) => setSource(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Fichier CSV
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Fichier JSON
                </div>
              </SelectItem>
              <SelectItem value="trustpilot">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Trustpilot
                </div>
              </SelectItem>
              <SelectItem value="google">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Google Reviews
                </div>
              </SelectItem>
              <SelectItem value="amazon">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Amazon
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(source === 'csv' || source === 'json' || source === 'amazon') && (
          <div>
            <Label>Fichier</Label>
            <Input
              type="file"
              accept={source === 'csv' ? '.csv' : '.json'}
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        )}

        {(source === 'trustpilot' || source === 'google') && (
          <>
            <div>
              <Label>URL de l'API</Label>
              <Input
                type="url"
                placeholder={
                  source === 'trustpilot'
                    ? 'https://api.trustpilot.com/...'
                    : 'https://maps.googleapis.com/maps/api/place/details/json'
                }
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Clé API</Label>
              <Input
                type="password"
                placeholder="Votre clé API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </>
        )}

        <Button
          onClick={handleImport}
          disabled={
            loading ||
            (!file && ['csv', 'json', 'amazon'].includes(source)) ||
            (['trustpilot', 'google'].includes(source) && (!apiUrl || !apiKey))
          }
          className="w-full"
        >
          {loading ? 'Import en cours...' : 'Importer les avis'}
        </Button>
      </div>
    </Card>
  )
}
