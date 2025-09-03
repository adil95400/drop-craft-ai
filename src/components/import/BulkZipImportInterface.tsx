import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileArchive, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkZipImportInterfaceProps {
  onImportComplete?: (result: any) => void;
}

interface FilePreview {
  name: string;
  size: number;
  type: string;
  estimatedRows?: number;
}

export const BulkZipImportInterface: React.FC<BulkZipImportInterfaceProps> = ({ onImportComplete }) => {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [filesPreview, setFilesPreview] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [importConfig, setImportConfig] = useState({
    batchSize: 100,
    validateData: true,
    autoDetectEncoding: true,
    skipDuplicates: true
  });
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/zip') {
      setZipFile(file);
      
      // Mock file preview - in production, you'd extract and analyze the ZIP
      const mockFiles: FilePreview[] = [
        { name: 'products_main.csv', size: 2048000, type: 'text/csv', estimatedRows: 1500 },
        { name: 'categories.xml', size: 512000, type: 'application/xml', estimatedRows: 50 },
        { name: 'inventory_updates.csv', size: 1024000, type: 'text/csv', estimatedRows: 800 },
        { name: 'suppliers.json', size: 256000, type: 'application/json', estimatedRows: 25 }
      ];
      setFilesPreview(mockFiles);
    } else {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier ZIP valide",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const uploadZipFile = async () => {
    if (!zipFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `bulk-import-${Date.now()}-${zipFile.name}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars') // Using existing bucket for demo
        .upload(fileName, zipFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      if (error) throw error;

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setUploadedFileUrl(publicUrl);
      
      toast({
        title: "Fichier téléchargé",
        description: "Le fichier ZIP a été téléchargé avec succès",
      });

    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
    
    setIsUploading(false);
  };

  const startBulkImport = async () => {
    if (!uploadedFileUrl) {
      toast({
        title: "Fichier manquant",
        description: "Veuillez d'abord télécharger un fichier ZIP",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-zip-import', {
        body: {
          zipFileUrl: uploadedFileUrl,
          importConfig: importConfig
        }
      });

      if (error) throw error;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 1000);

      // Wait for completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setImportProgress(100);
        
        toast({
          title: "Import terminé",
          description: `${data.successful_products || 0} produits importés avec succès`,
        });

        onImportComplete?.(data);
      }, 8000);

    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message || "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const removeFile = () => {
    setZipFile(null);
    setFilesPreview([]);
    setUploadedFileUrl(null);
    setUploadProgress(0);
  };

  const totalEstimatedRows = filesPreview.reduce((sum, file) => sum + (file.estimatedRows || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5" />
            Import en Masse (ZIP)
          </CardTitle>
          <CardDescription>
            Importez plusieurs fichiers CSV/XML simultanément via un fichier ZIP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Créez un fichier ZIP contenant vos fichiers CSV, XML ou JSON. 
              Tous les fichiers seront traités en parallèle pour un import rapide.
            </AlertDescription>
          </Alert>

          {/* Zone de drop */}
          {!zipFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <FileArchive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {isDragActive ? "Déposez votre fichier ZIP ici" : "Glissez-déposez votre fichier ZIP"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ou cliquez pour sélectionner un fichier (max 100MB)
                </p>
                <p className="text-xs text-muted-foreground">
                  Formats supportés: CSV, XML, JSON dans un fichier ZIP
                </p>
              </div>
            </div>
          )}

          {/* Aperçu du fichier ZIP */}
          {zipFile && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    {zipFile.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={removeFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Taille: {(zipFile.size / 1024 / 1024).toFixed(2)} MB • 
                  {filesPreview.length} fichiers • 
                  ~{totalEstimatedRows.toLocaleString()} lignes estimées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filesPreview.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type.split('/')[1].toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ~{file.estimatedRows?.toLocaleString()} lignes
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration d'import */}
          {zipFile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration d'import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validateData"
                      checked={importConfig.validateData}
                      onCheckedChange={(checked) => 
                        setImportConfig(prev => ({ ...prev, validateData: !!checked }))
                      }
                    />
                    <Label htmlFor="validateData" className="text-sm">
                      Valider les données
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoDetectEncoding"
                      checked={importConfig.autoDetectEncoding}
                      onCheckedChange={(checked) => 
                        setImportConfig(prev => ({ ...prev, autoDetectEncoding: !!checked }))
                      }
                    />
                    <Label htmlFor="autoDetectEncoding" className="text-sm">
                      Détecter l'encodage
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={importConfig.skipDuplicates}
                      onCheckedChange={(checked) => 
                        setImportConfig(prev => ({ ...prev, skipDuplicates: !!checked }))
                      }
                    />
                    <Label htmlFor="skipDuplicates" className="text-sm">
                      Ignorer les doublons
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress d'upload */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Téléchargement du fichier...</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Progress d'import */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Import en cours...</span>
                <span>{importProgress.toFixed(0)}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {zipFile && !uploadedFileUrl && (
              <Button 
                onClick={uploadZipFile} 
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Téléchargement...' : 'Télécharger le ZIP'}
              </Button>
            )}

            {uploadedFileUrl && (
              <Button 
                onClick={startBulkImport} 
                disabled={isImporting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isImporting ? 'Import en cours...' : 'Démarrer l\'import'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};