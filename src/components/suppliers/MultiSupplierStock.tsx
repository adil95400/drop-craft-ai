import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface StockMapping {
  id: string
  product_id: string
  product_name: string
  primary_supplier: string
  backup_supplier?: string
  total_stock: number
  primary_stock: number
  backup_stock: number
  auto_switch: boolean
  min_threshold: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

// Mock data generator
const generateMockStockMappings = (): StockMapping[] => {
  const products = [
    'iPhone 15 Pro Case',
    'Samsung Galaxy S24 Screen Protector',
    'MacBook Pro 14" Sleeve',
    'AirPods Pro Case',
    'iPad Mini Cover',
    'Apple Watch Band',
    'Wireless Charger Pad',
    'USB-C Hub Adapter'
  ]
  
  const suppliers = ['Fournisseur A', 'Grossiste Europe', 'BTSWholesaler', 'Supplier Direct']
  
  return products.map((name, index) => {
    const primaryStock = Math.floor(Math.random() * 100)
    const backupStock = Math.floor(Math.random() * 50)
    const totalStock = primaryStock + backupStock
    const threshold = 10
    
    return {
      id: `mapping-${index}`,
      product_id: `prod-${index}`,
      product_name: name,
      primary_supplier: suppliers[index % suppliers.length],
      backup_supplier: index % 2 === 0 ? suppliers[(index + 1) % suppliers.length] : undefined,
      total_stock: totalStock,
      primary_stock: primaryStock,
      backup_stock: backupStock,
      auto_switch: index % 3 === 0,
      min_threshold: threshold,
      status: totalStock === 0 ? 'out_of_stock' : totalStock <= threshold ? 'low_stock' : 'in_stock'
    }
  })
}

export function MultiSupplierStock() {
  const [stockMappings, setStockMappings] = useState<StockMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadStockMappings()
  }, [])

  const loadStockMappings = async () => {
    try {
      // Load from localStorage or use mock data
      const stored = localStorage.getItem('product_supplier_mappings')
      if (stored) {
        setStockMappings(JSON.parse(stored))
      } else {
        const mockData = generateMockStockMappings()
        setStockMappings(mockData)
        localStorage.setItem('product_supplier_mappings', JSON.stringify(mockData))
      }
    } catch (error) {
      console.error('Error loading stock mappings:', error)
      toast.error('Erreur lors du chargement des stocks')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutoSwitch = async (mappingId: string, currentValue: boolean) => {
    try {
      const updatedMappings = stockMappings.map(m => 
        m.id === mappingId 
          ? { ...m, auto_switch: !currentValue }
          : m
      )
      setStockMappings(updatedMappings)
      localStorage.setItem('product_supplier_mappings', JSON.stringify(updatedMappings))
      
      toast.success('Basculement automatique ' + (!currentValue ? 'activé' : 'désactivé'))
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            En stock
          </Badge>
        )
      case 'low_stock':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Stock faible
          </Badge>
        )
      case 'out_of_stock':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Minus className="h-3 w-3 mr-1" />
            Rupture
          </Badge>
        )
    }
  }

  const getStockTrend = (primary: number, backup: number) => {
    const total = primary + backup
    if (total > 50) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (total < 10) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-yellow-600" />
  }

  const filteredMappings = stockMappings.filter(mapping => {
    const matchesSearch = mapping.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.primary_supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || mapping.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion des Stocks Multi-Fournisseurs
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadStockMappings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un produit ou fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock faible</SelectItem>
              <SelectItem value="out_of_stock">Rupture</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <p className="text-sm text-muted-foreground">En stock</p>
            <p className="text-2xl font-bold text-green-600">
              {stockMappings.filter(m => m.status === 'in_stock').length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
            <p className="text-sm text-muted-foreground">Stock faible</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stockMappings.filter(m => m.status === 'low_stock').length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
            <p className="text-sm text-muted-foreground">Rupture</p>
            <p className="text-2xl font-bold text-red-600">
              {stockMappings.filter(m => m.status === 'out_of_stock').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Fournisseur Principal</TableHead>
              <TableHead>Fournisseur Backup</TableHead>
              <TableHead>Stock Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Auto-Switch</TableHead>
              <TableHead>Tendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.product_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{mapping.primary_supplier}</p>
                      <p className="text-xs text-muted-foreground">
                        {mapping.primary_stock} unités
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.backup_supplier ? (
                      <div>
                        <p className="font-medium">{mapping.backup_supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {mapping.backup_stock} unités
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{mapping.total_stock}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(mapping.status)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={mapping.auto_switch}
                      onCheckedChange={() => toggleAutoSwitch(mapping.id, mapping.auto_switch)}
                    />
                  </TableCell>
                  <TableCell>
                    {getStockTrend(mapping.primary_stock, mapping.backup_stock)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}