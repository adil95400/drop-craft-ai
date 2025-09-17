import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Palette, Smartphone, Globe, Download, Eye, Settings, Plus, Zap } from 'lucide-react';
import { mobileAppService } from '@/services/MobileAppService';
import { toast } from 'sonner';

interface WhiteLabelConfig {
  brand_name: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo_url: string;
  features: string[];
  custom_domain?: string;
}

const availableFeatures = [
  { id: 'dashboard', name: 'Dashboard Analytics', description: 'Complete dashboard with analytics' },
  { id: 'products', name: 'Product Management', description: 'Full product catalog management' },
  { id: 'orders', name: 'Order Management', description: 'Order processing and tracking' },
  { id: 'customers', name: 'Customer Management', description: 'CRM and customer data' },
  { id: 'marketing', name: 'Marketing Tools', description: 'Campaign and marketing automation' },
  { id: 'analytics', name: 'Advanced Analytics', description: 'AI-powered insights and reports' },
  { id: 'integrations', name: 'Third-party Integrations', description: 'Connect external services' },
  { id: 'mobile', name: 'Mobile App', description: 'Native mobile applications' },
  { id: 'api', name: 'API Access', description: 'Full REST API access' },
  { id: 'whitelabel', name: 'Full White-label', description: 'Complete brand customization' }
];

export const WhiteLabelSolution = () => {
  const [configs, setConfigs] = useState<(WhiteLabelConfig & { id: string; status: string; created_at: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  const [newConfig, setNewConfig] = useState<WhiteLabelConfig>({
    brand_name: '',
    brand_colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4'
    },
    logo_url: '',
    features: [],
    custom_domain: ''
  });

  const handleCreateConfig = async () => {
    try {
      setLoading(true);
      const id = await mobileAppService.generateWhiteLabelApp(newConfig);
      
      // Add to local state
      setConfigs(prev => [...prev, {
        ...newConfig,
        id,
        status: 'generating',
        created_at: new Date().toISOString()
      }]);

      setShowCreate(false);
      setNewConfig({
        brand_name: '',
        brand_colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4'
        },
        logo_url: '',
        features: [],
        custom_domain: ''
      });
    } catch (error) {
      console.error('Error creating white-label config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setNewConfig(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'generating': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">White-Label Solution</h1>
          <p className="text-muted-foreground">Create branded solutions for your clients</p>
        </div>
        
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New White-Label App
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create White-Label Solution</DialogTitle>
              <DialogDescription>
                Configure a branded solution for your client
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="branding" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand-name">Brand Name</Label>
                    <Input
                      id="brand-name"
                      value={newConfig.brand_name}
                      onChange={(e) => setNewConfig({ ...newConfig, brand_name: e.target.value })}
                      placeholder="Client Brand Name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input
                      id="logo-url"
                      value={newConfig.logo_url}
                      onChange={(e) => setNewConfig({ ...newConfig, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div className="grid gap-4">
                    <Label>Brand Colors</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color" className="text-sm">Primary</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={newConfig.brand_colors.primary}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, primary: e.target.value }
                            })}
                            className="w-16 h-10 p-1 rounded"
                          />
                          <Input
                            value={newConfig.brand_colors.primary}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, primary: e.target.value }
                            })}
                            placeholder="#6366f1"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondary-color" className="text-sm">Secondary</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={newConfig.brand_colors.secondary}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, secondary: e.target.value }
                            })}
                            className="w-16 h-10 p-1 rounded"
                          />
                          <Input
                            value={newConfig.brand_colors.secondary}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, secondary: e.target.value }
                            })}
                            placeholder="#8b5cf6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accent-color" className="text-sm">Accent</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="accent-color"
                            type="color"
                            value={newConfig.brand_colors.accent}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, accent: e.target.value }
                            })}
                            className="w-16 h-10 p-1 rounded"
                          />
                          <Input
                            value={newConfig.brand_colors.accent}
                            onChange={(e) => setNewConfig({
                              ...newConfig,
                              brand_colors: { ...newConfig.brand_colors, accent: e.target.value }
                            })}
                            placeholder="#06b6d4"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div 
                      className="h-20 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ background: `linear-gradient(135deg, ${newConfig.brand_colors.primary}, ${newConfig.brand_colors.secondary})` }}
                    >
                      {newConfig.brand_name || 'Brand Preview'}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Select Features</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which features to include in the white-label solution
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    {availableFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium">{feature.name}</h5>
                            {feature.id === 'whitelabel' && (
                              <Badge variant="secondary">Premium</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                        <Switch
                          checked={newConfig.features.includes(feature.id)}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-1">Selected Features: {newConfig.features.length}</h5>
                    <p className="text-sm text-muted-foreground">
                      {newConfig.features.length === 0 
                        ? 'No features selected' 
                        : `${newConfig.features.map(f => availableFeatures.find(af => af.id === f)?.name).join(', ')}`
                      }
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
                    <Input
                      id="custom-domain"
                      value={newConfig.custom_domain}
                      onChange={(e) => setNewConfig({ ...newConfig, custom_domain: e.target.value })}
                      placeholder="client.yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use a subdomain on our platform
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Configuration Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand Name:</span>
                        <span>{newConfig.brand_name || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Features:</span>
                        <span>{newConfig.features.length} selected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custom Domain:</span>
                        <span>{newConfig.custom_domain || 'Default subdomain'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConfig} disabled={!newConfig.brand_name || loading}>
                {loading ? 'Creating...' : 'Create Solution'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No White-Label Solutions</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first white-label solution for a client.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Solution
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.brand_name}</CardTitle>
                  <Badge className={getStatusColor(config.status)}>
                    {config.status}
                  </Badge>
                </div>
                <CardDescription>
                  Created {new Date(config.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="h-16 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: `linear-gradient(135deg, ${config.brand_colors.primary}, ${config.brand_colors.secondary})` }}
                >
                  {config.brand_name}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Features:</span>
                    <span>{config.features.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="truncate ml-2">
                      {config.custom_domain || `${config.brand_name.toLowerCase().replace(/\s+/g, '-')}.yourapp.com`}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  {config.status === 'ready' && (
                    <Button size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Deploy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>White-Label Features</span>
          </CardTitle>
          <CardDescription>
            Comprehensive branding and customization options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Complete Branding</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Custom colors, logos, and brand identity throughout the application
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Custom Domains</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Host on your client's domain with SSL certificates included
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Mobile Apps</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate branded mobile apps for iOS and Android
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Feature Control</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable or disable specific features per client
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Fast Deployment</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Deploy new solutions in minutes, not days
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Multi-tenant</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure isolation between different client instances
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};