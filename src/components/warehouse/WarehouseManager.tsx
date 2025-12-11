import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Warehouse, Plus, MapPin, Package, Truck, Settings2,
  AlertTriangle, CheckCircle2, RefreshCw, BarChart3,
  Globe, Clock, DollarSign, ArrowRightLeft, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface WarehouseData {
  id: string
  name: string
  location: string
  country: string
  type: 'owned' | '3pl' | 'supplier'
  provider?: string
  totalCapacity: number
  usedCapacity: number
  productCount: number
  status: 'active' | 'inactive' | 'maintenance'
  autoFulfill: boolean
  shippingZones: string[]
  avgShippingTime: number
}

interface ThreePLProvider {
  id: string
  name: string
  logo: string
  countries: string[]
  avgCost: number
  connected: boolean
}

const MOCK_WAREHOUSES: WarehouseData[] = [
  {
    id: '1',
    name: 'Entrepôt Principal',
    location: 'Paris, France',
    country: 'FR',
    type: 'owned',
    totalCapacity: 10000,
    usedCapacity: 6500,
    productCount: 1245,
    status: 'active',
    autoFulfill: true,
    shippingZones: ['FR', 'BE', 'DE', 'ES'],
    avgShippingTime: 2
  },
  {
    id: '2',
    name: 'CJ Dropshipping',
    location: 'Shenzhen, Chine',
    country: 'CN',
    type: '3pl',
    provider: 'CJ Dropshipping',
    totalCapacity: 50000,
    usedCapacity: 12000,
    productCount: 3420,
    status: 'active',
    autoFulfill: true,
    shippingZones: ['Worldwide'],
    avgShippingTime: 12
  },
  {
    id: '3',
    name: 'BigBuy EU',
    location: 'Valence, Espagne',
    country: 'ES',
    type: 'supplier',
    provider: 'BigBuy',
    totalCapacity: 25000,
    usedCapacity: 8900,
    productCount: 856,
    status: 'active',
    autoFulfill: false,
    shippingZones: ['EU'],
    avgShippingTime: 4
  }
]

const THREE_PL_PROVIDERS: ThreePLProvider[] = [
  { id: '1', name: 'CJ Dropshipping', logo: '/placeholder.svg', countries: ['CN', 'US', 'EU'], avgCost: 3.5, connected: true },
  { id: '2', name: 'ShipBob', logo: '/placeholder.svg', countries: ['US', 'CA', 'UK', 'EU'], avgCost: 5.2, connected: false },
  { id: '3', name: 'Printful', logo: '/placeholder.svg', countries: ['US', 'EU', 'MX'], avgCost: 4.8, connected: false },
  { id: '4', name: 'Eprolo', logo: '/placeholder.svg', countries: ['CN', 'US'], avgCost: 2.9, connected: false },
  { id: '5', name: 'BigBuy', logo: '/placeholder.svg', countries: ['ES', 'EU'], avgCost: 4.2, connected: true },
]

export function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>(MOCK_WAREHOUSES)
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const totalProducts = warehouses.reduce((sum, w) => sum + w.productCount, 0)
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.totalCapacity, 0)
  const usedCapacity = warehouses.reduce((sum, w) => sum + w.usedCapacity, 0)

  const handleSync = async () => {
    setIsSyncing(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsSyncing(false)
    toast.success('Stocks synchronisés avec succès')
  }

  const toggleAutoFulfill = (id: string) => {
    setWarehouses(prev => prev.map(w => 
      w.id === id ? { ...w, autoFulfill: !w.autoFulfill } : w
    ))
    toast.success('Paramètres mis à jour')
  }

  const connect3PL = (provider: ThreePLProvider) => {
    toast.success(`Connexion à ${provider.name} initiée`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="h-8 w-8" />
            Gestion Multi-Entrepôts
          </h1>
          <p className="text-muted-foreground">
            Gérez vos stocks et prestataires logistiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchroniser
          </Button>
          <Dialog open={isAddingWarehouse} onOpenChange={setIsAddingWarehouse}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un entrepôt</DialogTitle>
                <DialogDescription>
                  Configurez un nouvel entrepôt ou connectez un prestataire 3PL
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom de l'entrepôt</Label>
                  <Input placeholder="Ex: Entrepôt Europe" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Entrepôt propre</SelectItem>
                      <SelectItem value="3pl">Prestataire 3PL</SelectItem>
                      <SelectItem value="supplier">Fournisseur direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input placeholder="Ville, Pays" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingWarehouse(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  toast.success('Entrepôt ajouté')
                  setIsAddingWarehouse(false)
                }}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouses.length}</p>
                <p className="text-xs text-muted-foreground">Entrepôts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Produits totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round((usedCapacity / totalCapacity) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Capacité utilisée</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Truck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouses.filter(w => w.autoFulfill).length}</p>
                <p className="text-xs text-muted-foreground">Auto-fulfillment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="3pl">Prestataires 3PL</TabsTrigger>
          <TabsTrigger value="rules">Règles d'allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Délai moy.</TableHead>
                  <TableHead>Auto-fulfill</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map(warehouse => (
                  <TableRow key={warehouse.id}>
                    <TableCell>
                      <div className="font-medium">{warehouse.name}</div>
                      {warehouse.provider && (
                        <div className="text-xs text-muted-foreground">{warehouse.provider}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.type === 'owned' ? 'default' : 'secondary'}>
                        {warehouse.type === 'owned' ? 'Propre' : 
                         warehouse.type === '3pl' ? '3PL' : 'Fournisseur'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {warehouse.location}
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.productCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress 
                          value={(warehouse.usedCapacity / warehouse.totalCapacity) * 100} 
                          className="h-2 w-20"
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round((warehouse.usedCapacity / warehouse.totalCapacity) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {warehouse.avgShippingTime}j
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={warehouse.autoFulfill}
                        onCheckedChange={() => toggleAutoFulfill(warehouse.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                        {warehouse.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {warehouse.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="3pl" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THREE_PL_PROVIDERS.map(provider => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={provider.logo} 
                        alt={provider.name} 
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {provider.countries.join(', ')}
                        </p>
                      </div>
                    </div>
                    {provider.connected && (
                      <Badge className="bg-green-500">Connecté</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>~{provider.avgCost}€/envoi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.countries.length} régions</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant={provider.connected ? 'outline' : 'default'}
                    onClick={() => connect3PL(provider)}
                  >
                    {provider.connected ? (
                      <>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Configurer
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Connecter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'allocation automatique</CardTitle>
              <CardDescription>
                Configurez comment les commandes sont réparties entre vos entrepôts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Priorité par zone géographique</h4>
                  <p className="text-sm text-muted-foreground">
                    Utiliser l'entrepôt le plus proche du client
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Équilibrage de charge</h4>
                  <p className="text-sm text-muted-foreground">
                    Répartir les commandes selon la capacité disponible
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Fallback automatique</h4>
                  <p className="text-sm text-muted-foreground">
                    Basculer vers un autre entrepôt si rupture de stock
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Optimisation des coûts</h4>
                  <p className="text-sm text-muted-foreground">
                    Privilégier les entrepôts avec les frais les plus bas
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
