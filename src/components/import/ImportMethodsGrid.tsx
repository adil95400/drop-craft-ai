import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImportMethodCard } from './ImportMethodCard';
import { ImportConfigurationDialog } from './ImportConfigurationDialog';
import { logAction } from '@/utils/consoleCleanup';
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
    // Files & Feeds
    {
      id: 'csv',
      title: 'CSV',
      description: 'Import depuis fichiers CSV',
      icon: <FileText className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true,
      logo: '📊'
    },
    {
      id: 'xml',
      title: 'XML',
      description: 'Import depuis flux XML avec XPath',
      icon: <FileText className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true,
      logo: '🗂️'
    },
    {
      id: 'json',
      title: 'JSON',
      description: 'Import depuis URL JSON avec JSONPath',
      icon: <Globe className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true,
      logo: '📋'
    },
    {
      id: 'text',
      title: 'Text',
      description: 'Import depuis fichiers texte',
      icon: <FileText className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true,
      logo: '📄'
    },
    {
      id: 'google_sheets',
      title: 'Google Sheets',
      description: 'Import depuis feuilles Google Sheets',
      icon: <Database className="w-6 h-6" />,
      category: 'files',
      isActive: true,
      isConnected: true,
      logo: '📈'
    },
    {
      id: 'ftp',
      title: 'FTP/SFTP/FTPS',
      description: 'Import depuis serveurs FTP/SFTP/FTPS',
      icon: <Database className="w-6 h-6" />,
      category: 'ftp',
      isActive: true,
      isConnected: true,
      logo: '📡'
    },

    // E-commerce Platforms
    {
      id: 'afosto',
      title: 'Afosto',
      description: 'Synchronisation avec Afosto',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🟦'
    },
    {
      id: 'bigcommerce',
      title: 'BigCommerce',
      description: 'Synchronisation avec BigCommerce',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '⚫'
    },
    {
      id: 'ccv_shop',
      title: 'CCV Shop',
      description: 'Synchronisation avec CCV Shop',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🔵'
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce',
      description: 'Connexion avec WooCommerce',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🟣'
    },
    {
      id: 'shopify',
      title: 'Shopify',
      description: 'Synchronisation avec Shopify',
      icon: <Cloud className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🟢'
    },
    {
      id: 'prestashop',
      title: 'PrestaShop',
      description: 'Import depuis PrestaShop',
      icon: <Webhook className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🔴'
    },
    {
      id: 'magento',
      title: 'Magento',
      description: 'Synchronisation avec Magento',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🟠'
    },
    {
      id: 'shopware_5',
      title: 'Shopware 5',
      description: 'Synchronisation avec Shopware 5',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🔷'
    },
    {
      id: 'shopware_6',
      title: 'Shopware 6',
      description: 'Synchronisation avec Shopware 6',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'ecommerce',
      isActive: true,
      isConnected: false,
      logo: '🔶'
    },

    // Specialty Platforms
    {
      id: 'lightspeed',
      title: 'Lightspeed',
      description: 'Synchronisation avec Lightspeed',
      icon: <Settings className="w-6 h-6" />,
      category: 'specialty',
      isActive: true,
      isConnected: false,
      logo: '⚡'
    },
    {
      id: 'ecwid',
      title: 'Ecwid by Lightspeed',
      description: 'Synchronisation avec Ecwid',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'specialty',
      isActive: true,
      isConnected: false,
      logo: '🛒'
    },
    {
      id: 'squarespace',
      title: 'Squarespace',
      description: 'Synchronisation avec Squarespace',
      icon: <Cloud className="w-6 h-6" />,
      category: 'specialty',
      isActive: true,
      isConnected: false,
      logo: '⬛'
    },
    {
      id: 'akeneo',
      title: 'Akeneo',
      description: 'Connexion avec Akeneo PIM',
      icon: <Settings className="w-6 h-6" />,
      category: 'specialty',
      isActive: true,
      isConnected: false,
      logo: '🟣'
    },

    // Regional/Specialized
    {
      id: 'mijnwebwinkel',
      title: 'Mijnwebwinkel',
      description: 'Synchronisation avec Mijnwebwinkel',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'regional',
      isActive: true,
      isConnected: false,
      logo: '🟢'
    },
    {
      id: 'crawler',
      title: 'Crawler',
      description: 'Extraction automatique de données',
      icon: <Settings className="w-6 h-6" />,
      category: 'regional',
      isActive: true,
      isConnected: false,
      logo: '🌸'
    },
    {
      id: 'itsperfect',
      title: 'ItsPerfect',
      description: 'Synchronisation avec ItsPerfect',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'regional',
      isActive: true,
      isConnected: false,
      logo: '📊'
    },
    {
      id: 'oxid',
      title: 'Oxid eSales',
      description: 'Synchronisation avec Oxid eSales',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'regional',
      isActive: true,
      isConnected: false,
      logo: '🔺'
    },
    {
      id: 'shoptrader',
      title: 'Shoptrader',
      description: 'Synchronisation avec Shoptrader',
      icon: <ShoppingCart className="w-6 h-6" />,
      category: 'regional',
      isActive: true,
      isConnected: false,
      logo: '🔵'
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
    logAction('Configuration saved', config);
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Feeds & Fichiers
              </TabsTrigger>
              <TabsTrigger value="ecommerce" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                E-commerce
              </TabsTrigger>
              <TabsTrigger value="specialty" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Spécialisés
              </TabsTrigger>
              <TabsTrigger value="regional" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Régionaux
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
                    logo={method.logo}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ecommerce" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getMethodsByCategory('ecommerce').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    logo={method.logo}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="specialty" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getMethodsByCategory('specialty').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    logo={method.logo}
                    isActive={method.isActive}
                    isConnected={method.isConnected}
                    onTest={() => handleTest(method.id)}
                    onConfigure={() => handleConfigure(method.id)}
                    testLoading={testingMethod === method.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="regional" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getMethodsByCategory('regional').map((method) => (
                  <ImportMethodCard
                    key={method.id}
                    id={method.id}
                    title={method.title}
                    description={method.description}
                    icon={method.icon}
                    logo={method.logo}
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
                    logo={method.logo}
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
                  { type: 'XML', icon: '🗂️', color: 'bg-gray-100', accept: '.xml' },
                  { type: 'CSV', icon: '📊', color: 'bg-green-100', accept: '.csv' },
                  { type: 'Text', icon: '📄', color: 'bg-red-100', accept: '.txt' },
                  { type: 'JSON', icon: '📋', color: 'bg-blue-100', accept: '.json' },
                  { type: 'Google sheets', icon: '📈', color: 'bg-green-100', accept: '.xlsx,.xls' }
                ].map((format) => (
                  <label
                    key={format.type}
                    className={`${format.color} p-4 rounded-lg text-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 duration-300`}
                  >
                    <input
                      type="file"
                      accept={format.accept}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.success(`Fichier ${format.type} sélectionné : ${file.name}`, {
                            description: "Import du fichier en cours..."
                          });
                          // TODO: Implement actual file import logic
                        }
                      }}
                    />
                    <div className="text-2xl mb-2">{format.icon}</div>
                    <div className="text-sm font-medium">{format.type}</div>
                  </label>
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