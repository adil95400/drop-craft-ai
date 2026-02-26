import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, Database, Settings, HelpCircle, Cloud, Webhook, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface ImportConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: string;
  onSave: (config: any) => void;
}

const getMethodConfig = (method: string) => {
  const configs = {
    // Files & Technical Formats
    csv: {
      title: 'CSV',
      icon: <FileText className="w-5 h-5 text-green-600" />,
      description: 'Import depuis fichiers CSV',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'file_url', label: 'URL fichier CSV', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'encoding', label: 'Codage', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'quote', label: 'Apostrophe', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'separator', label: 'Séparateur', type: 'select', options: ['Détecter automatiquement'], required: true }
      ]
    },
    xml: {
      title: 'XML',
      icon: <FileText className="w-5 h-5 text-gray-600" />,
      description: 'Import depuis flux XML avec XPath',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'xml_url', label: 'URL fichier XML', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'encoding', label: 'Codage', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'xpath', label: 'XPath Produits', placeholder: '//product', required: false }
      ]
    },
    json: {
      title: 'JSON',
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      description: 'Import depuis URL JSON avec JSONPath',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'json_url', label: 'URL du fichier JSON', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'json_format', label: 'Format JSON', type: 'select', options: ['Un objet JSON dans le fichier'], required: true },
        { name: 'json_path', label: 'JSONPath', placeholder: '$.products[*]', required: false }
      ]
    },
    text: {
      title: 'Text',
      icon: <FileText className="w-5 h-5 text-red-600" />,
      description: 'Import depuis fichiers texte',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'file_url', label: 'URL fichier TXT', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'encoding', label: 'Codage', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'quote', label: 'Apostrophe', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'separator', label: 'Séparateur', type: 'select', options: ['Détecter automatiquement'], required: true }
      ]
    },
    google_sheets: {
      title: 'Google Sheets',
      icon: <Database className="w-5 h-5 text-green-600" />,
      description: 'Import depuis feuilles Google Sheets',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Google sheets', required: true },
        { name: 'sheet_url', label: 'URL feuille de calcul Google', placeholder: 'ex : https://docs.google.com/spreadsheets/...', required: true },
        { name: 'sheet_name', label: 'Nom de la feuille', placeholder: 'Feuille1', required: false },
        { name: 'range', label: 'Plage de cellules', placeholder: 'A1:Z1000', required: false }
      ]
    },
    ftp: {
      title: 'FTP/SFTP/FTPS',
      icon: <Database className="w-5 h-5 text-blue-600" />,
      description: 'Import depuis serveurs FTP/SFTP/FTPS',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple serveur FTP', required: true },
        { name: 'server', label: 'Serveur', placeholder: 'ftp.exemple.com', required: true },
        { name: 'port', label: 'Port', placeholder: '21', type: 'number', required: true },
        { name: 'username', label: 'Nom d\'utilisateur', placeholder: 'utilisateur', required: true },
        { name: 'password', label: 'Mot de passe', type: 'password', required: true },
        { name: 'protocol', label: 'Protocole', type: 'select', options: ['FTP', 'SFTP', 'FTPS'], required: true },
        { name: 'path', label: 'Chemin fichier', placeholder: '/data/products.csv', required: true }
      ]
    },

    // E-commerce Platforms
    shopify: {
      title: 'Shopify',
      icon: <Cloud className="w-5 h-5 text-green-600" />,
      description: 'Synchronisation avec Shopify',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Shopify Store', required: true },
        { name: 'shop_domain', label: 'Domaine boutique', placeholder: 'monboutique.myshopify.com', required: true },
        { name: 'api_key', label: 'Clé API', placeholder: 'votre-cle-api', required: true },
        { name: 'api_secret', label: 'Secret API', type: 'password', required: true },
        { name: 'access_token', label: 'Token d\'accès', placeholder: '••••••••••••••••', required: true }
      ]
    },
    woocommerce: {
      title: 'WooCommerce',
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      description: 'Connexion avec WooCommerce',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'WooCommerce', required: true },
        { name: 'woo_url', label: 'WooCommerce URL', placeholder: 'ex : https://www.exempleboutique.fr', required: true },
        { name: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_23dja3k23dfasd3emq345fursehgny', required: true },
        { name: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_3kae83kft950dmekqckhuec482kxie', required: true },
        { name: 'version', label: 'Version', type: 'select', options: ['WooCommerce 3.5+'], required: true }
      ]
    },
    prestashop: {
      title: 'PrestaShop',
      icon: <Webhook className="w-5 h-5 text-red-600" />,
      description: 'Synchronisation avec PrestaShop',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'PrestaShop', required: true },
        { name: 'prestashop_url', label: 'URL PrestaShop', placeholder: 'https://monboutique.com', required: true },
        { name: 'api_key', label: 'Clé API', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', required: true },
        { name: 'language_id', label: 'ID Langue', placeholder: '1', type: 'number', required: true },
        { name: 'shop_id', label: 'ID Boutique', placeholder: '1', type: 'number', required: false }
      ]
    },
    magento: {
      title: 'Magento',
      icon: <ShoppingCart className="w-5 h-5 text-orange-600" />,
      description: 'Synchronisation avec Magento',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Magento Store', required: true },
        { name: 'magento_url', label: 'URL Magento', placeholder: 'https://monboutique.com', required: true },
        { name: 'api_token', label: 'Token API', placeholder: 'xxxxxxxxxx', required: true },
        { name: 'store_code', label: 'Code boutique', placeholder: 'default', required: false },
        { name: 'website_id', label: 'ID Website', placeholder: '1', type: 'number', required: false }
      ]
    },
    bigcommerce: {
      title: 'BigCommerce',
      icon: <ShoppingCart className="w-5 h-5 text-gray-800" />,
      description: 'Synchronisation avec BigCommerce',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'BigCommerce Store', required: true },
        { name: 'store_hash', label: 'Store Hash', placeholder: 'abc123def', required: true },
        { name: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxxxx', required: true },
        { name: 'access_token', label: 'Access Token', type: 'password', required: true },
        { name: 'api_version', label: 'Version API', type: 'select', options: ['v3', 'v2'], required: true }
      ]
    },

    // Specialty Platforms
    akeneo: {
      title: 'Akeneo',
      icon: <Settings className="w-5 h-5 text-purple-600" />,
      description: 'Connexion avec Akeneo PIM',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Akeneo', required: true },
        { name: 'akeneo_url', label: 'Akeneo URL', placeholder: 'ex : https://www.exempleboutique.fr', required: true },
        { name: 'client_id', label: 'Client ID', placeholder: '5_2kgafeefaefdge9ggwog8ok408skok', required: true },
        { name: 'client_secret', label: 'Client secret', placeholder: '2dgkqlrysf(3456gdckkOsO8gcogkniyt', required: true },
        { name: 'username', label: 'Nom d\'utilisateur', placeholder: 'ex : pierremartin', required: true },
        { name: 'password', label: 'Mot de passe', type: 'password', required: true },
        { name: 'domain', label: 'Domaine TwicPics', placeholder: 'par exemple un-nom-de-domaine.twic.pics', required: false }
      ]
    },
    lightspeed: {
      title: 'Lightspeed',
      icon: <Settings className="w-5 h-5 text-red-600" />,
      description: 'Synchronisation avec Lightspeed',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Lightspeed', required: true },
        { name: 'api_key', label: 'Clé API', placeholder: 'votre-cle-api', required: true },
        { name: 'api_secret', label: 'Secret API', type: 'password', required: true },
        { name: 'account_id', label: 'ID Compte', placeholder: '123456', required: true },
        { name: 'cluster', label: 'Cluster', type: 'select', options: ['eu1', 'us1'], required: true }
      ]
    },
    squarespace: {
      title: 'Squarespace',
      icon: <Cloud className="w-5 h-5 text-gray-800" />,
      description: 'Synchronisation avec Squarespace',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Squarespace', required: true },
        { name: 'site_id', label: 'Site ID', placeholder: 'xxxxxxxxxx', required: true },
        { name: 'api_key', label: 'Clé API', placeholder: 'votre-cle-api', required: true },
        { name: 'api_version', label: 'Version API', type: 'select', options: ['1.0'], required: true }
      ]
    }
  };
  
  return configs[method as keyof typeof configs] || configs.csv;
};

export const ImportConfigurationDialog = ({ 
  open, 
  onOpenChange, 
  method, 
  onSave 
}: ImportConfigurationDialogProps) => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const methodConfig = getMethodConfig(method);

  const handleFieldChange = (name: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const requiredFields = methodConfig.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !config[field.name]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Veuillez remplir tous les champs obligatoires`);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSave({ method, config });
      toast.success(`Configuration ${methodConfig.title} sauvegardée avec succès !`);
      onOpenChange(false);
      setConfig({});
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (method === 'akeneo' || method === 'woocommerce') {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection test
        toast.success(`Connexion ${methodConfig.title} établie avec succès !`);
        onOpenChange(false);
      } catch (error) {
        toast.error('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStartImport = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate import start
      toast.success(`Import ${methodConfig.title} démarré avec succès !`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors du démarrage de l\'import');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {methodConfig.icon}
            <div>
              <div className="flex items-center gap-2">
                <span>{method === 'akeneo' || method === 'woocommerce' ? 'Connecter avec' : 'Importer depuis'}</span>
                <Badge variant="outline">{methodConfig.title}</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {methodConfig.description}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="p-6 space-y-4">
            {methodConfig.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'select' ? (
                  <Select
                    value={config[field.name] || ''}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={config[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}

            {method === 'woocommerce' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Aide</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Pour obtenir les clés Consumer, allez dans WooCommerce → Réglages → API → Créer une clé.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          
          {method === 'akeneo' || method === 'woocommerce' ? (
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? 'Connexion...' : `Se connecter avec ${methodConfig.title}`}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isLoading}>
                Sauvegarder
              </Button>
              <Button onClick={handleStartImport} disabled={isLoading}>
                {isLoading ? 'Démarrage...' : 'Démarrer l\'import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};