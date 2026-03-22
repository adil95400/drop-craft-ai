import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  FileSpreadsheet, 
  Settings, 
  Globe,
  Database,
  ArrowRight,
  History,
  Settings2,
  Upload
} from 'lucide-react';

interface ImportHubProps {
  onViewChange: (view: string) => void;
  onCategorySelect: (category: string) => void;
}

export const ImportHub = ({ onViewChange, onCategorySelect }: ImportHubProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');

  const categories = [
    { id: 'ecommerce', title: 'E-commerce', description: 'WooCommerce, Shopify, PrestaShop, Magento...', icon: ShoppingCart, count: 8, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { id: 'files', title: tCommon('filesAndFeeds', 'Files & Feeds'), description: 'CSV, XML, JSON, Google Sheets...', icon: FileSpreadsheet, count: 5, color: 'text-info', bgColor: 'bg-info/10' },
    { id: 'specialty', title: tCommon('specialized', 'Specialized'), description: 'Lightspeed, Ecwid, Squarespace...', icon: Settings, count: 4, color: 'text-success', bgColor: 'bg-success/10' },
    { id: 'regional', title: tCommon('regional', 'Regional'), description: 'Mijnwebwinkel, Crawler, ItsPerfect...', icon: Globe, count: 4, color: 'text-warning', bgColor: 'bg-orange-100' },
    { id: 'ftp', title: 'FTP/SFTP', description: tCommon('ftpServers', 'FTP, SFTP, FTPS servers'), icon: Database, count: 1, color: 'text-indigo-600', bgColor: 'bg-indigo-100' }
  ];

  return (
    <ChannablePageWrapper
      title={t('hubImport.title')}
      description={t('hubImport.description')}
      heroImage="import"
      badge={{ label: 'Import', icon: Upload }}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate('/products/import/manage/history')} className="flex items-center gap-2">
            <History className="h-4 w-4" />{tCommon('history', 'History')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/import/config')} className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />{tCommon('configuration', 'Configuration')}
          </Button>
        </>
      }
    >
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
                <Badge>{category.count} {tCommon('methods', 'methods')}</Badge>
              </div>
              <CardTitle className="text-lg">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              <Button size="sm" className="w-full" variant="outline">
                {tCommon('viewMethods', 'View methods')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  );
};
