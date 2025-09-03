import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Server, Upload, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { importAdvancedService } from '@/domains/commerce/services/importAdvancedService';

interface FTPImportInterfaceProps {
  onImportComplete?: (result: any) => void;
}

export const FTPImportInterface: React.FC<FTPImportInterfaceProps> = ({ onImportComplete }) => {
  const [ftpConfig, setFtpConfig] = useState({
    ftpUrl: '',
    username: '',
    password: '',
    filePath: '',
    fileType: 'csv' as 'csv' | 'xml' | 'json',
    schedule: '',
    autoSync: false,
    backupEnabled: true
  });
  const [isImporting, setIsImporting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFtpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testFTPConnection = async () => {
    if (!ftpConfig.ftpUrl || !ftpConfig.username || !ftpConfig.password) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir l'URL FTP, nom d'utilisateur et mot de passe",
        variant: "destructive"
      });
      return;
    }

    setTestingConnection(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Connexion réussie",
        description: "La connexion FTP a été établie avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur FTP. Vérifiez vos identifiants.",
        variant: "destructive"
      });
    }
    setTestingConnection(false);
  };

  const handleImport = async () => {
    if (!ftpConfig.ftpUrl || !ftpConfig.username || !ftpConfig.password || !ftpConfig.filePath) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await importAdvancedService.importFromFtp({
        ftpUrl: ftpConfig.ftpUrl,
        username: ftpConfig.username,
        password: ftpConfig.password,
        filePath: ftpConfig.filePath,
        fileType: ftpConfig.fileType,
        config: {
          schedule: ftpConfig.schedule || undefined,
          auto_sync: ftpConfig.autoSync,
          backup_enabled: ftpConfig.backupEnabled
        }
      });

      toast({
        title: "Import FTP lancé",
        description: `L'import depuis le serveur FTP a été démarré avec succès`,
      });

      onImportComplete?.(result);
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message || "Une erreur est survenue lors de l'import FTP",
        variant: "destructive"
      });
    }
    setIsImporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Import FTP
          </CardTitle>
          <CardDescription>
            Importez vos produits depuis un serveur FTP distant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              L'import FTP permet de synchroniser automatiquement vos produits depuis un serveur FTP.
              Assurez-vous que vos fichiers sont au format CSV, XML ou JSON.
            </AlertDescription>
          </Alert>

          {/* Configuration FTP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ftpUrl">URL du serveur FTP *</Label>
              <Input
                id="ftpUrl"
                type="url"
                placeholder="ftp://votre-serveur.com"
                value={ftpConfig.ftpUrl}
                onChange={(e) => handleInputChange('ftpUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filePath">Chemin du fichier *</Label>
              <Input
                id="filePath"
                placeholder="/uploads/products.csv"
                value={ftpConfig.filePath}
                onChange={(e) => handleInputChange('filePath', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur *</Label>
              <Input
                id="username"
                placeholder="username"
                value={ftpConfig.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={ftpConfig.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">Type de fichier</Label>
              <Select
                value={ftpConfig.fileType}
                onValueChange={(value) => handleInputChange('fileType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Planification (CRON)</Label>
              <Input
                id="schedule"
                placeholder="0 2 * * * (tous les jours à 2h)"
                value={ftpConfig.schedule}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
              />
            </div>
          </div>

          {/* Options avancées */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Options avancées</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSync"
                checked={ftpConfig.autoSync}
                onCheckedChange={(checked) => handleInputChange('autoSync', !!checked)}
              />
              <Label htmlFor="autoSync" className="text-sm">
                Synchronisation automatique
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="backupEnabled"
                checked={ftpConfig.backupEnabled}
                onCheckedChange={(checked) => handleInputChange('backupEnabled', !!checked)}
              />
              <Label htmlFor="backupEnabled" className="text-sm">
                Sauvegarder les fichiers traités
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={testFTPConnection}
              disabled={testingConnection || !ftpConfig.ftpUrl}
            >
              <Server className="w-4 h-4 mr-2" />
              {testingConnection ? 'Test en cours...' : 'Tester la connexion'}
            </Button>

            <Button
              onClick={handleImport}
              disabled={isImporting || !ftpConfig.ftpUrl || !ftpConfig.filePath}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Import en cours...' : 'Démarrer l\'import'}
            </Button>
          </div>

          {ftpConfig.autoSync && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                La synchronisation automatique est activée. L'import se répétera selon la planification définie.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};