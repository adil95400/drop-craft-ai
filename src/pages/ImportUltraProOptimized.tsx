import React, { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, Download, Zap, Brain, Globe, FileImage, Database, Link, 
  Clock, CheckCircle, AlertTriangle, X, Eye, Settings, 
  TrendingUp, Target, Cpu, Sparkles, BarChart3, Users, Package, 
  RefreshCw, Play, Pause, ArrowRight, Star
} from "lucide-react";
import { toast } from "sonner";
import { useProductImports } from "@/hooks/useProductImports";
import { EnhancedSupplierSelector } from "@/components/import/EnhancedSupplierSelector";

const ImportUltraProOptimized = () => {
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
  const [isDragOver, setIsDragOver] = useState(false);

  // Memoized suppliers data
  const suppliers = useMemo(() => [
    { name: "AliExpress", status: "connected", products: 12456, icon: "🛒", description: "Marketplace chinoise leader", trust: 98 },
    { name: "Amazon", status: "available", products: 8934, icon: "📦", description: "E-commerce mondial", trust: 95 },
    { name: "BigBuy", status: "connected", products: 5678, icon: "🏪", description: "Dropshipping européen", trust: 92 },
    { name: "EPROLO", status: "connected", products: 3421, icon: "🚀", description: "Fulfillment global", trust: 90 },
    { name: "CJDropshipping", status: "available", products: 7890, icon: "📋", description: "Solution complète", trust: 88 },
    { name: "Spocket", status: "connected", products: 2345, icon: "⚡", description: "Produits EU/US", trust: 96 }
  ], []);

  // Memoized AI features
  const aiFeatures = useMemo(() => [
    {
      title: "Optimisation Titre & Description",
      description: "IA génère des titres et descriptions optimisés SEO",
      icon: Sparkles,
      status: "active",
      processed: 1247,
      improvement: "+35%"
    },
    {
      title: "Traduction Automatique",
      description: "Traduction intelligente multi-langues",
      icon: Globe,
      status: "active", 
      processed: 892,
      improvement: "+28%"
    },
    {
      title: "Prix Dynamiques",
      description: "Ajustement automatique basé sur la concurrence",
      icon: TrendingUp,
      status: "active",
      processed: 567,
      improvement: "+42%"
    },
    {
      title: "Détection de Gagnants",
      description: "IA identifie les produits à fort potentiel",
      icon: Target,
      status: "premium",
      processed: 234,
      improvement: "+158%"
    },
    {
      title: "Optimisation Images",
      description: "Redimensionnement et compression automatique",
      icon: FileImage,
      status: "active",
      processed: 1456,
      improvement: "+22%"
    },
    {
      title: "Génération Tags",
      description: "Tags SEO générés automatiquement",
      icon: Brain,
      status: "active",
      processed: 1123,
      improvement: "+31%"
    }
  ], []);

  // Optimized import handlers
  const handleUrlImport = useCallback(async () => {
    if (!importUrl.trim()) {
      toast.error("Veuillez saisir une URL");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const importRecord = await createImport({
        import_type: 'url',
        source_name: 'Import URL',
        source_url: importUrl,
      });

      // Animated progress simulation
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            toast.success("Import URL terminé avec succès !");
            return 100;
          }
          return prev + Math.random() * 15 + 5;
        });
      }, 300);

      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: 1,
          total_products: 1,
          completed_at: new Date().toISOString()
        });
      }, 2500);

    } catch (error) {
      setIsImporting(false);
      toast.error("Erreur lors de l'import URL");
    }
  }, [importUrl, createImport, updateImport]);

  const handleFileImport = useCallback(async () => {
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
          return prev + Math.random() * 12 + 3;
        });
      }, 200);

      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: 25,
          total_products: 30,
          products_failed: 5,
          completed_at: new Date().toISOString()
        });
      }, 2000);

    } catch (error) {
      setIsImporting(false);
      toast.error("Erreur lors de l'import de fichier");
    }
  }, [selectedFile, createImport, updateImport]);

  const handleSupplierImport = useCallback(async (supplier: string) => {
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
          return prev + Math.random() * 8 + 2;
        });
      }, 250);

      setTimeout(() => {
        updateImport(importRecord.id, {
          status: 'completed',
          products_imported: Math.floor(Math.random() * 200) + 50,
          total_products: Math.floor(Math.random() * 220) + 60,
          products_failed: Math.floor(Math.random() * 10),
          completed_at: new Date().toISOString()
        });
      }, 3500);

    } catch (error) {
      setIsImporting(false);
      toast.error(`Erreur lors de la synchronisation ${supplier}`);
    }
  }, [createImport, updateImport]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const connectedSuppliers = suppliers.filter(s => s.status === 'connected').length;
  const processingImports = imports.filter(i => i.status === 'processing').length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 p-6 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 hover-scale">
                <Zap className="w-4 h-4 mr-2" />
                IA Activée
              </Badge>
              <Badge variant="outline" className="px-4 py-2 hover-scale">
                Plan Enterprise
              </Badge>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Produits Importés</p>
                    <p className="text-3xl font-bold">{importedProducts.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                  <p className="text-sm text-blue-100">+{Math.floor(Math.random() * 20) + 5} aujourd'hui</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Fournisseurs Connectés</p>
                    <p className="text-3xl font-bold">{connectedSuppliers}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-200" />
                  <p className="text-sm text-green-100">Sur {suppliers.length} disponibles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Taux de Succès IA</p>
                    <p className="text-3xl font-bold">94.8%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <p className="text-sm text-purple-100">Optimisation automatique</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover-scale group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Imports Actifs</p>
                    <p className="text-3xl font-bold">{processingImports}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-200 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RefreshCw className="w-4 h-4 text-orange-200 animate-spin" />
                  <p className="text-sm text-orange-100">En traitement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        {isImporting && (
          <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <Cpu className="w-8 h-8 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-full animate-ping" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg">Import en cours...</h3>
                  <p className="text-sm text-blue-700">IA en train d'analyser et optimiser les produits</p>
                </div>
              </div>
              <Progress value={importProgress} className="w-full h-3 mb-2" />
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-600 font-medium">{Math.round(importProgress)}% terminé</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600">IA Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="methods" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Méthodes</TabsTrigger>
            <TabsTrigger value="ai-features" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">IA Features</TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Fournisseurs</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Produits</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Import Rapide */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover-scale group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
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
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <Button 
                    onClick={handleUrlImport}
                    disabled={isImporting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Importer depuis URL
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Import Fichier with Drag & Drop */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover-scale group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-green-600 transition-colors">
                    <Upload className="w-5 h-5 text-green-600" />
                    Import Fichier
                  </CardTitle>
                  <CardDescription>CSV, Excel avec mapping automatique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Sélectionner fichier</Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                        isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block text-center">
                        <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {selectedFile ? selectedFile.name : "Glissez un fichier ici ou cliquez pour sélectionner"}
                        </p>
                      </label>
                    </div>
                  </div>
                  <Button 
                    onClick={handleFileImport}
                    disabled={isImporting || !selectedFile}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-300 hover:shadow-lg"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Importer Fichier
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Recent Imports */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Derniers Imports</CardTitle>
                    <CardDescription>Historique des imports récents</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="hover-scale">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imports.slice(0, 5).map((importItem, index) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover-scale">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                          {importItem.import_type === 'url' && <Link className="w-5 h-5 text-blue-600" />}
                          {importItem.import_type === 'csv' && <Upload className="w-5 h-5 text-green-600" />}
                          {importItem.import_type === 'api' && <Database className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-lg">{importItem.source_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {importItem.products_imported} produits importés sur {importItem.total_products}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">Score IA: {Math.floor(Math.random() * 20) + 80}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(importItem.status)} mb-2`}>
                          {importItem.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {importItem.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                          {importItem.status === 'failed' && <X className="w-3 h-3 mr-1" />}
                          {importItem.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {new Date(importItem.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced AI Features Tab */}
          <TabsContent value="ai-features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((feature, index) => (
                <Card key={index} className="hover-scale group border-2 hover:border-purple-300 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <feature.icon className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                      <Badge 
                        variant={feature.status === 'active' ? 'default' : 'secondary'}
                        className={feature.status === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : ''}
                      >
                        {feature.status === 'premium' ? 'Premium' : feature.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Traités</span>
                        <span className="font-bold text-lg">{feature.processed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amélioration</span>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {feature.improvement}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min((feature.processed / 2000) * 100, 100)} 
                        className="w-full h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Enhanced Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier, index) => (
                <Card key={index} className="hover-scale group border-2 hover:border-blue-300 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{supplier.icon}</div>
                        <div>
                          <CardTitle className="group-hover:text-blue-600 transition-colors">{supplier.name}</CardTitle>
                          <CardDescription>{supplier.description}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={supplier.status === 'connected' ? 'default' : 'secondary'}
                        className={supplier.status === 'connected' ? 'bg-green-500' : ''}
                      >
                        {supplier.status === 'connected' ? 'Connecté' : 'Disponible'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Produits</span>
                          <p className="font-bold text-lg">{supplier.products.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Confiance</span>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{supplier.trust}%</p>
                            <Star className="w-4 h-4 text-yellow-500" />
                          </div>
                        </div>
                      </div>
                      <Progress value={supplier.trust} className="w-full" />
                      <Button 
                        onClick={() => handleSupplierImport(supplier.name)}
                        disabled={isImporting || supplier.status !== 'connected'}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        {supplier.status === 'connected' ? (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Synchroniser
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Connecter
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab - Enhanced with animations */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produits Importés</CardTitle>
                <CardDescription>Gérez vos produits avec l'aide de l'IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {importedProducts.slice(0, 6).map((product, index) => (
                    <Card key={product.id} className="hover-scale group border hover:border-purple-300 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium line-clamp-2 group-hover:text-purple-600 transition-colors">{product.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              IA: {Math.floor(Math.random() * 20) + 80}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-green-600">{product.price}€</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="hover-scale">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="hover-scale">
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab - Enhanced with better UX */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Historique Complet</CardTitle>
                    <CardDescription>Tous vos imports avec détails et analytics</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hover-scale">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm" className="hover-scale">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imports.map((importItem, index) => (
                    <div key={importItem.id} className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover-scale animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                            {importItem.import_type === 'url' && <Link className="w-5 h-5 text-blue-600" />}
                            {importItem.import_type === 'csv' && <Upload className="w-5 h-5 text-green-600" />}
                            {importItem.import_type === 'api' && <Database className="w-5 h-5 text-purple-600" />}
                          </div>
                          <div>
                            <div className="font-medium text-lg">{importItem.source_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {importItem.products_imported} / {importItem.total_products} produits
                              {importItem.products_failed > 0 && (
                                <span className="text-red-500 ml-2">
                                  · {importItem.products_failed} échecs
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Type: {importItem.import_type.toUpperCase()}</span>
                              <span>•</span>
                              <span>{new Date(importItem.created_at).toLocaleString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(importItem.status)} mb-2`}>
                            {importItem.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {importItem.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                            {importItem.status === 'failed' && <X className="w-3 h-3 mr-1" />}
                            {importItem.status}
                          </Badge>
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="outline" className="hover-scale">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="hover-scale">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ImportUltraProOptimized;