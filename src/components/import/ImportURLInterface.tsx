import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Link, 
  Zap, 
  Brain, 
  Globe, 
  Shield, 
  TrendingUp,
  Cpu,
  Star,
  CheckCircle2
} from "lucide-react";
import { useImport } from "@/hooks/useImport";
import { ImportResultsPro } from "./ImportResultsPro";
import { productionLogger } from '@/utils/productionLogger';
import { toast } from "sonner";

export const ImportURLInterface = () => {
  const [url, setUrl] = useState("");
  const { urlImport, isUrlImporting, importData } = useImport();

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Veuillez saisir une URL valide");
      return;
    }
    
    if (!url.startsWith('http')) {
      toast.error("L'URL doit commencer par http:// ou https://");
      return;
    }

    try {
      await urlImport(url);
    } catch (error: any) {
      productionLogger.error('URL import', error, 'ImportURLInterface');
      toast.error(`Erreur d'import: ${error.message || 'Une erreur est survenue'}`);
    }
  };

  const handleAddToStore = (product: any) => {
    toast.success(`${product.name} ajouté au catalogue !`);
  };

  const handleOptimizeProduct = (product: any) => {
    toast.success(`Optimisation IA lancée pour ${product.name}`);
  };

  const handleViewDetails = (product: any) => {
    toast.info(`Affichage des détails pour ${product.name}`);
  };

  const supportedPlatforms = [
    { name: "AliExpress", icon: "🛒", active: true },
    { name: "Amazon", icon: "📦", active: true },
    { name: "Shopify", icon: "🛍️", active: true },
    { name: "eBay", icon: "🏪", active: true },
    { name: "WooCommerce", icon: "🌐", active: true },
    { name: "Autres", icon: "⚡", active: true }
  ];

  if (importData && importData.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            size="sm"
          >
            ← Nouveau Import
          </Button>
        </div>
        <ImportResultsPro
          result={importData}
          onAddToStore={handleAddToStore}
          onOptimizeProduct={handleOptimizeProduct}
          onViewDetails={handleViewDetails}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec badges */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Import URL Intelligent
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Importez n'importe quel produit depuis une URL avec analyse IA complète, 
          optimisation SEO automatique et recommandations personnalisées.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-50 text-success border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            IA Avancée
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Analyse Sécurisée
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            Scoring Automatique
          </Badge>
        </div>
      </div>

      {/* Interface d'import */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-info" />
            Importer depuis une URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="import-url">URL du produit</Label>
            <Input
              id="import-url"
              placeholder="https://www.aliexpress.com/item/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg py-3"
              disabled={isUrlImporting}
            />
            <div className="text-sm text-gray-500">
              Collez l'URL de n'importe quel produit e-commerce
            </div>
          </div>

          {isUrlImporting && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin">
                    <Cpu className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Analyse IA en cours...</div>
                    <div className="text-sm text-blue-700">
                      Extraction des données, optimisation SEO et analyse concurrentielle
                    </div>
                  </div>
                </div>
                <Progress value={85} className="w-full" />
                <div className="text-sm text-info mt-2">Traitement avancé avec IA</div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleImport} 
            disabled={isUrlImporting || !url.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg"
          >
            {isUrlImporting ? (
              <>
                <Cpu className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyser et Importer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plateformes supportées */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Plateformes Supportées
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {supportedPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="text-2xl mb-1">{platform.icon}</div>
                <div className="text-sm font-medium">{platform.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-success">Actif</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités IA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Brain className="w-8 h-8 text-info mx-auto mb-2" />
            <h4 className="font-medium text-blue-900">Optimisation IA</h4>
            <p className="text-sm text-blue-700 mt-1">
              Titre, description et tags SEO générés automatiquement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
            <h4 className="font-medium text-green-900">Analyse Marché</h4>
            <p className="text-sm text-success mt-1">
              Tendances, concurrence et potentiel de vente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-purple-900">Scoring Auto</h4>
            <p className="text-sm text-purple-700 mt-1">
              Notes de qualité et recommandations d'amélioration
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};