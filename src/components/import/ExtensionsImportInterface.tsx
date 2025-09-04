import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Puzzle,
  Star,
  Zap,
  Brain,
  ShoppingCart,
  TrendingUp,
  Search,
  Filter,
  Settings,
  Play,
  Pause,
  Download,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { useExtensions } from '@/hooks/useExtensions'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Extensions recommandées pour l'import avec IA intégrée
const IMPORT_EXTENSIONS = [
  {
    id: 'ai-seo-optimizer',
    name: 'ai_seo_optimizer',
    display_name: 'AI SEO Optimizer',
    description: 'Optimise automatiquement les titres, descriptions et mots-clés avec IA',
    category: 'ai_enhancement',
    provider: 'lovable_ai',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    ai_enhanced: true,
    auto_trigger: ['csv', 'url', 'bulk'],
    features: ['SEO automatique', 'Mots-clés IA', 'Méta-descriptions'],
    pricing: 'Premium',
    rating: 4.9,
    compatible_with: ['all']
  },
  {
    id: 'smart-pricing',
    name: 'smart_pricing',
    display_name: 'Smart Pricing AI',
    description: 'Calcule automatiquement les prix optimaux basés sur la concurrence',
    category: 'pricing',
    provider: 'lovable_ai',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    ai_enhanced: true,
    auto_trigger: ['bulk', 'url'],
    features: ['Prix compétitifs', 'Analyse marché', 'Marges optimales'],
    pricing: 'Premium',
    rating: 4.8,
    compatible_with: ['aliexpress', 'amazon', 'shopify']
  },
  {
    id: 'quality-checker',
    name: 'quality_checker',
    display_name: 'Quality Check AI',
    description: 'Vérifie automatiquement la qualité des produits importés avec IA',
    category: 'quality_control',
    provider: 'lovable_ai',
    icon: CheckCircle,
    color: 'from-blue-500 to-cyan-500',
    ai_enhanced: true,
    auto_trigger: ['csv', 'url', 'bulk'],
    features: ['Score qualité', 'Détection erreurs', 'Auto-correction'],
    pricing: 'Free',
    rating: 4.7,
    compatible_with: ['all']
  },
  {
    id: 'image-enhancer',
    name: 'image_enhancer',
    display_name: 'Image Enhancer AI',
    description: 'Améliore et optimise automatiquement les images produits',
    category: 'media_optimization',
    provider: 'lovable_ai',
    icon: Search,
    color: 'from-orange-500 to-red-500',
    ai_enhanced: true,
    auto_trigger: ['url', 'bulk'],
    features: ['Amélioration IA', 'Redimensionnement', 'Compression'],
    pricing: 'Premium',
    rating: 4.6,
    compatible_with: ['all']
  },
  {
    id: 'auto-categorizer',
    name: 'auto_categorizer',
    display_name: 'Auto Categorizer',
    description: 'Catégorise automatiquement les produits avec IA avancée',
    category: 'categorization',
    provider: 'lovable_ai',
    icon: Filter,
    color: 'from-indigo-500 to-purple-500',
    ai_enhanced: true,
    auto_trigger: ['csv', 'bulk'],
    features: ['Catégories IA', 'Tags automatiques', 'Classification'],
    pricing: 'Free',
    rating: 4.8,
    compatible_with: ['all']
  }
]

interface ExtensionsImportInterfaceProps {
  importMethod?: string
  onExtensionActivated?: (extension: any) => void
}

export const ExtensionsImportInterface = ({ 
  importMethod = 'all', 
  onExtensionActivated 
}: ExtensionsImportInterfaceProps) => {
  const [activeView, setActiveView] = useState<string>('recommended')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const {
    extensions: installedExtensions,
    isLoading,
    installExtension,
    toggleExtension,
    uninstallExtension,
    startJob,
    isInstallingExtension,
    isTogglingExtension,
    isStartingJob
  } = useExtensions()

  const { importedProducts } = useImportUltraPro()

  // Filtrer les extensions recommandées selon la méthode d'import
  const getRecommendedExtensions = () => {
    return IMPORT_EXTENSIONS.filter(ext => {
      if (importMethod === 'all') return true
      return ext.auto_trigger.includes(importMethod) || ext.compatible_with.includes('all')
    })
  }

  // Filtrer les extensions selon la recherche et catégorie
  const filteredExtensions = getRecommendedExtensions().filter(ext => {
    const matchesSearch = searchQuery === '' || 
      ext.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Vérifier si une extension est installée
  const isInstalled = (extensionId: string) => {
    return installedExtensions.some(ext => ext.name === extensionId)
  }

  // Obtenir l'extension installée
  const getInstalledExtension = (extensionId: string) => {
    return installedExtensions.find(ext => ext.name === extensionId)
  }

  // Installer une extension
  const handleInstall = async (extension: typeof IMPORT_EXTENSIONS[0]) => {
    try {
      await installExtension({
        name: extension.name,
        display_name: extension.display_name,
        description: extension.description,
        category: extension.category,
        provider: extension.provider,
        configuration: {
          ai_enhanced: extension.ai_enhanced,
          auto_trigger: extension.auto_trigger,
          compatible_with: extension.compatible_with
        },
        permissions: {
          read_products: true,
          write_products: true,
          ai_processing: extension.ai_enhanced
        },
        metadata: {
          features: extension.features,
          pricing: extension.pricing,
          rating: extension.rating
        }
      })
      
      onExtensionActivated?.(extension)
      toast.success(`Extension ${extension.display_name} installée !`)
    } catch (error) {
      toast.error(`Erreur lors de l'installation: ${error}`)
    }
  }

  // Activer/désactiver une extension
  const handleToggle = async (extensionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await toggleExtension({ id: extensionId, status: newStatus })
  }

  // Lancer un job d'extension avec IA
  const handleRunExtension = async (extension: any) => {
    const installedExt = getInstalledExtension(extension.name)
    if (!installedExt) return

    try {
      // Si l'extension est IA-enhanced, appeler l'AI optimizer
      if (extension.ai_enhanced) {
        const { data, error } = await supabase.functions.invoke('ai-optimizer', {
          body: {
            extensionType: extension.category === 'ai_enhancement' ? 'seo' : 
                          extension.category === 'pricing' ? 'pricing' :
                          extension.category === 'quality_control' ? 'quality' :
                          extension.category === 'categorization' ? 'categorization' :
                          extension.category === 'media_optimization' ? 'image_enhancement' : 'seo',
            productData: {
              products_count: importedProducts.length,
              sample_products: importedProducts.slice(0, 5)
            },
            userPreferences: {
              language: 'fr',
              market: 'france',
              import_method: importMethod
            }
          }
        })

        if (error) {
          throw new Error(error.message)
        }

        toast.success(`✨ Extension IA ${extension.display_name} exécutée ! Score: ${data.optimization?.seo_score || data.optimization?.quality_score || 'N/A'}`)
      } else {
        // Extension standard
        await startJob({
          extensionId: installedExt.id,
          jobType: 'import',
          inputData: {
            import_method: importMethod,
            products_count: importedProducts.length,
            ai_enhanced: false
          }
        })
        toast.success(`Extension ${extension.display_name} lancée !`)
      }
      
      onExtensionActivated?.(extension)
    } catch (error: any) {
      toast.error(`Erreur lors du lancement: ${error.message}`)
    }
  }

  const categories = [
    { value: 'all', label: 'Toutes' },
    { value: 'ai_enhancement', label: 'IA & Optimisation' },
    { value: 'pricing', label: 'Prix & Marges' },
    { value: 'quality_control', label: 'Contrôle Qualité' },
    { value: 'media_optimization', label: 'Médias' },
    { value: 'categorization', label: 'Catégorisation' }
  ]

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 rounded-2xl text-white">
        <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Puzzle className="h-6 w-6" />
                Extensions Import Intelligence
              </h2>
              <p className="opacity-90">
                Extensions IA pour optimiser automatiquement vos imports
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{installedExtensions.length}</div>
              <div className="text-sm opacity-80">Extensions Actives</div>
            </div>
          </div>
          
          {importMethod !== 'all' && (
            <Badge className="bg-white/20 text-white border-white/30">
              Optimisé pour: {importMethod.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher une extension..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs pour les vues */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommandées</TabsTrigger>
          <TabsTrigger value="installed">Installées ({installedExtensions.length})</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtensions.map(extension => {
              const installed = isInstalled(extension.name)
              const installedExt = getInstalledExtension(extension.name)
              const Icon = extension.icon

              return (
                <Card key={extension.id} className="relative group hover:shadow-lg transition-all">
                  <div className={`absolute inset-0 bg-gradient-to-r ${extension.color} opacity-5 rounded-lg`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-r ${extension.color} text-white rounded-lg`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {extension.display_name}
                            {extension.ai_enhanced && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {extension.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {extension.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Rating et prix */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{extension.rating}</span>
                      </div>
                      <Badge variant={extension.pricing === 'Free' ? 'default' : 'secondary'}>
                        {extension.pricing}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!installed ? (
                        <Button
                          onClick={() => handleInstall(extension)}
                          disabled={isInstallingExtension}
                          className="flex-1"
                          size="sm"
                        >
                          {isInstallingExtension ? 'Installation...' : 'Installer'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleRunExtension(extension)}
                            disabled={isStartingJob || installedExt?.status !== 'active'}
                            size="sm"
                            className="flex-1"
                          >
                            {isStartingJob ? 'Lancement...' : 'Lancer'}
                          </Button>
                          <Switch
                            checked={installedExt?.status === 'active'}
                            onCheckedChange={() => installedExt && handleToggle(installedExt.id, installedExt.status)}
                            disabled={isTogglingExtension}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          {installedExtensions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Puzzle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune extension installée</h3>
                <p className="text-muted-foreground mb-4">
                  Installez des extensions depuis l'onglet Recommandées pour optimiser vos imports
                </p>
                <Button onClick={() => setActiveView('recommended')}>
                  Découvrir les Extensions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedExtensions.map(extension => (
                <Card key={extension.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{extension.display_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={extension.status === 'active' ? 'default' : 'secondary'}>
                          {extension.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Switch
                          checked={extension.status === 'active'}
                          onCheckedChange={() => handleToggle(extension.id, extension.status)}
                          disabled={isTogglingExtension}
                        />
                      </div>
                    </div>
                    <CardDescription>{extension.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleRunExtension({ 
                          name: extension.name, 
                          ai_enhanced: (extension.configuration as any)?.ai_enhanced || false 
                        })}
                        disabled={isStartingJob || extension.status !== 'active'}
                        size="sm"
                        className="flex-1"
                      >
                        {extension.status === 'active' ? 'Lancer' : 'Inactif'}
                      </Button>
                      <Button
                        onClick={() => uninstallExtension(extension.id)}
                        variant="outline"
                        size="sm"
                      >
                        Désinstaller
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <ExternalLink className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Marketplace Extensions</h3>
              <p className="text-muted-foreground mb-4">
                Découvrez plus d'extensions créées par la communauté
              </p>
              <Button variant="outline">
                Visiter le Marketplace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}