import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart,
  Package,
  Loader2,
  CheckCircle,
  ExternalLink,
  Globe,
  Store,
  Truck
} from 'lucide-react'

interface ExportInterfaceProps {
  selectedProducts?: string[]
  onExportComplete?: () => void
}

export const ExportInterface: React.FC<ExportInterfaceProps> = ({ 
  selectedProducts = [], 
  onExportComplete 
}) => {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // Fetch user's approved/published products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['export-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .in('status', ['approved', 'published'])
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Available platforms with their status
  const platforms = [
    {
      id: 'shopify',
      name: 'Shopify',
      icon: Store,
      status: 'connected',
      description: 'Boutique e-commerce complète',
      color: 'text-green-600'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      icon: Package,
      status: 'available',
      description: 'Marketplace mondiale',
      color: 'text-orange-600'
    },
    {
      id: 'ebay',
      name: 'eBay',
      icon: ShoppingCart,
      status: 'configured',
      description: 'Ventes aux enchères et achats immédiats',
      color: 'text-blue-600'
    },
    {
      id: 'cdiscount',
      name: 'Cdiscount',
      icon: Truck,
      status: 'available',
      description: 'Marketplace française',
      color: 'text-red-600'
    }
  ]

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleExport = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Plateformes requises",
        description: "Veuillez sélectionner au moins une plateforme",
        variant: "destructive"
      })
      return
    }

    const productsToExport = selectedProducts.length > 0 
      ? selectedProducts 
      : products.map(p => p.id)

    if (productsToExport.length === 0) {
      toast({
        title: "Produits requis",
        description: "Aucun produit sélectionné pour l'export",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('publish-products', {
        body: {
          productIds: productsToExport,
          platforms: selectedPlatforms,
          config: {
            auto_sync: true,
            update_inventory: true
          }
        }
      })

      if (error) throw error

      toast({
        title: "Export réussi !",
        description: `${data.published_count} produits publiés sur ${data.platforms_count} plateformes`
      })

      setSelectedPlatforms([])
      onExportComplete?.()

    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getPlatformStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Connecté</Badge>
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800"><Globe className="h-3 w-3 mr-1" />Configuré</Badge>
      case 'available':
        return <Badge variant="outline">Disponible</Badge>
      default:
        return <Badge variant="secondary">Non configuré</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Exporter vers E-commerce</h2>
        <p className="text-muted-foreground">
          Publiez vos produits sur différentes plateformes de vente en ligne
        </p>
      </div>

      {/* Products Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits à exporter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {selectedProducts.length > 0 ? selectedProducts.length : products.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedProducts.length > 0 ? 'Produits sélectionnés' : 'Produits disponibles'}
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              {products.filter(p => p.status === 'approved').length} Approuvés
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner les plateformes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map(platform => {
              const Icon = platform.icon
              const isSelected = selectedPlatforms.includes(platform.id)
              
              return (
                <div
                  key={platform.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handlePlatformSelect(platform.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <Icon className={`h-6 w-6 ${platform.color}`} />
                      <div>
                        <h4 className="font-medium">{platform.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    {getPlatformStatusBadge(platform.status)}
                  </div>
                  
                  {platform.status === 'available' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      Configuration requise
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      {selectedPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paramètres d'export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-sync" defaultChecked />
              <label htmlFor="auto-sync" className="text-sm font-medium">
                Synchronisation automatique des stocks
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="update-prices" defaultChecked />
              <label htmlFor="update-prices" className="text-sm font-medium">
                Mise à jour automatique des prix
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="seo-optimization" defaultChecked />
              <label htmlFor="seo-optimization" className="text-sm font-medium">
                Optimisation SEO automatique
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Button 
        onClick={handleExport}
        disabled={isExporting || selectedPlatforms.length === 0}
        className="w-full"
        size="lg"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Export en cours...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Exporter vers {selectedPlatforms.length} plateforme{selectedPlatforms.length > 1 ? 's' : ''}
          </>
        )}
      </Button>

      {selectedPlatforms.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Les produits seront publiés sur: {selectedPlatforms.map(id => 
              platforms.find(p => p.id === id)?.name
            ).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}