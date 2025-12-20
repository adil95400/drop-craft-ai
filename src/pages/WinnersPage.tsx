import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWinnersActions } from '@/hooks/useWinnersActions';
import { useWinnersRealData, useRefreshWinners } from '@/hooks/useWinnersRealData';
import { 
  Trophy, TrendingUp, Sparkles, Search, Filter, 
  Star, DollarSign, BarChart3,
  RefreshCw, Target, Download, Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WinnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const { importWinner, isImporting } = useWinnersActions();
  
  const { data: winnersData, isLoading } = useWinnersRealData(selectedCategory, 20);
  const { mutate: refreshWinners, isPending: isRefreshing } = useRefreshWinners();

  const handleImport = async (product: any) => {
    await importWinner(product);
  };

  const handleRefresh = () => {
    refreshWinners({ category: selectedCategory, limit: 20 });
  };

  const winningProducts = winnersData?.products || [];
  const metrics = winnersData?.metrics;

  const filteredProducts = winningProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayMetrics = [
    { label: 'Produits Winners', value: metrics?.totalWinners?.toString() || '0', icon: Trophy, color: 'text-yellow-500' },
    { label: 'Score Moyen', value: metrics?.avgScore?.toString() || '0', icon: Star, color: 'text-blue-500' },
    { label: 'Tendance Moyenne', value: metrics?.avgTrend || '+0%', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Profit Potentiel', value: `€${((metrics?.potentialProfit || 0) / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-purple-500' }
  ];

  const metrics = [
    { label: 'Produits Winners', value: '127', icon: Trophy, color: 'text-yellow-500' },
    { label: 'Score Moyen', value: '94.2', icon: Star, color: 'text-blue-500' },
    { label: 'Tendance Moyenne', value: '+183%', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Profit Potentiel', value: '€52.4K', icon: DollarSign, color: 'text-purple-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Winning Products
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez les produits tendance avec fort potentiel de vente
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing || isLoading} size="lg">
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyser avec IA
            </>
          )}
        </Button>
      </div>

      {/* Métriques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {displayMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit gagnant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {metrics?.categories?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tous les Winners
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="mr-2 h-4 w-4" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="best">
            <Target className="mr-2 h-4 w-4" />
            Meilleurs Scores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {product.category}
                            <Badge variant="outline" className="text-xs">{product.source}</Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        Score: {product.score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tendance</p>
                        <p className="font-bold text-green-500 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {product.trend}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prix Moyen</p>
                        <p className="font-bold">{product.avgPrice.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit</p>
                        <p className="font-bold text-purple-500">{product.profit.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commandes</p>
                        <p className="font-bold">{product.orders.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{product.rating.toFixed(1)}</span>
                      </div>
                      <Badge variant={product.competition === 'low' ? 'default' : 'secondary'}>
                        {product.competition === 'low' ? 'Faible' : product.competition === 'medium' ? 'Moyenne' : 'Élevée'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={() => handleImport(product)}
                        disabled={isImporting}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {isImporting ? 'Import...' : 'Importer'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(product.name)}`, '_blank')}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analyser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Produits en Tendance</CardTitle>
              <CardDescription>
                Produits avec la plus forte croissance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Contenu à venir - Filtrez par tendance
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best">
          <Card>
            <CardHeader>
              <CardTitle>Meilleurs Scores</CardTitle>
              <CardDescription>
                Produits avec les scores IA les plus élevés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Contenu à venir - Triés par score IA
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
