import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, FileText, Globe, 
  ShoppingCart, Package, CheckCircle 
} from 'lucide-react'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  selectedProducts: string[]
}

export function ExportModal({ open, onClose, selectedProducts }: ExportModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [includeImages, setIncludeImages] = useState(true)
  const [includeStock, setIncludeStock] = useState(true)
  const [includeMetrics, setIncludeMetrics] = useState(false)

  const handleExport = async (type: string) => {
    setLoading(true)
    
    // Simulation d'export
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Export terminé",
        description: `${selectedProducts.length > 0 ? selectedProducts.length : 'Tous les'} produits exportés avec succès.`
      })
      onClose()
    }, 2000)
  }

  const exportOptions = [
    {
      id: 'csv',
      name: 'CSV/Excel',
      description: 'Format standard pour tableurs',
      icon: FileText,
      formats: ['CSV', 'Excel (.xlsx)']
    },
    {
      id: 'marketplace',
      name: 'Marketplaces',
      description: 'Export vers plateformes e-commerce',
      icon: ShoppingCart,
      formats: ['Amazon', 'eBay', 'Etsy', 'Shopify']
    },
    {
      id: 'feed',
      name: 'Flux Produits',
      description: 'Flux XML pour Google Shopping, Facebook',
      icon: Globe,
      formats: ['Google Shopping', 'Facebook Catalog', 'RSS Feed']
    },
    {
      id: 'inventory',
      name: 'Gestion Stock',
      description: 'Export pour systèmes de gestion',
      icon: Package,
      formats: ['WMS', 'ERP', 'Custom API']
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter les Produits
            {selectedProducts.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedProducts.length} sélectionnés)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exportOptions.map((option) => (
            <div key={option.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <option.icon className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{option.name}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {option.formats.map((format) => (
                  <div key={format} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{format}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => handleExport(option.id)} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Export...' : `Exporter ${option.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* Options d'export */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Options d'export</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="format">Format de fichier</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Encodage</Label>
                <Select defaultValue="utf8">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf8">UTF-8</SelectItem>
                    <SelectItem value="latin1">Latin-1</SelectItem>
                    <SelectItem value="windows1252">Windows-1252</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Données à inclure</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="images" 
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(checked === true)}
                  />
                  <Label htmlFor="images">URLs des images</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stock" 
                    checked={includeStock}
                    onCheckedChange={(checked) => setIncludeStock(checked === true)}
                  />
                  <Label htmlFor="stock">Données de stock</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metrics" 
                    checked={includeMetrics}
                    onCheckedChange={(checked) => setIncludeMetrics(checked === true)}
                  />
                  <Label htmlFor="metrics">Métriques de performance</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="seo" defaultChecked />
                  <Label htmlFor="seo">Données SEO</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="pricing" defaultChecked />
                  <Label htmlFor="pricing">Informations de prix</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} produits sélectionnés`
              : 'Tous les produits seront exportés'
            }
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={() => handleExport('standard')} disabled={loading}>
              {loading ? 'Export en cours...' : 'Exporter maintenant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}