import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Truck, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations() {
  const { integrations, connectIntegration, disconnectIntegration } = useIntegrations();

  const availableIntegrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect your Shopify store to sync products and orders',
      icon: ShoppingBag,
      category: 'E-commerce Platform',
      status: integrations.find(i => i.platform === 'shopify')?.status || 'disconnected'
    },
    {
      id: 'bigbuy',
      name: 'BigBuy',
      description: 'Import products from BigBuy wholesale marketplace',
      icon: Package,
      category: 'Supplier',
      status: integrations.find(i => i.platform === 'bigbuy')?.status || 'disconnected'
    },
    {
      id: 'aliexpress',
      name: 'AliExpress',
      description: 'Import products from AliExpress dropshipping',
      icon: Package,
      category: 'Supplier',
      status: 'disconnected' // Always disconnected for demo
    },
    {
      id: '17track',
      name: '17Track',
      description: 'Track packages and update order status automatically',
      icon: Truck,
      category: 'Logistics',
      status: integrations.find(i => i.platform === '17track')?.status || 'disconnected'
    },
    {
      id: 'canva',
      name: 'Canva',
      description: 'Create and manage designs directly from your SaaS',
      icon: Palette,
      category: 'Design',
      status: 'disconnected' // Will be updated via useCanva hook
    }
  ];

  const handleConnect = async (integrationId: string) => {
    toast.promise(
      connectIntegration(integrationId),
      {
        loading: `Connecting to ${integrationId}...`,
        success: `Successfully connected to ${integrationId}!`,
        error: `Failed to connect to ${integrationId}`
      }
    );
  };

  const handleDisconnect = async (integrationId: string) => {
    toast.promise(
      disconnectIntegration(integrationId),
      {
        loading: `Disconnecting from ${integrationId}...`,
        success: `Successfully disconnected from ${integrationId}`,
        error: `Failed to disconnect from ${integrationId}`
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          Integrations
        </h1>
        <p className="text-muted-foreground">
          Connect your favorite platforms and automate your workflow
        </p>
      </div>

      {/* Connected Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected ({integrations.filter(i => i.status === 'connected').length})</h2>
        {integrations.filter(i => i.status === 'connected').length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No integrations connected yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.status === 'connected').map((integration) => (
              <Card key={integration.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg capitalize">{integration.platform}</CardTitle>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Last sync: {new Date(integration.last_sync || Date.now()).toLocaleDateString()}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDisconnect(integration.platform)}
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <integration.icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge 
                    variant={integration.status === 'connected' ? 'default' : 'outline'}
                    className={integration.status === 'connected' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {integration.description}
                </CardDescription>
                <Button 
                  className="w-full"
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  onClick={() => integration.status === 'connected' 
                    ? handleDisconnect(integration.id)
                    : handleConnect(integration.id)
                  }
                >
                  {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}