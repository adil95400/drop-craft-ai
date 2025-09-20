import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, Edit3, Check, X, AlertTriangle, Image as ImageIcon } from 'lucide-react'

interface ProductPreview {
  id: string
  name: string
  description: string
  price: number
  sku: string
  category: string
  brand: string
  stock_quantity: number
  image_url: string
  weight?: number
  dimensions?: string
  row_number: number
  validation_status: 'valid' | 'warning' | 'error'
  validation_messages: string[]
}

interface ImportPreviewProps {
  products: ProductPreview[]
  onProductUpdate: (id: string, updates: Partial<ProductPreview>) => void
  onValidateAll: () => void
  onImportConfirm: () => void
  isValidating?: boolean
  isImporting?: boolean
}

export function ImportPreview({ 
  products, 
  onProductUpdate, 
  onValidateAll, 
  onImportConfirm,
  isValidating = false,
  isImporting = false
}: ImportPreviewProps) {
  const [editingProduct, setEditingProduct] = useState<ProductPreview | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all')

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || product.validation_status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: products.length,
    valid: products.filter(p => p.validation_status === 'valid').length,
    warnings: products.filter(p => p.validation_status === 'warning').length,
    errors: products.filter(p => p.validation_status === 'error').length
  }

  const handleSaveProduct = (product: ProductPreview) => {
    onProductUpdate(product.id, product)
    setEditingProduct(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <Check className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error': return <X className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground">Valides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <p className="text-xs text-muted-foreground">Avertissements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">Erreurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles d'import</CardTitle>
          <CardDescription>
            Validez et ajustez vos produits avant l'import final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou SKU du produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'valid', 'warning', 'error'] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'Tous' : 
                   status === 'valid' ? 'Valides' :
                   status === 'warning' ? 'Avertissements' : 'Erreurs'}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              onClick={onValidateAll} 
              disabled={isValidating}
              variant="outline"
            >
              {isValidating ? 'Validation...' : 'Re-valider tout'}
            </Button>
            <Button 
              onClick={onImportConfirm}
              disabled={stats.errors > 0 || isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isImporting ? 'Import en cours...' : `Importer ${stats.valid} produits`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu des produits ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(product.validation_status)}
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(product.validation_status)}
                        >
                          {product.validation_status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-48">
                      <div className="truncate" title={product.name}>
                        {product.name}
                      </div>
                      {product.validation_messages.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {product.validation_messages[0]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.price.toFixed(2)}€</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{product.stock_quantity || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails du produit</DialogTitle>
                              <DialogDescription>
                                Ligne {product.row_number} - {product.name}
                              </DialogDescription>
                            </DialogHeader>
                            <ProductDetailView product={product} />
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={editingProduct?.id === product.id} onOpenChange={(open) => !open && setEditingProduct(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Modifier le produit</DialogTitle>
                              <DialogDescription>
                                Ligne {product.row_number}
                              </DialogDescription>
                            </DialogHeader>
                            {editingProduct && (
                              <ProductEditForm 
                                product={editingProduct}
                                onChange={setEditingProduct}
                                onSave={handleSaveProduct}
                                onCancel={() => setEditingProduct(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductDetailView({ product }: { product: ProductPreview }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Nom</Label>
          <p className="text-sm">{product.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground">
            {product.description || 'Aucune description'}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Prix</Label>
          <p className="text-sm">{product.price.toFixed(2)}€</p>
        </div>
        <div>
          <Label className="text-sm font-medium">SKU</Label>
          <p className="text-sm">{product.sku || 'Non défini'}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Catégorie</Label>
          <p className="text-sm">{product.category || 'Non définie'}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Marque</Label>
          <p className="text-sm">{product.brand || 'Non définie'}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Stock</Label>
          <p className="text-sm">{product.stock_quantity || 0}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Image</Label>
          {product.image_url ? (
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <a href={product.image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                Voir l'image
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune image</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductEditForm({ 
  product, 
  onChange, 
  onSave, 
  onCancel 
}: { 
  product: ProductPreview
  onChange: (product: ProductPreview) => void
  onSave: (product: ProductPreview) => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            value={product.name}
            onChange={(e) => onChange({...product, name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="price">Prix *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => onChange({...product, price: parseFloat(e.target.value) || 0})}
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={product.sku}
            onChange={(e) => onChange({...product, sku: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Input
            id="category"
            value={product.category}
            onChange={(e) => onChange({...product, category: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="brand">Marque</Label>
          <Input
            id="brand"
            value={product.brand}
            onChange={(e) => onChange({...product, brand: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={product.stock_quantity}
            onChange={(e) => onChange({...product, stock_quantity: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={product.description}
          onChange={(e) => onChange({...product, description: e.target.value})}
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="image_url">URL de l'image</Label>
        <Input
          id="image_url"
          value={product.image_url}
          onChange={(e) => onChange({...product, image_url: e.target.value})}
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="outline">
          Annuler
        </Button>
        <Button onClick={() => onSave(product)}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}