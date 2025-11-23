import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBulkProducts } from '@/hooks/useBulkProducts';

interface QATest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export default function ProductsQA() {
  const { user } = useUnifiedAuth();
  const { updateBulkStatus, deleteBulkProducts, exportBulkProducts, optimizeBulkProducts } = useBulkProducts();
  const [tests, setTests] = useState<QATest[]>([
    { id: 'list', name: 'Liste des produits', description: 'Charger et afficher les produits', status: 'pending' },
    { id: 'create', name: 'Créer un produit', description: 'Créer un nouveau produit de test', status: 'pending' },
    { id: 'update', name: 'Mettre à jour un produit', description: 'Modifier un produit existant', status: 'pending' },
    { id: 'bulk_update', name: 'Mise à jour groupée', description: 'Mettre à jour plusieurs produits', status: 'pending' },
    { id: 'bulk_export', name: 'Export CSV', description: 'Exporter les produits en CSV', status: 'pending' },
    { id: 'optimize', name: 'Optimisation AI', description: 'Optimiser un produit avec AI', status: 'pending' },
    { id: 'delete', name: 'Supprimer un produit', description: 'Supprimer le produit de test', status: 'pending' },
  ]);

  const [testProductId, setTestProductId] = useState<string | null>(null);

  const updateTestStatus = (testId: string, status: QATest['status'], error?: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status, error } : test
    ));
  };

  const runTest = async (testId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    updateTestStatus(testId, 'running');

    try {
      switch (testId) {
        case 'list':
          await testListProducts();
          break;
        case 'create':
          await testCreateProduct();
          break;
        case 'update':
          await testUpdateProduct();
          break;
        case 'bulk_update':
          await testBulkUpdate();
          break;
        case 'bulk_export':
          await testBulkExport();
          break;
        case 'optimize':
          await testOptimize();
          break;
        case 'delete':
          await testDeleteProduct();
          break;
      }
      updateTestStatus(testId, 'passed');
      toast.success(`Test "${testId}" réussi`);
    } catch (error: any) {
      updateTestStatus(testId, 'failed', error.message);
      toast.error(`Test "${testId}" échoué: ${error.message}`);
    }
  };

  const testListProducts = async () => {
    const { data, error } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', user!.id)
      .limit(10);

    if (error) throw error;
    if (!data) throw new Error('Aucune donnée retournée');
    
    console.log('✅ Liste des produits:', data.length);
  };

  const testCreateProduct = async () => {
    const { data, error } = await supabase
      .from('imported_products')
      .insert({
        user_id: user!.id,
        name: `Test Product ${Date.now()}`,
        price: 29.99,
        status: 'draft',
        description: 'Produit de test pour QA',
        stock_quantity: 100
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Produit non créé');
    
    setTestProductId(data.id);
    console.log('✅ Produit créé:', data.id);
  };

  const testUpdateProduct = async () => {
    if (!testProductId) {
      throw new Error('Aucun produit de test disponible');
    }

    const { error } = await supabase
      .from('imported_products')
      .update({
        name: 'Test Product (Updated)',
        price: 39.99
      })
      .eq('id', testProductId)
      .eq('user_id', user!.id);

    if (error) throw error;
    
    console.log('✅ Produit mis à jour');
  };

  const testBulkUpdate = async () => {
    if (!testProductId) {
      throw new Error('Créez d\'abord un produit de test');
    }

    updateBulkStatus([testProductId], 'active');
    console.log('✅ Mise à jour groupée effectuée');
  };

  const testBulkExport = async () => {
    const { data } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', user!.id)
      .limit(5);

    if (!data || data.length === 0) {
      throw new Error('Aucun produit à exporter');
    }

    await exportBulkProducts(data.map(p => p.id));
    console.log('✅ Export CSV généré');
  };

  const testOptimize = async () => {
    if (!testProductId) {
      throw new Error('Créez d\'abord un produit de test');
    }

    optimizeBulkProducts([testProductId]);
    console.log('✅ Optimisation AI effectuée');
  };

  const testDeleteProduct = async () => {
    if (!testProductId) {
      throw new Error('Créez d\'abord un produit de test');
    }

    deleteBulkProducts([testProductId]);
    setTestProductId(null);
    console.log('✅ Produit supprimé');
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: QATest['status']) => {
    const variants: Record<QATest['status'], 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      running: 'default',
      passed: 'default',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {status === 'passed' && '✓ '}
        {status === 'failed' && '✗ '}
        {status === 'running' && '⟳ '}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QA - Domaine Produits</h1>
        <p className="text-muted-foreground">
          Tests de validation pour les fonctionnalités produits
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests réussis</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passedCount}/{tests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests échoués</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests en attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Lancer les tests de validation</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={runAllTests} size="lg">
            Lancer tous les tests
          </Button>
          <Button 
            onClick={() => setTests(prev => prev.map(t => ({ ...t, status: 'pending', error: undefined })))}
            variant="outline"
          >
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests de validation</CardTitle>
          <CardDescription>Suite de tests pour le domaine produits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.description}</div>
                    {test.error && (
                      <div className="text-sm text-red-500 mt-1">Erreur: {test.error}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(test.status)}
                  <Button
                    onClick={() => runTest(test.id)}
                    disabled={test.status === 'running'}
                    size="sm"
                  >
                    {test.status === 'running' ? 'En cours...' : 'Lancer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
