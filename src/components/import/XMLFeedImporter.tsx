import React, { useState } from 'react'
import { Rss, Globe, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { toast } from "sonner";
import { productionLogger } from "@/utils/productionLogger";

interface XMLFeedConfig {
  url: string
  feedType: 'google_shopping' | 'lengow' | 'custom'
  syncInterval: number
  autoSync: boolean
  mapping: {
    [key: string]: string
  }
}

const feedTypeOptions = [
  { value: 'google_shopping', label: 'Google Shopping' },
  { value: 'lengow', label: 'Lengow' },
  { value: 'custom', label: 'XML personnalisé' }
]

const syncIntervalOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 heure' },
  { value: 240, label: '4 heures' },
  { value: 1440, label: '24 heures' }
]

export const XMLFeedImporter = () => {
  const { toast } = useToast()
  const [config, setConfig] = useState<XMLFeedConfig>({
    url: '',
    feedType: 'google_shopping',
    syncInterval: 60,
    autoSync: false,
    mapping: {}
  })
  const [testing, setTesting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleTestFeed = async () => {
    if (!config.url) {
      toast({
        title: "URL requise",
        description: "Veuillez saisir l'URL du flux XML",
        variant: "destructive"
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: {
          url: config.url,
          type: 'xml',
          feedType: config.feedType,
          testMode: true
        }
      })

      if (error) throw error

      setTestResult(data)
      toast({
        title: "Test réussi",
        description: `${data.totalFound} produits trouvés dans le flux`
      })

    } catch (error) {
      productionLogger.error('Error testing XML feed', error as Error)
      toast({
        title: "Erreur de test",
        description: "Impossible de lire le flux XML",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const handleImport = async () => {
    if (!config.url) {
      toast({
        title: "URL requise",
        description: "Veuillez saisir l'URL du flux XML",
        variant: "destructive"
      })
      return
    }

    setImporting(true)

    try {
      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: {
          url: config.url,
          type: 'xml',
          feedType: config.feedType,
          syncInterval: config.autoSync ? config.syncInterval : 0,
          mapping: config.mapping
        }
      })

      if (error) throw error

      toast({
        title: "Import démarré",
        description: `Import de ${data.totalFound} produits en cours...`
      })

      // Create import job if auto-sync is enabled
      if (config.autoSync) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('jobs').insert({
            user_id: user.id,
            job_type: 'import',
            job_subtype: 'xml_feed',
            status: 'pending',
            metadata: { source_platform: config.feedType, source_url: config.url }
          })
        }
      }

    } catch (error) {
      productionLogger.error('Error importing XML feed', error as Error)
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le flux XML",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  const getFieldMappingForType = (feedType: string) => {
    switch (feedType) {
      case 'google_shopping':
        return {
          'g:id': 'external_id',
          'g:title': 'name',
          'g:description': 'description',
          'g:price': 'price',
          'g:brand': 'brand',
          'g:product_type': 'category',
          'g:image_link': 'image_url',
          'g:availability': 'availability_status'
        }
      case 'lengow':
        return {
          'product_id': 'external_id',
          'product_name': 'name',
          'product_description': 'description',
          'product_price': 'price',
          'product_brand': 'brand',
          'product_category': 'category',
          'product_image': 'image_url'
        }
      default:
        return {}
    }
  }

  React.useEffect(() => {
    const mapping = getFieldMappingForType(config.feedType)
    setConfig(prev => ({ ...prev, mapping }))
  }, [config.feedType])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Import de flux XML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feed-url">URL du flux XML</Label>
            <Input
              id="feed-url"
              type="url"
              placeholder="https://example.com/products.xml"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de flux</Label>
            <Select
              value={config.feedType}
              onValueChange={(value: any) => setConfig(prev => ({ ...prev, feedType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync"
              checked={config.autoSync}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoSync: checked }))}
            />
            <Label htmlFor="auto-sync">Synchronisation automatique</Label>
          </div>

          {config.autoSync && (
            <div className="space-y-2">
              <Label>Intervalle de synchronisation</Label>
              <Select
                value={config.syncInterval.toString()}
                onValueChange={(value) => setConfig(prev => ({ ...prev, syncInterval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {syncIntervalOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestFeed}
              disabled={testing || !config.url}
            >
              <Globe className="h-4 w-4 mr-2" />
              {testing ? 'Test en cours...' : 'Tester le flux'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !config.url}
            >
              {importing ? 'Import en cours...' : 'Démarrer l\'import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Résultat du test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Produits trouvés :</strong> {testResult.totalFound}</p>
              <p><strong>Type de flux :</strong> {config.feedType}</p>
              
              {testResult.products && testResult.products.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Aperçu des produits :</p>
                  <div className="space-y-2">
                    {testResult.products.slice(0, 3).map((product: any, index: number) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <p><strong>Nom :</strong> {product.name}</p>
                        <p><strong>Prix :</strong> {product.price} {product.currency}</p>
                        <p><strong>Catégorie :</strong> {product.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}