import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  Upload, 
  Users, 
  ShoppingCart, 
  Package, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface ShopifyImportExportManagerProps {
  storeId: string;
  storeName: string;
  shopDomain: string;
  accessToken: string;
}

export const ShopifyImportExportManager = ({ 
  storeId, 
  storeName, 
  shopDomain, 
  accessToken 
}: ShopifyImportExportManagerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    products: { count: 0, status: 'idle' },
    orders: { count: 0, status: 'idle' },
    customers: { count: 0, status: 'idle' }
  });

  const executeOperation = async (operation: string, data?: any) => {
    setIsLoading(true);
    setCurrentOperation(operation);
    setProgress(0);

    try {
      const { data: response, error } = await supabase.functions.invoke('shopify-operations', {
        body: {
          storeId,
          platform: 'shopify',
          operation,
          credentials: {
            shop_domain: shopDomain,
            access_token: accessToken
          },
          operation_data: data
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!response.success) {
        throw new Error(response.error || 'Opération échouée');
      }

      toast({
        title: "Succès",
        description: response.message,
      });

      // Mettre à jour les statistiques si disponibles
      if (response.imported_count) {
        updateStats(operation, response.imported_count);
      }

      if (response.results) {
        updateFullSyncStats(response.results);
      }

      return response;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  };

  const updateStats = (operation: string, count: number) => {
    setStats(prev => ({
      ...prev,
      [operation.replace('import-', '')]: { count, status: 'success' }
    }));
  };

  const updateFullSyncStats = (results: any) => {
    setStats({
      products: { 
        count: results.products.count, 
        status: results.products.success ? 'success' : 'error' 
      },
      orders: { 
        count: results.orders.count, 
        status: results.orders.success ? 'success' : 'error' 
      },
      customers: { 
        count: results.customers.count, 
        status: results.customers.success ? 'success' : 'error' 
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'loading':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'loading':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec informations du store */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {storeName}
              </CardTitle>
              <CardDescription>
                Boutique Shopify: {shopDomain}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Connecté
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Produits</span>
              </div>
              {getStatusIcon(stats.products.status)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.products.count}</div>
              <Badge 
                variant="secondary" 
                className={getStatusColor(stats.products.status)}
              >
                {stats.products.status === 'idle' ? 'Non synchronisé' : 
                 stats.products.status === 'success' ? 'Synchronisé' : 'Erreur'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Commandes</span>
              </div>
              {getStatusIcon(stats.orders.status)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.orders.count}</div>
              <Badge 
                variant="secondary" 
                className={getStatusColor(stats.orders.status)}
              >
                {stats.orders.status === 'idle' ? 'Non synchronisé' : 
                 stats.orders.status === 'success' ? 'Synchronisé' : 'Erreur'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Clients</span>
              </div>
              {getStatusIcon(stats.customers.status)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.customers.count}</div>
              <Badge 
                variant="secondary" 
                className={getStatusColor(stats.customers.status)}
              >
                {stats.customers.status === 'idle' ? 'Non synchronisé' : 
                 stats.customers.status === 'success' ? 'Synchronisé' : 'Erreur'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar pendant l'opération */}
      {isLoading && currentOperation && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Opération en cours: {currentOperation}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets pour les différentes opérations */}
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import depuis Shopify</TabsTrigger>
          <TabsTrigger value="export">Export vers Shopify</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Importer depuis Shopify
              </CardTitle>
              <CardDescription>
                Importez vos données depuis votre boutique Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => executeOperation('import-products')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Importer les produits
                </Button>
                <Button
                  onClick={() => executeOperation('import-orders')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Importer les commandes
                </Button>
                <Button
                  onClick={() => executeOperation('import-customers')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Importer les clients
                </Button>
                <Button
                  onClick={() => executeOperation('full-sync')}
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Synchronisation complète
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Exporter vers Shopify
              </CardTitle>
              <CardDescription>
                Exportez vos produits optimisés vers votre boutique Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => executeOperation('export-products')}
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Exporter tous les produits
                </Button>
                <Button
                  onClick={() => executeOperation('export-products', { product_ids: [] })}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Exporter les produits sélectionnés
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Optimisation IA</p>
                    <p>Les produits exportés incluront les optimisations SEO et les améliorations de contenu générées par l'IA.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};