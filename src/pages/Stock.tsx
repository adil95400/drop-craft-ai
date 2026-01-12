import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Package, Search, Plus, Loader2, Warehouse, TrendingDown, DollarSign } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ChannablePageWrapper, ChannableStatsGrid } from '@/components/channable'

interface StockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  price: number;
  status: string;
}

const Stock = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  const [stockData, setStockData] = useState<StockItem[]>([
    { id: '1', name: 'iPhone 15 Pro', sku: 'IP15-PRO-256', currentStock: 45, minStock: 20, price: 1199, status: 'in_stock' },
    { id: '2', name: 'Samsung Galaxy S24', sku: 'SGS24-128', currentStock: 8, minStock: 15, price: 899, status: 'low_stock' },
    { id: '3', name: 'MacBook Air M3', sku: 'MBA-M3-512', currentStock: 0, minStock: 5, price: 1499, status: 'out_of_stock' }
  ])

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    currentStock: '',
    minStock: '',
    price: '',
    status: 'in_stock'
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">En stock</Badge>
      case 'low_stock': return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Stock faible</Badge>
      case 'out_of_stock': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rupture</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredStock = stockData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) {
      toast({
        title: "Erreur",
        description: "Le nom et le SKU sont requis",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentStock = parseInt(newProduct.currentStock) || 0;
    const minStock = parseInt(newProduct.minStock) || 10;
    
    let status = 'in_stock';
    if (currentStock === 0) status = 'out_of_stock';
    else if (currentStock <= minStock) status = 'low_stock';

    const product: StockItem = {
      id: Date.now().toString(),
      name: newProduct.name,
      sku: newProduct.sku,
      currentStock,
      minStock,
      price: parseFloat(newProduct.price) || 0,
      status
    };

    setStockData([...stockData, product]);
    setShowAddModal(false);
    setNewProduct({ name: '', sku: '', currentStock: '', minStock: '', price: '', status: 'in_stock' });
    setIsAdding(false);

    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté au stock`,
    });
  };

  const lowStockCount = stockData.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;
  const totalValue = stockData.reduce((acc, item) => acc + (item.price * item.currentStock), 0);
  const totalUnits = stockData.reduce((acc, item) => acc + item.currentStock, 0);

  const stats = [
    {
      label: 'Produits en stock',
      value: stockData.length,
      icon: Package,
      color: 'primary' as const,
    },
    {
      label: 'Alertes stock',
      value: lowStockCount,
      icon: AlertTriangle,
      color: 'destructive' as const,
      trend: lowStockCount > 0 ? 'down' as const : undefined,
    },
    {
      label: 'Valeur totale',
      value: `${totalValue.toLocaleString()} €`,
      icon: DollarSign,
      color: 'success' as const,
    },
    {
      label: 'Unités totales',
      value: totalUnits,
      icon: Warehouse,
      color: 'info' as const,
    },
  ];

  return (
    <ChannablePageWrapper
      title="Gestion des Stocks"
      subtitle="Inventaire"
      description="Gérez votre inventaire, suivez les niveaux de stock et recevez des alertes automatiques."
      heroImage="stock"
      badge={{ label: `${stockData.length} produits`, icon: Package }}
      actions={
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un produit
        </Button>
      }
    >
      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} columns={4} />

      {/* Table Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom ou SKU..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9" 
              />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Stock min</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className={item.currentStock <= item.minStock ? 'text-destructive font-bold' : 'text-green-600 font-bold'}>
                    {item.currentStock}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.minStock}</TableCell>
                  <TableCell>{item.price} €</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStock.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un produit au stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input 
                placeholder="Ex: iPhone 15 Pro"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input 
                placeholder="Ex: IP15-PRO-256"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock actuel</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newProduct.currentStock}
                  onChange={(e) => setNewProduct({...newProduct, currentStock: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock minimum</Label>
                <Input 
                  type="number"
                  placeholder="10"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prix (€)</Label>
              <Input 
                type="number"
                placeholder="0.00"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button onClick={handleAddProduct} disabled={isAdding}>
              {isAdding ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ajout...</>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  )
}

export default Stock
