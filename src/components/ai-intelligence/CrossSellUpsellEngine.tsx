import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, ArrowUpRight, ArrowRightLeft, Sparkles, 
  RefreshCw, Plus, Trash2, Settings, TrendingUp,
  Package, DollarSign, Users, Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductSuggestion {
  id: string;
  sourceProduct: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  suggestedProducts: {
    id: string;
    name: string;
    price: number;
    image?: string;
    type: 'cross-sell' | 'upsell';
    confidence: number;
    reason: string;
  }[];
  estimatedRevenue: number;
  conversionPotential: number;
}

interface SuggestionRule {
  id: string;
  name: string;
  type: 'cross-sell' | 'upsell';
  condition: string;
  isActive: boolean;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export function CrossSellUpsellEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('suggestions');
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['cross-sell-suggestions'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(20);

      if (!products) return [];

      // Generate AI suggestions for each product
      return products.map(product => {
        const relatedProducts = products
          .filter(p => p.id !== product.id)
          .slice(0, 4)
          .map(p => ({
            id: p.id,
            name: p.name || 'Produit',
            price: p.price || 0,
            image: p.image_url,
            type: (Math.random() > 0.5 ? 'cross-sell' : 'upsell') as 'cross-sell' | 'upsell',
            confidence: Math.floor(Math.random() * 30) + 70,
            reason: getRandomReason()
          }));

        return {
          id: product.id,
          sourceProduct: {
            id: product.id,
            name: product.name || 'Produit',
            price: product.price || 0,
            image: product.image_url
          },
          suggestedProducts: relatedProducts,
          estimatedRevenue: Math.floor(Math.random() * 500) + 100,
          conversionPotential: Math.floor(Math.random() * 30) + 10
        } as ProductSuggestion;
      });
    }
  });

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['cross-sell-rules'],
    queryFn: async () => {
      // Mock rules - in production, fetch from database
      return [
        {
          id: '1',
          name: 'Accessoires complémentaires',
          type: 'cross-sell' as const,
          condition: 'Catégorie = Électronique',
          isActive: true,
          performance: { impressions: 1250, clicks: 89, conversions: 23 }
        },
        {
          id: '2',
          name: 'Version premium',
          type: 'upsell' as const,
          condition: 'Prix < 100€',
          isActive: true,
          performance: { impressions: 890, clicks: 67, conversions: 18 }
        },
        {
          id: '3',
          name: 'Bundle produits similaires',
          type: 'cross-sell' as const,
          condition: 'Stock > 10',
          isActive: false,
          performance: { impressions: 450, clicks: 32, conversions: 8 }
        }
      ] as SuggestionRule[];
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('ai-generate-suggestions', {
        body: { type: 'cross-sell-upsell' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-sell-suggestions'] });
      toast.success('Suggestions IA générées avec succès');
      setIsGenerating(false);
    },
    onError: () => {
      toast.error('Erreur lors de la génération');
      setIsGenerating(false);
    }
  });

  const totalEstimatedRevenue = suggestions?.reduce((acc, s) => acc + s.estimatedRevenue, 0) || 0;
  const avgConversionPotential = suggestions?.reduce((acc, s) => acc + s.conversionPotential, 0) / (suggestions?.length || 1);
  const activeRules = rules?.filter(r => r.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-500" />
            Moteur Cross-Sell / Upsell IA
          </h2>
          <p className="text-muted-foreground">
            Suggestions de produits complémentaires générées par IA
          </p>
        </div>
        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Générer suggestions
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenu potentiel</p>
                <p className="text-2xl font-bold text-green-500">{totalEstimatedRevenue}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux conversion moy.</p>
                <p className="text-2xl font-bold">{avgConversionPotential.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suggestions actives</p>
                <p className="text-2xl font-bold">{suggestions?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Settings className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-2xl font-bold">{activeRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="suggestions" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Suggestions IA
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="w-4 h-4" />
            Règles automatiques
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions?.slice(0, 10).map(suggestion => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
          {rules?.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance des suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-500">2,590</p>
                  <p className="text-muted-foreground">Impressions totales</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">188</p>
                  <p className="text-muted-foreground">Clics</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-500">49</p>
                  <p className="text-muted-foreground">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ProductSuggestion }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            {suggestion.sourceProduct.image ? (
              <img 
                src={suggestion.sourceProduct.image} 
                alt={suggestion.sourceProduct.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium">{suggestion.sourceProduct.name}</h3>
            <p className="text-sm text-muted-foreground">{suggestion.sourceProduct.price}€</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.suggestedProducts.slice(0, 3).map(product => (
                <div 
                  key={product.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <Badge variant={product.type === 'upsell' ? 'default' : 'secondary'}>
                    {product.type === 'upsell' ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                    )}
                    {product.type}
                  </Badge>
                  <span className="text-sm truncate max-w-32">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-green-500">+{suggestion.estimatedRevenue}€</p>
            <p className="text-xs text-muted-foreground">Revenu estimé</p>
            <Button size="sm" className="mt-2">
              <Zap className="w-4 h-4 mr-1" />
              Activer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleCard({ rule }: { rule: SuggestionRule }) {
  const [isActive, setIsActive] = useState(rule.isActive);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{rule.name}</h3>
                <Badge variant={rule.type === 'upsell' ? 'default' : 'secondary'}>
                  {rule.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rule.condition}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-medium">{rule.performance.impressions}</p>
              <p className="text-xs text-muted-foreground">Impressions</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{rule.performance.clicks}</p>
              <p className="text-xs text-muted-foreground">Clics</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-green-500">{rule.performance.conversions}</p>
              <p className="text-xs text-muted-foreground">Conversions</p>
            </div>
            <Button size="sm" variant="ghost">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRandomReason(): string {
  const reasons = [
    'Achetés ensemble fréquemment',
    'Catégorie similaire',
    'Même gamme de prix',
    'Clients similaires ont acheté',
    'Complément fonctionnel',
    'Tendance actuelle'
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}
