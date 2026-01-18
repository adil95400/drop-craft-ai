import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ProductRule, ProductRuleCondition } from '@/lib/rules/ruleTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, CheckCircle2, XCircle, ArrowRight, Loader2, 
  Search, Database, TestTube, RefreshCw 
} from 'lucide-react';

interface RuleTesterDialogProps {
  rule: ProductRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number;
  stock_quantity: number;
  category: string;
  brand: string;
  sku: string;
  tags: string[];
  audit_score_global: number;
}

function evaluateCondition(condition: ProductRuleCondition, product: TestProduct): boolean {
  const fieldValue = product[condition.field as keyof TestProduct];
  const condValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue == condValue;
    case 'ne':
      return fieldValue != condValue;
    case 'gt':
      return Number(fieldValue) > Number(condValue);
    case 'ge':
      return Number(fieldValue) >= Number(condValue);
    case 'lt':
      return Number(fieldValue) < Number(condValue);
    case 'le':
      return Number(fieldValue) <= Number(condValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condValue).toLowerCase());
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(condValue).toLowerCase());
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(condValue).toLowerCase());
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(condValue).toLowerCase());
    case 'empty':
      return !fieldValue || (Array.isArray(fieldValue) ? fieldValue.length === 0 : String(fieldValue).trim() === '');
    case 'not_empty':
      return !!fieldValue && (Array.isArray(fieldValue) ? fieldValue.length > 0 : String(fieldValue).trim() !== '');
    case 'length_gt':
      return String(fieldValue).length > Number(condValue);
    case 'length_lt':
      return String(fieldValue).length < Number(condValue);
    default:
      return false;
  }
}

function evaluateRule(rule: ProductRule, product: TestProduct): { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] } {
  const conditionResults = rule.conditionGroup.conditions.map(condition => ({
    condition,
    result: evaluateCondition(condition, product)
  }));

  const matches = rule.conditionGroup.logic === 'AND'
    ? conditionResults.every(r => r.result)
    : conditionResults.some(r => r.result);

  return { matches, conditionResults };
}

export function RuleTesterDialog({ rule, open, onOpenChange }: RuleTesterDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'database' | 'sample'>('database');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<TestProduct[]>([]);
  const [results, setResults] = useState<Map<string, { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] }>>(new Map());

  // Sample products for testing without database
  const SAMPLE_PRODUCTS: TestProduct[] = [
    {
      id: 'sample-1',
      name: 'iPhone 15 Pro Max Case Ultra Protection avec Support Béquille Antichoc et Porte-Cartes Intégré pour Apple',
      description: 'Coque premium',
      price: 29.99,
      compare_at_price: 39.99,
      stock_quantity: 45,
      category: 'Accessoires Téléphone',
      brand: 'TechCase',
      sku: 'IP15-CASE-001',
      tags: ['iphone', 'case', 'protection'],
      audit_score_global: 72
    },
    {
      id: 'sample-2',
      name: 'Câble USB-C',
      description: '',
      price: 12.99,
      compare_at_price: 0,
      stock_quantity: 5,
      category: 'Câbles',
      brand: 'NoCable',
      sku: 'USB-C-002',
      tags: ['cable', 'usb'],
      audit_score_global: 35
    },
    {
      id: 'sample-3',
      name: 'Casque Bluetooth Pro',
      description: 'Casque sans fil avec réduction de bruit active, autonomie 30h, qualité audio Hi-Fi',
      price: 89.99,
      compare_at_price: 129.99,
      stock_quantity: 120,
      category: 'Audio',
      brand: 'SoundMax',
      sku: 'BT-HEAD-003',
      tags: ['audio', 'bluetooth', 'premium'],
      audit_score_global: 88
    }
  ];

  // Load products from database
  const loadProducts = async () => {
    if (!user?.id) return;
    
    setIsLoadingProducts(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, description, price, compare_at_price, stock_quantity, category, brand, sku, tags')
        .eq('user_id', user.id)
        .limit(50);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts((data || []).map((p: any) => ({
        id: p.id,
        name: p.name || '',
        description: p.description || '',
        price: p.price || 0,
        compare_at_price: p.compare_at_price || 0,
        stock_quantity: p.stock_quantity || 0,
        category: p.category || '',
        brand: p.brand || '',
        sku: p.sku || '',
        tags: p.tags || [],
        audit_score_global: 0
      })));
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === 'database') {
      loadProducts();
    }
  }, [open, activeTab]);

  const runTest = async () => {
    setIsRunning(true);
    setResults(new Map());

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 300));

    const testProducts = activeTab === 'database' ? products : SAMPLE_PRODUCTS;
    const newResults = new Map<string, { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] }>();

    for (const product of testProducts) {
      const result = evaluateRule(rule, product);
      newResults.set(product.id, result);
    }

    setResults(newResults);
    setIsRunning(false);

    const matchCount = Array.from(newResults.values()).filter(r => r.matches).length;
    toast({
      title: 'Test terminé',
      description: `${matchCount}/${testProducts.length} produits correspondent aux conditions`
    });
  };

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      eq: '=', ne: '≠', gt: '>', ge: '≥', lt: '<', le: '≤',
      contains: 'contient', not_contains: 'ne contient pas',
      starts_with: 'commence par', ends_with: 'finit par',
      empty: 'est vide', not_empty: 'n\'est pas vide',
      length_gt: 'longueur >', length_lt: 'longueur <'
    };
    return labels[op] || op;
  };

  const testProducts = activeTab === 'database' ? products : SAMPLE_PRODUCTS;
  const matchCount = Array.from(results.values()).filter(r => r.matches).length;
  const noMatchCount = Array.from(results.values()).filter(r => !r.matches).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Tester la règle: {rule.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rule Summary */}
          <Card className="bg-muted/30">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4" />
                Résumé de la règle
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">SI</Badge>
                  {rule.conditionGroup.conditions.map((cond, idx) => (
                    <div key={cond.id} className="flex items-center gap-1">
                      {idx > 0 && <Badge variant="secondary" className="text-xs">{rule.conditionGroup.logic}</Badge>}
                      <span className="bg-background px-2 py-0.5 rounded text-xs border">
                        {cond.field} {getOperatorLabel(cond.operator)} {cond.value || ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-primary/10">ALORS</Badge>
                  {rule.actions.map((action) => (
                    <span key={action.id} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {action.type} → {action.field}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'database' | 'sample')}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="database" className="gap-2">
                  <Database className="h-4 w-4" />
                  Mes produits
                </TabsTrigger>
                <TabsTrigger value="sample" className="gap-2">
                  <TestTube className="h-4 w-4" />
                  Produits d'exemple
                </TabsTrigger>
              </TabsList>

              <Button onClick={runTest} disabled={isRunning || (activeTab === 'database' && products.length === 0)}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Lancer le test ({testProducts.length})
                  </>
                )}
              </Button>
            </div>

            <TabsContent value="database" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                  />
                </div>
                <Button variant="outline" onClick={loadProducts} disabled={isLoadingProducts}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {isLoadingProducts ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Chargement des produits...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit trouvé</p>
                  <p className="text-sm">Ajoutez des produits ou utilisez les produits d'exemple</p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="sample" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Testez votre règle sur 3 produits d'exemple pré-configurés
              </p>
            </TabsContent>
          </Tabs>

          {/* Results */}
          {results.size > 0 && (
            <>
              {/* Stats */}
              <div className="flex items-center justify-center gap-6 py-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{matchCount} match{matchCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{noMatchCount} non-match{noMatchCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {testProducts.map((product) => {
                    const result = results.get(product.id);
                    if (!result) return null;

                    return (
                      <Card key={product.id} className={`transition-all ${result.matches ? 'border-green-500 bg-green-500/5' : 'border-muted'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {result.matches ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                                )}
                                <span className="font-medium truncate max-w-md">{product.name}</span>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground space-y-1 ml-7">
                                <div className="flex flex-wrap gap-2">
                                  <span>Prix: {product.price}€</span>
                                  <span>•</span>
                                  <span>Stock: {product.stock_quantity}</span>
                                  <span>•</span>
                                  <span>Score: {product.audit_score_global}</span>
                                </div>

                                {/* Condition results */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {result.conditionResults.map((cr, idx) => (
                                    <Badge
                                      key={idx}
                                      variant={cr.result ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {cr.condition.field} {getOperatorLabel(cr.condition.operator)} {cr.condition.value || '∅'}
                                      {cr.result ? ' ✓' : ' ✗'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {result.matches && (
                              <Badge className="bg-green-500 shrink-0">Match</Badge>
                            )}
                          </div>

                          {/* Show what would be applied */}
                          {result.matches && (
                            <div className="mt-3 pt-3 border-t ml-7">
                              <p className="text-xs font-medium mb-2">Actions qui seraient appliquées:</p>
                              <div className="space-y-1">
                                {rule.actions.map((action) => (
                                  <div key={action.id} className="flex items-center gap-2 text-xs bg-muted rounded p-2">
                                    <ArrowRight className="h-3 w-3 text-primary" />
                                    <span className="font-medium">{action.type}</span>
                                    <span>sur</span>
                                    <code className="bg-background px-1 rounded">{action.field}</code>
                                    {action.value && (
                                      <>
                                        <span>=</span>
                                        <code className="bg-background px-1 rounded text-primary">{action.value}</code>
                                      </>
                                    )}
                                    {action.aiPrompt && (
                                      <span className="text-purple-500 truncate max-w-[200px]">(IA: {action.aiPrompt})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
