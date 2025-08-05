import React, { useState } from "react"
import { ImportHeader } from "@/components/import/ImportHeader"
import { ImportMethods } from "@/components/import/ImportMethods"
import { ImportInterface } from "@/components/import/ImportInterface"
import { ImportResults } from "@/components/import/ImportResults"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Package, TrendingUp, Zap, History, Settings } from "lucide-react"
import { toast } from "sonner"
import { useProducts } from "@/hooks/useProducts"
import { AppLayout } from "@/layouts/AppLayout"

const Import = () => {
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<any[]>([])
  const { products, addProduct } = useProducts()

  const handleImport = (importData: any) => {
    setIsImporting(true)
    setImportProgress(0)
    setImportResults([])

    const interval = setInterval(() => {
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
          toast.success(`Import terminé ! ${mockResults.length} produits traités`)
          return 100
        }
        return prev + 10
      })
    }, 300)
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
        cost: product.price * 0.6,
        margin: 40,
        supplier: product.supplier,
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
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8">
      <ImportHeader 
        importCount={products.length}
        onQuickImport={handleQuickImport}
      />

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
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              Imports ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

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
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Gérer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suppliers.map((supplier, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
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
    </AppLayout>
  )
}

export default Import