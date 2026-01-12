import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProductsUnified } from '@/hooks/unified'
import { 
  Package, TrendingUp, AlertTriangle, DollarSign, 
  ShoppingBag, Star, Eye, Plus, Download, Upload
} from 'lucide-react'
import { ProductMetrics } from './ProductMetrics'
import { ProductCategoriesSection } from './ProductCategoriesSection'
import { useState } from 'react'

export function ProductsOverview() {
  const { stats, isLoading } = useProductsUnified()
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

        {/* Métriques Principales */}
        <ProductMetrics />
        
        {/* Sections détaillées */}
        <ProductCategoriesSection />
      </div>

      {/* Dialogs - Gardés pour l'instant mais devront être implémentés */}
      {/*
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
      */}
    </>
  )
}