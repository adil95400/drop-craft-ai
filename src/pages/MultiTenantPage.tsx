import { useState } from 'react';
import { Building2, Plus, Settings, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMultiTenant } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

export default function MultiTenantPage() {
  const { tenants, loading, createTenant, deleteTenant } = useMultiTenant();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du tenant est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTenant({
        name: newTenantName,
        domain: newTenantDomain || undefined,
        branding: {
          primary_color: '#000000',
          secondary_color: '#666666',
        },
        features: ['basic'],
        settings: {},
      });

      setNewTenantName('');
      setNewTenantDomain('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tenant ?')) {
      await deleteTenant(tenantId);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-tenant</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos organisations et leurs configurations
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Nom du tenant *</Label>
                <Input
                  id="tenant-name"
                  placeholder="Mon organisation"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-domain">Domaine personnalisé</Label>
                <Input
                  id="tenant-domain"
                  placeholder="monorg.example.com"
                  value={newTenantDomain}
                  onChange={(e) => setNewTenantDomain(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateTenant} className="w-full">
                Créer le tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun tenant</h3>
            <p className="text-muted-foreground text-center mb-4">
              Créez votre premier tenant pour commencer
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>{tenant.name}</CardTitle>
                  </div>
                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                    {tenant.status}
                  </Badge>
                </div>
                <CardDescription>{tenant.slug}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge variant="outline">{tenant.plan_type}</Badge>
                </div>

                {tenant.domain && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Domaine</span>
                    <span className="font-medium">{tenant.domain}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fonctionnalités</span>
                  <span className="font-medium">{tenant.features.length}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurer
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Membres
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTenant(tenant.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}