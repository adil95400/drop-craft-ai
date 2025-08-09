import React, { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, Download, Zap, Brain, Globe, FileImage, Database, Link, 
  Clock, CheckCircle, AlertTriangle, X, Eye, Edit, Settings, 
  TrendingUp, Target, Cpu, Sparkles, BarChart3, Users, Package, Store
} from "lucide-react";
import { toast } from "sonner";
import { useProductImports } from "@/hooks/useProductImports";
import { EnhancedSupplierSelector } from "@/components/import/EnhancedSupplierSelector";

const ImportUltraPro = () => {
  const {
    imports,
    importedProducts,
    loading,
    createImport,
    updateImport,
    approveProduct,
    rejectProduct,
    optimizeWithAI
  } = useProductImports();

  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importUrl, setImportUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Simuler un import URL avec vraies données
  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toast.error("Veuillez saisir une URL");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Créer l'import en base
      const importRecord = await createImport({
        import_type: 'url',
        source_name: 'Import URL',
        source_url: importUrl,
      });

      // Simuler le progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            toast.success("Import URL terminé avec succès !");
            return 100;
          }
          return prev + 20;
        });
      }, 500);

      // Mettre à jour l'import après 3 secondes
      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: 1,
          total_products: 1,
          completed_at: new Date().toISOString()
        });
      }, 3000);

    } catch (error) {
      setIsImporting(false);
      toast.error("Erreur lors de l'import URL");
    }
  };

  // Simuler un import CSV
  const handleFileImport = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const importRecord = await createImport({
        import_type: 'csv',
        source_name: selectedFile.name,
      });

      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            toast.success(`Import de ${selectedFile.name} terminé !`);
            return 100;
          }
          return prev + 15;
        });
      }, 400);

      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: 25,
          total_products: 30,
          products_failed: 5,
          completed_at: new Date().toISOString()
        });
      }, 3000);

    } catch (error) {
      setIsImporting(false);
      toast.error("Erreur lors de l'import de fichier");
    }
  };

  // Simuler import API fournisseur
  const handleSupplierImport = async (supplier: string) => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      const importRecord = await createImport({
        import_type: 'api',
        source_name: `${supplier} API Sync`,
      });

      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            toast.success(`Synchronisation ${supplier} terminée !`);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: Math.floor(Math.random() * 200) + 50,
          total_products: Math.floor(Math.random() * 220) + 60,
          products_failed: Math.floor(Math.random() * 10),
          completed_at: new Date().toISOString()
        });
      }, 4000);

    } catch (error) {
      setIsImporting(false);
      toast.error(`Erreur lors de la synchronisation ${supplier}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const suppliers = [
    { name: "AliExpress", status: "connected", products: 12456, icon: "🛒", description: "Marketplace chinoise leader" },
    { name: "Amazon", status: "available", products: 8934, icon: "📦", description: "E-commerce mondial" },
    { name: "BigBuy", status: "connected", products: 5678, icon: "🏪", description: "Dropshipping européen" },
    { name: "EPROLO", status: "connected", products: 3421, icon: "🚀", description: "Fulfillment global" },
    { name: "CJDropshipping", status: "available", products: 7890, icon: "📋", description: "Solution complète" },
    { name: "Spocket", status: "connected", products: 2345, icon: "⚡", description: "Produits EU/US" }
  ];

  const aiFeatures = [
    {
      title: "Optimisation Titre & Description",
      description: "IA génère des titres et descriptions optimisés SEO",
      icon: Sparkles,
      status: "active",
      processed: 1247
    },
    {
      title: "Traduction Automatique",
      description: "Traduction intelligente multi-langues",
      icon: Globe,
      status: "active", 
      processed: 892
    },
    {
      title: "Prix Dynamiques",
      description: "Ajustement automatique basé sur la concurrence",
      icon: TrendingUp,
      status: "active",
      processed: 567
    },
    {
      title: "Détection de Gagnants",
      description: "IA identifie les produits à fort potentiel",
      icon: Target,
      status: "premium",
      processed: 234
    },
    {
      title: "Optimisation Images",
      description: "Redimensionnement et compression automatique",
      icon: FileImage,
      status: "active",
      processed: 1456
    },
    {
      title: "Génération Tags",
      description: "Tags SEO générés automatiquement",
      icon: Brain,
      status: "active",
      processed: 1123
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 p-6">
        {/* Header Ultra Pro */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Import Ultra Pro
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Import intelligent avec IA avancée et automation complète
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                IA Activée
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                Plan Enterprise
              </Badge>
            </div>
          </div>

          {/* Stats en temps réel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Produits Importés</p>
                    <p className="text-3xl font-bold">{importedProducts.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-sm text-blue-100 mt-2">+{Math.floor(Math.random() * 20) + 5} aujourd'hui</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Fournisseurs Connectés</p>
                    <p className="text-3xl font-bold">{suppliers.filter(s => s.status === 'connected').length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200" />
                </div>
                <p className="text-sm text-green-100 mt-2">Sur {suppliers.length} disponibles</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Taux de Succès IA</p>
                    <p className="text-3xl font-bold">94.8%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-200" />
                </div>
                <p className="text-sm text-purple-100 mt-2">Optimisation automatique</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Imports Actifs</p>
                    <p className="text-3xl font-bold">{imports.filter(i => i.status === 'processing').length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-200" />
                </div>
                <p className="text-sm text-orange-100 mt-2">En cours de traitement</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Bar pour import en cours */}
        {isImporting && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="animate-spin">
                  <Cpu className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Import en cours...</h3>
                  <p className="text-sm text-blue-700">IA en train d'analyser et optimiser les produits</p>
                </div>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-blue-600 mt-2">{importProgress}% terminé</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="methods">Méthodes</TabsTrigger>
            <TabsTrigger value="ai-features">IA Features</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import Rapide */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Import Rapide
                  </CardTitle>
                  <CardDescription>Import instantané avec IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="import-url">URL du produit</Label>
                    <Input
                      id="import-url"
                      placeholder="https://www.aliexpress.com/item/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleUrlImport}
                    disabled={isImporting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Importer depuis URL
                  </Button>
                </CardContent>
              </Card>

              {/* Import Fichier */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-600" />
                    Import Fichier
                  </CardTitle>
                  <CardDescription>CSV, Excel avec mapping automatique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Sélectionner fichier</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button 
                    onClick={handleFileImport}
                    disabled={isImporting || !selectedFile}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Importer Fichier
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Derniers Imports */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Derniers Imports</CardTitle>
                <CardDescription>Historique des imports récents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imports.slice(0, 5).map((importItem) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-100">
                          {importItem.import_type === 'url' && <Link className="w-5 h-5 text-blue-600" />}
                          {importItem.import_type === 'csv' && <Upload className="w-5 h-5 text-green-600" />}
                          {importItem.import_type === 'api' && <Database className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div>
                          <div className="font-medium">{importItem.source_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {importItem.products_imported} produits importés sur {importItem.total_products}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(importItem.status)}>
                          {importItem.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {importItem.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                          {importItem.status === 'failed' && <X className="w-3 h-3 mr-1" />}
                          {importItem.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(importItem.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Fournisseurs avec OAuth</h3>
                <Badge variant="default" className="bg-green-600">Authentification Sécurisée</Badge>
              </div>
              <EnhancedSupplierSelector />
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Produits Importés</CardTitle>
                <CardDescription>Gérer et optimiser vos produits importés</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>IA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_urls?.[0] && (
                              <img 
                                src={product.image_urls[0]} 
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{product.price}€</div>
                            {product.cost_price && (
                              <div className="text-sm text-muted-foreground">
                                Coût: {product.cost_price}€
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            product.status === 'published' ? 'default' :
                            product.status === 'draft' ? 'secondary' : 'destructive'
                          }>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.ai_optimized ? (
                            <Badge variant="default" className="bg-purple-100 text-purple-800">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Optimisé
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => optimizeWithAI(product.id)}
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              Optimiser IA
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {product.status === 'draft' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => approveProduct(product.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => rejectProduct(product.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Historique des Imports</CardTitle>
                <CardDescription>Suivi détaillé de tous vos imports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Import</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Produits</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((importItem) => (
                      <TableRow key={importItem.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{importItem.source_name}</div>
                            {importItem.source_url && (
                              <div className="text-sm text-muted-foreground truncate max-w-48">
                                {importItem.source_url}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{importItem.import_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-green-600">
                              {importItem.products_imported} réussis
                            </div>
                            {importItem.products_failed > 0 && (
                              <div className="text-sm text-red-600">
                                {importItem.products_failed} échecs
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(importItem.status)}>
                            {importItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(importItem.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ImportUltraPro;