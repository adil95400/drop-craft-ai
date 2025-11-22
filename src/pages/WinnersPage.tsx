import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWinnersActions } from '@/hooks/useWinnersActions';
import { 
  Trophy, TrendingUp, Sparkles, Search, Filter, 
  Star, DollarSign, BarChart3, ExternalLink,
  RefreshCw, Target, Download
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function WinnersPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { importWinner, isImporting } = useWinnersActions();

  const handleImport = async (product: any) => {
    await importWinner(product);
  };

  const analyzeWinners = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Analyse IA terminée - 47 nouveaux produits gagnants trouvés');
    }, 2000);
  };

  // Données simulées de winning products
  const winningProducts = [
    {
      id: 1,
      name: 'Smartwatch Ultra Pro',
      category: 'Électronique',
      score: 98,
      trend: '+245%',
      avgPrice: '89.99€',
      profit: '45.00€',
      competition: 'Faible',
      orders: 1234,
      rating: 4.8
    },
    {
      id: 2,
      name: 'LED Gaming Setup',
      category: 'Gaming',
      score: 95,
      trend: '+180%',
      avgPrice: '129.99€',
      profit: '65.00€',
      competition: 'Moyenne',
      orders: 892,
      rating: 4.7
    },
    {
      id: 3,
      name: 'Wireless Earbuds Pro',
      category: 'Audio',
      score: 93,
      trend: '+165%',
      avgPrice: '49.99€',
      profit: '28.00€',
      competition: 'Faible',
      orders: 2156,
      rating: 4.9
    },
    {
      id: 4,
      name: 'Portable Blender',
      category: 'Maison',
      score: 91,
      trend: '+142%',
      avgPrice: '39.99€',
      profit: '22.00€',
      competition: 'Moyenne',
      orders: 1567,
      rating: 4.6
    }
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
        <Button onClick={analyzeWinners} disabled={isAnalyzing} size="lg">
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
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
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {winningProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
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
                      <p className="font-bold">{product.avgPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit</p>
                      <p className="font-bold text-purple-500">{product.profit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commandes</p>
                      <p className="font-bold">{product.orders.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                    <Badge variant={product.competition === 'Faible' ? 'default' : 'secondary'}>
                      {product.competition}
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
