import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Link2, Database, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportSource {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'file' | 'url' | 'supplier' | 'api' | 'shopify';
}

interface UnifiedImportSourceProps {
  onSelectSource: (sourceType: string) => void;
  selectedSource?: string;
}

export function UnifiedImportSource({ onSelectSource, selectedSource }: UnifiedImportSourceProps) {
  const sources: ImportSource[] = [
    {
      id: 'csv',
      name: 'CSV/Excel File',
      description: 'Upload CSV or Excel file from your computer',
      icon: <Upload className="h-6 w-6" />,
      type: 'file'
    },
    {
      id: 'url',
      name: 'Product URL',
      description: 'Import from AliExpress, Amazon, or other supplier URLs',
      icon: <Link2 className="h-6 w-6" />,
      type: 'url'
    },
    {
      id: 'supplier',
      name: 'Connected Suppliers',
      description: 'Import from your connected suppliers (BigBuy, CJ, etc.)',
      icon: <Package className="h-6 w-6" />,
      type: 'supplier'
    },
    {
      id: 'api',
      name: 'API/Feed',
      description: 'Import from XML/JSON API or product feed',
      icon: <Database className="h-6 w-6" />,
      type: 'api'
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      description: 'Sync products from your Shopify store',
      icon: <FileText className="h-6 w-6" />,
      type: 'shopify'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Select Import Source</h2>
        <p className="text-muted-foreground mt-2">
          Choose where you want to import your products from
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <Card
            key={source.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
              selectedSource === source.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelectSource(source.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {source.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{source.description}</CardDescription>
              <Button 
                className="w-full mt-4" 
                variant={selectedSource === source.id ? "default" : "outline"}
              >
                {selectedSource === source.id ? 'Selected' : 'Select'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
