import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Link2, Database, Settings2, Play } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ImportAdvanced = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"csv" | "excel" | "url" | "api">("csv");
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`Fichier sélectionné: ${file.name}`);
    }
  };

  const handleStartImport = () => {
    if (!selectedFile && importType !== "url" && importType !== "api") {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    toast.info("Import en cours de configuration...");
    navigate("/import/quick", { state: { file: selectedFile, type: importType } });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Avancé</h1>
        <p className="text-muted-foreground">
          Configuration avancée pour importer vos produits avec mapping personnalisé
        </p>
      </div>

      <Tabs value={importType} onValueChange={(v) => setImportType(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="csv">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link2 className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="api">
            <Database className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import CSV</CardTitle>
              <CardDescription>
                Importez des produits depuis un fichier CSV avec délimiteur personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Fichier CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="delimiter">Délimiteur</Label>
                <Select defaultValue=",">
                  <SelectTrigger id="delimiter">
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
                <Label htmlFor="encoding">Encodage</Label>
                <Select defaultValue="utf8">
                  <SelectTrigger id="encoding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf8">UTF-8</SelectItem>
                    <SelectItem value="iso">ISO-8859-1</SelectItem>
                    <SelectItem value="windows">Windows-1252</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Excel</CardTitle>
              <CardDescription>
                Importez des produits depuis un fichier Excel (.xlsx, .xls)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="excel-file">Fichier Excel</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="sheet">Feuille</Label>
                <Select defaultValue="1">
                  <SelectTrigger id="sheet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Feuille 1</SelectItem>
                    <SelectItem value="2">Feuille 2</SelectItem>
                    <SelectItem value="3">Feuille 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-row">Ligne de début</Label>
                <Input
                  id="start-row"
                  type="number"
                  defaultValue="1"
                  min="1"
                  placeholder="1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import par URL</CardTitle>
              <CardDescription>
                Importez des produits directement depuis une URL de produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-url">URL du produit</Label>
                <Input
                  id="product-url"
                  type="url"
                  placeholder="https://example.com/product/123"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="platform">Plateforme</Label>
                <Select defaultValue="auto">
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Détection automatique</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import API</CardTitle>
              <CardDescription>
                Connectez-vous à une API externe pour importer des produits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-endpoint">Endpoint API</Label>
                <Input
                  id="api-endpoint"
                  type="url"
                  placeholder="https://api.example.com/products"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="api-key">API Key (optionnel)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Votre clé API"
                />
              </div>

              <div>
                <Label htmlFor="api-method">Méthode</Label>
                <Select defaultValue="GET">
                  <SelectTrigger id="api-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Options d'import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ignorer les doublons</p>
              <p className="text-sm text-muted-foreground">
                Vérifier les SKU existants avant import
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mettre à jour les produits existants</p>
              <p className="text-sm text-muted-foreground">
                Mettre à jour si le SKU existe déjà
              </p>
            </div>
            <input type="checkbox" className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Validation stricte</p>
              <p className="text-sm text-muted-foreground">
                Rejeter les lignes avec des données manquantes
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => navigate("/import/quick")} variant="outline">
          Retour à l'import simple
        </Button>
        <Button onClick={handleStartImport} size="lg" className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Démarrer l'import
        </Button>
      </div>
    </div>
  );
};

export default ImportAdvanced;
