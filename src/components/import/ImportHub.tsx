import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { usePlan } from '@/hooks/usePlan'
import { EnhancedImportInterface } from './EnhancedImportInterface'
import { AIWinnersDiscovery } from './AIWinnersDiscovery'
import { XMLJSONImportInterface } from './XMLJSONImportInterface'
import { VariantsManager } from './VariantsManager'
import { BulkEditor } from './BulkEditor'
import { AutomationRules } from './AutomationRules'
import { ImageImportInterface } from './ImageImportInterface'
import { DuplicateDetection } from './DuplicateDetection'
import { CategoryMapping } from './CategoryMapping'
import { SyncManager } from './SyncManager'
import { 
  Package, 
  Zap, 
  Globe, 
  FileSpreadsheet, 
  Image, 
  Bot,
  TrendingUp,
  Activity,
  CheckCircle
} from 'lucide-react'

export const ImportHub = () => {
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("methods")
  const [demoProducts, setDemoProducts] = useState([
    {
      id: '1',
      name: 'Casque Bluetooth Premium',
      sku: 'BT-HEAD-001',
      price: 89.99,
      costPrice: 45.00,
      category: 'Électronique',
      status: 'active',
      stock: 50,
      tags: ['bluetooth', 'audio', 'premium'],
      supplier: 'TechSupplier',
      margin: 100
    },
    {
      id: '2', 
      name: 'Montre Connectée Sport',
      sku: 'WATCH-SP-002',
      price: 199.99,
      costPrice: 120.00,
      category: 'Accessoires',
      status: 'active',
      stock: 25,
      tags: ['sport', 'montre', 'fitness'],
      supplier: 'SportTech',
      margin: 67
    }
  ])
  
  const [demoVariants, setDemoVariants] = useState([
    {
      id: 'var_1',
      sku: 'BT-HEAD-001-BLK',
      name: 'Casque Bluetooth - Noir',
      color: 'black',
      size: 'One Size',
      material: 'Plastique',
      price: 89.99,
      costPrice: 45.00,
      stock: 30,
      imageUrl: '',
      isActive: true
    },
    {
      id: 'var_2',
      sku: 'BT-HEAD-001-WHT', 
      name: 'Casque Bluetooth - Blanc',
      color: 'white',
      size: 'One Size',
      material: 'Plastique',
      price: 89.99,
      costPrice: 45.00,
      stock: 20,
      imageUrl: '',
      isActive: true
    }
  ])
  const { toast } = useToast()
  const { isPro, isUltraPro } = usePlan()

  const handleImport = async (data: any) => {
    setIsImporting(true)
    setImportProgress(0)

    const stages = [15, 35, 55, 75, 90, 100]
    for (const progress of stages) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImportProgress(progress)
    }

    setIsImporting(false)
    setImportProgress(0)
    
    toast({
      title: "Import réussi !",
      description: "Produit importé avec succès",
    })
  }

  const handleImportWinner = (productId: string) => {
    toast({
      title: "Winner importé !",
      description: "Le produit gagnant a été ajouté à votre catalogue",
    })
  }

  const quickStats = [
    { icon: Package, label: "Produits importés", value: "1,247", color: "text-blue-600" },
    { icon: TrendingUp, label: "Taux de réussite", value: "94.5%", color: "text-green-600" },
    { icon: Zap, label: "Temps moyen", value: "2.3s", color: "text-purple-600" },
    { icon: Activity, label: "Heures économisées", value: "156h", color: "text-orange-600" }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover-scale animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interface principale avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="methods" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="xmljson" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Flux
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Variantes
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Masse
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Auto
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Doublons
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            Winners
            {!isPro() && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="mt-6">
          <EnhancedImportInterface
            selectedMethod={selectedMethod}
            isImporting={isImporting}
            importProgress={importProgress}
            onImport={handleImport}
          />
        </TabsContent>

        <TabsContent value="xmljson" className="mt-6">
          <XMLJSONImportInterface onImport={handleImport} />
        </TabsContent>

        <TabsContent value="variants" className="mt-6">
          <VariantsManager 
            productId="demo-product-1"
            variants={demoVariants}
            onVariantsUpdate={setDemoVariants}
          />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkEditor 
            products={demoProducts}
            onProductsUpdate={setDemoProducts}
          />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <AutomationRules />
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <ImageImportInterface
            onProductsFound={(products) => {
              toast({
                title: "Produits détectés",
                description: `${products.length} produits trouvés via reconnaissance d'image`
              })
            }}
          />
        </TabsContent>

        <TabsContent value="duplicates" className="mt-6">
          <DuplicateDetection
            onDuplicatesResolved={(count) => {
              toast({
                title: "Doublons résolus",
                description: `${count} groupe(s) de doublons traité(s)`
              })
            }}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryMapping
            onRulesUpdated={(rules) => {
              console.log('Category rules updated:', rules)
            }}
          />
        </TabsContent>

        <TabsContent value="sync" className="mt-6">
          <SyncManager
            onSyncCompleted={(jobId, results) => {
              toast({
                title: "Synchronisation terminée",
                description: `Job ${jobId} complété avec succès`
              })
            }}
          />
        </TabsContent>

        <TabsContent value="winners" className="mt-6">
          {isPro() ? (
            <AIWinnersDiscovery onImportWinner={handleImportWinner} />
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Winners IA - Fonctionnalité Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Découvrez automatiquement les produits gagnants avec notre IA avancée
                </p>
                <Button>Passer au plan Pro</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}