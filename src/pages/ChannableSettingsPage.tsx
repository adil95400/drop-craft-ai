/**
 * Page Paramètres avec design Channable
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminRole } from '@/hooks/useAdminRole'
import { useSettingsActions } from '@/hooks/useSettingsActions'
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableCard
} from '@/components/channable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Mail,
  Smartphone,
  Lock,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  Palette,
  User,
  Database,
  Key
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Helmet } from 'react-helmet-async'

const settingsCategories = [
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Confidentialité', icon: Eye },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'account', label: 'Compte', icon: User },
]

export default function ChannableSettingsPage() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminRole()
  const { theme, setTheme } = useTheme()
  const { saveSettings, changePassword, exportData, deleteAccount, loading } = useSettingsActions()
  const [activeCategory, setActiveCategory] = useState('appearance')
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
    analyticsEnabled: true
  })

  const [language, setLanguage] = useState('fr')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (hasChanges) {
      const timeoutId = setTimeout(() => {
        saveSettings({ notifications, privacy, language })
        setHasChanges(false)
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [notifications, privacy, language, hasChanges, saveSettings])

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    setHasChanges(true)
  }

  const handleDeleteAccount = async () => {
    const success = await deleteAccount()
    if (success) signOut()
  }

  if (!user) return null

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description, 
    children 
  }: { 
    icon: any, 
    label: string, 
    description: string, 
    children: React.ReactNode 
  }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-4 border-b border-border/50 last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <Label className="font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )

  return (
    <>
      <Helmet>
        <title>Paramètres - ShopOpti</title>
        <meta name="description" content="Configurez vos préférences et paramètres de compte" />
      </Helmet>

      <ChannablePageLayout>
        <ChannableHeroSection
          title="Paramètres"
          subtitle="Configurez vos préférences et personnalisez votre expérience"
          icon={Settings}
        />

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Categories */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Catégories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Apparence */}
            {activeCategory === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Palette className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Apparence</CardTitle>
                        <CardDescription>Personnalisez l'interface</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow icon={Moon} label="Thème" description="Choisissez votre thème préféré">
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Clair</SelectItem>
                          <SelectItem value="dark">Sombre</SelectItem>
                          <SelectItem value="system">Système</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow icon={Globe} label="Langue" description="Langue de l'interface">
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Notifications */}
            {activeCategory === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5">
                        <Bell className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Gérez vos alertes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow icon={Mail} label="E-mail" description="Notifications par e-mail">
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      />
                    </SettingRow>

                    <SettingRow icon={Smartphone} label="Push" description="Notifications navigateur">
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      />
                    </SettingRow>

                    <SettingRow icon={Mail} label="Marketing" description="Actualités produit">
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                      />
                    </SettingRow>

                    <SettingRow icon={Shield} label="Sécurité" description="Alertes de sécurité">
                      <Switch checked={notifications.security} disabled />
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Privacy */}
            {activeCategory === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
                        <Eye className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>Confidentialité</CardTitle>
                        <CardDescription>Contrôlez vos données</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow icon={User} label="Profil public" description="Visible aux autres utilisateurs">
                      <Switch
                        checked={privacy.profileVisible}
                        onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                      />
                    </SettingRow>

                    <SettingRow icon={Eye} label="Activité visible" description="Partager avec l'équipe">
                      <Switch
                        checked={privacy.activityVisible}
                        onCheckedChange={(checked) => handlePrivacyChange('activityVisible', checked)}
                      />
                    </SettingRow>

                    <SettingRow icon={Database} label="Analytics" description="Données anonymisées">
                      <Switch
                        checked={privacy.analyticsEnabled}
                        onCheckedChange={(checked) => handlePrivacyChange('analyticsEnabled', checked)}
                      />
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security */}
            {activeCategory === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle>Sécurité</CardTitle>
                        <CardDescription>Protégez votre compte</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow icon={Lock} label="Mot de passe" description="Dernière modification : Il y a 30 jours">
                      <Button variant="outline" size="sm" onClick={changePassword} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Modifier
                      </Button>
                    </SettingRow>

                    <SettingRow icon={Key} label="2FA" description="Authentification à deux facteurs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Recommandé</Badge>
                        <Button variant="outline" size="sm" disabled>
                          Bientôt
                        </Button>
                      </div>
                    </SettingRow>

                    <SettingRow icon={Smartphone} label="Sessions" description="Appareils connectés">
                      <Button variant="outline" size="sm" disabled>
                        Bientôt
                      </Button>
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Account */}
            {activeCategory === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Actions de compte</CardTitle>
                        <CardDescription>Gérez vos données</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow icon={Download} label="Exporter mes données" description="Téléchargez une archive">
                      <Button variant="outline" size="sm" onClick={exportData} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Exporter
                      </Button>
                    </SettingRow>
                  </CardContent>
                </Card>

                <Card className="border-red-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-red-500/10">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
                        <CardDescription>Actions irréversibles</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        La suppression de votre compte est définitive et irréversible.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </ChannablePageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le compte"
        description="Cette action est irréversible. Toutes vos données seront définitivement supprimées."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        onConfirm={handleDeleteAccount}
        variant="destructive"
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </>
  )
}
