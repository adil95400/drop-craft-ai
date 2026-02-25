import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sparkles, FileText, Search, Image, Wand2,
  CheckCircle, Clock, AlertCircle, Play, Loader2
} from 'lucide-react';

export default function AIOptimizationPage() {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Fetch products needing optimization
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-optimization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, price, main_image_url, status, seo_score')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('seo_score', { ascending: true, nullsFirst: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch past AI generations
  const { data: generations = [] } = useQuery({
    queryKey: ['ai-generations-recent'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const runOptimization = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const targets = selectedProducts.length > 0 ? selectedProducts : products.slice(0, 5).map((p: any) => p.id);
      if (targets.length === 0) throw new Error('Aucun produit sélectionné');

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: { product_ids: targets, content_type: type },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-generations-recent'] });
      toast.success('Optimisation IA lancée avec succès !');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de l\'optimisation');
    },
  });

  const optimizationTypes = [
    {
      id: 'description',
      name: 'Descriptions Produits',
      description: 'Réécriture SEO-optimisée des descriptions',
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      id: 'seo_title',
      name: 'Titres SEO',
      description: 'Optimisation des titres pour les moteurs de recherche',
      icon: Search,
      color: 'text-green-500',
    },
    {
      id: 'bullet_points',
      name: 'Points Clés',
      description: 'Génération de bullet points vendeurs',
      icon: Sparkles,
      color: 'text-purple-500',
    },
    {
      id: 'image_alt',
      name: 'Alt Images',
      description: 'Textes alternatifs pour l\'accessibilité et le SEO',
      icon: Image,
      color: 'text-orange-500',
    },
  ];

  const lowScoreProducts = products.filter((p: any) => !p.seo_score || p.seo_score < 50);
  const pendingGenerations = generations.filter((g: any) => g.status === 'pending');

  return (
    <>
      <Helmet>
        <title>Optimisation IA — Drop-Craft AI</title>
        <meta name="description" content="Optimisez vos produits en masse avec l'IA : descriptions, SEO, images et plus." />
      </Helmet>

      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-primary" />
            Optimisation IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Améliorez vos fiches produits en masse grâce à l'intelligence artificielle
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Produits actifs', value: products.length, icon: FileText, color: 'text-primary' },
            { label: 'Score SEO faible', value: lowScoreProducts.length, icon: AlertCircle, color: 'text-orange-500' },
            { label: 'Générations récentes', value: generations.length, icon: Sparkles, color: 'text-purple-500' },
            { label: 'En attente', value: pendingGenerations.length, icon: Clock, color: 'text-muted-foreground' },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="optimize" className="w-full">
          <TabsList>
            <TabsTrigger value="optimize">Optimiser</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="optimize" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimizationTypes.map((opt) => (
                <Card key={opt.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent">
                      <opt.icon className={`h-6 w-6 ${opt.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{opt.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        {opt.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {selectedProducts.length || Math.min(5, products.length)} produit(s) ciblé(s)
                        </span>
                        <Button
                          size="sm"
                          onClick={() => runOptimization.mutate({ type: opt.id })}
                          disabled={runOptimization.isPending || products.length === 0}
                        >
                          {runOptimization.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Lancer
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Products with low SEO */}
            {lowScoreProducts.length > 0 && (
              <Card className="p-6 mt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Produits à optimiser en priorité
                </h3>
                <div className="space-y-3">
                  {lowScoreProducts.slice(0, 8).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate max-w-md">
                          {product.title || 'Sans titre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.price ? `${product.price}€` : 'Prix non défini'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <Progress value={product.seo_score || 0} className="h-2" />
                        </div>
                        <Badge variant={product.seo_score && product.seo_score >= 50 ? 'default' : 'destructive'}>
                          {product.seo_score || 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
            {generations.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Aucune génération IA récente</p>
              </Card>
            ) : (
              generations.map((gen: any) => (
                <Card key={gen.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{gen.content_type}</Badge>
                        <Badge variant={gen.status === 'applied' ? 'default' : 'secondary'}>
                          {gen.status === 'applied' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Appliqué</>
                          ) : gen.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-lg">
                        {gen.generated_content?.slice(0, 120)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(gen.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
