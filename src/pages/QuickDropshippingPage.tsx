import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useQuickDropshipping } from '@/hooks/useQuickDropshipping'
import { Zap, ShoppingCart, TrendingUp, Package, Settings, PlayCircle, ChevronRight, Loader2 } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function QuickDropshippingPage() {
  const { toast } = useToast()
  const { config, stats, setupStore, isSettingUp, updateAutomationRules, isUpdatingRules, syncInventory, isSyncing, optimizePrices, isOptimizing } = useQuickDropshipping()
  
  const [autoImport, setAutoImport] = useState((config as any)?.auto_import || false)
  const [autoFulfill, setAutoFulfill] = useState((config as any)?.auto_fulfill || false)
  const [priceOptimization, setPriceOptimization] = useState((config as any)?.price_optimization ?? true)
  const [targetMargin, setTargetMargin] = useState((config as any)?.target_margin || 30)
  const [syncFrequency, setSyncFrequency] = useState((config as any)?.sync_frequency || '1hour')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [minPrice, setMinPrice] = useState<number>()
  const [maxPrice, setMaxPrice] = useState<number>()
  const [minRating, setMinRating] = useState('4.5')
  const [maxShippingDays, setMaxShippingDays] = useState('30')

  const suppliers = [
    { id: 'aliexpress', name: 'AliExpress', products: '100M+' },
    { id: 'bigbuy', name: 'BigBuy', products: '150K+' },
    { id: 'cjdropshipping', name: 'CJ Dropshipping', products: '500K+' },
    { id: 'spocket', name: 'Spocket', products: '50K+ Premium' },
  ]

  const quickTemplates = [
    { id: 'winning-products', title: 'Produits Gagnants', description: 'Import automatique des top 100 produits tendance', icon: TrendingUp, config: { auto_import: true, filter: 'trending', limit: 100 } },
    { id: 'fashion-store', title: 'Boutique Mode', description: 'Vêtements & Accessoires pré-sélectionnés', icon: Package, config: { auto_import: true, category: 'fashion', limit: 500 } },
    { id: 'electronics', title: 'Tech & Gadgets', description: 'Électronique et gadgets innovants', icon: Zap, config: { auto_import: true, category: 'electronics', limit: 300 } },
  ]

  const handleQuickStart = (template: typeof quickTemplates[0]) => {
    if (!selectedSupplier) {
      toast({ title: "Fournisseur requis", description: "Sélectionnez d'abord un fournisseur", variant: "destructive" })
      return
    }
    setupStore({ template, supplier: selectedSupplier, automationRules: { autoImport, autoFulfill, priceOptimization, targetMargin, syncFrequency } })
  }

  const handleSaveRules = () => {
    updateAutomationRules({ autoImport, autoFulfill, priceOptimization, targetMargin, syncFrequency, filters: { minPrice, maxPrice, minRating: parseFloat(minRating), maxShippingDays: parseInt(maxShippingDays) } })
  }

  return (
    <ChannablePageWrapper
      title="Mode Dropshipping Rapide"
      description="Lancez votre boutique en 5 minutes — Style AutoDS"
      heroImage="products"
      badge={{ label: 'Quick Start', icon: Zap }}
      actions={
        <Button size="lg" className="gap-2"><PlayCircle className="h-5 w-5" />Tutoriel Vidéo</Button>
      }
    >
      {/* Quick Setup Steps */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { step: '1', title: 'Choisir Fournisseur', desc: 'AliExpress, BigBuy, CJ...' },
          { step: '2', title: 'Template Produits', desc: 'Mode, Tech, Tendances...' },
          { step: '3', title: 'Automatisation', desc: '100% automatique' },
        ].map(s => (
          <Card key={s.step} className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{s.step}</span>
              </div>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="quick-start" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-start">Démarrage Rapide</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-start" className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xl font-semibold">1. Sélectionnez votre fournisseur</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className={`p-4 cursor-pointer transition-all hover:shadow-lg ${selectedSupplier === supplier.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedSupplier(supplier.id)}>
                  <h4 className="font-semibold">{supplier.name}</h4>
                  <p className="text-sm text-muted-foreground">{supplier.products}</p>
                </Card>
              ))}
            </div>
          </Card>
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
                    <Button className="w-full gap-2" onClick={() => handleQuickStart(template)} disabled={!selectedSupplier || isSettingUp}>
                      {isSettingUp ? <><Loader2 className="h-4 w-4 animate-spin" />Configuration...</> : <>Démarrer <ChevronRight className="h-4 w-4" /></>}
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
              <div className="flex items-center justify-between"><div className="space-y-1"><Label>Import automatique des produits</Label><p className="text-sm text-muted-foreground">Importer automatiquement les nouveaux produits tendance</p></div><Switch checked={autoImport} onCheckedChange={setAutoImport} /></div>
              <div className="flex items-center justify-between"><div className="space-y-1"><Label>Traitement automatique des commandes</Label><p className="text-sm text-muted-foreground">Passer les commandes automatiquement chez le fournisseur</p></div><Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} /></div>
              <div className="flex items-center justify-between"><div className="space-y-1"><Label>Optimisation des prix dynamique</Label><p className="text-sm text-muted-foreground">Ajuster les prix selon la concurrence et les coûts</p></div><Switch checked={priceOptimization} onCheckedChange={setPriceOptimization} /></div>
              <div className="space-y-3"><Label>Marge bénéficiaire cible</Label><div className="flex gap-4 items-center"><Input type="number" value={targetMargin} onChange={(e) => setTargetMargin(parseFloat(e.target.value))} className="w-32" /><span className="text-sm text-muted-foreground">%</span></div></div>
              <div className="space-y-3"><Label>Fréquence de synchronisation</Label><Select value={syncFrequency} onValueChange={setSyncFrequency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15min">Toutes les 15 minutes</SelectItem><SelectItem value="1hour">Toutes les heures</SelectItem><SelectItem value="6hours">Toutes les 6 heures</SelectItem><SelectItem value="daily">Quotidien</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" size="lg" onClick={handleSaveRules} disabled={isUpdatingRules}>{isUpdatingRules ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sauvegarder</Button>
              <Button variant="outline" size="lg" onClick={() => syncInventory()} disabled={isSyncing}>{isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sync Stock</Button>
              <Button variant="outline" size="lg" onClick={() => optimizePrices()} disabled={isOptimizing}>{isOptimizing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Optimiser Prix</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-xl font-semibold">Configuration avancée</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3"><Label>Filtre de prix minimum</Label><Input type="number" placeholder="10" value={minPrice} onChange={(e) => setMinPrice(parseFloat(e.target.value))} /></div>
              <div className="space-y-3"><Label>Filtre de prix maximum</Label><Input type="number" placeholder="1000" value={maxPrice} onChange={(e) => setMaxPrice(parseFloat(e.target.value))} /></div>
              <div className="space-y-3"><Label>Note minimum du fournisseur</Label><Select value={minRating} onValueChange={setMinRating}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4.0">4.0+ étoiles</SelectItem><SelectItem value="4.5">4.5+ étoiles</SelectItem><SelectItem value="4.8">4.8+ étoiles</SelectItem></SelectContent></Select></div>
              <div className="space-y-3"><Label>Délai de livraison max</Label><Select value={maxShippingDays} onValueChange={setMaxShippingDays}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 jours</SelectItem><SelectItem value="30">30 jours</SelectItem><SelectItem value="60">60 jours</SelectItem></SelectContent></Select></div>
            </div>
            <Button className="w-full" size="lg" onClick={handleSaveRules} disabled={isUpdatingRules}>{isUpdatingRules ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Appliquer les filtres</Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Produits importés</p><p className="text-2xl font-bold">{stats?.products || 0}</p></div><Package className="h-8 w-8 text-muted-foreground" /></div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Commandes auto</p><p className="text-2xl font-bold">{stats?.autoOrders || 0}</p></div><ShoppingCart className="h-8 w-8 text-muted-foreground" /></div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Taux de conversion</p><p className="text-2xl font-bold">{stats?.products ? Math.round((stats.autoOrders / stats.products) * 100) : 0}%</p></div><TrendingUp className="h-8 w-8 text-muted-foreground" /></div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Syncs actives</p><p className="text-2xl font-bold">{stats?.syncs || 0}</p></div><Settings className={`h-8 w-8 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} /></div></Card>
      </div>
    </ChannablePageWrapper>
  )
}
