import { useState, useEffect } from 'react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users, Palette, Globe, Shield, Loader2, Plus, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Tenant {
  id: string
  name: string
  slug: string
  plan_type: string
  status: string
  branding: any
  features: string[]
  created_at: string
  owner_id: string
  domain: string
}

export const MultiTenantDashboard = () => {
  const { user } = useAuthOptimized()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    if (user) {
      loadTenants()
    }
  }, [user])

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTenant = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-tenant', {
        body: { 
          action: 'create',
          user_id: user?.id,
          name: 'Nouveau Tenant',
          plan: 'standard'
        }
      })

      if (error) throw error

      toast({
        title: "Tenant créé",
        description: "Le nouveau tenant a été créé avec succès"
      })
      
      await loadTenants()
    } catch (error) {
      console.error('Create tenant error:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le tenant",
        variant: "destructive"
      })
    }
  }

  const updateBranding = async (tenantId: string, branding: any) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ branding })
        .eq('id', tenantId)

      if (error) throw error

      toast({
        title: "Branding mis à jour",
        description: "Les modifications ont été enregistrées"
      })
      
      await loadTenants()
    } catch (error) {
      console.error('Update branding error:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le branding",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Multi-Tenant Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion centralisée de vos tenants SaaS
          </p>
        </div>
        <Badge variant="secondary">PHASE 3</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tenants actifs</CardDescription>
            <CardTitle className="text-3xl">{tenants.filter(t => t.status === 'active').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Utilisateurs totaux</CardDescription>
            <CardTitle className="text-3xl">
              {tenants.length * 10}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Plans Premium</CardDescription>
            <CardTitle className="text-3xl">
              {tenants.filter(t => t.plan_type !== 'standard').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Domaines custom</CardDescription>
            <CardTitle className="text-3xl">
              {tenants.filter(t => t.branding?.custom_domain).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Vos Tenants</h2>
        <Button onClick={createTenant}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucun tenant créé. Créez votre premier tenant pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6" />
                    <div>
                      <CardTitle>{tenant.name}</CardTitle>
                      <CardDescription>/{tenant.slug}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                    {tenant.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="outline">{tenant.plan_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Utilisateurs:</span>
                    <span className="font-medium">10</span>
                  </div>
                  {tenant.branding?.custom_domain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Domaine:</span>
                      <span className="font-medium">{tenant.branding.custom_domain}</span>
                    </div>
                  )}
                  <div className="pt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Branding
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Branding Editor */}
      {selectedTenant && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configuration Branding - {selectedTenant.name}</CardTitle>
            <CardDescription>Personnalisez l'apparence de votre tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors">
              <TabsList>
                <TabsTrigger value="colors">Couleurs</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="domain">Domaine</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <div className="space-y-2">
                  <Label>Couleur primaire</Label>
                  <Input 
                    type="color"
                    defaultValue={selectedTenant.branding?.primary_color || '#000000'}
                    onChange={(e) => {
                      const newBranding = { ...selectedTenant.branding, primary_color: e.target.value }
                      updateBranding(selectedTenant.id, newBranding)
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="logo" className="space-y-4">
                <div className="space-y-2">
                  <Label>URL du logo</Label>
                  <Input 
                    placeholder="https://example.com/logo.png"
                    defaultValue={selectedTenant.branding?.logo_url || ''}
                    onBlur={(e) => {
                      const newBranding = { ...selectedTenant.branding, logo_url: e.target.value }
                      updateBranding(selectedTenant.id, newBranding)
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="domain" className="space-y-4">
                <div className="space-y-2">
                  <Label>Domaine personnalisé</Label>
                  <Input 
                    placeholder="mon-domaine.com"
                    defaultValue={selectedTenant.branding?.custom_domain || ''}
                    onBlur={(e) => {
                      const newBranding = { ...selectedTenant.branding, custom_domain: e.target.value }
                      updateBranding(selectedTenant.id, newBranding)
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedTenant(null)}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
