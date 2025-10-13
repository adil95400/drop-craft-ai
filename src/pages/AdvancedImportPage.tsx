import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, History, Settings2 } from 'lucide-react';
import { useOptimizedImport } from '@/hooks/useOptimizedImport';
import { useOptimizedExport } from '@/hooks/useOptimizedExport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImportZone } from '@/components/import/ImportZone';
import { ImportProgress as EnhancedImportProgress } from '@/components/import/EnhancedImportProgress';
import { ImportHistory } from '@/components/import/ImportHistory';

function AdvancedImportPage() {
  const [importOptions, setImportOptions] = useState({
    format: 'csv' as 'csv' | 'json' | 'excel',
    delimiter: ',',
    skipRows: 1,
  });

  const { importData, isImporting, progress, status, details } = useOptimizedImport();
  const { downloadTemplate } = useOptimizedExport();

  // Fetch import history
  const { data: importHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const handleFileSelect = (file: File) => {
    importData(file, importOptions);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Avancé</h1>
          <p className="text-muted-foreground mt-2">
            Importez vos produits depuis différentes sources avec suivi en temps réel
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Template CSV
        </Button>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="w-4 h-4 mr-2" />
            Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <ImportZone
            onFileSelect={handleFileSelect}
            disabled={isImporting}
            acceptedFormats={['.csv', '.json', '.xlsx', '.xls']}
            maxSize={10}
          />

          {isImporting && (
            <EnhancedImportProgress
              progress={progress}
              status={status}
              message={
                status === 'processing' 
                  ? 'Traitement des données en cours...' 
                  : status === 'success'
                  ? 'Import terminé avec succès'
                  : 'Erreur lors de l\'import'
              }
              details={details}
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Format CSV</CardTitle>
                <CardDescription>
                  Import depuis fichier CSV standard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Délimiteur personnalisable</li>
                  <li>• Encodage UTF-8</li>
                  <li>• Mapping automatique</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Format JSON</CardTitle>
                <CardDescription>
                  Import depuis fichier JSON structuré
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Structure flexible</li>
                  <li>• Objets imbriqués</li>
                  <li>• Validation schéma</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Format Excel</CardTitle>
                <CardDescription>
                  Import depuis fichier Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Multi-feuilles</li>
                  <li>• Formules conservées</li>
                  <li>• XLSX et XLS</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
              <CardDescription>
                Consultez l'historique de vos derniers imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHistory jobs={importHistory} isLoading={historyLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Options d'import</CardTitle>
              <CardDescription>
                Configurez les paramètres d'import selon vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <select
                  value={importOptions.format}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    format: e.target.value as any 
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              {importOptions.format === 'csv' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Délimiteur</label>
                    <input
                      type="text"
                      value={importOptions.delimiter}
                      onChange={(e) => setImportOptions(prev => ({ 
                        ...prev, 
                        delimiter: e.target.value 
                      }))}
                      className="w-full p-2 border rounded-md"
                      maxLength={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lignes à ignorer</label>
                    <input
                      type="number"
                      value={importOptions.skipRows}
                      onChange={(e) => setImportOptions(prev => ({ 
                        ...prev, 
                        skipRows: parseInt(e.target.value) 
                      }))}
                      className="w-full p-2 border rounded-md"
                      min={0}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedImportPage;
