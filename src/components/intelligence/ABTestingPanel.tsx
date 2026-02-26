import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  usePriceABTests, 
  useCreateABTest,
  useStartABTest,
  useStopABTest,
  PriceABTest 
} from '@/hooks/useDropshippingIntelligence';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  FlaskConical, 
  Play, 
  Square,
  Trophy,
  TrendingUp,
  Eye,
  ShoppingCart,
  DollarSign,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function ABTestingPanel() {
  const { data: tests, isLoading } = usePriceABTests();
  const startTest = useStartABTest();
  const stopTest = useStopABTest();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const runningTests = tests?.filter(t => t.status === 'running') || [];
  const draftTests = tests?.filter(t => t.status === 'draft') || [];
  const completedTests = tests?.filter(t => t.status === 'completed') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Tests A/B Prix
          </CardTitle>
          <CardDescription>
            Testez différents prix pour optimiser vos conversions
          </CardDescription>
        </div>
        <CreateTestDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
        />
      </CardHeader>
      <CardContent>
        {tests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun test A/B</p>
            <p className="text-sm">Créez un test pour comparer différents prix</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tests en cours */}
            {runningTests.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-green-600">
                  <Play className="h-4 w-4" />
                  En cours ({runningTests.length})
                </h3>
                <div className="space-y-3">
                  {runningTests.map(test => (
                    <TestCard 
                      key={test.id} 
                      test={test}
                      onStop={() => stopTest.mutate(test.id)}
                      stopping={stopTest.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Brouillons */}
            {draftTests.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
                  Brouillons ({draftTests.length})
                </h3>
                <div className="space-y-3">
                  {draftTests.map(test => (
                    <TestCard 
                      key={test.id} 
                      test={test}
                      onStart={() => startTest.mutate(test.id)}
                      starting={startTest.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Terminés */}
            {completedTests.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Terminés ({completedTests.length})
                </h3>
                <div className="space-y-3">
                  {completedTests.slice(0, 3).map(test => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TestCard({ 
  test,
  onStart,
  onStop,
  starting = false,
  stopping = false
}: { 
  test: PriceABTest;
  onStart?: () => void;
  onStop?: () => void;
  starting?: boolean;
  stopping?: boolean;
}) {
  const totalViews = test.variant_a_views + test.variant_b_views;
  const crA = test.variant_a_views > 0 
    ? (test.variant_a_conversions / test.variant_a_views * 100).toFixed(1)
    : '0';
  const crB = test.variant_b_views > 0 
    ? (test.variant_b_conversions / test.variant_b_views * 100).toFixed(1)
    : '0';

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium">{test.test_name}</h4>
          <p className="text-sm text-muted-foreground">
            {test.products?.title || 'Produit'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {test.status === 'running' && (
            <Badge className="bg-green-500 animate-pulse">En cours</Badge>
          )}
          {test.status === 'draft' && (
            <Badge variant="outline">Brouillon</Badge>
          )}
          {test.status === 'completed' && test.winner && (
            <Badge className="bg-yellow-500 text-black">
              <Trophy className="h-3 w-3 mr-1" />
              Gagnant: {test.winner}
            </Badge>
          )}
        </div>
      </div>

      {/* Comparaison des variantes */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Variante A */}
        <div className={`p-3 rounded-lg border-2 ${test.winner === 'A' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-muted'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Variante A</span>
            {test.winner === 'A' && <Trophy className="h-4 w-4 text-yellow-500" />}
          </div>
          <p className="text-2xl font-bold">{test.variant_a_price.toFixed(2)} €</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_a_views}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_a_conversions}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span>{crA}%</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_a_revenue.toFixed(0)}€</span>
            </div>
          </div>
        </div>

        {/* Variante B */}
        <div className={`p-3 rounded-lg border-2 ${test.winner === 'B' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-muted'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Variante B</span>
            {test.winner === 'B' && <Trophy className="h-4 w-4 text-yellow-500" />}
          </div>
          <p className="text-2xl font-bold">{test.variant_b_price.toFixed(2)} €</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_b_views}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_b_conversions}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span>{crB}%</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span>{test.variant_b_revenue.toFixed(0)}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar pour le trafic */}
      {test.status === 'running' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Répartition du trafic</span>
            <span>{totalViews} vues totales</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500" 
              style={{ width: `${100 - test.traffic_split}%` }}
            />
            <div 
              className="bg-purple-500" 
              style={{ width: `${test.traffic_split}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>A: {100 - test.traffic_split}%</span>
            <span>B: {test.traffic_split}%</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {test.status === 'draft' && onStart && (
          <Button size="sm" onClick={onStart} disabled={starting}>
            <Play className="h-4 w-4 mr-1" />
            Démarrer
          </Button>
        )}
        {test.status === 'running' && onStop && (
          <Button size="sm" variant="outline" onClick={onStop} disabled={stopping}>
            <Square className="h-4 w-4 mr-1" />
            Arrêter
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateTestDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const createTest = useCreateABTest();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [variantAPrice, setVariantAPrice] = useState('');
  const [variantBPrice, setVariantBPrice] = useState('');
  const [testName, setTestName] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products-for-ab-test'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from('products')
        .select('id, title, price, sku')
        .eq('user_id', user.id)
        .order('title')
        .limit(50);
      
      return data || [];
    },
  });

  const handleCreate = () => {
    if (!selectedProduct || !variantAPrice || !variantBPrice) return;
    
    createTest.mutate({
      productId: selectedProduct,
      variantAPrice: parseFloat(variantAPrice),
      variantBPrice: parseFloat(variantBPrice),
      testName: testName || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedProduct('');
        setVariantAPrice('');
        setVariantBPrice('');
        setTestName('');
      }
    });
  };

  const selectedProductData = products?.find(p => p.id === selectedProduct);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau test
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un test A/B de prix</DialogTitle>
          <DialogDescription>
            Comparez deux prix différents pour optimiser vos ventes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Produit</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {products?.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title} ({product.price}€)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nom du test (optionnel)</Label>
            <Input 
              placeholder="Ex: Test prix hiver 2024"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix Variante A (€)</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder={selectedProductData?.price?.toString() || '0.00'}
                value={variantAPrice}
                onChange={(e) => setVariantAPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prix Variante B (€)</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={variantBPrice}
                onChange={(e) => setVariantBPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!selectedProduct || !variantAPrice || !variantBPrice || createTest.isPending}
          >
            Créer le test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
