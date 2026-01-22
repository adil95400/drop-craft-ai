import React from 'react'
import { Search, Globe, TrendingUp, Zap, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SupplierSearchForm } from '@/components/import/SupplierSearchForm'
import { SupplierComparisonTable } from '@/components/import/SupplierComparisonTable'
import { useSearchAllSuppliers } from '@/hooks/useSearchAllSuppliers'

export default function SearchAllSuppliersPage() {
  const {
    results,
    isSearching,
    searchProgress,
    platformsSearched,
    searchAllPlatforms,
    sortResults,
    supportedPlatforms
  } = useSearchAllSuppliers()

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/import">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Search All Suppliers
                <Badge variant="secondary" className="text-xs">
                  {supportedPlatforms.filter(p => p.searchable).length} plateformes
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Trouvez le meilleur fournisseur en comparant prix, livraison et disponibilité
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Recherche Multi-Plateforme</h3>
              <p className="text-sm text-muted-foreground">
                15+ fournisseurs searchés simultanément
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Score de Qualité</h3>
              <p className="text-sm text-muted-foreground">
                Classement automatique par pertinence
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Import 1-Clic</h3>
              <p className="text-sm text-muted-foreground">
                Importez directement vers votre boutique
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rechercher un produit
          </CardTitle>
          <CardDescription>
            Entrez le nom du produit, SKU ou mots-clés pour lancer une recherche globale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierSearchForm 
            onSearch={searchAllPlatforms}
            isSearching={isSearching}
            supportedPlatforms={supportedPlatforms}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Résultats de la comparaison
            {results.length > 0 && (
              <Badge>{results.length} produits trouvés</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Comparez les prix, frais de livraison, notes et disponibilité entre fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierComparisonTable
            results={results}
            isSearching={isSearching}
            searchProgress={searchProgress}
            platformsSearched={platformsSearched}
            onSort={sortResults}
          />
        </CardContent>
      </Card>

      {/* Supported Platforms Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Plateformes supportées</CardTitle>
          <CardDescription>
            Nous recherchons sur toutes ces marketplaces pour trouver le meilleur deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
            {supportedPlatforms.filter(p => p.searchable).map((platform) => (
              <div 
                key={platform.id}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{platform.icon}</span>
                <span className="text-xs font-medium text-center">{platform.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
