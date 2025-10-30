import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Zap, ShoppingCart, TrendingUp, Package, Settings, PlayCircle, ChevronRight } from 'lucide-react'

export default function QuickDropshippingPage() {
  const { toast } = useToast()
  const [autoImport, setAutoImport] = useState(false)
  const [autoFulfill, setAutoFulfill] = useState(false)
  const [priceOptimization, setPriceOptimization] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')

  const suppliers = [
    { id: 'aliexpress', name: 'AliExpress', products: '100M+' },
    { id: 'bigbuy', name: 'BigBuy', products: '150K+' },
    { id: 'cjdropshipping', name: 'CJ Dropshipping', products: '500K+' },
    { id: 'spocket', name: 'Spocket', products: '50K+ Premium' },
  ]

  const quickTemplates = [
    {
      id: 'winning-products',
      title: 'Produits Gagnants',
      description: 'Import automatique des top 100 produits tendance',
      icon: TrendingUp,
      config: { auto_import: true, filter: 'trending', limit: 100 }
    },
    {
      id: 'fashion-store',
      title: 'Boutique Mode',
      description: 'Vêtements & Accessoires pré-sélectionnés',
      icon: Package,
      config: { auto_import: true, category: 'fashion', limit: 500 }
    },
    {
      id: 'electronics',
      title: 'Tech & Gadgets',
      description: 'Électronique et gadgets innovants',
      icon: Zap,
      config: { auto_import: true, category: 'electronics', limit: 300 }
    },
  ]

  const handleQuickStart = async (template: typeof quickTemplates[0]) => {
    if (!selectedSupplier) {
      toast({
        title: "Fournisseur requis",
        description: "Sélectionnez d'abord un fournisseur",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Démarrage en cours...",
      description: `Configuration du store avec ${template.title}`,
    })

    // Simulation - En production, appeler l'edge function
    setTimeout(() => {
      toast({
        title: "Store configuré !",
        description: "Import des produits en cours...",
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Zap className="h-10 w-10 text-primary" />
              Mode Dropshipping Rapide
            </h1>
            <p className="text-muted-foreground mt-2">
              Lancez votre boutique en 5 minutes - Style AutoDS
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <PlayCircle className="h-5 w-5" />
            Tutoriel Vidéo
          </Button>
        </div>

        {/* Quick Setup Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Choisir Fournisseur</h3>
                <p className="text-sm text-muted-foreground">AliExpress, BigBuy, CJ...</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Template Produits</h3>
                <p className="text-sm text-muted-foreground">Mode, Tech, Tendances...</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Automatisation</h3>
                <p className="text-sm text-muted-foreground">100% automatique</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="quick-start" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-start">Démarrage Rapide</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-start" className="space-y-6">
            {/* Supplier Selection */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">1. Sélectionnez votre fournisseur</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {suppliers.map((supplier) => (
                  <Card
                    key={supplier.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedSupplier === supplier.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSupplier(supplier.id)}
                  >
                    <h4 className="font-semibold">{supplier.name}</h4>
                    <p className="text-sm text-muted-foreground">{supplier.products}</p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Template Selection */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">2. Choisissez un template</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {quickTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <Card key={template.id} className="p-6 space-y-4 hover:shadow-lg transition-all">
                      <Icon className="h-10 w-10 text-primary" />
                      <div>
                        <h4 className="font-semibold">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Button 
                        className="w-full gap-2" 
                        onClick={() => handleQuickStart(template)}
                        disabled={!selectedSupplier}
                      >
                        Démarrer <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="text-xl font-semibold">Règles d'automatisation</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Import automatique des produits</Label>
                    <p className="text-sm text-muted-foreground">
                      Importer automatiquement les nouveaux produits tendance
                    </p>
                  </div>
                  <Switch checked={autoImport} onCheckedChange={setAutoImport} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Traitement automatique des commandes</Label>
                    <p className="text-sm text-muted-foreground">
                      Passer les commandes automatiquement chez le fournisseur
                    </p>
                  </div>
                  <Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Optimisation des prix dynamique</Label>
                    <p className="text-sm text-muted-foreground">
                      Ajuster les prix selon la concurrence et les coûts
                    </p>
                  </div>
                  <Switch checked={priceOptimization} onCheckedChange={setPriceOptimization} />
                </div>

                <div className="space-y-3">
                  <Label>Marge bénéficiaire cible</Label>
                  <div className="flex gap-4 items-center">
                    <Input type="number" defaultValue="30" className="w-32" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Fréquence de synchronisation</Label>
                  <Select defaultValue="1hour">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                      <SelectItem value="1hour">Toutes les heures</SelectItem>
                      <SelectItem value="6hours">Toutes les 6 heures</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Sauvegarder les règles
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="text-xl font-semibold">Configuration avancée</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Filtre de prix minimum</Label>
                  <Input type="number" placeholder="10" />
                </div>

                <div className="space-y-3">
                  <Label>Filtre de prix maximum</Label>
                  <Input type="number" placeholder="1000" />
                </div>

                <div className="space-y-3">
                  <Label>Note minimum du fournisseur</Label>
                  <Select defaultValue="4.5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.0">4.0+ étoiles</SelectItem>
                      <SelectItem value="4.5">4.5+ étoiles</SelectItem>
                      <SelectItem value="4.8">4.8+ étoiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Délai de livraison max</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="60">60 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Appliquer les filtres
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits importés</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes auto</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de conversion</p>
                <p className="text-2xl font-bold">0%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Syncs actives</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
