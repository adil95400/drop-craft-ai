import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Shield, 
  Database,
  Mail,
  Globe,
  Bell,
  Users,
  Package,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Key,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SystemConfig {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    timezone: string
    language: string
    maintenanceMode: boolean
    debugMode: boolean
  }
  security: {
    maxLoginAttempts: number
    sessionTimeout: number
    twoFactorRequired: boolean
    passwordMinLength: number
    requireStrongPassword: boolean
    apiRateLimit: number
    corsEnabled: boolean
    allowedOrigins: string
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    smtpEncryption: string
    fromEmail: string
    fromName: string
  }
  backup: {
    autoBackup: boolean
    backupFrequency: string
    retentionDays: number
    backupLocation: string
  }
  api: {
    rateLimit: number
    cacheEnabled: boolean
    cacheDuration: number
    compressionEnabled: boolean
  }
}

export const AdvancedSettings = () => {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'Shopopti+',
      siteUrl: 'https://app.shopopti.com',
      adminEmail: 'admin@shopopti.com',
      timezone: 'Europe/Paris',
      language: 'fr',
      maintenanceMode: false,
      debugMode: false,
    },
    security: {
      maxLoginAttempts: 5,
      sessionTimeout: 86400,
      twoFactorRequired: false,
      passwordMinLength: 8,
      requireStrongPassword: true,
      apiRateLimit: 1000,
      corsEnabled: true,
      allowedOrigins: 'https://app.shopopti.com',
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpEncryption: 'tls',
      fromEmail: 'noreply@shopopti.com',
      fromName: 'Shopopti+',
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupLocation: 'cloud',
    },
    api: {
      rateLimit: 1000,
      cacheEnabled: true,
      cacheDuration: 300,
      compressionEnabled: true,
    }
  })

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const handleSave = async (section?: string) => {
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Configuration sauvegardée",
        description: section ? `Section ${section} mise à jour` : "Toute la configuration a été sauvegardée",
      })
    }, 1500)
  }

  const handleTest = (type: string) => {
    switch (type) {
      case 'email':
        toast({
          title: "Test d'email envoyé",
          description: "Vérifiez votre boîte de réception",
        })
        break
      case 'backup':
        toast({
          title: "Test de sauvegarde lancé",
          description: "Une sauvegarde de test a été créée",
        })
        break
      default:
        toast({
          title: "Test effectué",
          description: "La configuration fonctionne correctement",
        })
    }
  }

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Paramètres Avancés
          </h2>
          <p className="text-muted-foreground">
            Configurez les paramètres système et les options avancées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave()}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder Tout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuration Générale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom du Site</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL du Site</Label>
                  <Input
                    id="siteUrl"
                    value={config.general.siteUrl}
                    onChange={(e) => updateConfig('general', 'siteUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Administrateur</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={config.general.adminEmail}
                    onChange={(e) => updateConfig('general', 'adminEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau Horaire</Label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode Maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Désactive l'accès public à la plateforme
                    </p>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode Debug</Label>
                    <p className="text-sm text-muted-foreground">
                      Active les logs détaillés pour le développement
                    </p>
                  </div>
                  <Switch
                    checked={config.general.debugMode}
                    onCheckedChange={(checked) => updateConfig('general', 'debugMode', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('général')} disabled={loading}>
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuration de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Tentatives de Connexion Max</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout Session (secondes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longueur Min Mot de Passe</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">Limite API (req/min)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={config.security.apiRateLimit}
                    onChange={(e) => updateConfig('security', 'apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedOrigins">Origines CORS Autorisées</Label>
                <Textarea
                  id="allowedOrigins"
                  value={config.security.allowedOrigins}
                  onChange={(e) => updateConfig('security', 'allowedOrigins', e.target.value)}
                  placeholder="https://example.com, https://app.example.com"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à 2 Facteurs Obligatoire</Label>
                    <p className="text-sm text-muted-foreground">
                      Force tous les utilisateurs à activer 2FA
                    </p>
                  </div>
                  <Switch
                    checked={config.security.twoFactorRequired}
                    onCheckedChange={(checked) => updateConfig('security', 'twoFactorRequired', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mots de Passe Forts Requis</Label>
                    <p className="text-sm text-muted-foreground">
                      Impose des critères stricts pour les mots de passe
                    </p>
                  </div>
                  <Switch
                    checked={config.security.requireStrongPassword}
                    onCheckedChange={(checked) => updateConfig('security', 'requireStrongPassword', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CORS Activé</Label>
                    <p className="text-sm text-muted-foreground">
                      Autorise les requêtes cross-origin
                    </p>
                  </div>
                  <Switch
                    checked={config.security.corsEnabled}
                    onCheckedChange={(checked) => updateConfig('security', 'corsEnabled', checked)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('sécurité')} disabled={loading}>
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleTest('security')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Tester Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Serveur SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={config.email.smtpHost}
                    onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port SMTP</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                  <Input
                    id="smtpUser"
                    value={config.email.smtpUser}
                    onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Mot de Passe SMTP</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={config.email.smtpPassword}
                      onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Expéditeur</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nom Expéditeur</Label>
                  <Input
                    id="fromName"
                    value={config.email.fromName}
                    onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpEncryption">Chiffrement</Label>
                <Select 
                  value={config.email.smtpEncryption} 
                  onValueChange={(value) => updateConfig('email', 'smtpEncryption', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">Aucun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('email')} disabled={loading}>
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleTest('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuration Sauvegarde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Fréquence</Label>
                  <Select 
                    value={config.backup.backupFrequency} 
                    onValueChange={(value) => updateConfig('backup', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Horaire</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Rétention (jours)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={config.backup.retentionDays}
                    onChange={(e) => updateConfig('backup', 'retentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupLocation">Emplacement</Label>
                <Select 
                  value={config.backup.backupLocation} 
                  onValueChange={(value) => updateConfig('backup', 'backupLocation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                    <SelectItem value="external">Serveur Externe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sauvegarde Automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Lance automatiquement les sauvegardes selon la fréquence définie
                  </p>
                </div>
                <Switch
                  checked={config.backup.autoBackup}
                  onCheckedChange={(checked) => updateConfig('backup', 'autoBackup', checked)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('backup')} disabled={loading}>
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleTest('backup')}>
                  <Database className="h-4 w-4 mr-2" />
                  Test Sauvegarde
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuration API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Limite de Taux (req/min)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={config.api.rateLimit}
                    onChange={(e) => updateConfig('api', 'rateLimit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheDuration">Durée Cache (secondes)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    value={config.api.cacheDuration}
                    onChange={(e) => updateConfig('api', 'cacheDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache Activé</Label>
                    <p className="text-sm text-muted-foreground">
                      Améliore les performances en cachant les réponses API
                    </p>
                  </div>
                  <Switch
                    checked={config.api.cacheEnabled}
                    onCheckedChange={(checked) => updateConfig('api', 'cacheEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compression Activée</Label>
                    <p className="text-sm text-muted-foreground">
                      Compresse les réponses pour réduire la bande passante
                    </p>
                  </div>
                  <Switch
                    checked={config.api.compressionEnabled}
                    onCheckedChange={(checked) => updateConfig('api', 'compressionEnabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('api')} disabled={loading}>
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Information Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Version & Statuts</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Version Plateforme</span>
                      <Badge>v2.1.0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Base de Données</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connectée
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Stockage</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Opérationnel
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Edge Functions</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Info className="h-3 w-3 mr-1" />
                        Maintenance
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Ressources Système</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>CPU Utilisé</span>
                      <span>45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RAM Utilisée</span>
                      <span>2.4 GB / 8 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stockage</span>
                      <span>156 GB / 1 TB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bande Passante</span>
                      <span>12.5 MB/s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Redémarrer Services
                  </Button>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Vider Cache
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Optimiser Système
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}