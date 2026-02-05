import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Brain, 
  Zap, 
  Link, 
  Upload, 
  Settings, 
  Sparkles,
  CheckCircle2,
  Shield,
  TrendingUp,
  Globe
} from 'lucide-react'
import { useImport } from '@/domains/commerce/hooks/useImport'
import { ImportStatusCard } from './ImportStatusCard'
import { ImportResultsPro } from './ImportResultsPro'
import { toast } from 'sonner'
import { productionLogger } from '@/utils/productionLogger'

export const SmartImportInterface = () => {
  const [url, setUrl] = useState('')
  const [aiOptions, setAiOptions] = useState({
    autoOptimize: true,
    extractImages: true,
    generateSEO: true,
    marketAnalysis: true,
    priceOptimization: true
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [importResult, setImportResult] = useState(null)
  
  const { importFromUrl, isImportingUrl, jobs } = useImport()

  const handleSmartImport = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Veuillez saisir une URL valide")
      return
    }
    
    if (!url.startsWith('http')) {
      toast.error("L'URL doit commencer par http:// ou https://")
      return
    }

    try {
      const result = await importFromUrl({ url, config: { options: aiOptions } })
      setImportResult(result)
      toast.success("Import intelligent lancé avec succès !")
    } catch (error: any) {
      productionLogger.error('Smart import error', error as Error, 'SmartImportInterface')
      toast.error(`Erreur d'import: ${error.message || 'Une erreur est survenue'}`)
    }
  }, [url, importFromUrl, aiOptions])

  const handleAiOptionChange = (option: string, value: boolean) => {
    setAiOptions(prev => ({
      ...prev,
      [option]: value
    }))
  }

  if (importResult && importResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Résultats de l'Import</h2>
          <Button 
            variant="outline" 
            onClick={() => setImportResult(null)}
            size="sm"
          >
            ← Nouvel Import
          </Button>
        </div>
        <ImportResultsPro
          result={importResult}
          onAddToStore={(product) => toast.success(`${product.name} ajouté !`)}
          onOptimizeProduct={(product) => toast.success(`Optimisation IA pour ${product.name}`)}
          onViewDetails={(product) => toast.info(`Détails: ${product.name}`)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Import Intelligent IA
          </h1>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg">
          Transformez n'importe quelle URL en produit optimisé grâce à notre IA avancée. 
          Analyse complète, SEO automatique et recommandations personnalisées.
        </p>
        
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1 px-3">
            <Brain className="w-3 h-3 mr-1" />
            IA GPT-4
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1 px-3">
            <Shield className="w-3 h-3 mr-1" />
            Analyse Sécurisée
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 py-1 px-3">
            <TrendingUp className="w-3 h-3 mr-1" />
            Scoring Auto
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 py-1 px-3">
            <Globe className="w-3 h-3 mr-1" />
            Multi-plateformes
          </Badge>
        </div>
      </div>

      {/* Interface principale */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Configuration de l'Import IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Import Rapide
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration Avancée
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label htmlFor="smart-url" className="text-lg font-medium">URL du Produit</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="smart-url"
                    placeholder="https://www.amazon.com/product/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 text-lg py-4 border-2 focus:border-purple-300"
                  disabled={isImportingUrl}
                  />
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Compatible avec Amazon, AliExpress, Shopify, eBay et plus
                </div>
              </div>

              <Button 
                onClick={handleSmartImport} 
                disabled={isImportingUrl || !url.trim()}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 py-4 text-lg font-semibold shadow-lg"
                size="lg"
              >
                <Brain className="w-5 h-5 mr-2" />
                Analyser avec l'IA
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label htmlFor="advanced-url" className="text-lg font-medium">URL du Produit</Label>
                <Input
                  id="advanced-url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-lg py-3"
                  disabled={isImportingUrl}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border border-gray-200">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Options d'IA</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Optimisation Automatique</Label>
                        <div className="text-xs text-gray-500">Titre, description et SEO</div>
                      </div>
                      <Switch 
                        checked={aiOptions.autoOptimize}
                        onCheckedChange={(checked) => handleAiOptionChange('autoOptimize', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Extraction d'Images</Label>
                        <div className="text-xs text-gray-500">Téléchargement auto des images</div>
                      </div>
                      <Switch 
                        checked={aiOptions.extractImages}
                        onCheckedChange={(checked) => handleAiOptionChange('extractImages', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Génération SEO</Label>
                        <div className="text-xs text-gray-500">Meta tags et mots-clés</div>
                      </div>
                      <Switch 
                        checked={aiOptions.generateSEO}
                        onCheckedChange={(checked) => handleAiOptionChange('generateSEO', checked)}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-gray-200">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Analyse Avancée</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Analyse de Marché</Label>
                        <div className="text-xs text-gray-500">Tendances et concurrence</div>
                      </div>
                      <Switch 
                        checked={aiOptions.marketAnalysis}
                        onCheckedChange={(checked) => handleAiOptionChange('marketAnalysis', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Optimisation Prix</Label>
                        <div className="text-xs text-gray-500">Recommandations tarifaires</div>
                      </div>
                      <Switch 
                        checked={aiOptions.priceOptimization}
                        onCheckedChange={(checked) => handleAiOptionChange('priceOptimization', checked)}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <Button 
                onClick={handleSmartImport} 
                disabled={isImportingUrl || !url.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 text-lg font-semibold"
                size="lg"
              >
                <Settings className="w-5 h-5 mr-2" />
                Import Avancé avec IA
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status d'import */}
      {isImportingUrl && (
        <ImportStatusCard
          status="processing"
          progress={75}
          message="Analyse IA en cours - Extraction des données et optimisation..."
        />
      )}

      {/* Fonctionnalités IA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">IA GPT-4 Avancée</h3>
            <p className="text-sm text-blue-700">
              Analyse complète avec génération automatique de contenu optimisé SEO
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Analyse Marché</h3>
            <p className="text-sm text-green-700">
              Évaluation des tendances, concurrence et potentiel de vente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-purple-900 mb-2">Scoring Intelligent</h3>
            <p className="text-sm text-purple-700">
              Notes de qualité et recommandations d'amélioration personnalisées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}