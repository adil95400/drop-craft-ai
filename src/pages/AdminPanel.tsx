import { useState } from 'react'
import { AdminRoute } from '@/components/admin/AdminRoute'
import { EnhancedAdminDashboard } from '@/components/admin/EnhancedAdminDashboard'
import { UserManagement } from '@/components/admin/UserManagement'
import { SupplierManagement } from '@/components/suppliers/SupplierManagement'
import { SystemAnalytics } from '@/components/admin/SystemAnalytics'
import { DatabaseManagement } from '@/components/admin/DatabaseManagement'
import { LogsViewer } from '@/components/admin/LogsViewer'
import { AdvancedSettings } from '@/components/admin/AdvancedSettings'
import { RealTimeMonitoring } from '@/components/admin/RealTimeMonitoring'
import { FinalHealthCheck } from '@/components/admin/FinalHealthCheck'
import { CommercializationQuickActions } from '@/components/admin/CommercializationQuickActions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Shield, 
  Database,
  BarChart3,
  FileText,
  Building2,
  Activity
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const AdminPanel = () => {
  const { t } = useTranslation(['common', 'settings', 'navigation'])
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  {t('navigation:admin')} Panel
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez votre plateforme et surveillez les activités
                </p>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-8 mb-8">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {t('navigation:dashboard')}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fournisseurs
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Base de données
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('navigation:settings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <EnhancedAdminDashboard />
              <CommercializationQuickActions />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="suppliers">
              <SupplierManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <SystemAnalytics />
            </TabsContent>

            <TabsContent value="database">
              <DatabaseManagement />
            </TabsContent>

            <TabsContent value="monitoring">
              <RealTimeMonitoring />
            </TabsContent>

            <TabsContent value="logs">
              <LogsViewer />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <AdvancedSettings />
                <FinalHealthCheck />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminRoute>
  )
}

export default AdminPanel