import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  FileSpreadsheet, 
  Package, 
  Globe, 
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  Database
} from 'lucide-react'

interface QuickImportAccessProps {
  onMethodSelect: (method: string) => void
}

export const QuickImportAccess = ({ onMethodSelect }: QuickImportAccessProps) => {
  const popularMethods = [
    {
      id: "woocommerce",
      title: "WooCommerce",
      description: "Import depuis votre boutique WooCommerce",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "text-purple-600",
      category: "E-commerce"
    },
    {
      id: "shopify", 
      title: "Shopify",
      description: "Synchronisation avec votre store Shopify",
      icon: <Package className="w-6 h-6" />,
      color: "text-green-600",
      category: "E-commerce"
    },
    {
      id: "csv",
      title: "CSV/Excel",
      description: "Import via fichier avec mapping IA automatique", 
      icon: <FileSpreadsheet className="w-6 h-6" />,
      color: "text-blue-600",
      category: "Fichiers"
    },
    {
      id: "xml",
      title: "XML/API",
      description: "Flux XML avec XPath et API REST", 
      icon: <Globe className="w-6 h-6" />,
      color: "text-orange-600",
      category: "API"
    },
    {
      id: "prestashop",
      title: "PrestaShop",
      description: "Import depuis PrestaShop",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "text-red-600",
      category: "E-commerce"
    },
    {
      id: "magento",
      title: "Magento",
      description: "Synchronisation avec Magento",
      icon: <Package className="w-6 h-6" />,
      color: "text-indigo-600",
      category: "E-commerce"
    }
  ]

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-gradient">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Import Intelligent - 22+ Méthodes
        </CardTitle>
        <CardDescription className="text-lg">
          Accès direct aux 22+ méthodes d'import organisées par catégorie
        </CardDescription>
        
        {/* CTA pour voir toutes les méthodes */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => onMethodSelect("all-methods")}
          >
            <Package className="w-5 h-5 mr-2" />
            22+ Méthodes d'Import
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-purple-300 hover:bg-purple-50"
            onClick={() => onMethodSelect("popular")}
          >
            <Zap className="w-5 h-5 mr-2" />
            Méthodes Populaires
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Méthodes les plus utilisées (6 sur 22+)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularMethods.map((method) => (
              <Card 
                key={method.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary/20"
                onClick={() => onMethodSelect(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg ${method.color}`}>
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold truncate">{method.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {method.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Accès rapide aux catégories */}
          <div className="bg-white/50 rounded-lg p-4 mt-6">
            <h4 className="font-medium mb-3 text-center">Accès rapide par catégorie</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => onMethodSelect("category-ecommerce")}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs">E-commerce</span>
                <Badge variant="secondary" className="text-xs">8 méthodes</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => onMethodSelect("category-files")}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs">Fichiers</span>
                <Badge variant="secondary" className="text-xs">5 méthodes</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => onMethodSelect("category-specialty")}
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs">Spécialisés</span>
                <Badge variant="secondary" className="text-xs">4 méthodes</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => onMethodSelect("category-regional")}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs">Régionaux</span>
                <Badge variant="secondary" className="text-xs">4 méthodes</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => onMethodSelect("category-ftp")}
              >
                <Database className="w-4 h-4" />
                <span className="text-xs">FTP/SFTP</span>
                <Badge variant="secondary" className="text-xs">1 méthode</Badge>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">22+</div>
              <div className="text-sm text-muted-foreground">Méthodes total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-muted-foreground">Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Automatisation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">IA</div>
              <div className="text-sm text-muted-foreground">Optimisation</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}