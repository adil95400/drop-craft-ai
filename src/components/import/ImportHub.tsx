import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Sparkles, 
  ShoppingCart, 
  FileSpreadsheet, 
  Settings, 
  Globe,
  Database,
  ArrowRight,
  Zap
} from 'lucide-react';

interface ImportHubProps {
  onViewChange: (view: string) => void;
  onCategorySelect: (category: string) => void;
}

export const ImportHub = ({ onViewChange, onCategorySelect }: ImportHubProps) => {
  const categories = [
    {
      id: 'ecommerce',
      title: 'E-commerce',
      description: 'WooCommerce, Shopify, PrestaShop, Magento...',
      icon: ShoppingCart,
      count: 8,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'files',
      title: 'Fichiers & Feeds', 
      description: 'CSV, XML, JSON, Google Sheets...',
      icon: FileSpreadsheet,
      count: 5,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'specialty',
      title: 'Spécialisés',
      description: 'Lightspeed, Ecwid, Squarespace...',
      icon: Settings,
      count: 4,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'regional',
      title: 'Régionaux',
      description: 'Mijnwebwinkel, Crawler, ItsPerfect...',
      icon: Globe,
      count: 4,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'ftp',
      title: 'FTP/SFTP',
      description: 'Serveurs FTP, SFTP, FTPS',
      icon: Database,
      count: 1,
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Card 
          key={category.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => onCategorySelect(category.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={`p-3 ${category.bgColor} rounded-full`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <Badge>{category.count} méthodes</Badge>
            </div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {category.description}
            </p>
            <Button size="sm" className="w-full" variant="outline">
              Voir les méthodes <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};