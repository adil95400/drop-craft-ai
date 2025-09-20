import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal,
  Filter,
  Search,
  Users,
  Package,
  ArrowUpDown,
  Eye,
  Download
} from 'lucide-react';
import { SimplifiedSyncEngine, SyncConfiguration, SyncOperation, syncEngine } from '@/services/sync/SimplifiedSyncEngine';
import { ConnectorManager } from '@/services/ConnectorManager';

const CoreSyncDashboard: React.FC = () => {
  const [syncConfigs, setSyncConfigs] = useState<SyncConfiguration[]>([]);
  const [syncOps, setSyncOps] = useState<SyncOperation[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SyncConfiguration | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock available connectors for now
      const availableConnectors = [
        { id: 'shopify', name: 'Shopify', type: 'ecommerce' },
        { id: 'woocommerce', name: 'WooCommerce', type: 'ecommerce' },
        { id: 'amazon', name: 'Amazon', type: 'marketplace' },
        { id: 'ebay', name: 'eBay', type: 'marketplace' },
      ];
      setConnectors(availableConnectors);
      
      // Mock user ID for now
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      
      const configs = await syncEngine.getSyncConfigurations(mockUserId);
      const operations = await syncEngine.getSyncOperations(mockUserId);
      
      setSyncConfigs(configs);
      setSyncOps(operations);
    } catch (error) {
      console.error('Failed to load sync data:', error);
      toast({
        title: "Error",
        description: "Failed to load sync configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Sync data has been refreshed",
    });
  };

  const handleManualSync = async (configId: string) => {
    try {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      await syncEngine.triggerManualSync(configId, mockUserId);
      toast({
        title: "Sync Started",
        description: "Manual sync has been triggered",
      });
      await loadData();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      toast({
        title: "Error",
        description: "Failed to trigger sync",
        variant: "destructive",
      });
    }
  };

  const handleCreateConfig = async (configData: any) => {
    try {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      await syncEngine.createSyncConfiguration({
        user_id: mockUserId,
        connector_id: configData.connector_id,
        sync_direction: configData.sync_direction,
        sync_entities: configData.sync_entities,
        sync_frequency: configData.sync_frequency,
        is_active: true,
      });
      
      toast({
        title: "Configuration Created",
        description: "Sync configuration has been created successfully",
      });
      
      setConfigDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create configuration:', error);
      toast({
        title: "Error",
        description: "Failed to create sync configuration",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, icon: Clock },
      running: { variant: 'default' as const, icon: RefreshCw },
      completed: { variant: 'default' as const, icon: CheckCircle },
      failed: { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredOperations = syncOps.filter(op => {
    const matchesStatus = statusFilter === 'all' || op.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      op.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.entities_synced.some(entity => entity.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sync dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your platform synchronization configurations and monitor sync operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Sync Configuration</DialogTitle>
                <DialogDescription>
                  Set up a new synchronization configuration for your platforms
                </DialogDescription>
              </DialogHeader>
              <SyncConfigForm 
                connectors={connectors}
                onSubmit={handleCreateConfig}
                onCancel={() => setConfigDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="operations">Sync Operations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Configurations</CardTitle>
              <CardDescription>
                Manage your platform sync configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No configurations found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first sync configuration to get started
                    </p>
                    <Button onClick={() => setConfigDialogOpen(true)}>
                      Create Configuration
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {syncConfigs.map((config) => (
                      <Card key={config.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{config.connector_id}</CardTitle>
                            <Badge variant={config.is_active ? "default" : "secondary"}>
                              {config.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <CardDescription>
                            {config.sync_direction} • {config.sync_entities.join(', ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Last sync: {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualSync(config.id)}
                              className="flex items-center gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Sync
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Operations</CardTitle>
              <CardDescription>
                Monitor and track your synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search operations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredOperations.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No operations found</h3>
                    <p className="text-muted-foreground">
                      Sync operations will appear here once you start syncing
                    </p>
                  </div>
                ) : (
                  filteredOperations.map((operation) => (
                    <Card key={operation.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold">{operation.operation_type}</h4>
                              <p className="text-sm text-muted-foreground">
                                {operation.entities_synced.join(', ')} • {operation.sync_direction}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(operation.status)}
                        </div>
                        
                        {operation.status === 'running' && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Progress</span>
                              <span className="text-sm">{operation.progress}%</span>
                            </div>
                            <Progress value={operation.progress} />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">{operation.total_items}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Processed</p>
                            <p className="font-semibold">{operation.processed_items}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Success</p>
                            <p className="font-semibold text-green-600">{operation.success_items}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Errors</p>
                            <p className="font-semibold text-red-600">{operation.error_items}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                          Started: {operation.started_at ? new Date(operation.started_at).toLocaleString() : 'N/A'}
                          {operation.completed_at && (
                            <> • Completed: {new Date(operation.completed_at).toLocaleString()}</>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Configs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncConfigs.length}</div>
                <p className="text-xs text-muted-foreground">Active configurations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Operations Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncOps.length}</div>
                <p className="text-xs text-muted-foreground">Sync operations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3m</div>
                <p className="text-xs text-muted-foreground">Average sync time</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sync Configuration Form Component
const SyncConfigForm: React.FC<{
  connectors: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ connectors, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    connector_id: '',
    sync_direction: 'bidirectional' as const,
    sync_entities: [] as string[],
    sync_frequency: 15,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const entityOptions = ['products', 'orders', 'customers', 'inventory'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="connector">Platform Connector</Label>
          <Select value={formData.connector_id} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, connector_id: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent>
              {connectors.map((connector) => (
                <SelectItem key={connector.id} value={connector.id}>
                  {connector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">Sync Direction</Label>
          <Select value={formData.sync_direction} onValueChange={(value: any) => 
            setFormData(prev => ({ ...prev, sync_direction: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="import">Import Only</SelectItem>
              <SelectItem value="export">Export Only</SelectItem>
              <SelectItem value="bidirectional">Bidirectional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sync Entities</Label>
          <div className="grid grid-cols-2 gap-2">
            {entityOptions.map((entity) => (
              <div key={entity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={entity}
                  checked={formData.sync_entities.includes(entity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        sync_entities: [...prev.sync_entities, entity]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        sync_entities: prev.sync_entities.filter(e => e !== entity)
                      }));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <Label htmlFor={entity} className="text-sm capitalize">
                  {entity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Sync Frequency (minutes)</Label>
          <Input
            id="frequency"
            type="number"
            min="1"
            value={formData.sync_frequency}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              sync_frequency: parseInt(e.target.value) || 15 
            }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.connector_id || formData.sync_entities.length === 0}>
          Create Configuration
        </Button>
      </div>
    </form>
  );
};

export default CoreSyncDashboard;