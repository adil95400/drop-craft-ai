import React, { useState } from 'react'
import { Server, Folder, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { productionLogger } from '@/utils/productionLogger'

interface FTPConfig {
  url: string
  username: string
  password: string
  filePath: string
  fileType: 'csv' | 'xml'
  syncInterval: number
  autoSync: boolean
  secure: boolean
}

export const FTPImporter = () => {
  const { toast } = useToast()
  const [config, setConfig] = useState<FTPConfig>({
    url: '',
    username: '',
    password: '',
    filePath: '/products.csv',
    fileType: 'csv',
    syncInterval: 1440, // 24h by default
    autoSync: false,
    secure: true
  })
  const [testing, setTesting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleTestConnection = async () => {
    if (!config.url || !config.username || !config.password) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setTesting(true)

    try {
      // Create or update import connector for testing
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Test the connection via edge function
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          config: {
            url: config.url,
            username: config.username,
            password: config.password,
            filePath: config.filePath,
            fileType: config.fileType,
            secure: config.secure
          },
          testMode: true
        }
      })

      if (error) throw error

      toast({
        title: "Connexion réussie",
        description: "La connexion FTP fonctionne correctement"
      })

    } catch (error) {
      productionLogger.error('FTP connection test failed', error as Error, 'FTPImporter');
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur FTP",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const handleImport = async () => {
    if (!config.url || !config.username || !config.password) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setImporting(true)

    try {
      // Create import connector
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Create import job instead of import_connectors
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          job_type: 'import',
          job_subtype: 'ftp',
          status: 'pending',
          metadata: { source_platform: 'ftp', source_url: config.url }
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Start import via edge function
      const { data, error } = await supabase.functions.invoke('ftp-import', {
        body: {
          jobId: jobData.id,
          config: {
            url: config.url,
            username: config.username,
            password: config.password,
            filePath: config.filePath,
            fileType: config.fileType,
            secure: config.secure
          },
          immediate: true
        }
      })

      if (error) throw error

      toast({
        title: "Import FTP démarré",
        description: `Import depuis ${config.url} en cours...`
      })

    } catch (error) {
      productionLogger.error('FTP import start failed', error as Error, 'FTPImporter');
      toast({
        title: "Erreur d'import",
        description: "Impossible de démarrer l'import FTP",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Import FTP/SFTP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ftp-url">Serveur FTP</Label>
            <Input
              id="ftp-url"
              placeholder="ftp.example.com"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp-path">Chemin du fichier</Label>
            <Input
              id="ftp-path"
              placeholder="/exports/products.csv"
              value={config.filePath}
              onChange={(e) => setConfig(prev => ({ ...prev, filePath: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ftp-username">Nom d'utilisateur</Label>
            <Input
              id="ftp-username"
              type="text"
              value={config.username}
              onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp-password">Mot de passe</Label>
            <Input
              id="ftp-password"
              type="password"
              value={config.password}
              onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type de fichier</Label>
            <Select
              value={config.fileType}
              onValueChange={(value: 'csv' | 'xml') => setConfig(prev => ({ ...prev, fileType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xml">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    XML
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intervalle de sync (minutes)</Label>
            <Input
              type="number"
              min="15"
              value={config.syncInterval}
              onChange={(e) => setConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 1440 }))}
              disabled={!config.autoSync}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="secure-ftp"
              checked={config.secure}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, secure: checked }))}
            />
            <Label htmlFor="secure-ftp">SFTP (sécurisé)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync-ftp"
              checked={config.autoSync}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoSync: checked }))}
            />
            <Label htmlFor="auto-sync-ftp">Sync automatique</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing}
          >
            <Folder className="h-4 w-4 mr-2" />
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? 'Import en cours...' : 'Démarrer l\'import'}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Formats supportés :</p>
              <ul className="space-y-1">
                <li>• CSV avec en-têtes (name, price, description, etc.)</li>
                <li>• XML avec structure produits standards</li>
                <li>• SFTP recommandé pour la sécurité</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}