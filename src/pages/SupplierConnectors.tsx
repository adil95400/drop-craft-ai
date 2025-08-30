import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Plug, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download,
  AlertCircle,
  Eye,
  Zap
} from 'lucide-react';
import { useSupplierConnectors } from '@/hooks/useSupplierConnectors';
import { JobQueueDashboard } from '@/components/jobs/JobQueueDashboard';
import { ProGate } from '@/components/plan/PlanGate';
import { SupplierCredentials } from '@/types/suppliers';
import { useToast } from '@/hooks/use-toast';

export default function SupplierConnectors() {
  const {
    loading,
    connectors,
    activeConnectors,
    loadAvailableConnectors,
    connectSupplier,
    disconnectSupplier,
    syncProducts,
    fetchProductPreview,
    getConnectorStatus,
    loadActiveConnectors,
  } = useSupplierConnectors();

  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SupplierCredentials>({});
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableConnectors();
    loadActiveConnectors();
  }, [loadAvailableConnectors, loadActiveConnectors]);

  useEffect(() => {
    // Load connection statuses for all connectors
    const loadStatuses = async () => {
      const statuses: Record<string, string> = {};
      for (const connector of connectors) {
        statuses[connector.id] = await getConnectorStatus(connector.id);
      }
      setConnectionStatuses(statuses);
    };

    if (connectors.length > 0) {
      loadStatuses();
    }
  }, [connectors, getConnectorStatus]);

  const handleConnect = async () => {
    if (!selectedConnector) return;

    const success = await connectSupplier(selectedConnector, credentials);
    if (success) {
      setCredentials({});
      setSelectedConnector(null);
      // Refresh statuses
      const newStatus = await getConnectorStatus(selectedConnector);
      setConnectionStatuses(prev => ({ ...prev, [selectedConnector]: newStatus }));
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    const success = await disconnectSupplier(connectorId);
    if (success) {
      const newStatus = await getConnectorStatus(connectorId);
      setConnectionStatuses(prev => ({ ...prev, [connectorId]: newStatus }));
    }
  };

  const handleSync = async (connectorId: string, fullSync: boolean = false) => {
    const jobId = await syncProducts(connectorId, { fullSync });
    if (jobId) {
      toast({
        title: "Sync Started",
        description: "Product synchronization has been queued. Check the Jobs tab for progress.",
      });
    }
  };

  const handlePreview = async (connectorId: string) => {
    const products = await fetchProductPreview(connectorId, 5);
    setPreviewProducts(products);
    setShowPreview(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const renderCredentialForm = (connector: any) => {
    const requiredFields = connector.authType === 'api_key' ? ['apiKey'] 
      : connector.authType === 'oauth' ? ['accessToken'] 
      : connector.authType === 'credentials' ? ['username', 'password'] 
      : [];

    return (
      <div className="space-y-4">
        {requiredFields.includes('apiKey') && (
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={credentials.apiKey || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key"
            />
          </div>
        )}
        {requiredFields.includes('accessToken') && (
          <div>
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={credentials.accessToken || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
              placeholder="Enter your access token"
            />
          </div>
        )}
        {requiredFields.includes('username') && (
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={credentials.username || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
            />
          </div>
        )}
        {requiredFields.includes('password') && (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Connectors</h1>
        <p className="text-muted-foreground mt-2">
          Connect to real suppliers and sync products automatically
        </p>
      </div>

      <Tabs defaultValue="connectors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((connector) => {
              const status = connectionStatuses[connector.id] || 'disconnected';
              const isConnected = status === 'connected';

              return (
                <Card key={connector.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Plug className="w-5 h-5" />
                        {connector.displayName}
                      </CardTitle>
                      {getStatusBadge(status)}
                    </div>
                    <CardDescription>{connector.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {connector.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {connector.authType}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Features:</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={connector.features.products ? 'text-success' : 'text-muted-foreground'}>
                          {connector.features.products ? '✓' : '✗'} Products
                        </div>
                        <div className={connector.features.inventory ? 'text-success' : 'text-muted-foreground'}>
                          {connector.features.inventory ? '✓' : '✗'} Inventory
                        </div>
                        <div className={connector.features.orders ? 'text-success' : 'text-muted-foreground'}>
                          {connector.features.orders ? '✓' : '✗'} Orders
                        </div>
                        <div className={connector.features.webhooks ? 'text-success' : 'text-muted-foreground'}>
                          {connector.features.webhooks ? '✓' : '✗'} Webhooks
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2 flex-wrap">
                      {!isConnected ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedConnector(connector.id)}
                              disabled={loading}
                            >
                              <Plug className="w-4 h-4 mr-2" />
                              Connect
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Connect to {connector.displayName}</DialogTitle>
                              <DialogDescription>
                                Enter your credentials to connect to this supplier.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <ProGate feature="supplier_connectors">
                              <div className="space-y-4">
                                {renderCredentialForm(connector)}
                                
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    onClick={handleConnect}
                                    disabled={loading}
                                  >
                                    {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                                    Connect
                                  </Button>
                                </div>
                              </div>
                            </ProGate>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(connector.id, false)}
                            disabled={loading}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(connector.id, true)}
                            disabled={loading}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Full Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(connector.id)}
                            disabled={loading}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisconnect(connector.id)}
                            disabled={loading}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Disconnect
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Rate Limits: {connector.rateLimits.requestsPerMinute}/min, {connector.rateLimits.requestsPerHour}/hour
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Product Preview Dialog */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Product Preview</DialogTitle>
                <DialogDescription>
                  Preview of products from the connected supplier
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {previewProducts.map((product, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {product.images[0] && (
                          <img 
                            src={product.images[0]} 
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{product.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Price: {product.price} {product.currency}</span>
                            <span>Stock: {product.stock}</span>
                            <span>SKU: {product.sku}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="jobs">
          <ProGate feature="job_queue">
            <JobQueueDashboard />
          </ProGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}