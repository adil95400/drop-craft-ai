import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Chrome,
  Download,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Package,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ExtensionSyncLog {
  id: string
  source: string
  extension_version?: string
  products_count: number
  success_count: number
  error_count: number
  errors?: string[]
  metadata?: any
  created_at: string
}

export const BrowserExtensionImportInterface = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [syncLogs, setSyncLogs] = useState<ExtensionSyncLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [autoSync, setAutoSync] = useState(false)

  const extensionId = 'drop-craft-ai-extension' // Chrome extension ID would go here
  const supportedSites = [
    'aliexpress.com',
    'amazon.com',
    'amazon.fr',
    'ebay.com',
    'shopify.com',
    'etsy.com',
    'alibaba.com'
  ]

  useEffect(() => {
    checkExtensionStatus()
    loadSyncLogs()
  }, [])

  const checkExtensionStatus = () => {
    // Check if extension is installed and active
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        (window as any).chrome.runtime.sendMessage(extensionId, { action: 'ping' }, (response: any) => {
          setIsConnected(!!response)
        })
      } catch (error) {
        setIsConnected(false)
      }
    } else {
      setIsConnected(false)
    }
    setIsLoading(false)
  }

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('extension_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSyncLogs(data || [])
    } catch (error) {
      console.error('Error loading sync logs:', error)
    }
  }

  const refreshLogs = async () => {
    setIsRefreshing(true)
    await loadSyncLogs()
    setIsRefreshing(false)
    toast.success('Historique mis à jour')
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extension-download');
      
      if (error) throw error;
      
      // Create download link
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dropcraft-extension.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Extension téléchargée ! Consultez le guide d'installation pour l'activer.");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Impossible de télécharger l'extension.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadExtension = handleDownload;

  const installInstructions = () => {
    toast.info('Instructions d\'installation envoyées par email')
  }

  const testConnection = async () => {
    if (!isConnected) {
      toast.error('Extension non connectée')
      return
    }

    try {
      (window as any).chrome.runtime.sendMessage(extensionId, { 
        action: 'test',
        userId: (await supabase.auth.getUser()).data.user?.id
      }, (response: any) => {
        if (response?.success) {
          toast.success('Test de connexion réussi !')
        } else {
          toast.error('Échec du test de connexion')
        }
      })
    } catch (error) {
      toast.error('Erreur lors du test')
    }
  }

  const getSourceIcon = (source: string) => {
    if (source.includes('aliexpress')) return '🛒'
    if (source.includes('amazon')) return '📦'
    if (source.includes('ebay')) return '🏷️'
    if (source.includes('shopify')) return '🏪'
    if (source.includes('etsy')) return '🎨'
    return '🌐'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header avec statut */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-2xl text-white">
        <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Chrome className="h-6 w-6" />
                Extension Navigateur
              </h2>
              <p className="opacity-90">
                Importez des produits en un clic depuis n'importe quel site e-commerce
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connectée
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Déconnectée
                  </>
                )}
              </Badge>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="data-[state=checked]:bg-white/30"
              />
              <span className="text-sm opacity-80">Auto-sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation et configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation Extension
            </CardTitle>
            <CardDescription>
              Installez l'extension pour commencer à importer des produits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Extension non installée</h4>
                      <p className="text-sm text-yellow-700">
                        Téléchargez et installez l'extension pour commencer
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={downloadExtension}
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    {isDownloading ? "Téléchargement..." : "Télécharger pour Chrome"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/extension-download', '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Guide complet
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={installInstructions}
                  className="w-full text-sm"
                >
                  📧 Recevoir les instructions par email
                </Button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">Extension connectée</h4>
                      <p className="text-sm text-green-700">
                        Votre extension est installée et fonctionnelle
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testConnection} variant="outline" className="flex-1">
                    <Activity className="h-4 w-4 mr-2" />
                    Tester la connexion
                  </Button>
                  <Button onClick={checkExtensionStatus} variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Sites supportés */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Sites supportés :</h4>
              <div className="flex flex-wrap gap-1">
                {supportedSites.map(site => (
                  <Badge key={site} variant="outline" className="text-xs">
                    {site}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques et historique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Historique des Imports
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshLogs}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
            <CardDescription>
              Dernières synchronisations depuis l'extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Aucun import encore effectué</p>
                <p className="text-sm">
                  Les imports depuis l'extension apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {syncLogs.map(log => {
                  const successRate = log.products_count > 0 
                    ? Math.round((log.success_count / log.products_count) * 100) 
                    : 0

                  return (
                    <div key={log.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSourceIcon(log.source)}</span>
                          <div>
                            <p className="font-medium text-sm">{log.source}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={successRate === 100 ? "default" : successRate > 50 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {successRate}% réussi
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Produits traités</span>
                          <span className="font-medium">{log.products_count}</span>
                        </div>
                        <Progress value={successRate} className="h-1" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>✅ {log.success_count} réussis</span>
                          {log.error_count > 0 && (
                            <span>❌ {log.error_count} erreurs</span>
                          )}
                        </div>

                        {log.errors && log.errors.length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-red-600">
                              Voir les erreurs ({log.errors.length})
                            </summary>
                            <div className="mt-1 space-y-1">
                              {log.errors.slice(0, 3).map((error, index) => (
                                <p key={index} className="text-red-600 bg-red-50 p-1 rounded">
                                  {error}
                                </p>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Comment utiliser l'extension
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Naviguez sur un site</h4>
              <p className="text-sm text-muted-foreground">
                Allez sur AliExpress, Amazon ou tout autre site e-commerce supporté
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Cliquez sur "Importer"</h4>
              <p className="text-sm text-muted-foreground">
                Un bouton d'import apparaît automatiquement sur les pages produits
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Produit importé</h4>
              <p className="text-sm text-muted-foreground">
                Le produit est automatiquement ajouté à votre catalogue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}