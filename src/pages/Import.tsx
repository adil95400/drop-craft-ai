import React, { useState } from "react"
import { ImportHeader } from "@/components/import/ImportHeader"
import { ImportMethods } from "@/components/import/ImportMethods"
import { ImportInterface } from "@/components/import/ImportInterface"
import { ImportResults } from "@/components/import/ImportResults"
import { SupplierSelector } from "@/components/import/SupplierSelector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, Package, TrendingUp, Zap, History, Settings, Clock, CheckCircle, AlertTriangle, FileImage, Globe, Database, Cpu, Store, Crown, Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { useProducts } from "@/hooks/useProducts"
import { useImport } from "@/hooks/useImport"
import { Link } from "react-router-dom"


const Import = () => {
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("suppliers")
  const [scheduleImports, setScheduleImports] = useState([
    { id: 1, name: "AliExpress Weekly", frequency: "weekly", nextRun: "2025-01-15", active: true },
    { id: 2, name: "Amazon Daily", frequency: "daily", nextRun: "2025-01-08", active: false }
  ])
  const { products, addProduct } = useProducts()
  const { importHistory, addImportRecord, updateImportRecord } = useImport()

  const handleImport = async (importData: any) => {
    setIsImporting(true)
    setImportProgress(0)
    setImportResults([])

    try {
      // Créer un enregistrement d'import
      const importRecord = addImportRecord({
        sourceType: importData.type,
        source_url: importData.type === 'url' ? importData.data : undefined,
        status: 'processing',
        products_imported: 0,
        errors_count: 0
      })

      const interval = setInterval(async () => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsImporting(false)
            
            // Simuler des résultats d'import réalistes
            const mockResults = [
              {
                id: "1",
                name: "Smartphone Gaming Pro Max",
                price: 599.99,
                status: "success" as const,
                image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
                category: "Électronique",
                supplier: "TechDirect"
              },
              {
                id: "2", 
                name: "Écouteurs Sans Fil Premium",
                price: 149.99,
                status: "warning" as const,
                issues: ["Description courte", "Mots-clés SEO manquants"],
                image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
                category: "Audio",
                supplier: "SoundMax"
              },
              {
                id: "3",
                name: "Montre Connectée Sport",
                price: 299.99,
                status: "success" as const,
                image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
                category: "Wearables",
                supplier: "FitTech"
              },
              {
                id: "4",
                name: "Chargeur Rapide 65W",
                price: 39.99,
                status: "error" as const,
                issues: ["Prix incohérent", "Fournisseur non vérifié"],
                category: "Accessoires",
                supplier: "PowerPlus"
              }
            ]
            
            setImportResults(mockResults)
            
            // Mettre à jour l'enregistrement d'import
            updateImportRecord(importRecord.id, {
              status: 'completed',
              products_imported: mockResults.filter(r => r.status === 'success').length,
              errors_count: mockResults.filter(r => r.status === 'error').length
            })
            
            toast.success(`Import terminé ! ${mockResults.length} produits traités`)
            return 100
          }
          return prev + 10
        })
      }, 300)
    } catch (error) {
      setIsImporting(false)
      toast.error("Erreur lors de l'import")
    }
  }

  const handleQuickImport = () => {
    setSelectedMethod("url")
  }

  const handleValidateAll = () => {
    const validProducts = importResults.filter(r => r.status !== 'error')
    
    validProducts.forEach(product => {
      addProduct({
        name: product.name,
        price: product.price,
        cost_price: product.price * 0.6,
        category: product.category || "Divers",
        status: "active" as const,
        image_url: product.image_url,
        description: `Produit importé automatiquement: ${product.name}`
      })
    })
    
    toast.success(`${validProducts.length} produits ajoutés au catalogue !`)
    setImportResults([])
  }

  const handleEditProduct = (id: string) => {
    toast.info("Ouverture de l'éditeur de produit...")
  }

  const suppliers = [
    {
      name: "AliExpress",
      status: "connected",
      products: 245,
      logo: "🛒"
    },
    {
      name: "Amazon", 
      status: "available",
      products: 156,
      logo: "📦"
    },
    {
      name: "BigBuy",
      status: "connected",
      products: 89,
      logo: "🏪"
    },
    {
      name: "EPROLO",
      status: "available",
      products: 67,
      logo: "🚀"
    }
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Import Produits
            </h1>
            <p className="text-muted-foreground mt-2">
              Importez vos produits depuis n'importe quelle source avec l'IA
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                const csvTemplate = 'name,price,description,category,image_url\n"Produit Exemple",29.99,"Description du produit","Électronique","https://example.com/image.jpg"';
                const blob = new Blob([csvTemplate], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'template-import.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Template CSV
            </Button>
            <Link to="/import-ultra-pro">
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Zap className="mr-2 h-4 w-4" />
                Import Ultra Pro
              </Button>
            </Link>
            <Button variant="hero" onClick={handleQuickImport}>
              <Plus className="mr-2 h-4 w-4" />
              Import Rapide
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits importés</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                Total dans le catalogue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fournisseurs connectés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.filter(s => s.status === "connected").length}
              </div>
              <p className="text-xs text-muted-foreground">
                4 fournisseurs disponibles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                Import automatique réussi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Historique</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{importHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                Imports effectués
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="methods">Méthodes</TabsTrigger>
            <TabsTrigger value="smart">Import Smart</TabsTrigger>
            <TabsTrigger value="bulk">Import Masse</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Import depuis vos Fournisseurs
                </CardTitle>
                <CardDescription>
                  Connectez-vous directement à plus de 100 fournisseurs et marketplaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SupplierSelector />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-6">
            <ImportMethods 
              selectedMethod={selectedMethod}
              onMethodSelect={setSelectedMethod}
            />
            <ImportInterface 
              selectedMethod={selectedMethod}
              isImporting={isImporting}
              importProgress={importProgress}
              onImport={handleImport}
            />
            <ImportResults 
              results={importResults}
              onValidateAll={handleValidateAll}
              onEditProduct={handleEditProduct}
            />
          </TabsContent>

          <TabsContent value="smart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  Import Intelligent
                </CardTitle>
                <CardDescription>
                  L'IA analyse et optimise automatiquement vos imports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileImage className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Optimisation Images</h4>
                        <p className="text-sm text-muted-foreground">Redimensionnement & SEO auto</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => alert('Optimisation des images activée')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Activer
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Globe className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Traduction Auto</h4>
                        <p className="text-sm text-muted-foreground">Multi-langues avec IA</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => alert('Configuration de la traduction automatique')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Configurer
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Database className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Prix Dynamiques</h4>
                        <p className="text-sm text-muted-foreground">Ajustement automatique</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => alert('Prix dynamiques activés')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Activer
                    </Button>
                  </Card>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Dernières optimisations IA</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Images redimensionnées</span>
                      <Badge variant="outline">247 produits</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Descriptions améliorées</span>
                      <Badge variant="outline">156 produits</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Prix optimisés</span>
                      <Badge variant="outline">89 produits</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import en Masse</CardTitle>
                <CardDescription>
                  Importez des milliers de produits en une fois
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Options d'import</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Catalogue complet</div>
                          <div className="text-sm text-muted-foreground">Tous les produits disponibles</div>
                        </div>
                        <Button variant="outline" size="sm">Importer</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Produits tendances</div>
                          <div className="text-sm text-muted-foreground">Top 1000 cette semaine</div>
                        </div>
                        <Button variant="outline" size="sm">Importer</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Winners détectés</div>
                          <div className="text-sm text-muted-foreground">Sélection IA personnalisée</div>
                        </div>
                        <Button size="sm">Importer</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Progression</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Import en cours</span>
                          <span>2,847 / 5,000</span>
                        </div>
                        <Progress value={57} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">2,689</div>
                          <div className="text-xs text-green-600">Succès</div>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded">
                          <div className="text-lg font-bold text-yellow-600">158</div>
                          <div className="text-xs text-yellow-600">Warnings</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-600">23</div>
                          <div className="text-xs text-red-600">Erreurs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Imports Planifiés</CardTitle>
                    <CardDescription>
                      Automatisez vos imports avec des planifications personnalisées
                    </CardDescription>
                  </div>
                  <Button>
                    <Clock className="h-4 w-4 mr-2" />
                    Nouveau Planning
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleImports.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${schedule.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Fréquence: {schedule.frequency} • Prochaine exécution: {schedule.nextRun}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Modifier</Button>
                        <Button variant="outline" size="sm">
                          {schedule.active ? 'Pause' : 'Activer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Imports</CardTitle>
                <CardDescription>
                  Consultez tous vos imports passés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importHistory.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                          {record.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {record.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                          {record.status === 'processing' && <Clock className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <div className="font-medium">{record.source_type.toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.products_imported} produits • {new Date(record.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={record.status === 'completed' ? 'default' : record.status === 'failed' ? 'destructive' : 'secondary'}>
                          {record.status}
                        </Badge>
                        <Button variant="outline" size="sm">Détails</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Available Suppliers */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fournisseurs disponibles</CardTitle>
                <CardDescription>
                  Connectez-vous à vos fournisseurs pour un import automatique
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("schedule")}>
                <Settings className="w-4 h-4 mr-2" />
                Gérer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {suppliers.map((supplier, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.success(`Configuration de ${supplier.name}`)}>
                  <CardContent className="p-4">
                    <div className="text-3xl mb-2">{supplier.logo}</div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {supplier.products} produits
                    </p>
                    <Badge 
                      variant={supplier.status === 'connected' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {supplier.status === 'connected' ? '✓ Connecté' : 'Disponible'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default Import;