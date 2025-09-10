import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Save,
  Database,
  Globe,
  FileText,
  Server,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { importAdvancedService } from '@/domains/commerce/services/importAdvancedService'

interface ImportConfiguration {
  id?: string
  user_id?: string
  config_type: 'url' | 'xml' | 'ftp' | 'csv' | 'api'
  config_name: string
  settings: Record<string, any>
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface RealImportConfigurationManagerProps {
  onConfigurationSaved?: (config: ImportConfiguration) => void
}

export const RealImportConfigurationManager = ({ onConfigurationSaved }: RealImportConfigurationManagerProps) => {
  const [configurations, setConfigurations] = useState<ImportConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<ImportConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('url')

  // Default configurations for each type
  const defaultConfigs: Record<string, Partial<ImportConfiguration>> = {
    url: {
      config_type: 'url',
      config_name: 'Import URL Standard',
      settings: {
        auto_optimize: true,
        extract_images: true,
        generate_seo: true,
        market_analysis: false,
        price_optimization: false,
        timeout: 30,
        retry_attempts: 3
      },
      is_active: true
    },
    xml: {
      config_type: 'xml',
      config_name: 'Import XML Standard',
      settings: {
        validate_schema: true,
        auto_detect_fields: true,
        batch_size: 50,
        mapping: {
          'name': 'title',
          'description': 'desc',
          'price': 'price',
          'sku': 'reference'
        }
      },
      is_active: true
    },
    ftp: {
      config_type: 'ftp',
      config_name: 'Import FTP Standard',
      settings: {
        host: '',
        port: 21,
        username: '',
        password: '',
        path: '/products',
        file_pattern: '*.csv',
        schedule: 'daily',
        auto_sync: false,
        backup_enabled: true
      },
      is_active: true
    },
    csv: {
      config_type: 'csv',
      config_name: 'Import CSV Standard',
      settings: {
        delimiter: ',',
        quote_char: '"',
        encoding: 'utf-8',
        has_header: true,
        skip_rows: 0,
        validate_data: true,
        auto_mapping: true
      },
      is_active: true
    },
    api: {
      config_type: 'api',
      config_name: 'Import API Standard',
      settings: {
        endpoint: '',
        method: 'GET',
        headers: {},
        auth_type: 'none',
        rate_limit: 100,
        pagination: 'page',
        data_path: 'data'
      },
      is_active: true
    }
  }

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('import_configurations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setConfigurations(data || [])
      
      if (data && data.length > 0) {
        setActiveConfig(data[0])
      }
    } catch (error: any) {
      console.error('Error loading configurations:', error)
      toast.error('Erreur lors du chargement des configurations')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async (config: ImportConfiguration) => {
    try {
      setIsSaving(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const configData = {
        ...config,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      let result
      if (config.id) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('import_configurations')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('import_configurations')
          .insert([{ ...configData, created_at: new Date().toISOString() }])
          .select()
          .single()

        if (error) throw error
        result = data
      }

      // Update local state
      if (config.id) {
        setConfigurations(prev => 
          prev.map(c => c.id === config.id ? result : c)
        )
      } else {
        setConfigurations(prev => [result, ...prev])
      }

      setActiveConfig(result)
      onConfigurationSaved?.(result)
      
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

      // Test the configuration based on its type
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

        case 'ftp':
          if (!config.settings.host || !config.settings.username) {
            toast.error('Veuillez définir les paramètres FTP')
            return
          }
          await importAdvancedService.importFromFtp({
            ftpUrl: `ftp://${config.settings.host}:${config.settings.port}`,
            username: config.settings.username,
            password: config.settings.password,
            filePath: config.settings.test_file_path || config.settings.path,
            fileType: 'csv',
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

  const createNewConfiguration = (type: string) => {
    const newConfig = {
      ...defaultConfigs[type],
      config_name: `Nouvelle configuration ${type.toUpperCase()}`,
    } as ImportConfiguration
    
    setActiveConfig(newConfig)
    setSelectedType(type)
  }

  const renderConfigurationForm = (config: ImportConfiguration) => {
    const updateSetting = (key: string, value: any) => {
      setActiveConfig(prev => ({
        ...prev!,
        settings: {
          ...prev!.settings,
          [key]: value
        }
      }))
    }

    const updateConfig = (key: keyof ImportConfiguration, value: any) => {
      setActiveConfig(prev => ({
        ...prev!,
        [key]: value
      }))
    }

    switch (config.config_type) {
      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="test_url">URL de test</Label>
              <Input
                id="test_url"
                value={config.settings.test_url || ''}
                onChange={(e) => updateSetting('test_url', e.target.value)}
                placeholder="https://example.com/product/123"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_optimize">Optimisation automatique</Label>
                <Switch
                  id="auto_optimize"
                  checked={config.settings.auto_optimize}
                  onCheckedChange={(checked) => updateSetting('auto_optimize', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="extract_images">Extraire les images</Label>
                <Switch
                  id="extract_images"
                  checked={config.settings.extract_images}
                  onCheckedChange={(checked) => updateSetting('extract_images', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="generate_seo">Générer le SEO</Label>
                <Switch
                  id="generate_seo"
                  checked={config.settings.generate_seo}
                  onCheckedChange={(checked) => updateSetting('generate_seo', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="price_optimization">Optimisation prix</Label>
                <Switch
                  id="price_optimization"
                  checked={config.settings.price_optimization}
                  onCheckedChange={(checked) => updateSetting('price_optimization', checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'xml':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="test_xml_url">URL XML de test</Label>
              <Input
                id="test_xml_url"
                value={config.settings.test_xml_url || ''}
                onChange={(e) => updateSetting('test_xml_url', e.target.value)}
                placeholder="https://example.com/products.xml"
              />
            </div>
            <div>
              <Label htmlFor="batch_size">Taille des lots</Label>
              <Select value={String(config.settings.batch_size)} onValueChange={(value) => updateSetting('batch_size', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 produits</SelectItem>
                  <SelectItem value="25">25 produits</SelectItem>
                  <SelectItem value="50">50 produits</SelectItem>
                  <SelectItem value="100">100 produits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="validate_schema">Valider le schéma</Label>
                <Switch
                  id="validate_schema"
                  checked={config.settings.validate_schema}
                  onCheckedChange={(checked) => updateSetting('validate_schema', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_detect_fields">Détection auto des champs</Label>
                <Switch
                  id="auto_detect_fields"
                  checked={config.settings.auto_detect_fields}
                  onCheckedChange={(checked) => updateSetting('auto_detect_fields', checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'ftp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ftp_host">Serveur FTP</Label>
                <Input
                  id="ftp_host"
                  value={config.settings.host || ''}
                  onChange={(e) => updateSetting('host', e.target.value)}
                  placeholder="ftp.example.com"
                />
              </div>
              <div>
                <Label htmlFor="ftp_port">Port</Label>
                <Input
                  id="ftp_port"
                  type="number"
                  value={config.settings.port || 21}
                  onChange={(e) => updateSetting('port', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ftp_username">Nom d'utilisateur</Label>
                <Input
                  id="ftp_username"
                  value={config.settings.username || ''}
                  onChange={(e) => updateSetting('username', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ftp_password">Mot de passe</Label>
                <Input
                  id="ftp_password"
                  type="password"
                  value={config.settings.password || ''}
                  onChange={(e) => updateSetting('password', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ftp_path">Chemin des fichiers</Label>
              <Input
                id="ftp_path"
                value={config.settings.path || ''}
                onChange={(e) => updateSetting('path', e.target.value)}
                placeholder="/products"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_sync">Synchronisation automatique</Label>
              <Switch
                id="auto_sync"
                checked={config.settings.auto_sync}
                onCheckedChange={(checked) => updateSetting('auto_sync', checked)}
              />
            </div>
          </div>
        )

      default:
        return <p className="text-muted-foreground">Configuration non supportée</p>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurations d'Import</h2>
          <p className="text-muted-foreground">
            Gérez vos configurations d'import pour chaque source
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type d'import" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="ftp">FTP</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => createNewConfiguration(selectedType)}>
            <Settings className="h-4 w-4 mr-2" />
            Nouvelle Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Configurations existantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {configurations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune configuration trouvée
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
                      {config.is_active ? "Actif" : "Inactif"}
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
              {activeConfig ? 'Modifier la configuration' : 'Nouvelle configuration'}
            </CardTitle>
            {activeConfig && (
              <CardDescription>
                Configuration {activeConfig.config_type.toUpperCase()} - {activeConfig.config_name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {activeConfig ? (
              <div className="space-y-6">
                {/* Paramètres généraux */}
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
                </div>

                {/* Paramètres spécifiques */}
                <div>
                  <h4 className="font-semibold mb-3">Paramètres spécifiques</h4>
                  {renderConfigurationForm(activeConfig)}
                </div>

                {/* Actions */}
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
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Test...
                      </>
                    ) : (
                      'Tester'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une configuration ou créez-en une nouvelle</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}