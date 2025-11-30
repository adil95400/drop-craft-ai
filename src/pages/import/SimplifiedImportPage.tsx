import React, { useState } from 'react';
import { Upload, Link2, FileSpreadsheet, Package, ChevronRight, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportFromURL } from '@/components/import/ImportFromURL';
import { ImportFromCSV } from '@/components/import/ImportFromCSV';
import { ImportFromSupplier } from '@/components/import/ImportFromSupplier';
import { SimplifiedImportPreview } from '@/components/import/SimplifiedImportPreview';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SimplifiedImportPage() {
  const [activeTab, setActiveTab] = useState('url');
  const [previewData, setPreviewData] = useState<any>(null);
  const [importStep, setImportStep] = useState<'select' | 'preview' | 'confirm'>('select');
  const isMobile = useIsMobile();

  const importMethods = [
    {
      id: 'url',
      icon: Link2,
      title: 'URL de produit',
      description: 'Importer depuis un lien AliExpress, Amazon, etc.',
      color: 'bg-blue-500'
    },
    {
      id: 'supplier',
      icon: Package,
      title: 'Fournisseur connecté',
      description: 'Parcourir les catalogues de vos fournisseurs',
      color: 'bg-purple-500'
    },
    {
      id: 'csv',
      icon: FileSpreadsheet,
      title: 'Fichier CSV/Excel',
      description: 'Importer en masse depuis un fichier',
      color: 'bg-green-500'
    }
  ];

  const handlePreview = (data: any) => {
    setPreviewData(data);
    setImportStep('preview');
  };

  const handleConfirmImport = async () => {
    setImportStep('confirm');
    // L'import sera géré par les composants enfants
  };

  const resetImport = () => {
    setPreviewData(null);
    setImportStep('select');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import simplifié</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Importez vos produits en 3 étapes
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${importStep === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">Source</span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            
            <div className={`flex items-center space-x-2 ${importStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">Aperçu</span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            
            <div className={`flex items-center space-x-2 ${importStep === 'confirm' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Step 1: Select Source */}
        {importStep === 'select' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Quick Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sélectionnez votre méthode d'import préférée. Vous pourrez prévisualiser les données avant l'import final.
              </AlertDescription>
            </Alert>

            {/* Import Method Cards */}
            {!isMobile && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {importMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = activeTab === method.id;
                  return (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isActive ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setActiveTab(method.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center mb-3`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold mb-1">{method.title}</h3>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Import Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Importer des produits</span>
                </CardTitle>
                <CardDescription>
                  Remplissez les informations ci-dessous pour commencer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="supplier">Fournisseur</TabsTrigger>
                    <TabsTrigger value="csv">CSV/Excel</TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="mt-4">
                    <ImportFromURL onPreview={handlePreview} />
                  </TabsContent>

                  <TabsContent value="supplier" className="mt-4">
                    <ImportFromSupplier onPreview={handlePreview} />
                  </TabsContent>

                  <TabsContent value="csv" className="mt-4">
                    <ImportFromCSV onPreview={handlePreview} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Preview */}
        {importStep === 'preview' && previewData && (
          <div className="max-w-6xl mx-auto">
            <SimplifiedImportPreview
              data={previewData}
              onConfirm={handleConfirmImport}
              onCancel={resetImport}
            />
          </div>
        )}

        {/* Step 3: Confirmation */}
        {importStep === 'confirm' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Import réussi !</h2>
                  <p className="text-muted-foreground">
                    Vos produits ont été importés avec succès et sont maintenant disponibles dans votre catalogue.
                  </p>
                  <div className="flex justify-center space-x-3 pt-4">
                    <Button onClick={resetImport} variant="outline">
                      Nouvel import
                    </Button>
                    <Button onClick={() => window.location.href = '/products'}>
                      Voir les produits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
