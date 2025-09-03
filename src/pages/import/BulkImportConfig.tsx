import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, Play, Upload, FolderOpen, FileText, Download, Archive, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

const BulkImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    processing: {
      batch_size: 100,
      max_files: 50,
      parallel_processing: true,
      validate_data: true,
      auto_detect_encoding: true,
      skip_duplicates: true,
      merge_strategy: 'update' as 'update' | 'replace' | 'skip',
      file_pattern: '*.{csv,xml,json,xlsx}',
      timeout_per_file: 300
    },
    formats: {
      csv: {
        enabled: true,
        delimiter: ',' as ',' | ';' | '\t' | '|',
        encoding: 'utf-8' as 'utf-8' | 'iso-8859-1' | 'windows-1252',
        has_header: true,
        quote_char: '"',
        escape_char: '\\'
      },
      xml: {
        enabled: true,
        root_element: 'products',
        product_element: 'product',
        validate_schema: true,
        namespace_aware: false
      },
      json: {
        enabled: true,
        array_path: 'products',
        validate_json: true,
        flatten_nested: false
      },
      xlsx: {
        enabled: true,
        sheet_name: 'Products',
        start_row: 1,
        has_header: true
      }
    },
    archive: {
      create_archive: true,
      archive_processed: true,
      delete_after_archive: false,
      compression_level: 6
    },
    monitoring: {
      progress_updates: true,
      detailed_logs: true,
      email_report: true,
      webhook_notifications: false,
      webhook_url: ''
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['csv', 'xml', 'json', 'xlsx', 'zip'].includes(extension || '');
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast({
        title: "Fichiers non supportés",
        description: "Seuls les fichiers CSV, XML, JSON, XLSX et ZIP sont acceptés.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip']
    },
    multiple: true,
    maxFiles: config.processing.max_files
  });

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleStartBulkImport = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez télécharger au moins un fichier pour démarrer l'import en masse.",
        variant: "destructive"
      });
      return;
    }

    setProcessingStatus('processing');
    setUploadProgress(0);

    // Simuler le traitement en masse
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const progress = ((i + 1) / uploadedFiles.length) * 100;
      
      // Simuler le traitement de chaque fichier
      await new Promise(resolve => {
        setTimeout(() => {
          setUploadProgress(progress);
          resolve(void 0);
        }, 1000 + Math.random() * 2000);
      });

      toast({
        title: `Fichier traité`,
        description: `${file.name} a été importé avec succès (${Math.floor(Math.random() * 500) + 50} produits)`,
      });
    }

    setProcessingStatus('completed');
    toast({
      title: "Import en masse terminé",
      description: `${uploadedFiles.length} fichiers ont été traités avec succès.`,
    });
  };

  const handleSaveConfig = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres d'import en masse ont été enregistrés.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuration Import en Masse</h1>
          <p className="text-muted-foreground">Traitez plusieurs fichiers simultanément</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Zone de téléchargement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Téléchargement de fichiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg">Déposez les fichiers ici...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Glissez-déposez vos fichiers ici</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ou cliquez pour sélectionner des fichiers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formats supportés: CSV, XML, JSON, XLSX, ZIP (max {config.processing.max_files} fichiers)
                    </p>
                  </div>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Fichiers téléchargés ({uploadedFiles.length})</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {processingStatus === 'processing' && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Traitement en cours...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration de traitement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Configuration de traitement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batch_size">Taille des lots</Label>
                  <Input
                    id="batch_size"
                    type="number"
                    min="10"
                    max="1000"
                    value={config.processing.batch_size}
                    onChange={(e) => setConfig({
                      ...config,
                      processing: {...config.processing, batch_size: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_files">Fichiers maximum</Label>
                  <Input
                    id="max_files"
                    type="number"
                    min="1"
                    max="100"
                    value={config.processing.max_files}
                    onChange={(e) => setConfig({
                      ...config,
                      processing: {...config.processing, max_files: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="merge_strategy">Stratégie de fusion</Label>
                <Select 
                  value={config.processing.merge_strategy} 
                  onValueChange={(value) => setConfig({
                    ...config,
                    processing: {...config.processing, merge_strategy: value as any}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Mettre à jour existants</SelectItem>
                    <SelectItem value="replace">Remplacer existants</SelectItem>
                    <SelectItem value="skip">Ignorer existants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="parallel_processing">Traitement parallèle</Label>
                  <Switch
                    id="parallel_processing"
                    checked={config.processing.parallel_processing}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      processing: {...config.processing, parallel_processing: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="validate_data">Validation des données</Label>
                  <Switch
                    id="validate_data"
                    checked={config.processing.validate_data}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      processing: {...config.processing, validate_data: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_detect_encoding">Détection automatique encodage</Label>
                  <Switch
                    id="auto_detect_encoding"
                    checked={config.processing.auto_detect_encoding}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      processing: {...config.processing, auto_detect_encoding: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="skip_duplicates">Ignorer doublons</Label>
                  <Switch
                    id="skip_duplicates"
                    checked={config.processing.skip_duplicates}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      processing: {...config.processing, skip_duplicates: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration des formats */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration des formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configuration CSV */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Format CSV</h4>
                  <Switch
                    checked={config.formats.csv.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      formats: {...config.formats, csv: {...config.formats.csv, enabled: checked}}
                    })}
                  />
                </div>
                
                {config.formats.csv.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="csv_delimiter">Délimiteur</Label>
                      <Select 
                        value={config.formats.csv.delimiter} 
                        onValueChange={(value) => setConfig({
                          ...config,
                          formats: {...config.formats, csv: {...config.formats.csv, delimiter: value as any}}
                        })}
                      >
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

                    <div>
                      <Label htmlFor="csv_encoding">Encodage</Label>
                      <Select 
                        value={config.formats.csv.encoding} 
                        onValueChange={(value) => setConfig({
                          ...config,
                          formats: {...config.formats, csv: {...config.formats.csv, encoding: value as any}}
                        })}
                      >
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
                )}
              </div>

              {/* Configuration XML */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Format XML</h4>
                  <Switch
                    checked={config.formats.xml.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      formats: {...config.formats, xml: {...config.formats.xml, enabled: checked}}
                    })}
                  />
                </div>
                
                {config.formats.xml.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="xml_root">Élément racine</Label>
                      <Input
                        id="xml_root"
                        value={config.formats.xml.root_element}
                        onChange={(e) => setConfig({
                          ...config,
                          formats: {...config.formats, xml: {...config.formats.xml, root_element: e.target.value}}
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="xml_product">Élément produit</Label>
                      <Input
                        id="xml_product"
                        value={config.formats.xml.product_element}
                        onChange={(e) => setConfig({
                          ...config,
                          formats: {...config.formats, xml: {...config.formats.xml, product_element: e.target.value}}
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration d'archivage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Configuration d'archivage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create_archive">Créer archive</Label>
                  <Switch
                    id="create_archive"
                    checked={config.archive.create_archive}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      archive: {...config.archive, create_archive: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="archive_processed">Archiver traités</Label>
                  <Switch
                    id="archive_processed"
                    checked={config.archive.archive_processed}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      archive: {...config.archive, archive_processed: checked}
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="delete_after_archive">Supprimer après archivage</Label>
                <Switch
                  id="delete_after_archive"
                  checked={config.archive.delete_after_archive}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    archive: {...config.archive, delete_after_archive: checked}
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
              <Button onClick={handleSaveConfig} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder config
              </Button>
              
              <Button 
                onClick={handleStartBulkImport} 
                variant="default" 
                className="w-full"
                disabled={uploadedFiles.length === 0 || processingStatus === 'processing'}
              >
                <Play className="w-4 h-4 mr-2" />
                {processingStatus === 'processing' ? 'Traitement...' : 'Démarrer import'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fichiers:</span>
                  <span>{uploadedFiles.length}/{config.processing.max_files}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taille lot:</span>
                  <span>{config.processing.batch_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parallèle:</span>
                  <Badge variant={config.processing.parallel_processing ? "default" : "secondary"}>
                    {config.processing.parallel_processing ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validation:</span>
                  <Badge variant={config.processing.validate_data ? "default" : "secondary"}>
                    {config.processing.validate_data ? "Activée" : "Désactivée"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant={
                    processingStatus === 'completed' ? "default" :
                    processingStatus === 'processing' ? "secondary" :
                    processingStatus === 'error' ? "destructive" : "outline"
                  }>
                    {processingStatus === 'idle' ? 'Prêt' :
                     processingStatus === 'processing' ? 'En cours' :
                     processingStatus === 'completed' ? 'Terminé' :
                     processingStatus === 'error' ? 'Erreur' : 'Prêt'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {processingStatus === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fichiers traités:</span>
                    <span className="text-green-600">{uploadedFiles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produits importés:</span>
                    <span className="text-green-600">
                      {uploadedFiles.length * (Math.floor(Math.random() * 200) + 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Erreurs:</span>
                    <span className="text-red-600">{Math.floor(Math.random() * 5)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportConfig;