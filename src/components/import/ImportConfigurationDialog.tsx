import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, Database, Settings, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: string;
  onSave: (config: any) => void;
}

const getMethodConfig = (method: string) => {
  const configs = {
    csv: {
      title: 'CSV/Excel',
      icon: <FileText className="w-5 h-5 text-green-600" />,
      description: 'Import depuis fichiers CSV ou Excel',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'file_url', label: 'URL fichier CSV', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'encoding', label: 'Codage', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'quote', label: 'Apostrophe', type: 'select', options: ['Détecter automatiquement'], required: true },
        { name: 'separator', label: 'Séparateur', type: 'select', options: ['Détecter automatiquement'], required: true }
      ]
    },
    json: {
      title: 'JSON (URL)',
      icon: <Globe className="w-5 h-5 text-blue-600" />,
      description: 'Import depuis URL JSON avec JSONPath',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'ex : exemple site e-commerce', required: true },
        { name: 'json_url', label: 'URL du fichier JSON', placeholder: 'ex : https://www.exemple.fr/flux', required: true },
        { name: 'authentication', label: 'Authentification', type: 'select', options: ['Pas d\'authentification'], required: true },
        { name: 'json_format', label: 'Format JSON', type: 'select', options: ['Un objet JSON dans le fichier'], required: true }
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
        { name: 'encoding', label: 'Codage', type: 'select', options: ['Détecter automatiquement'], required: true }
      ]
    },
    google_sheets: {
      title: 'Google Sheets',
      icon: <Database className="w-5 h-5 text-green-600" />,
      description: 'Import depuis feuilles Google Sheets',
      fields: [
        { name: 'name', label: 'Nom', placeholder: 'Google sheets', required: true },
        { name: 'sheet_url', label: 'URL feuille de calcul Google', placeholder: 'ex : https://www.exemple.fr/flux', required: true }
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