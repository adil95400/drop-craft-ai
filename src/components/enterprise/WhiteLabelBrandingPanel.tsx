import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Type, 
  Image, 
  Globe, 
  Users, 
  Settings,
  Eye,
  Save,
  Upload
} from 'lucide-react';
import { multiTenantService, Tenant } from '@/services/white-label/MultiTenantService';
import { useToast } from '@/hooks/use-toast';

export function WhiteLabelBrandingPanel() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState({
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    font_family: 'Inter',
    favicon_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentTenant = multiTenantService.getCurrentTenant();
    if (currentTenant) {
      setTenant(currentTenant);
      setBranding({
        logo_url: currentTenant.branding.logo_url || '',
        primary_color: currentTenant.branding.primary_color,
        secondary_color: currentTenant.branding.secondary_color,
        accent_color: currentTenant.branding.accent_color,
        font_family: currentTenant.branding.font_family,
        favicon_url: currentTenant.branding.favicon_url || ''
      });
    }
  }, []);

  const handleColorChange = (colorType: string, value: string) => {
    setBranding(prev => ({
      ...prev,
      [colorType]: value
    }));

    if (previewMode) {
      // Apply preview immediately
      const root = document.documentElement;
      root.style.setProperty(`--${colorType.replace('_', '-')}`, value);
    }
  };

  const handleSaveBranding = async () => {
    if (!tenant) return;

    setIsLoading(true);
    try {
      await multiTenantService.updateTenantBranding(tenant.id, branding);
      
      toast({
        title: 'Branding mis à jour',
        description: 'Votre personnalisation a été sauvegardée avec succès.'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la personnalisation.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewToggle = (enabled: boolean) => {
    setPreviewMode(enabled);
    
    if (enabled) {
      // Apply preview styles
      const root = document.documentElement;
      root.style.setProperty('--primary', branding.primary_color);
      root.style.setProperty('--secondary', branding.secondary_color);
      root.style.setProperty('--accent', branding.accent_color);
    } else {
      // Restore original styles
      if (tenant) {
        multiTenantService.setCurrentTenant(tenant);
      }
    }
  };

  const fontOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Nunito'
  ];

  if (!tenant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun tenant sélectionné. Veuillez vous connecter à un tenant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">White-Label Branding</h1>
          <p className="text-muted-foreground">
            Personnalisez l'apparence de votre plateforme
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="preview-mode"
              checked={previewMode}
              onCheckedChange={handlePreviewToggle}
            />
            <Label htmlFor="preview-mode" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu en direct
            </Label>
          </div>
          
          <Button onClick={handleSaveBranding} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informations du Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Nom</Label>
              <p className="text-lg font-semibold">{tenant.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Slug</Label>
              <p className="text-lg font-mono">{tenant.slug}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Domaine</Label>
              <p className="text-lg">{tenant.domain || 'Non configuré'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Configuration */}
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typographie
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Palette de Couleurs</CardTitle>
              <CardDescription>
                Définissez les couleurs principales de votre marque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Couleur Primaire</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-color"
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Couleur Secondaire</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Couleur d'Accent</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="accent-color"
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Aperçu des Couleurs</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    Primaire
                  </div>
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: branding.secondary_color }}
                  >
                    Secondaire
                  </div>
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: branding.accent_color }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typographie</CardTitle>
              <CardDescription>
                Choisissez la police de caractères de votre marque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="font-family">Police de Caractères</Label>
                <select
                  id="font-family"
                  value={branding.font_family}
                  onChange={(e) => setBranding(prev => ({ ...prev, font_family: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {fontOptions.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Font Preview */}
              <div className="mt-6 p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Aperçu de la Police</h4>
                <div style={{ fontFamily: branding.font_family }}>
                  <h1 className="text-4xl font-bold mb-2">Titre Principal</h1>
                  <h2 className="text-2xl font-semibold mb-2">Sous-titre</h2>
                  <p className="text-base mb-2">
                    Ceci est un exemple de texte avec la police sélectionnée. 
                    Elle sera appliquée à l'ensemble de votre plateforme.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Texte secondaire avec la même police mais une taille plus petite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Assets Visuels</CardTitle>
              <CardDescription>
                Téléchargez votre logo et favicon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">URL du Logo</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="logo-url"
                      value={branding.logo_url}
                      onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://votre-domaine.com/logo.png"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon-url">URL du Favicon</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="favicon-url"
                      value={branding.favicon_url}
                      onChange={(e) => setBranding(prev => ({ ...prev, favicon_url: e.target.value }))}
                      placeholder="https://votre-domaine.com/favicon.ico"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </div>

              {/* Assets Preview */}
              {(branding.logo_url || branding.favicon_url) && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Aperçu des Assets</h4>
                  <div className="flex items-center gap-6">
                    {branding.logo_url && (
                      <div className="space-y-2">
                        <Label className="text-sm">Logo</Label>
                        <img 
                          src={branding.logo_url} 
                          alt="Logo" 
                          className="h-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}
                    {branding.favicon_url && (
                      <div className="space-y-2">
                        <Label className="text-sm">Favicon</Label>
                        <img 
                          src={branding.favicon_url} 
                          alt="Favicon" 
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Avancée</CardTitle>
              <CardDescription>
                Paramètres avancés de personnalisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Fonctionnalités Disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {tenant.settings.features.map(feature => (
                      <Badge key={feature} variant="secondary">
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Limites du Plan</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Utilisateurs: {tenant.settings.limits.users}</div>
                    <div>Produits: {tenant.settings.limits.products.toLocaleString()}</div>
                    <div>Commandes: {tenant.settings.limits.orders.toLocaleString()}</div>
                    <div>Stockage: {tenant.settings.limits.storage_gb} GB</div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Abonnement</h4>
                  <div className="space-y-1 text-sm">
                    <div>Plan: <Badge>{tenant.subscription.plan}</Badge></div>
                    <div>Statut: <Badge variant="outline">{tenant.subscription.status}</Badge></div>
                    <div>Cycle: {tenant.subscription.billing_cycle}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}