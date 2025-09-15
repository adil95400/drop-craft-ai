import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  FileText, 
  Database, 
  Globe, 
  Settings,
  ArrowRight,
  Zap
} from 'lucide-react'

interface QuickImportAccessProps {
  onMethodSelect: (method: string) => void
}

export const QuickImportAccess = ({ onMethodSelect }: QuickImportAccessProps) => {
  const popularMethods = [
    {
      id: 'woocommerce',
      title: 'WooCommerce',
      description: 'Synchronisation avec votre boutique WooCommerce',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-purple-500',
      category: 'E-commerce'
    },
    {
      id: 'shopify',
      title: 'Shopify',
      description: 'Import depuis votre boutique Shopify',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-green-500',
      category: 'E-commerce'
    },
    {
      id: 'csv',
      title: 'CSV/Excel',
      description: 'Import via fichier CSV ou Excel',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500',
      category: 'Fichiers'
    },
    {
      id: 'xml',
      title: 'XML/JSON',
      description: 'Flux XML ou API JSON',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-orange-500',
      category: 'Feeds'
    },
    {
      id: 'magento',
      title: 'Magento',
      description: 'Connexion avec Magento 1 & 2',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-red-500',
      category: 'E-commerce'
    },
    {
      id: 'bigcommerce',
      title: 'BigCommerce',
      description: 'Synchronisation BigCommerce',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-indigo-500',
      category: 'E-commerce'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header avec call-to-action */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Accès Rapide aux Méthodes d'Import</CardTitle>
          <CardDescription className="text-base">
            Connectez rapidement vos sources de données les plus utilisées ou explorez toutes les options disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Button 
              onClick={() => onMethodSelect('all-methods')}
              size="lg" 
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Settings className="w-5 h-5 mr-2" />
              Voir Toutes les 22+ Méthodes d'Import
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Méthodes populaires */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Méthodes Populaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularMethods.map((method) => (
            <Card 
              key={method.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4"
              style={{ borderLeftColor: method.color.replace('bg-', '').replace('-500', '') }}
              onClick={() => onMethodSelect(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${method.color} text-white rounded-lg`}>
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
      </div>

      {/* Stats et informations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">22+</div>
            <div className="text-sm text-muted-foreground">Méthodes d'Import</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-muted-foreground">Catégories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-muted-foreground">Automatisé</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">IA</div>
            <div className="text-sm text-muted-foreground">Optimisé</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}