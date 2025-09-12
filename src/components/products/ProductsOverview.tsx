import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealProducts } from '@/hooks/useRealProducts'
import { 
  Package, TrendingUp, AlertTriangle, DollarSign, 
  ShoppingBag, Star, Eye, Plus, Download, Upload
} from 'lucide-react'
import { ProductCreateDialog } from './ProductCreateDialog'
import { ProductImportDialog } from './ProductImportDialog'
import { ProductExportDialog } from './ProductExportDialog'
import { useState } from 'react'

export function ProductsOverview() {
  const { stats, isLoading } = useRealProducts()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const overviewStats = [
    {
      title: "Total Produits",
      value: stats.total,
      icon: Package,
      color: "text-primary",
      trend: "+12% ce mois"
    },
    {
      title: "Produits Actifs",
      value: stats.active,
      icon: ShoppingBag,
      color: "text-green-600",
      trend: `${((stats.active / stats.total) * 100).toFixed(1)}%`
    },
    {
      title: "Stock Faible",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "text-orange-500",
      trend: stats.lowStock > 0 ? "Attention requise" : "Tout va bien"
    },
    {
      title: "Valeur Stock",
      value: `${stats.totalValue.toLocaleString()}€`,
      icon: DollarSign,
      color: "text-blue-600",
      trend: "+8.5% ce mois"
    },
    {
      title: "Vues Moyennes",
      value: "2,847",
      icon: Eye,
      color: "text-purple-600",
      trend: "+15.3% cette semaine"
    },
    {
      title: "Note Moyenne",
      value: "4.7",
      icon: Star,
      color: "text-yellow-500",
      trend: "⭐ Excellent"
    },
    {
      title: "Conversions",
      value: "12.4%",
      icon: TrendingUp,
      color: "text-green-600",
      trend: "+2.1% vs mois dernier"
    },
    {
      title: "Nouveaux Aujourd'hui",
      value: "24",
      icon: Plus,
      color: "text-indigo-600",
      trend: "3 en attente"
    }
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Produit
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Catégories Populaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Électronique</span>
                <Badge variant="secondary">245 produits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Mode</span>
                <Badge variant="secondary">189 produits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Maison</span>
                <Badge variant="secondary">156 produits</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alertes Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.lowStock > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{stats.lowStock} produits en stock faible</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Voir les produits
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Aucune alerte stock
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ventes ce mois</span>
                <Badge variant="secondary">+23%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Taux de conversion</span>
                <Badge variant="secondary">12.4%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Panier moyen</span>
                <Badge variant="secondary">89€</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ProductCreateDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProductCreated={() => setShowCreateDialog(false)}
      />
      <ProductImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
      <ProductExportDialog 
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </>
  )
}