import { useState } from 'react'
import { AdminRoute } from '@/components/admin/AdminRoute'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UserManagement } from '@/components/admin/UserManagement'
import { SupplierManagement } from '@/components/suppliers/SupplierManagement'
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
  Building2
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

            <TabsList className="grid w-full grid-cols-7 mb-8">
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
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="suppliers">
              <SupplierManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics avancées</CardTitle>
                  <CardDescription>
                    Analysez les performances de votre plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Module analytics en cours de développement...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion de la base de données</CardTitle>
                  <CardDescription>
                    Surveillez et gérez votre base de données Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Module de gestion BDD en cours de développement...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Logs système</CardTitle>
                  <CardDescription>
                    Consultez les logs d'activité et de sécurité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Module de logs en cours de développement...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres système</CardTitle>
                  <CardDescription>
                    Configurez les paramètres globaux de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Module de configuration système en cours de développement...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminRoute>
  )
}

export default AdminPanel