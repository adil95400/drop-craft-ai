import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Download, Settings, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';

export default function ImportAdvancedPage() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      // Simulation d'import
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Import réussi",
        description: "Les produits ont été importés avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Import Avancé - Gestion Produits | Drop Craft AI</title>
        <meta name="description" content="Importez vos produits en masse depuis différentes sources avec notre outil d'import avancé." />
      </Helmet>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Avancé</h1>
            <p className="text-muted-foreground">
              Importez vos produits depuis différentes sources
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Télécharger template
          </Button>
        </div>

        <Tabs defaultValue="csv" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import CSV</CardTitle>
                <CardDescription>
                  Importez vos produits depuis un fichier CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Glissez-déposez votre fichier CSV</h3>
                  <p className="text-muted-foreground mb-4">
                    ou cliquez pour sélectionner un fichier
                  </p>
                  <Button>Sélectionner un fichier</Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Format attendu:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Nom du produit</li>
                    <li>• Prix</li>
                    <li>• Stock</li>
                    <li>• Description</li>
                    <li>• Catégorie</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AliExpress
                  </CardTitle>
                  <CardDescription>
                    Importez depuis AliExpress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleImport} disabled={importing}>
                    {importing ? "Import en cours..." : "Connecter"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    CJ Dropshipping
                  </CardTitle>
                  <CardDescription>
                    Importez depuis CJ Dropshipping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleImport} disabled={importing}>
                    {importing ? "Import en cours..." : "Connecter"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Autres sources
                  </CardTitle>
                  <CardDescription>
                    Configuration personnalisée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Configurer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import via API</CardTitle>
                <CardDescription>
                  Connectez-vous via API REST
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fonctionnalité d'import via API en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres d'import
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences d'import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Paramètres d'import en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
