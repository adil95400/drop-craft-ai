import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Server, FolderOpen, Check, AlertTriangle, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface FTPConfig {
  host: string
  port: number
  username: string
  password: string
  remotePath: string
  protocol: 'ftp' | 'sftp'
  passive: boolean
}

interface FTPTestResult {
  success: boolean
  filesFound: string[]
  error?: string
}

export function FTPImportWizard() {
  const { toast } = useToast()
  const [step, setStep] = useState<'config' | 'test' | 'import'>('config')
  const [config, setConfig] = useState<FTPConfig>({
    host: '',
    port: 21,
    username: '',
    password: '',
    remotePath: '/',
    protocol: 'ftp',
    passive: true
  })
  const [testResult, setTestResult] = useState<FTPTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<string>('')

  const handleConfigChange = (key: keyof FTPConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          action: 'test',
          config
        }
      })

      if (error) throw error

      setTestResult({
        success: true,
        filesFound: data.files || []
      })

      toast({
        title: "Connexion réussie",
        description: `${data.files?.length || 0} fichiers trouvés`
      })

      setStep('test')
    } catch (error: any) {
      setTestResult({
        success: false,
        filesFound: [],
        error: error.message
      })

      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          action: 'import',
          config: {
            ...config,
            file: selectedFile
          }
        }
      })

      if (error) throw error

      setImportProgress(100)

      toast({
        title: "Import réussi",
        description: `${data.imported || 0} produits importés depuis FTP`
      })

      setTimeout(() => {
        setStep('config')
        setConfig({
          host: '',
          port: 21,
          username: '',
          password: '',
          remotePath: '/',
          protocol: 'ftp',
          passive: true
        })
        setTestResult(null)
        setSelectedFile('')
        setIsImporting(false)
        setImportProgress(0)
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  const renderConfigStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Configuration FTP/SFTP</CardTitle>
        <CardDescription>Configurez la connexion à votre serveur FTP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocole</Label>
            <Select value={config.protocol} onValueChange={(v) => handleConfigChange('protocol', v)}>
              <SelectTrigger id="protocol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ftp">FTP</SelectItem>
                <SelectItem value="sftp">SFTP (Sécurisé)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={config.port}
              onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
              placeholder="21"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="host">Hôte</Label>
          <Input
            id="host"
            value={config.host}
            onChange={(e) => handleConfigChange('host', e.target.value)}
            placeholder="ftp.example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            id="username"
            value={config.username}
            onChange={(e) => handleConfigChange('username', e.target.value)}
            placeholder="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={config.password}
            onChange={(e) => handleConfigChange('password', e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="path">Chemin distant</Label>
          <Input
            id="path"
            value={config.remotePath}
            onChange={(e) => handleConfigChange('remotePath', e.target.value)}
            placeholder="/products"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="passive"
            checked={config.passive}
            onChange={(e) => handleConfigChange('passive', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="passive">Mode passif</Label>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={!config.host || !config.username || isTesting}
          className="w-full"
        >
          {isTesting ? 'Test en cours...' : 'Tester la connexion'}
        </Button>
      </CardContent>
    </Card>
  )

  const renderTestStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Fichiers disponibles</CardTitle>
        <CardDescription>Sélectionnez le fichier à importer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResult?.success ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Connexion établie - {testResult.filesFound.length} fichier(s) trouvé(s)
              </p>
            </div>

            {testResult.filesFound.length > 0 ? (
              <div className="space-y-2">
                <Label>Sélectionner un fichier</Label>
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un fichier" />
                  </SelectTrigger>
                  <SelectContent>
                    {testResult.filesFound.map(file => (
                      <SelectItem key={file} value={file}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {file}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Aucun fichier trouvé dans le répertoire spécifié
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('config')}>
                Retour
              </Button>
              <Button 
                onClick={() => setStep('import')} 
                disabled={!selectedFile}
                className="flex-1"
              >
                Continuer
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-300">
              {testResult?.error || 'Erreur de connexion'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderImportStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Import depuis FTP</CardTitle>
        <CardDescription>Lancez l'importation du fichier sélectionné</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Serveur</span>
            <span className="text-sm font-medium">{config.host}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Protocol</span>
            <Badge>{config.protocol.toUpperCase()}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Fichier</span>
            <span className="text-sm font-medium">{selectedFile}</span>
          </div>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <Progress value={importProgress} />
            <p className="text-sm text-center text-muted-foreground">{importProgress}% importé</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('test')} disabled={isImporting}>
            Retour
          </Button>
          <Button onClick={handleImport} disabled={isImporting} className="flex-1">
            {isImporting ? 'Import en cours...' : 'Lancer l\'import'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test" disabled={!testResult}>Sélection</TabsTrigger>
          <TabsTrigger value="import" disabled={!selectedFile}>Import</TabsTrigger>
        </TabsList>
      </Tabs>

      {step === 'config' && renderConfigStep()}
      {step === 'test' && renderTestStep()}
      {step === 'import' && renderImportStep()}
    </div>
  )
}
