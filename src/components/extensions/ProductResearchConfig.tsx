import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProductResearchConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [criteria, setCriteria] = useState({
    category: '',
    minProfitMargin: 20,
    maxCompetition: 5,
    minRating: 4.0,
    minOrders: 100
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: { handler: 'product-research', action: 'find_winners', criteria }
      });

      if (error) throw error;

      setResults(data.products || []);
      toast({
        title: "Recherche terminée",
        description: `${data.winners_found} produits gagnants trouvés`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Produits Gagnants
          </CardTitle>
          <CardDescription>
            Trouvez les meilleurs produits à vendre selon vos critères
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select 
              value={criteria.category || "all"} 
              onValueChange={(value) => setCriteria({ ...criteria, category: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Electronics">Électronique</SelectItem>
                <SelectItem value="Fashion">Mode</SelectItem>
                <SelectItem value="Home">Maison</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Beauty">Beauté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marge min. (%)</Label>
              <Input
                type="number"
                value={criteria.minProfitMargin}
                onChange={(e) => setCriteria({ ...criteria, minProfitMargin: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Note min.</Label>
              <Input
                type="number"
                step="0.1"
                value={criteria.minRating}
                onChange={(e) => setCriteria({ ...criteria, minRating: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Compétition max. (1-10)</Label>
              <Input
                type="number"
                value={criteria.maxCompetition}
                onChange={(e) => setCriteria({ ...criteria, maxCompetition: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ventes min.</Label>
              <Input
                type="number"
                value={criteria.minOrders}
                onChange={(e) => setCriteria({ ...criteria, minOrders: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Rechercher des produits gagnants
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Résultats ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <img 
                    src={product.image_url || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={product.analysis.winner_score > 70 ? 'default' : 'secondary'}>
                        Score: {product.analysis.winner_score}/100
                      </Badge>
                      <Badge variant="outline">
                        Marge: {product.analysis.profit_margin.toFixed(1)}%
                      </Badge>
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {product.analysis.trend_score}/100
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Prix: {product.price}€</span>
                      <span>Note: {product.rating}⭐</span>
                      <span>Ventes: {product.sales_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
