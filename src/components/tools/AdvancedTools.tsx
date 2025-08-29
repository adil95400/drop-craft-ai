import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, Upload, FileText, Database, Zap, Shield, 
  BarChart3, Globe, Smartphone, Search, Settings,
  PlayCircle, PauseCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAdvancedTools } from '@/hooks/useAdvancedTools';

export function AdvancedTools() {
  const { 
    exportData, 
    importData, 
    bulkOperations, 
    performanceMetrics, 
    securityStatus,
    loading 
  } = useAdvancedTools();
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState('products');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Advanced Tools</h2>
        <p className="text-muted-foreground">Professional tools for managing your dropshipping business.</p>
      </div>

      <Tabs defaultValue="import-export" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="bulk-ops">Bulk Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="import-export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>Export your business data in various formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Products CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <Database className="mr-2 h-4 w-4" />
                    Orders JSON
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    SEO Report
                  </Button>
                </div>
                <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Custom Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Custom Data Export</DialogTitle>
                      <DialogDescription>Configure your data export settings</DialogDescription>
                    </DialogHeader>
                    <ExportForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Import Data
                </CardTitle>
                <CardDescription>Import data from various sources and formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    CSV Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    URL Scraping
                  </Button>
                  <Button variant="outline" size="sm">
                    <Database className="mr-2 h-4 w-4" />
                    API Sync
                  </Button>
                  <Button variant="outline" size="sm">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Mobile App
                  </Button>
                </div>
                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Advanced Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Advanced Data Import</DialogTitle>
                      <DialogDescription>Configure your data import settings</DialogDescription>
                    </DialogHeader>
                    <ImportForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-ops" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Updates</CardTitle>
                <CardDescription>Bulk update product prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queue: 150 products</span>
                    <Badge variant="outline">Ready</Badge>
                  </div>
                  <Progress value={0} className="h-2" />
                  <Button size="sm" className="w-full">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Optimization</CardTitle>
                <CardDescription>Bulk optimize SEO metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queue: 89 products</span>
                    <Badge variant="secondary">Processing</Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                  <Button size="sm" variant="outline" className="w-full">
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Sync</CardTitle>
                <CardDescription>Sync stock levels across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last sync: 2h ago</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <Button size="sm" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125ms</div>
                <p className="text-xs text-muted-foreground">-15ms from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Queries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+20% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.1%</div>
                <p className="text-xs text-muted-foreground">-0.05% from yesterday</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor your system performance and health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['Shopify', 'WooCommerce', 'Amazon', 'eBay', 'Etsy', 'Facebook Shop'].map((platform) => (
              <Card key={platform}>
                <CardHeader>
                  <CardTitle className="text-lg">{platform}</CardTitle>
                  <CardDescription>Sync products and orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={platform === 'Shopify' ? 'default' : 'secondary'}>
                      {platform === 'Shopify' ? 'Connected' : 'Disconnected'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {platform === 'Shopify' ? 'Settings' : 'Connect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Status
                </CardTitle>
                <CardDescription>Monitor your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Two-Factor Authentication</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Key Rotation</span>
                    <Badge variant="secondary">30 days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Security Scan</span>
                    <Badge variant="outline">2h ago</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL Certificate</span>
                    <Badge variant="default">Valid</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent security-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'API key accessed from new location',
                    'Bulk price update completed',
                    'New integration connected',
                    'Password changed successfully'
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {activity}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="export-type">Data Type</Label>
        <Select defaultValue="products">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="export-format">Format</Label>
        <Select defaultValue="csv">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="xlsx">Excel</SelectItem>
            <SelectItem value="pdf">PDF Report</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Export Data
      </Button>
    </div>
  );
}

function ImportForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="import-source">Source</Label>
        <Select defaultValue="file">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="file">File Upload</SelectItem>
            <SelectItem value="url">URL/Scraping</SelectItem>
            <SelectItem value="api">API Integration</SelectItem>
            <SelectItem value="ftp">FTP/SFTP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload File</Label>
        <Input type="file" accept=".csv,.json,.xlsx" />
      </div>
      <Button className="w-full">
        <Upload className="mr-2 h-4 w-4" />
        Import Data
      </Button>
    </div>
  );
}