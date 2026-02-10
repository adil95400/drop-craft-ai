import { Building2, Plus, Users, Settings as SettingsIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useMultiTenant } from '@/hooks/useMultiTenant';
import { Loader2 } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function MultiTenantManagementPage() {
  const navigate = useNavigate();
  const { tenants, loading } = useMultiTenant();

  return (
    <ChannablePageWrapper
      title="Gestion Multi-Tenant"
      description={`${tenants.length} tenants • ${tenants.filter(t => t.status === 'active').length} actifs`}
      heroImage="settings"
      badge={{ label: 'Multi-Tenant', icon: Building2 }}
      actions={
        <Button onClick={() => navigate('/tenants/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un Tenant
        </Button>
      }
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tenants.filter(t => t.status === 'active').length} actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Tous les tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plans Premium</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.filter(t => t.plan_type !== 'standard').length}
                </div>
                <p className="text-xs text-muted-foreground">Pro & Ultra</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tenants Récents</CardTitle>
              <CardDescription>
                Les derniers tenants créés sur votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {tenants.slice(0, 5).map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tenants/${tenant.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.domain || 'Pas de domaine'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                        <Badge variant="outline">{tenant.plan_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Tenants</CardTitle>
              <CardDescription>
                Liste complète de tous vos tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tenant.name}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                              {tenant.status}
                            </Badge>
                            <Badge variant="outline">{tenant.plan_type}</Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {tenant.domain || 'Pas de domaine personnalisé'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tenants/${tenant.id}`)}
                          >
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            Configurer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tenants/${tenant.id}/users`)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Utilisateurs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Multi-Tenant</CardTitle>
              <CardDescription>
                Statistiques et métriques de performance globales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les analytics détaillées seront disponibles prochainement
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
