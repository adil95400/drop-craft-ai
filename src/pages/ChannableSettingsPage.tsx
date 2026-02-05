/**
 * Page Paramètres avec design Channable - Fully i18n translated
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminRole } from '@/hooks/useAdminRole'
import { useSettingsActions } from '@/hooks/useSettingsActions'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Key,
  Info,
  CreditCard,
  FileText,
} from 'lucide-react'
import { VersionInfo } from '@/components/shared/VersionInfo'
import { useTheme } from 'next-themes'
import { Helmet } from 'react-helmet-async'

export default function ChannableSettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { isAdmin } = useAdminRole()
  const { theme, setTheme } = useTheme()
  const { saveSettings, changePassword, exportData, deleteAccount, loading } = useSettingsActions()
  const { t, i18n } = useTranslation('settings')
  const [activeCategory, setActiveCategory] = useState('appearance')

  const settingsCategories = [
    { id: 'appearance', labelKey: 'categories.appearance', icon: Palette },
    { id: 'notifications', labelKey: 'categories.notifications', icon: Bell },
    { id: 'privacy', labelKey: 'categories.privacy', icon: Eye },
    { id: 'security', labelKey: 'categories.security', icon: Shield },
    { id: 'billing', labelKey: 'categories.billing', icon: CreditCard },
    { id: 'account', labelKey: 'categories.account', icon: User },
    { id: 'about', labelKey: 'categories.about', icon: Info },
  ]

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
    analyticsEnabled: true,
  })

  const [language, setLanguage] = useState('fr')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load persisted settings from profile (without triggering autosave)
  useEffect(() => {
    const s: any = (profile as any)?.settings || {}

    const nextNotifications = {
      email: s?.notifications?.email ?? (profile as any)?.email_notifications ?? true,
      push: s?.notifications?.push ?? (profile as any)?.push_notifications ?? false,
      marketing: s?.notifications?.marketing ?? (profile as any)?.marketing_notifications ?? false,
      security: true,
    }

    const nextPrivacy = {
      profileVisible: s?.privacy?.profileVisible ?? (profile as any)?.profile_visible ?? true,
      activityVisible: s?.privacy?.activityVisible ?? (profile as any)?.activity_visible ?? false,
      analyticsEnabled: s?.privacy?.analyticsEnabled ?? (profile as any)?.analytics_enabled ?? true,
    }

    const nextLanguage = s?.language ?? (profile as any)?.language ?? 'fr'

    setNotifications(nextNotifications)
    setPrivacy(nextPrivacy)
    setLanguage(nextLanguage)
    
    // Apply language from profile on load
    if (nextLanguage && i18n.language !== nextLanguage) {
      i18n.changeLanguage(nextLanguage)
    }
    
    setHasChanges(false)
  }, [profile, i18n])

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
    // Apply language change immediately via i18next
    i18n.changeLanguage(value)
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
        <title>{t('title')} - ShopOpti</title>
        <meta name="description" content={t('description')} />
      </Helmet>

      <ChannablePageWrapper
        title={t('title')}
        subtitle={t('subtitle')}
        description={t('description')}
        heroImage="analytics"
        badge={{ label: t('title'), icon: Settings }}
      >
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
                  {t('categories.title')}
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
                      {t(category.labelKey)}
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
                        <CardTitle>{t('appearance.title')}</CardTitle>
                        <CardDescription>{t('appearance.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={Moon} 
                      label={t('appearance.theme.label')} 
                      description={t('appearance.theme.description')}
                    >
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">{t('appearance.theme.light')}</SelectItem>
                          <SelectItem value="dark">{t('appearance.theme.dark')}</SelectItem>
                          <SelectItem value="system">{t('appearance.theme.system')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow 
                      icon={Globe} 
                      label={t('appearance.language.label')} 
                      description={t('appearance.language.description')}
                    >
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
                        <CardTitle>{t('notifications.title')}</CardTitle>
                        <CardDescription>{t('notifications.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={Mail} 
                      label={t('notifications.email.label')} 
                      description={t('notifications.email.description')}
                    >
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      />
                    </SettingRow>

                    <SettingRow 
                      icon={Smartphone} 
                      label={t('notifications.push.label')} 
                      description={t('notifications.push.description')}
                    >
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      />
                    </SettingRow>

                    <SettingRow 
                      icon={Mail} 
                      label={t('notifications.marketing.label')} 
                      description={t('notifications.marketing.description')}
                    >
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                      />
                    </SettingRow>

                    <SettingRow 
                      icon={Shield} 
                      label={t('notifications.security.label')} 
                      description={t('notifications.security.description')}
                    >
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
                        <CardTitle>{t('privacy.title')}</CardTitle>
                        <CardDescription>{t('privacy.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={User} 
                      label={t('privacy.profileVisible.label')} 
                      description={t('privacy.profileVisible.description')}
                    >
                      <Switch
                        checked={privacy.profileVisible}
                        onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                      />
                    </SettingRow>

                    <SettingRow 
                      icon={Eye} 
                      label={t('privacy.activityVisible.label')} 
                      description={t('privacy.activityVisible.description')}
                    >
                      <Switch
                        checked={privacy.activityVisible}
                        onCheckedChange={(checked) => handlePrivacyChange('activityVisible', checked)}
                      />
                    </SettingRow>

                    <SettingRow 
                      icon={Database} 
                      label={t('privacy.analytics.label')} 
                      description={t('privacy.analytics.description')}
                    >
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
                        <CardTitle>{t('security.title')}</CardTitle>
                        <CardDescription>{t('security.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={Lock} 
                      label={t('security.password.label')} 
                      description={t('security.password.description')}
                    >
                      <Button variant="outline" size="sm" onClick={changePassword} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {t('security.password.change')}
                      </Button>
                    </SettingRow>

                    <SettingRow 
                      icon={Key} 
                      label={t('security.twoFactor.label')} 
                      description={t('security.twoFactor.description')}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('security.twoFactor.recommended')}</Badge>
                        <Button variant="outline" size="sm" disabled>
                          {t('security.twoFactor.comingSoon')}
                        </Button>
                      </div>
                    </SettingRow>

                    <SettingRow 
                      icon={Smartphone} 
                      label={t('security.sessions.label')} 
                      description={t('security.sessions.description')}
                    >
                      <Button variant="outline" size="sm" disabled>
                        {t('security.sessions.comingSoon')}
                      </Button>
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Billing */}
            {activeCategory === 'billing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>{t('billing.title')}</CardTitle>
                        <CardDescription>{t('billing.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={CreditCard} 
                      label={t('billing.currentPlan.title')} 
                      description={t('billing.currentPlan.free')}
                    >
                      <Button variant="outline" size="sm">
                        {t('billing.currentPlan.changePlan')}
                      </Button>
                    </SettingRow>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-500/5">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle>{t('billing.invoices.title')}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground font-medium">{t('billing.invoices.noInvoices')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('billing.invoices.noInvoicesDesc')}</p>
                    </div>
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
                        <CardTitle>{t('account.title')}</CardTitle>
                        <CardDescription>{t('account.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={Download} 
                      label={t('account.export.label')} 
                      description={t('account.export.description')}
                    >
                      <Button variant="outline" size="sm" onClick={exportData} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        {t('account.export.button')}
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
                        <CardTitle className="text-red-600">{t('account.dangerZone.title')}</CardTitle>
                        <CardDescription>{t('account.dangerZone.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SettingRow 
                      icon={Trash2} 
                      label={t('account.delete.label')} 
                      description={t('account.delete.description')}
                    >
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('account.delete.button')}
                      </Button>
                    </SettingRow>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* About */}
            {activeCategory === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Info className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{t('about.title')}</CardTitle>
                        <CardDescription>{t('about.description')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <VersionInfo />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('account.delete.confirmTitle')}
          description={t('account.delete.confirmDescription')}
          confirmText={t('account.delete.confirm')}
          variant="destructive"
          onConfirm={handleDeleteAccount}
        />
      </ChannablePageWrapper>
    </>
  )
}