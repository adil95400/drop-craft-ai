import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImport } from '@/hooks/useImport';
import { Upload, Link as LinkIcon, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function Import() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { importFromUrl, importFromCsv } = useImport();

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      await importFromUrl(url);
      toast.success('Product imported successfully!');
      setUrl('');
    } catch (error) {
      toast.error('Failed to import product');
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      await importFromCsv(file);
      toast.success(`Successfully imported products from ${file.name}`);
    } catch (error) {
      toast.error('Failed to import CSV file');
      console.error('CSV import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const importMethods = [
    {
      icon: LinkIcon,
      title: 'URL Import',
      description: 'Import products directly from supplier URLs',
      action: 'url'
    },
    {
      icon: FileText,
      title: 'CSV Upload',
      description: 'Upload a CSV file with product data',
      action: 'csv'
    },
    {
      icon: Database,
      title: 'API Integration',
      description: 'Connect with supplier APIs for real-time sync',
      action: 'api'
    },
    {
      icon: Upload,
      title: 'Bulk Import',
      description: 'Import large quantities of products',
      action: 'bulk'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import Products</h1>
        <p className="text-muted-foreground">
          Import products from various sources to build your catalog
        </p>
      </div>

      {/* Quick Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              URL Import
            </CardTitle>
            <CardDescription>
              Import a product directly from a supplier URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter product URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleUrlImport} disabled={loading}>
                Import
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: AliExpress, BigBuy, and other supplier URLs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Upload
            </CardTitle>
            <CardDescription>
              Upload a CSV file with your product data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                CSV format: title, description, price, sku, images, etc.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Methods */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Import Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {importMethods.map((method, index) => (
            <Card key={index} className="hover:shadow-card transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <method.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">{method.title}</CardTitle>
                <CardDescription className="text-sm">
                  {method.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>
            View your recent import activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent imports. Start importing products to see them here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}