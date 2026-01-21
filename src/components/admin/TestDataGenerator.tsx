import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Users,
  ShoppingCart,
  Package,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Database,
  Play,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

interface GenerationResult {
  type: string;
  count: number;
  success: boolean;
  message: string;
}

export const TestDataGenerator = () => {
  const { user } = useUnifiedAuth();
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GenerationResult[]>([]);

  const [config, setConfig] = useState({
    customers: 10,
    orders: 25,
    products: 15,
    includeReturns: true,
    includeDisputes: true,
    realisticData: true
  });

  const generateTestCustomers = async (count: number): Promise<number> => {
    if (!user?.id) return 0;

    const firstNames = ['Marie', 'Pierre', 'Sophie', 'Jean', 'Emma', 'Lucas', 'Chloé', 'Thomas', 'Léa', 'Hugo'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille', 'Strasbourg', 'Rennes'];

    const customers = Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];

      return {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`,
        phone: `+33${Math.floor(Math.random() * 900000000 + 100000000)}`,
        city,
        country: 'France',
        postal_code: `${Math.floor(Math.random() * 90000 + 10000)}`,
        total_orders: Math.floor(Math.random() * 10),
        total_spent: Math.floor(Math.random() * 500) + 50,
        status: Math.random() > 0.2 ? 'active' : 'inactive',
        tags: ['test-data']
      };
    });

    const { error } = await supabase.from('customers').insert(customers);
    if (error) throw error;

    return count;
  };

  const generateTestOrders = async (count: number): Promise<number> => {
    if (!user?.id) return 0;

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const platforms = ['shopify', 'woocommerce', 'manual'];

    // Get some customer IDs
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .limit(20);

    const customerIds = customers?.map(c => c.id) || [];

    const orders = Array.from({ length: count }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

      return {
        user_id: user.id,
        order_number: `TEST-${Date.now()}-${i}`,
        customer_id: customerIds.length > 0 ? customerIds[Math.floor(Math.random() * customerIds.length)] : null,
        status,
        total_amount: Math.floor(Math.random() * 500) + 20,
        subtotal: Math.floor(Math.random() * 450) + 15,
        shipping_cost: Math.floor(Math.random() * 20) + 5,
        currency: 'EUR',
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        shipping_address: {
          city: 'Paris',
          country: 'France',
          postal_code: '75001'
        },
        order_date: orderDate.toISOString(),
        items_count: Math.floor(Math.random() * 5) + 1,
        is_test_data: true
      };
    });

    const { error } = await supabase.from('orders').insert(orders);
    if (error) throw error;

    return count;
  };

  const generateTestProducts = async (count: number): Promise<number> => {
    if (!user?.id) return 0;

    const categories = ['Électronique', 'Mode', 'Maison', 'Sport', 'Beauté'];
    const adjectives = ['Premium', 'Classique', 'Moderne', 'Élégant', 'Sport'];
    const nouns = ['Montre', 'Sac', 'Lampe', 'Chaussure', 'Crème'];

    const products = Array.from({ length: count }, (_, i) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const price = Math.floor(Math.random() * 200) + 10;

      return {
        user_id: user.id,
        title: `${adj} ${noun} Test ${i + 1}`,
        description: `Produit de test - ${adj} ${noun} dans la catégorie ${category}`,
        price,
        compare_at_price: Math.random() > 0.5 ? price * 1.2 : null,
        cost_price: price * 0.4,
        sku: `TEST-SKU-${Date.now()}-${i}`,
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        category,
        status: 'active',
        source: 'test-generator',
        tags: ['test-data']
      };
    });

    const { error } = await supabase.from('products').insert(products);
    if (error) throw error;

    return count;
  };

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setResults([]);

    const newResults: GenerationResult[] = [];

    try {
      // Generate customers
      setProgress(10);
      try {
        const customerCount = await generateTestCustomers(config.customers);
        newResults.push({
          type: 'Clients',
          count: customerCount,
          success: true,
          message: `${customerCount} clients créés`
        });
      } catch (error: any) {
        newResults.push({
          type: 'Clients',
          count: 0,
          success: false,
          message: error.message
        });
      }

      setProgress(40);

      // Generate products
      try {
        const productCount = await generateTestProducts(config.products);
        newResults.push({
          type: 'Produits',
          count: productCount,
          success: true,
          message: `${productCount} produits créés`
        });
      } catch (error: any) {
        newResults.push({
          type: 'Produits',
          count: 0,
          success: false,
          message: error.message
        });
      }

      setProgress(70);

      // Generate orders
      try {
        const orderCount = await generateTestOrders(config.orders);
        newResults.push({
          type: 'Commandes',
          count: orderCount,
          success: true,
          message: `${orderCount} commandes créées`
        });
      } catch (error: any) {
        newResults.push({
          type: 'Commandes',
          count: 0,
          success: false,
          message: error.message
        });
      }

      setProgress(100);
      setResults(newResults);

      const successCount = newResults.filter(r => r.success).length;
      if (successCount === newResults.length) {
        toast.success('Données de test générées avec succès !');
      } else {
        toast.warning('Génération partielle - voir les détails');
      }

    } catch (error: any) {
      toast.error('Erreur lors de la génération: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (!user?.id) return;

    setDeleting(true);
    try {
      // Delete test orders - filter by order_number prefix for test data
      const { data: testOrders } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('user_id', user.id)
        .like('order_number', 'TEST-%');
      
      if (testOrders && testOrders.length > 0) {
        await supabase
          .from('orders')
          .delete()
          .in('id', testOrders.map(o => o.id));
      }

      // Delete test products - filter by SKU prefix for test data
      const { data: testProducts } = await supabase
        .from('products')
        .select('id, sku')
        .eq('user_id', user.id)
        .like('sku', 'TEST-SKU-%');

      if (testProducts && testProducts.length > 0) {
        await supabase
          .from('products')
          .delete()
          .in('id', testProducts.map(p => p.id));
      }

      // Delete test customers - filter by email pattern  
      const { data: testCustomers } = await supabase
        .from('customers')
        .select('id, email')
        .eq('user_id', user.id)
        .like('email', '%@test.com');
      
      if (testCustomers && testCustomers.length > 0) {
        await supabase
          .from('customers')
          .delete()
          .in('id', testCustomers.map(c => c.id));
      }

      toast.success('Données de test supprimées');
      setResults([]);
    } catch (error: any) {
      toast.error('Erreur lors de la suppression: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Générateur de données test
          </h2>
          <p className="text-muted-foreground">
            Créez des données réalistes pour tester vos fonctionnalités
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleDeleteTestData}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Supprimer données test
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Définissez le volume de données à générer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clients
                </Label>
                <Badge variant="outline">{config.customers}</Badge>
              </div>
              <Slider
                value={[config.customers]}
                onValueChange={([v]) => setConfig(prev => ({ ...prev, customers: v }))}
                min={5}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produits
                </Label>
                <Badge variant="outline">{config.products}</Badge>
              </div>
              <Slider
                value={[config.products]}
                onValueChange={([v]) => setConfig(prev => ({ ...prev, products: v }))}
                min={5}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes
                </Label>
                <Badge variant="outline">{config.orders}</Badge>
              </div>
              <Slider
                value={[config.orders]}
                onValueChange={([v]) => setConfig(prev => ({ ...prev, orders: v }))}
                min={10}
                max={200}
                step={10}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Inclure retours</Label>
                <Switch
                  checked={config.includeReturns}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, includeReturns: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Inclure litiges</Label>
                <Switch
                  checked={config.includeDisputes}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, includeDisputes: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Données réalistes</Label>
                <Switch
                  checked={config.realisticData}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, realisticData: v }))}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Générer les données
                </>
              )}
            </Button>

            {generating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-center text-muted-foreground">
                  {progress}% complété
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
            <CardDescription>Détails de la dernière génération</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune génération effectuée</p>
                <p className="text-sm">Configurez et lancez une génération</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">{result.type}</span>
                      </div>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.count} créés
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                  </div>
                ))}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Données de test</AlertTitle>
                  <AlertDescription>
                    Ces données sont marquées comme "test-data" et peuvent être supprimées à tout moment.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
