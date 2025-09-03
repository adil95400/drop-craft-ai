import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Play, Server, Shield, Clock, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const FTPImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    connection: {
      host: '',
      port: 21,
      username: '',
      password: '',
      protocol: 'ftp' as 'ftp' | 'sftp' | 'ftps',
      passive_mode: true,
      timeout: 30
    },
    paths: {
      remote_directory: '/',
      file_pattern: '*.csv',
      archive_directory: '/archive/',
      error_directory: '/errors/'
    },
    processing: {
      auto_download: true,
      auto_process: true,
      delete_after_processing: false,
      backup_files: true,
      file_format: 'csv' as 'csv' | 'xml' | 'json' | 'xlsx',
      encoding: 'utf-8' as 'utf-8' | 'iso-8859-1' | 'windows-1252',
      delimiter: ',' as ',' | ';' | '\t' | '|',
      has_header: true
    },
    scheduling: {
      enabled: true,
      frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
      time: '02:00',
      retry_attempts: 3,
      retry_delay: 300
    },
    notifications: {
      success_email: '',
      error_email: '',
      webhook_url: ''
    }
  });

  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres FTP/SFTP ont été enregistrés.",
    });
  };

  const handleTestConnection = async () => {
    if (!config.connection.host) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez saisir au moins l'adresse du serveur.",
        variant: "destructive",
      });
      return;
    }

    setTestConnection('testing');
    
    // Simuler le test de connexion
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% de chance de succès
      setTestConnection(success ? 'success' : 'error');
      
      toast({
        title: success ? "Connexion réussie" : "Échec de connexion",
        description: success 
          ? "La connexion au serveur FTP/SFTP fonctionne correctement."
          : "Impossible de se connecter au serveur. Vérifiez les paramètres.",
        variant: success ? "default" : "destructive",
      });

      setTimeout(() => setTestConnection('idle'), 3000);
    }, 2000);
  };

  const handleStartImport = () => {
    if (!config.connection.host) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez configurer la connexion FTP/SFTP.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Import FTP démarré",
      description: "L'import depuis le serveur FTP a été lancé.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuration Import FTP/SFTP</h1>
          <p className="text-muted-foreground">Connexion automatique aux serveurs FTP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration de connexion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Configuration de connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">Serveur</Label>
                  <Input
                    id="host"
                    placeholder="ftp.exemple.com"
                    value={config.connection.host}
                    onChange={(e) => setConfig({
                      ...config, 
                      connection: {...config.connection, host: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.connection.port}
                    onChange={(e) => setConfig({
                      ...config, 
                      connection: {...config.connection, port: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={config.connection.username}
                    onChange={(e) => setConfig({
                      ...config, 
                      connection: {...config.connection, username: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.connection.password}
                    onChange={(e) => setConfig({
                      ...config, 
                      connection: {...config.connection, password: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="protocol">Protocole</Label>
                  <Select value={config.connection.protocol} onValueChange={(value) => setConfig({
                    ...config, 
                    connection: {...config.connection, protocol: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ftp">FTP</SelectItem>
                      <SelectItem value="sftp">SFTP (SSH)</SelectItem>
                      <SelectItem value="ftps">FTPS (SSL/TLS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (secondes)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.connection.timeout}
                    onChange={(e) => setConfig({
                      ...config, 
                      connection: {...config.connection, timeout: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="passive_mode">Mode passif</Label>
                <Switch
                  id="passive_mode"
                  checked={config.connection.passive_mode}
                  onCheckedChange={(checked) => setConfig({
                    ...config, 
                    connection: {...config.connection, passive_mode: checked}
                  })}
                />
              </div>

              <Button 
                onClick={handleTestConnection} 
                variant="outline" 
                disabled={testConnection === 'testing'}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                {testConnection === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
              </Button>

              {testConnection === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">✓ Connexion réussie !</p>
                </div>
              )}

              {testConnection === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">✗ Échec de connexion</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration des chemins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Configuration des chemins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="remote_directory">Répertoire distant</Label>
                <Input
                  id="remote_directory"
                  placeholder="/uploads/products/"
                  value={config.paths.remote_directory}
                  onChange={(e) => setConfig({
                    ...config, 
                    paths: {...config.paths, remote_directory: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="file_pattern">Motif de fichiers</Label>
                <Input
                  id="file_pattern"
                  placeholder="products_*.csv"
                  value={config.paths.file_pattern}
                  onChange={(e) => setConfig({
                    ...config, 
                    paths: {...config.paths, file_pattern: e.target.value}
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="archive_directory">Répertoire d'archive</Label>
                  <Input
                    id="archive_directory"
                    placeholder="/archive/"
                    value={config.paths.archive_directory}
                    onChange={(e) => setConfig({
                      ...config, 
                      paths: {...config.paths, archive_directory: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="error_directory">Répertoire d'erreurs</Label>
                  <Input
                    id="error_directory"
                    placeholder="/errors/"
                    value={config.paths.error_directory}
                    onChange={(e) => setConfig({
                      ...config, 
                      paths: {...config.paths, error_directory: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration de traitement */}
          <Card>
            <CardHeader>
              <CardTitle>Options de traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_download">Téléchargement automatique</Label>
                  <Switch
                    id="auto_download"
                    checked={config.processing.auto_download}
                    onCheckedChange={(checked) => setConfig({
                      ...config, 
                      processing: {...config.processing, auto_download: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_process">Traitement automatique</Label>
                  <Switch
                    id="auto_process"
                    checked={config.processing.auto_process}
                    onCheckedChange={(checked) => setConfig({
                      ...config, 
                      processing: {...config.processing, auto_process: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delete_after_processing">Supprimer après traitement</Label>
                  <Switch
                    id="delete_after_processing"
                    checked={config.processing.delete_after_processing}
                    onCheckedChange={(checked) => setConfig({
                      ...config, 
                      processing: {...config.processing, delete_after_processing: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="backup_files">Sauvegarder les fichiers</Label>
                  <Switch
                    id="backup_files"
                    checked={config.processing.backup_files}
                    onCheckedChange={(checked) => setConfig({
                      ...config, 
                      processing: {...config.processing, backup_files: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file_format">Format de fichier</Label>
                  <Select value={config.processing.file_format} onValueChange={(value) => setConfig({
                    ...config, 
                    processing: {...config.processing, file_format: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="encoding">Encodage</Label>
                  <Select value={config.processing.encoding} onValueChange={(value) => setConfig({
                    ...config, 
                    processing: {...config.processing, encoding: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utf-8">UTF-8</SelectItem>
                      <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                      <SelectItem value="windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delimiter">Délimiteur CSV</Label>
                  <Select value={config.processing.delimiter} onValueChange={(value) => setConfig({
                    ...config, 
                    processing: {...config.processing, delimiter: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                      <SelectItem value=";">Point-virgule (;)</SelectItem>
                      <SelectItem value="\t">Tabulation</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="has_header">En-têtes présents</Label>
                  <Switch
                    id="has_header"
                    checked={config.processing.has_header}
                    onCheckedChange={(checked) => setConfig({
                      ...config, 
                      processing: {...config.processing, has_header: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Planification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scheduling_enabled">Planification activée</Label>
                <Switch
                  id="scheduling_enabled"
                  checked={config.scheduling.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config, 
                    scheduling: {...config.scheduling, enabled: checked}
                  })}
                />
              </div>

              {config.scheduling.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Select value={config.scheduling.frequency} onValueChange={(value) => setConfig({
                        ...config, 
                        scheduling: {...config.scheduling, frequency: value as any}
                      })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="time">Heure d'exécution</Label>
                      <Input
                        id="time"
                        type="time"
                        value={config.scheduling.time}
                        onChange={(e) => setConfig({
                          ...config, 
                          scheduling: {...config.scheduling, time: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="retry_attempts">Tentatives de reprise</Label>
                      <Input
                        id="retry_attempts"
                        type="number"
                        min="0"
                        max="10"
                        value={config.scheduling.retry_attempts}
                        onChange={(e) => setConfig({
                          ...config, 
                          scheduling: {...config.scheduling, retry_attempts: parseInt(e.target.value)}
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="retry_delay">Délai entre reprises (sec)</Label>
                      <Input
                        id="retry_delay"
                        type="number"
                        value={config.scheduling.retry_delay}
                        onChange={(e) => setConfig({
                          ...config, 
                          scheduling: {...config.scheduling, retry_delay: parseInt(e.target.value)}
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="success_email">Email de succès</Label>
                <Input
                  id="success_email"
                  type="email"
                  placeholder="admin@exemple.com"
                  value={config.notifications.success_email}
                  onChange={(e) => setConfig({
                    ...config, 
                    notifications: {...config.notifications, success_email: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="error_email">Email d'erreur</Label>
                <Input
                  id="error_email"
                  type="email"
                  placeholder="admin@exemple.com"
                  value={config.notifications.error_email}
                  onChange={(e) => setConfig({
                    ...config, 
                    notifications: {...config.notifications, error_email: e.target.value}
                  })}
                />
              </div>

              <div>
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://votre-site.com/webhook"
                  value={config.notifications.webhook_url}
                  onChange={(e) => setConfig({
                    ...config, 
                    notifications: {...config.notifications, webhook_url: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              
              <Button onClick={handleStartImport} variant="default" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Démarrer l'import
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut de connexion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocole:</span>
                  <Badge variant="outline">{config.connection.protocol.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port:</span>
                  <span>{config.connection.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode passif:</span>
                  <Badge variant={config.connection.passive_mode ? "default" : "secondary"}>
                    {config.connection.passive_mode ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planification:</span>
                  <Badge variant={config.scheduling.enabled ? "default" : "secondary"}>
                    {config.scheduling.enabled ? config.scheduling.frequency : "Désactivée"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FTPImportConfig;