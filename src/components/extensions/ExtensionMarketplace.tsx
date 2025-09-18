import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Star, 
  Download, 
  TrendingUp,
  Crown,
  CheckCircle,
  Zap,
  Shield,
  Palette,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Code,
  Smartphone
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Mock data for demonstration
const mockExtensions = [
  {
    id: '1',
    name: 'AI Product Descriptions',
    short_description: 'AI-powered product descriptions with SEO',
    category: 'AI',
    developer_name: 'OpenAI Partners',
    developer_verified: true,
    version: '2.1.4',
    rating: 4.9,
    reviews_count: 1250,
    downloads_count: 15000,
    price: 29.99,
    features: ['Multi-language support', 'SEO optimization', 'Bulk generation'],
    permissions: ['Product data access', 'API calls'],
    compatibility: ['Shopify', 'WooCommerce'],
    size_mb: 2.1,
    trending: true,
    featured: true
  },
  {
    id: '2',
    name: 'Smart Inventory Manager',
    short_description: 'Predictive inventory management',
    category: 'Analytics',
    developer_name: 'DataFlow Solutions',
    developer_verified: true,
    version: '1.8.2',
    rating: 4.7,
    reviews_count: 890,
    downloads_count: 12000,
    price: 0,
    features: ['Predictive analytics', 'Auto-reordering'],
    permissions: ['Inventory access', 'Order data'],
    compatibility: ['All platforms'],
    size_mb: 3.5,
    trending: false,
    featured: false
  }
]

const categoryIcons: Record<string, any> = {
  'AI': MessageSquare,
  'Analytics': BarChart3,
  'Security': Shield,
  'Marketing': TrendingUp
}

export const ExtensionMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const handleInstallClick = (extension: any) => {
    toast({
      title: "Installation simulée",
      description: `${extension.name} sera bientôt disponible`
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Marketplace d'Extensions</h1>
        <p className="text-muted-foreground">
          Découvrez des extensions puissantes pour booster votre e-commerce
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher des extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockExtensions.map(ext => {
          const IconComponent = categoryIcons[ext.category] || Code
          return (
            <Card key={ext.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{ext.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{ext.developer_name}</span>
                        {ext.developer_verified && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{ext.category}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{ext.short_description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{ext.rating}</span>
                    <span className="text-muted-foreground">({ext.reviews_count})</span>
                  </div>
                  <span className="text-muted-foreground">{ext.downloads_count.toLocaleString()} téléchargements</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold text-lg">
                    {ext.price === 0 ? 'Gratuit' : `${ext.price}€`}
                  </span>
                  <Button size="sm" onClick={() => handleInstallClick(ext)}>
                    <Download className="w-4 h-4 mr-2" />
                    Installer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default ExtensionMarketplace