import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults';
import { ImportDashboard } from '@/components/import/ImportDashboard';
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface';
import { useProductImports } from '@/hooks/useProductImports';
import {
  BarChart3,
  Package,
  Upload,
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react';

const ImportManagement = () => {
  const { imports, importedProducts } = useProductImports();

  // Calculate real statistics
  const calculateSuccessRate = () => {
    const totalProducts = imports.reduce((sum, imp) => sum + (imp.products_imported || 0), 0);
    const failedProducts = imports.reduce((sum, imp) => sum + (imp.products_failed || 0), 0);
    if (totalProducts === 0) return 0;
    return Math.round(((totalProducts - failedProducts) / totalProducts) * 100);
  };

  const calculateAverageTime = () => {
    const completedImports = imports.filter(i => i.status === 'completed' && i.created_at);
    if (completedImports.length === 0) return 0;
    
    const totalSeconds = completedImports.reduce((sum, imp) => {
      if (!imp.created_at) return sum;
      const start = new Date(imp.created_at).getTime();
      const end = new Date().getTime();
      return sum + (end - start) / 1000;
    }, 0);
    
    return Math.round(totalSeconds / completedImports.length);
  };

  const calculateProductQuality = () => {
    if (importedProducts.length === 0) return { completeness: 0, withImages: 0, withDescriptions: 0 };
    
    const withImages = importedProducts.filter(p => p.image_urls && p.image_urls.length > 0).length;
    const withDescriptions = importedProducts.filter(p => p.description && p.description.length > 50).length;
    const withAllFields = importedProducts.filter(p => 
      p.name && p.sku && p.price && p.description && p.image_urls?.length
    ).length;

    return {
      completeness: Math.round((withAllFields / importedProducts.length) * 100),
      withImages: Math.round((withImages / importedProducts.length) * 100),
      withDescriptions: Math.round((withDescriptions / importedProducts.length) * 100),
    };
  };

  const stats = {
    successRate: calculateSuccessRate(),
    averageTime: calculateAverageTime(),
    productQuality: calculateProductQuality(),
    optimizedProducts: importedProducts.filter(p => p.ai_optimized).length,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des Imports</h1>
        <p className="text-muted-foreground mt-2">
          Module complet de gestion, analyse et optimisation de vos imports de produits
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Tableau de Bord
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produits Importés
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Nouvel Import
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ImportDashboard />
        </TabsContent>

        <TabsContent value="products">
          <AdvancedImportResults />
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Nouvel Import de Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImportUltraProInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rapport de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Analyse détaillée des imports et de leur performance
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Taux de succès:</span>
                    <span className="font-medium">{stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps moyen:</span>
                    <span className="font-medium">{stats.averageTime} sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imports réussis:</span>
                    <span className="font-medium">{imports.filter(i => i.status === 'completed').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Qualité des Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Évaluation de la qualité des données importées
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Complétude moyenne:</span>
                    <span className="font-medium">{stats.productQuality.completeness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images présentes:</span>
                    <span className="font-medium">{stats.productQuality.withImages}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descriptions OK:</span>
                    <span className="font-medium">{stats.productQuality.withDescriptions}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Optimisations IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Performance des optimisations automatiques
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Produits optimisés:</span>
                    <span className="font-medium">{stats.optimizedProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux optimisation:</span>
                    <span className="font-medium">
                      {importedProducts.length > 0 
                        ? Math.round((stats.optimizedProducts / importedProducts.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total produits:</span>
                    <span className="font-medium">{importedProducts.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportManagement;