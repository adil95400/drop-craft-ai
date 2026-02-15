import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Upload, 
  Globe, 
  Zap, 
  Bot, 
  Database, 
  Smartphone, 
  ShoppingCart,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface ImportMethodModalProps {
  method: {
    id: string
    title: string
    description: string
    icon: React.ElementType
    features: string[]
  } | null
  isOpen: boolean
  onClose: () => void
  onImportStart: (jobId: string) => void
}

export function ImportMethodModal({ method, isOpen, onClose, onImportStart }: ImportMethodModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [importConfig, setImportConfig] = useState<{
    sourceName: string
    sourceUrl: string
    configuration: Record<string, any>
  }>({
    sourceName: '',
    sourceUrl: '',
    configuration: {}
  })
  const { toast } = useToast()
  const { user } = useAuth()

  if (!method) return null

  const handleStartImport = async () => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour démarrer un import.",
        variant: "destructive"
      })
      return
    }

    if (!importConfig.sourceName) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez renseigner au moins le nom de la source.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Map method.id to valid source_type
      const sourceTypeMap: Record<string, string> = {
        'api-connector': 'api',
        'bulk-csv': 'csv',
        'one-click': 'shopify',
        'chrome-extension': 'shopify',
        'ai-scraper': 'shopify',
        'marketplace-feeds': 'shopify'
      }
      
      const { data, error } = await (supabase as any)
        .from('import_jobs')
        .insert({
          user_id: user.id,
          job_type: 'single',
          supplier_id: sourceTypeMap[method.id] || 'csv',
          import_settings: { 
            sourceName: importConfig.sourceName, 
            sourceUrl: importConfig.sourceUrl,
            ...importConfig.configuration 
          },
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating import job:', error)
        toast({
          title: "Erreur lors de la création",
          description: "Impossible de créer le job d'import. Veuillez réessayer.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Import démarré",
        description: `L'import depuis ${importConfig.sourceName} a été créé avec succès.`,
      })

      onImportStart(data.id)
      onClose()
      
      // Reset form
      setImportConfig({
        sourceName: '',
        sourceUrl: '',
        configuration: {}
      })

    } catch (error) {
      console.error('Import creation error:', error)
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMethodSpecificFields = () => {
    switch (method.id) {
      case 'one-click':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="marketplace">Marketplace</Label>
              <Select onValueChange={(value) => setImportConfig(prev => ({ ...prev, sourceName: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une marketplace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="ebay">eBay</SelectItem>
                  <SelectItem value="aliexpress">AliExpress</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="store-url">URL du magasin</Label>
              <Input
                id="store-url"
                placeholder="https://monmagasin.com"
                value={importConfig.sourceUrl}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'chrome-extension':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4" />
                Extension Chrome requise
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Installez notre extension Chrome pour importer directement depuis n'importe quel site.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Installer l'extension
              </Button>
            </div>
            <div>
              <Label htmlFor="target-url">URL de la page à importer</Label>
              <Input
                id="target-url"
                placeholder="https://exemple.com/products"
                value={importConfig.sourceUrl}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'ai-scraper':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="website-name">Nom du site web</Label>
              <Input
                id="website-name"
                placeholder="Nom du site à analyser"
                value={importConfig.sourceName}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="target-url">URL à analyser</Label>
              <Input
                id="target-url"
                placeholder="https://exemple.com/products"
                value={importConfig.sourceUrl}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ai-instructions">Instructions pour l'IA (optionnel)</Label>
              <Textarea
                id="ai-instructions"
                placeholder="Décrivez ce que vous voulez extraire..."
                className="min-h-[80px]"
                onChange={(e) => setImportConfig(prev => ({ 
                  ...prev, 
                  configuration: { ...prev.configuration, instructions: e.target.value }
                }))}
              />
            </div>
          </div>
        )

      case 'bulk-csv':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-name">Nom du fichier</Label>
              <Input
                id="file-name"
                placeholder="products.csv"
                value={importConfig.sourceName}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceName: e.target.value }))}
              />
            </div>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez votre fichier CSV/Excel ici ou cliquez pour sélectionner
              </p>
              <Button variant="outline" size="sm">
                Choisir un fichier
              </Button>
            </div>
          </div>
        )

      case 'api-connector':
        const authType = importConfig.configuration.authType
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-name">Nom de l'API</Label>
              <Input
                id="api-name"
                placeholder="Mon API Fournisseur"
                value={importConfig.sourceName}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="api-endpoint">Endpoint API</Label>
              <Input
                id="api-endpoint"
                placeholder="https://api.fournisseur.com/products"
                value={importConfig.sourceUrl}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="auth-type">Type d'authentification</Label>
              <Select onValueChange={(value) => setImportConfig(prev => ({ 
                ...prev, 
                configuration: { ...prev.configuration, authType: value }
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type d'auth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">Clé API</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="oauth">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional auth fields */}
            {authType === 'api_key' && (
              <>
                <div>
                  <Label htmlFor="api-key-header">Nom du header (optionnel)</Label>
                  <Input
                    id="api-key-header"
                    placeholder="X-API-Key"
                    value={importConfig.configuration.apiKeyHeader || ''}
                    onChange={(e) => setImportConfig(prev => ({ 
                      ...prev, 
                      configuration: { ...prev.configuration, apiKeyHeader: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="api-key-value">Clé API *</Label>
                  <Input
                    id="api-key-value"
                    type="password"
                    placeholder="Votre clé API"
                    value={importConfig.configuration.apiKeyValue || ''}
                    onChange={(e) => setImportConfig(prev => ({ 
                      ...prev, 
                      configuration: { ...prev.configuration, apiKeyValue: e.target.value }
                    }))}
                  />
                </div>
              </>
            )}

            {authType === 'bearer' && (
              <div>
                <Label htmlFor="bearer-token">Bearer Token *</Label>
                <Input
                  id="bearer-token"
                  type="password"
                  placeholder="Votre token"
                  value={importConfig.configuration.bearerToken || ''}
                  onChange={(e) => setImportConfig(prev => ({ 
                    ...prev, 
                    configuration: { ...prev.configuration, bearerToken: e.target.value }
                  }))}
                />
              </div>
            )}

            {authType === 'basic' && (
              <>
                <div>
                  <Label htmlFor="basic-username">Nom d'utilisateur *</Label>
                  <Input
                    id="basic-username"
                    placeholder="username"
                    value={importConfig.configuration.basicUsername || ''}
                    onChange={(e) => setImportConfig(prev => ({ 
                      ...prev, 
                      configuration: { ...prev.configuration, basicUsername: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="basic-password">Mot de passe *</Label>
                  <Input
                    id="basic-password"
                    type="password"
                    placeholder="password"
                    value={importConfig.configuration.basicPassword || ''}
                    onChange={(e) => setImportConfig(prev => ({ 
                      ...prev, 
                      configuration: { ...prev.configuration, basicPassword: e.target.value }
                    }))}
                  />
                </div>
              </>
            )}

            {authType === 'oauth' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  OAuth 2.0 nécessite une configuration avancée. Contactez le support pour l'activer.
                </p>
              </div>
            )}
          </div>
        )

      case 'marketplace-feeds':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="feed-name">Nom du flux</Label>
              <Input
                id="feed-name"
                placeholder="Flux produits fournisseur"
                value={importConfig.sourceName}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="feed-url">URL du flux XML/JSON</Label>
              <Input
                id="feed-url"
                placeholder="https://fournisseur.com/feed.xml"
                value={importConfig.sourceUrl}
                onChange={(e) => setImportConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
              <Select onValueChange={(value) => setImportConfig(prev => ({ 
                ...prev, 
                configuration: { ...prev.configuration, syncFrequency: value }
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="manual">Manuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <Label htmlFor="source-name">Nom de la source</Label>
            <Input
              id="source-name"
              placeholder="Nom de votre source"
              value={importConfig.sourceName}
              onChange={(e) => setImportConfig(prev => ({ ...prev, sourceName: e.target.value }))}
            />
          </div>
        )
    }
  }

  const IconComponent = method.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <span>{method.title}</span>
          </DialogTitle>
          <DialogDescription>
            {method.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fonctionnalités incluses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {method.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {getMethodSpecificFields()}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleStartImport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Démarrer l\'import'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}