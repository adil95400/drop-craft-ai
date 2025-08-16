import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImportMethodCard } from './ImportMethodCard';
import { ImportConfigurationDialog } from './ImportConfigurationDialog';
import { 
  FileText, 
  Globe, 
  Database, 
  Settings, 
  Cloud,
  Webhook,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

export const ImportMethodsGrid = () => {
  const [configDialog, setConfigDialog] = useState<{ open: boolean; method: string }>({
    open: false,
    method: ''
  });
  const [testingMethod, setTestingMethod] = useState<string | null>(null);

  const importMethods = [
    {
      id: 'csv',
      title: 'CSV/Excel',
      description: 'Import depuis fichiers CSV ou Excel',
      icon: <FileText className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true
    },
    {
      id: 'json',
      title: 'JSON (URL)',
      description: 'Import depuis URL JSON avec JSONPath',
      icon: <Globe className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true
    },
    {
      id: 'xml',
      title: 'XML',
      description: 'Import depuis flux XML avec XPath',
      icon: <FileText className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true
    },
    {
      id: 'google_sheets',
      title: 'Google Sheets',
      description: 'Import depuis feuilles Google Sheets',
      icon: <Database className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true
    },
    {
      id: 'ftp',
      title: 'FTP/SFTP/FTPS',
      description: 'Import depuis serveurs FTP/SFTP/FTPS',
      icon: <Database className="w-6 h-6" />,
      category: 'ftp',
      isActive: true,
      isConnected: true
    },
    {
      id: 'akeneo',
      title: 'Akeneo',
      description: 'Connexion avec Akeneo PIM',
      icon: <Settings className="w-6 h-6" />,
      category: 'integrations',
      isActive: true,
      isConnected: false
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce',
      description: 'Connexion avec WooCommerce',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'integrations',
      isActive: true,
      isConnected: false
    },
    {
      id: 'shopify',
      title: 'Shopify',
      description: 'Synchronisation avec Shopify',
      icon: <Cloud className="w-6 h-6" />,
      category: 'integrations',
      isActive: true,
      isConnected: false
    },
    {
      id: 'prestashop',
      title: 'PrestaShop',
      description: 'Import depuis PrestaShop',
      icon: <Webhook className="w-6 h-6" />,
      category: 'integrations',
      isActive: true,
      isConnected: false
    }
  ];

  const handleTest = async (methodId: string) => {
    setTestingMethod(methodId);
    
    try {
      // Simulate test with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const method = importMethods.find(m => m.id === methodId);
      if (method?.isConnected) {
        toast.success(`Test ${method.title} réussi ! Connexion établie.`);
      } else {
        toast.warning(`${method?.title} non configuré. Veuillez d'abord configurer la connexion.`);
      }
    } catch (error) {
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTestingMethod(null);
    }
  };

  const handleConfigure = (methodId: string) => {
    setConfigDialog({ open: true, method: methodId });
  };

  const handleSaveConfiguration = (config: any) => {
    console.log('Configuration saved:', config);
    toast.success('Configuration sauvegardée avec succès !');
  };

  const getMethodsByCategory = (category: string) => {
    return importMethods.filter(method => method.category === category);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configurez votre import avec des plugins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="files" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Feeds & Fichiers
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                E-commerce
              </TabsTrigger>
              <TabsTrigger value="ftp" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                FTP/SFTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getMethodsByCategory('files').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getMethodsByCategory('integrations').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ftp" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {getMethodsByCategory('ftp').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Configuration Files Section */}
          <Card className="mt-6 bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Ou configuration à l'aide de fiches techniques
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { type: 'XML', icon: '🗂️', color: 'bg-gray-100' },
                  { type: 'CSV', icon: '📊', color: 'bg-green-100' },
                  { type: 'Text', icon: '📄', color: 'bg-red-100' },
                  { type: 'JSON', icon: '📋', color: 'bg-blue-100' },
                  { type: 'Google sheets', icon: '📈', color: 'bg-green-100' }
                ].map((format) => (
                  <div
                    key={format.type}
                    className={`${format.color} p-4 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => toast.info(`Configuration ${format.type} en cours de développement`)}
                  >
                    <div className="text-2xl mb-2">{format.icon}</div>
                    <div className="text-sm font-medium">{format.type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <ImportConfigurationDialog
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog({ open, method: configDialog.method })}
        method={configDialog.method}
        onSave={handleSaveConfiguration}
      />
    </div>
  );
};