import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, TrendingUp, Filter, Loader2 } from 'lucide-react'
import { useRealWinnersAPI } from '@/hooks/useRealWinnersAPI'

export const WinnersSearchInterface = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSources, setSelectedSources] = useState(['trends', 'ebay', 'amazon'])
  
  const { searchWinners, isSearching, winnersData } = useRealWinnersAPI()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    searchWinners({
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sources: selectedSources,
      limit: 50
    })
  }

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty',
    'Toys', 'Automotive', 'Books', 'Health', 'Pet Supplies'
  ]

  const sources = [
    { id: 'trends', name: 'Google Trends', color: 'bg-blue-500' },
    { id: 'ebay', name: 'eBay', color: 'bg-yellow-500' },
    { id: 'amazon', name: 'Amazon', color: 'bg-orange-500' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recherche de Produits Gagnants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Rechercher des produits tendance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Rechercher
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sources Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sources:</span>
            {sources.map(source => (
              <Badge
                key={source.id}
                variant={selectedSources.includes(source.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleSourceToggle(source.id)}
              >
                {source.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Stats */}
        {winnersData && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{winnersData.meta.total} produits trouvés</span>
            {winnersData.stats && (
              <>
                <span>Score moyen: {winnersData.stats.avg_score}</span>
                <span>{winnersData.stats.total_sources} sources utilisées</span>
              </>
            )}
            <span>Dernière mise à jour: {new Date(winnersData.meta.timestamp).toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}