import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle, AlertCircle, 
  Download, ArrowLeft, Play, Settings 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CSVImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'import' | 'complete'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile) {
      setFile(csvFile);
      setStep('mapping');
      toast.success('Fichier CSV chargé avec succès');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const handleStartImport = async () => {
    if (!file) return;
    
    setStep('import');
    setImporting(true);
    
    // Simulation d'import progressif
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setImporting(false);
    setStep('complete');
    toast.success('Import terminé avec succès!');
  };

  const csvColumns = ['name', 'price', 'description', 'category', 'sku', 'brand'];
  const productFields = [
    { key: 'name', label: 'Nom du produit' },
    { key: 'price', label: 'Prix' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Catégorie' },
    { key: 'sku', label: 'SKU' },
    { key: 'brand', label: 'Marque' },
    { key: 'stock', label: 'Stock' },
    { key: 'weight', label: 'Poids' }
  ];

  return (
    <>
      <Helmet>
        <title>Import CSV - Drop Craft AI</title>
        <meta name="description" content="Importez vos produits depuis un fichier CSV avec mapping intelligent des colonnes." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import CSV</h1>
            <p className="text-muted-foreground">
              Importez vos produits depuis un fichier CSV
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {['upload', 'mapping', 'import', 'complete'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s || (index < ['upload', 'mapping', 'import', 'complete'].indexOf(step)) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < ['upload', 'mapping', 'import', 'complete'].indexOf(step) 
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sélectionner le fichier CSV
              </CardTitle>
              <CardDescription>
                Glissez-déposez votre fichier CSV ou cliquez pour le sélectionner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg">Déposez le fichier ici...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">Glissez votre fichier CSV ici</p>
                    <p className="text-muted-foreground mb-4">ou cliquez pour sélectionner</p>
                    <Button variant="outline">
                      Sélectionner un fichier
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Template Standard
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Template Avancé
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && file && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mapping des colonnes
              </CardTitle>
              <CardDescription>
                Associez les colonnes de votre fichier aux champs produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Colonnes CSV détectées</h4>
                  <div className="space-y-2">
                    {csvColumns.map((col) => (
                      <Badge key={col} variant="outline" className="mr-2">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Champs produit</h4>
                  <div className="space-y-3">
                    {productFields.map((field) => (
                      <div key={field.key} className="flex items-center justify-between p-3 border rounded">
                        <span>{field.label}</span>
                        <select 
                          className="border rounded px-2 py-1"
                          value={mapping[field.key] || ''}
                          onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                        >
                          <option value="">-- Sélectionner --</option>
                          {csvColumns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Retour
                </Button>
                <Button onClick={handleStartImport}>
                  <Play className="h-4 w-4 mr-2" />
                  Commencer l'import
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Progress */}
        {step === 'import' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Import en cours...
              </CardTitle>
              <CardDescription>
                Traitement du fichier {file?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Lignes traitées</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">1,198</div>
                  <div className="text-sm text-muted-foreground">Succès</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-red-600">49</div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Import terminé avec succès
              </CardTitle>
              <CardDescription>
                Votre fichier {file?.name} a été importé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">1,198</div>
                  <div className="text-sm text-green-700">Produits importés</div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">49</div>
                  <div className="text-sm text-yellow-700">Avertissements</div>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">0</div>
                  <div className="text-sm text-red-700">Erreurs critiques</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-3 pt-6">
                <Button variant="outline" onClick={() => navigate('/import')}>
                  Nouvel import
                </Button>
                <Button onClick={() => navigate('/products')}>
                  Voir les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default CSVImportPage;