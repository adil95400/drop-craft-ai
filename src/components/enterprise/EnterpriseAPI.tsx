import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Code, Key, Shield, Globe, Copy, Eye, EyeOff, Plus, Trash2, BarChart3 } from 'lucide-react';
import { mobileAppService } from '@/services/MobileAppService';
import { toast } from 'sonner';

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used: string;
  created_at: string;
}

const availablePermissions = [
  { id: 'read:products', name: 'Read Products', description: 'View product catalog' },
  { id: 'write:products', name: 'Write Products', description: 'Create and update products' },
  { id: 'read:orders', name: 'Read Orders', description: 'View order data' },
  { id: 'write:orders', name: 'Write Orders', description: 'Create and update orders' },
  { id: 'read:customers', name: 'Read Customers', description: 'View customer data' },
  { id: 'write:customers', name: 'Write Customers', description: 'Create and update customers' },
  { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics and reports' },
  { id: 'webhook:receive', name: 'Webhook Access', description: 'Receive webhook notifications' },
  { id: 'admin:all', name: 'Admin Access', description: 'Full administrative access' }
];

const codeExamples = {
  curl: `curl -X GET "https://api.yourapp.com/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  
  javascript: `const response = await fetch('https://api.yourapp.com/v1/products', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();`,
  
  python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.yourapp.com/v1/products', headers=headers)
data = response.json()`,
  
  php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.yourapp.com/v1/products',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($curl);
curl_close($curl);
?>`
};

export const EnterpriseAPI = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const data = await mobileAppService.getEnterpriseAPIKeys();
      setApiKeys(data);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      await mobileAppService.createEnterpriseAPIKey(newKey);
      setShowCreate(false);
      setNewKey({ name: '', permissions: [] });
      loadAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setNewKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setHiddenKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise API</h1>
          <p className="text-muted-foreground">Manage API keys and integrations</p>
        </div>
        
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="My Integration Key"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={newKey.permissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selected permissions: {newKey.permissions.length}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={!newKey.name}>
                Create Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first API key to start integrating with our platform.
                </p>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{key.name}</CardTitle>
                      <Badge variant="outline">
                        {key.permissions.length} permissions
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {new Date(key.created_at).toLocaleDateString()} • 
                      Last used: {key.last_used === 'Never' ? 'Never' : new Date(key.last_used).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="font-mono text-sm bg-muted p-2 rounded flex-1">
                        {hiddenKeys.has(key.id) ? maskApiKey(key.key) : key.key}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {hiddenKeys.has(key.id) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Permissions</h4>
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {availablePermissions.find(p => p.id === permission)?.name || permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Available REST API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <code className="text-sm">/v1/products</code>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">POST</Badge>
                      <code className="text-sm">/v1/products</code>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <code className="text-sm">/v1/orders</code>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">POST</Badge>
                      <code className="text-sm">/v1/orders</code>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>How to authenticate your requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Bearer Token</h4>
                    <p className="text-sm text-muted-foreground">
                      Include your API key in the Authorization header
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Rate Limits</h4>
                    <p className="text-sm text-muted-foreground">
                      1000 requests per hour per API key
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Integration examples in different languages</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>
                
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium capitalize">{lang}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Configure webhook endpoints to receive real-time updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://yourapp.com/webhooks"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2">
                    {[
                      'product.created',
                      'product.updated',
                      'order.created',
                      'order.updated',
                      'customer.created'
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox id={event} />
                        <Label htmlFor={event} className="text-sm font-mono">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button>Save Webhook Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15%</div>
                <p className="text-xs text-muted-foreground">
                  Of quota used
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142ms</div>
                <p className="text-xs text-muted-foreground">
                  Response time
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage by Endpoint</CardTitle>
              <CardDescription>API usage breakdown by endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { endpoint: '/v1/products', calls: 423, percentage: 50 },
                  { endpoint: '/v1/orders', calls: 254, percentage: 30 },
                  { endpoint: '/v1/customers', calls: 170, percentage: 20 }
                ].map((stat) => (
                  <div key={stat.endpoint} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <code>{stat.endpoint}</code>
                      <span>{stat.calls} calls</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};