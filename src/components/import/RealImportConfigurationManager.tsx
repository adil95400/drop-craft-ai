import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Save,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { importAdvancedService } from '@/domains/commerce/services/importAdvancedService'

// Simplified version using localStorage for now
interface ImportConfiguration {
  id: string
  config_type: 'url' | 'xml' | 'ftp' | 'csv' | 'api'
  config_name: string
  settings: Record<string, any>
  is_active: boolean
  created_at: string
}

interface RealImportConfigurationManagerProps {
  onConfigurationSaved?: (config: ImportConfiguration) => void
}

export const RealImportConfigurationManager = ({ onConfigurationSaved }: RealImportConfigurationManagerProps) => {
  const [configurations, setConfigurations] = useState<ImportConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<ImportConfiguration | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load configurations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('import_configurations')
    if (saved) {
      try {
        setConfigurations(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load configurations:', error)
      }
    }
  }, [])

  const saveConfiguration = async (config: ImportConfiguration) => {
    try {
      setIsSaving(true)
      
      const configData = {
        ...config,
        id: config.id || crypto.randomUUID(),
        created_at: config.created_at || new Date().toISOString()
      }

      let updatedConfigs
      if (configurations.find(c => c.id === configData.id)) {
        updatedConfigs = configurations.map(c => c.id === configData.id ? configData : c)
      } else {
        updatedConfigs = [configData, ...configurations]
      }

      setConfigurations(updatedConfigs)
      localStorage.setItem('import_configurations', JSON.stringify(updatedConfigs))
      
      setActiveConfig(configData)
      onConfigurationSaved?.(configData)
      
      toast.success('Configuration sauvegardée avec succès !')
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const testConfiguration = async (config: ImportConfiguration) => {
    try {
      setIsTesting(true)

      switch (config.config_type) {
        case 'url':
          if (!config.settings.test_url) {
            toast.error('Veuillez définir une URL de test')
            return
          }
          await importAdvancedService.importFromUrl({
            url: config.settings.test_url,
            config: config.settings
          })
          break

        case 'xml':
          if (!config.settings.test_xml_url) {
            toast.error('Veuillez définir une URL XML de test')
            return
          }
          await importAdvancedService.importFromXml({
            xmlUrl: config.settings.test_xml_url,
            mapping: config.settings.mapping,
            config: config.settings
          })
          break

        default:
          toast.info('Test non disponible pour ce type de configuration')
          return
      }

      toast.success('Test de configuration réussi !')
    } catch (error: any) {
      console.error('Test configuration error:', error)
      toast.error(`Test échoué: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const createNewConfiguration = () => {
    const newConfig: ImportConfiguration = {
      id: crypto.randomUUID(),
      config_type: 'url',
      config_name: 'Nouvelle configuration URL',
      settings: {
        auto_optimize: true,
        extract_images: true,
        generate_seo: true,
        timeout: 30
      },
      is_active: true,
      created_at: new Date().toISOString()
    }
    
    setActiveConfig(newConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurations d'Import</h2>
          <p className="text-muted-foreground">
            Gérez vos configurations d'import réelles avec sauvegarde
          </p>
        </div>
        <Button onClick={createNewConfiguration}>
          <Settings className="h-4 w-4 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Configurations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {configurations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune configuration
              </p>
            ) : (
              configurations.map(config => (
                <div
                  key={config.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeConfig?.id === config.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveConfig(config)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{config.config_name}</p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {config.config_type}
                      </p>
                    </div>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? <CheckCircle className="h-3 w-3" /> : null}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Formulaire de configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration d'Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeConfig ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="config_name">Nom de la configuration</Label>
                    <Input
                      id="config_name"
                      value={activeConfig.config_name}
                      onChange={(e) => setActiveConfig(prev => ({ ...prev!, config_name: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Configuration active</Label>
                    <Switch
                      id="is_active"
                      checked={activeConfig.is_active}
                      onCheckedChange={(checked) => setActiveConfig(prev => ({ ...prev!, is_active: checked }))}
                    />
                  </div>
                  {activeConfig.config_type === 'url' && (
                    <>
                      <div>
                        <Label htmlFor="test_url">URL de test</Label>
                        <Input
                          id="test_url"
                          value={activeConfig.settings.test_url || ''}
                          onChange={(e) => setActiveConfig(prev => ({
                            ...prev!,
                            settings: { ...prev!.settings, test_url: e.target.value }
                          }))}
                          placeholder="https://example.com/product/123"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto_optimize">Optimisation auto</Label>
                          <Switch
                            id="auto_optimize"
                            checked={activeConfig.settings.auto_optimize}
                            onCheckedChange={(checked) => setActiveConfig(prev => ({
                              ...prev!,
                              settings: { ...prev!.settings, auto_optimize: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="extract_images">Extraire images</Label>
                          <Switch
                            id="extract_images"
                            checked={activeConfig.settings.extract_images}
                            onCheckedChange={(checked) => setActiveConfig(prev => ({
                              ...prev!,
                              settings: { ...prev!.settings, extract_images: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => saveConfiguration(activeConfig)}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConfiguration(activeConfig)}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Test...' : 'Tester'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Créez une nouvelle configuration pour commencer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}