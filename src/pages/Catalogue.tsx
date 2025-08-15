import React, { useState } from 'react'
import { usePlan } from '@/contexts/PlanContext'
import { CatalogUltraProInterface } from '@/components/catalog/CatalogUltraProInterface'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { AdvancedFilters } from '@/components/catalog/AdvancedFilters'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Catalogue() {
  const { isUltraPro, hasFeature } = usePlan()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header unifié */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Catalogue Produits
                {isUltraPro && <Badge variant="secondary">Ultra Pro</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isUltraPro 
                  ? "Gestion avancée avec analytics et IA"
                  : "Gérez votre catalogue de produits"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <CatalogHeader 
          onSearch={setSearchTerm}
          onFilterChange={setFilters}
        />
        
        {hasFeature('advanced-analytics') ? (
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="advanced">Avancé</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-6">
              {hasFeature('advanced-filters') && (
                <AdvancedFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={[]}
                  suppliers={[]}
                />
              )}
              <ProductGrid 
                products={[]}
                onProductClick={() => {}}
                onImportProduct={() => {}}
                onToggleFavorite={() => {}}
                favorites={[]}
              />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <CatalogUltraProInterface />
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-6">
              <CatalogUltraProInterface />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <ProductGrid 
              products={[]}
              onProductClick={() => {}}
              onImportProduct={() => {}}
              onToggleFavorite={() => {}}
              favorites={[]}
            />
          </div>
        )}
      </div>
    </div>
  )
}