import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileText, Globe, Database, Download, CheckCircle, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealProducts } from '@/hooks/useRealProducts'

interface ProductExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductExportDialog({ open, onOpenChange }: ProductExportDialogProps) {
  const [exportFormat, setExportFormat] = useState('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    sku: true,
    price: true,
    cost_price: true,
    description: true,
    category: true,
    stock_quantity: true,
    status: true,
    image_url: false,
    created_at: false,
    updated_at: false
  })
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    stock_level: 'all'
  })
  
  const { products, stats } = useRealProducts()
  const { toast } = useToast()

  const exportFormats = [
    {
      id: 'csv',
      title: 'CSV',
      description: 'Compatible avec Excel et Google Sheets',
      icon: FileText,
      badge: 'Populaire'
    },
    {
      id: 'json',
      title: 'JSON',
      description: 'Format structuré pour développeurs',
      icon: Database,
      badge: 'API'
    },
    {
      id: 'shopify',
      title: 'Shopify CSV',
      description: 'Format optimisé pour Shopify',
      icon: Globe,
      badge: 'E-commerce'
    },
    {
      id: 'woocommerce',
      title: 'WooCommerce CSV',
      description: 'Format optimisé pour WooCommerce',
      icon: Globe,
      badge: 'WordPress'
    }
  ]

  const availableFields = [
    { id: 'name', label: 'Nom du produit', required: true },
    { id: 'sku', label: 'SKU', required: false },
    { id: 'price', label: 'Prix de vente', required: true },
    { id: 'cost_price', label: 'Prix de revient', required: false },
    { id: 'description', label: 'Description', required: false },
    { id: 'category', label: 'Catégorie', required: false },
    { id: 'stock_quantity', label: 'Quantité en stock', required: false },
    { id: 'status', label: 'Statut', required: false },
    { id: 'image_url', label: 'URL de l\'image', required: false },
    { id: 'created_at', label: 'Date de création', required: false },
    { id: 'updated_at', label: 'Date de modification', required: false },
    { id: 'profit_margin', label: 'Marge bénéficiaire', required: false },
  ]

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulation de l'export avec progress
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 20
        })
      }, 300)

      // Attendre la fin de la simulation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Créer et télécharger le fichier
      const filteredProducts = products.filter(product => {
        if (filters.status !== 'all' && product.status !== filters.status) return false
        if (filters.category !== 'all' && product.category !== filters.category) return false
        if (filters.stock_level === 'low' && (product.stock_quantity || 0) >= 10) return false
        if (filters.stock_level === 'out' && (product.stock_quantity || 0) > 0) return false
        return true
      })

      const selectedFieldKeys = Object.entries(selectedFields)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key)

      let content = ''
      let filename = ''

      if (exportFormat === 'csv' || exportFormat === 'shopify' || exportFormat === 'woocommerce') {
        // Generate CSV
        const headers = selectedFieldKeys.map(key => 
          availableFields.find(f => f.id === key)?.label || key
        ).join(',')
        
        const rows = filteredProducts.map(product => 
          selectedFieldKeys.map(key => {
            const value = product[key as keyof typeof product] || ''
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          }).join(',')
        ).join('\n')
        
        content = headers + '\n' + rows
        filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      } else if (exportFormat === 'json') {
        // Generate JSON
        const exportData = filteredProducts.map(product => {
          const filtered: any = {}
          selectedFieldKeys.forEach(key => {
            filtered[key] = product[key as keyof typeof product]
          })
          return filtered
        })
        
        content = JSON.stringify({
          metadata: {
            exportDate: new Date().toISOString(),
            totalProducts: exportData.length,
            fields: selectedFieldKeys
          },
          products: exportData
        }, null, 2)
        filename = `products_export_${new Date().toISOString().split('T')[0]}.json`
      }

      // Download file
      const blob = new Blob([content], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export terminé",
        description: `${filteredProducts.length} produits exportés avec succès`,
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const filteredProductsCount = products.filter(product => {
    if (filters.status !== 'all' && product.status !== filters.status) return false
    if (filters.category !== 'all' && product.category !== filters.category) return false
    if (filters.stock_level === 'low' && (product.stock_quantity || 0) >= 10) return false
    if (filters.stock_level === 'out' && (product.stock_quantity || 0) > 0) return false
    return true
  }).length

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exporter des Produits</DialogTitle>
        </DialogHeader>

        {isExporting ? (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2">Export en cours...</h3>
              <p className="text-muted-foreground">
                Génération de votre fichier d'export
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{filteredProductsCount}</div>
              <div className="text-sm text-muted-foreground">Produits à exporter</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Export Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      {filteredProductsCount} produits seront exportés
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {Object.values(selectedFields).filter(Boolean).length} champs
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Format Selection */}
            <div>
              <Label className="text-base font-medium mb-4 block">Format d'export</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map((format) => (
                  <Card 
                    key={format.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      exportFormat === format.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <format.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{format.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {format.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres d'export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <Select value={filters.status} onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, status: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Actif uniquement</SelectItem>
                        <SelectItem value="inactive">Inactif uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Catégorie</Label>
                    <Select value={filters.category} onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Niveau de stock</Label>
                    <Select value={filters.stock_level} onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, stock_level: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux</SelectItem>
                        <SelectItem value="low">Stock faible</SelectItem>
                        <SelectItem value="out">Rupture de stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Champs à exporter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields[field.id as keyof typeof selectedFields]}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                        disabled={field.required}
                      />
                      <Label 
                        htmlFor={field.id} 
                        className={`text-sm ${field.required ? 'font-medium' : ''}`}
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  * Champs obligatoires
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleExport} disabled={filteredProductsCount === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exporter {filteredProductsCount} produits
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}