import { Product } from '@/lib/supabase'
import { CategoryDistributionChart } from './charts/CategoryDistributionChart'
import { StockLevelsChart } from './charts/StockLevelsChart'
import { TopProductsChart } from './charts/TopProductsChart'
import { MarginAnalysisChart } from './charts/MarginAnalysisChart'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ProductsAnalyticsDashboardProps {
  products: Product[]
  onClose: () => void
}

export function ProductsAnalyticsDashboard({ products, onClose }: ProductsAnalyticsDashboardProps) {
  // Préparer les données pour la répartition par catégorie
  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      const category = p.category || 'Sans catégorie'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Préparer les données pour les niveaux de stock par catégorie
  const stockByCategory = Object.entries(
    products.reduce((acc, p) => {
      const category = p.category || 'Sans catégorie'
      if (!acc[category]) {
        acc[category] = { stock: 0, lowStock: 0, outOfStock: 0 }
      }
      
      const qty = p.stock_quantity || 0
      if (qty === 0) {
        acc[category].outOfStock++
      } else if (qty < 10) {
        acc[category].lowStock++
      } else {
        acc[category].stock++
      }
      
      return acc
    }, {} as Record<string, { stock: number; lowStock: number; outOfStock: number }>)
  )
    .map(([category, counts]) => ({
      category,
      ...counts
    }))
    .sort((a, b) => (b.stock + b.lowStock + b.outOfStock) - (a.stock + a.lowStock + a.outOfStock))

  // Top 10 produits par valeur de stock
  const topProducts = products
    .map(p => ({
      name: p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
      value: p.price * (p.stock_quantity || 0)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Analyse des marges
  const marginData = products
    .filter(p => p.profit_margin && p.profit_margin > 0)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      price: p.price,
      margin: p.profit_margin || 0,
      stock: p.stock_quantity || 0
    }))
    .slice(0, 20) // Limiter à 20 produits pour la lisibilité

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Tableaux de bord analytiques</h3>
          <p className="text-muted-foreground">
            Visualisation des données de vos {products.length} produits
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Répartition par catégorie */}
        {categoryData.length > 0 && (
          <CategoryDistributionChart data={categoryData} />
        )}

        {/* Niveaux de stock */}
        {stockByCategory.length > 0 && (
          <StockLevelsChart data={stockByCategory} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 produits */}
        {topProducts.length > 0 && (
          <TopProductsChart 
            data={topProducts}
            title="Top 10 produits"
            description="Classement par valeur de stock (prix × quantité)"
            valueLabel="Valeur"
          />
        )}

        {/* Analyse des marges */}
        {marginData.length > 0 && (
          <MarginAnalysisChart data={marginData} />
        )}
      </div>

      {marginData.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            L'analyse des marges nécessite des prix de revient pour vos produits.
            <br />
            Ajoutez les coûts pour voir ce graphique.
          </p>
        </div>
      )}
    </div>
  )
}
