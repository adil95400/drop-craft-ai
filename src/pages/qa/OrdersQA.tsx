import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QATest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export default function OrdersQA() {
  const { user } = useUnifiedAuth();
  const [testOrderId, setTestOrderId] = useState<string | null>(null);
  const [testCustomerId, setTestCustomerId] = useState<string | null>(null);
  
  const [tests, setTests] = useState<QATest[]>([
    { id: 'list', name: 'Liste des commandes', description: 'Charger les commandes', status: 'pending' },
    { id: 'create_customer', name: 'Créer un client', description: 'Créer un client de test', status: 'pending' },
    { id: 'create_order', name: 'Créer une commande', description: 'Créer une commande de test', status: 'pending' },
    { id: 'get_order', name: 'Détails commande', description: 'Récupérer les détails d\'une commande', status: 'pending' },
    { id: 'update_status', name: 'Mise à jour statut', description: 'Changer le statut d\'une commande', status: 'pending' },
    { id: 'stats', name: 'Statistiques', description: 'Récupérer les stats des commandes', status: 'pending' },
    { id: 'export', name: 'Export', description: 'Exporter les commandes en CSV', status: 'pending' },
    { id: 'delete', name: 'Supprimer', description: 'Supprimer la commande de test', status: 'pending' },
  ]);

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
          await testListOrders();
          break;
        case 'create_customer':
          await testCreateCustomer();
          break;
        case 'create_order':
          await testCreateOrder();
          break;
        case 'get_order':
          await testGetOrder();
          break;
        case 'update_status':
          await testUpdateStatus();
          break;
        case 'stats':
          await testGetStats();
          break;
        case 'export':
          await testExportOrders();
          break;
        case 'delete':
          await testDeleteOrder();
          break;
      }
      updateTestStatus(testId, 'passed');
      toast.success(`Test "${testId}" réussi`);
    } catch (error: any) {
      updateTestStatus(testId, 'failed', error.message);
      toast.error(`Test "${testId}" échoué: ${error.message}`);
    }
  };

  const testListOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .limit(10);

    if (error) throw error;
    console.log('✅ Commandes chargées:', data?.length || 0);
  };

  const testCreateCustomer = async () => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user!.id,
        first_name: 'Test',
        last_name: `Customer ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        total_orders: 0,
        total_spent: 0
      })
      .select()
      .single();

    if (error) throw error;
    setTestCustomerId(data.id);
    console.log('✅ Client créé:', data.id);
  };

  const testCreateOrder = async () => {
    if (!testCustomerId) {
      throw new Error('Créez d\'abord un client de test');
    }

    const orderNumber = `ORD-TEST-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user!.id,
        customer_id: testCustomerId,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        total_amount: 99.99,
        currency: 'EUR',
        order_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    setTestOrderId(data.id);
    console.log('✅ Commande créée:', data.id);
  };

  const testGetOrder = async () => {
    if (!testOrderId) {
      throw new Error('Créez d\'abord une commande de test');
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', testOrderId)
      .eq('user_id', user!.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Commande non trouvée');
    
    console.log('✅ Détails commande récupérés');
  };

  const testUpdateStatus = async () => {
    if (!testOrderId) {
      throw new Error('Créez d\'abord une commande de test');
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', testOrderId)
      .eq('user_id', user!.id);

    if (error) throw error;
    console.log('✅ Statut mis à jour');
  };

  const testGetStats = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('user_id', user!.id);

    if (error) throw error;
    
    const stats = {
      total: data?.length || 0,
      revenue: data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    };
    
    console.log('✅ Statistiques:', stats);
  };

  const testExportOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(first_name, last_name)')
      .eq('user_id', user!.id)
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Aucune commande à exporter');
    }

    // Simuler export CSV
    const csv = data.map(o => {
      const customer = o.customers as any;
      const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'N/A';
      return `${o.order_number},${customerName},${o.status},${o.total_amount}`;
    }).join('\n');
    
    console.log('✅ Export CSV généré:', csv.split('\n').length, 'lignes');
  };

  const testDeleteOrder = async () => {
    if (!testOrderId) {
      throw new Error('Créez d\'abord une commande de test');
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', testOrderId)
      .eq('user_id', user!.id);

    if (error) throw error;
    
    // Nettoyer le client aussi
    if (testCustomerId) {
      await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomerId)
        .eq('user_id', user!.id);
    }
    
    setTestOrderId(null);
    setTestCustomerId(null);
    console.log('✅ Commande et client supprimés');
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

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QA - Domaine Commandes</h1>
        <p className="text-muted-foreground">
          Tests de validation pour le système de gestion des commandes
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
            <CardTitle className="text-sm font-medium">Produits de test</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              Commande: {testOrderId ? '✓' : '✗'}<br/>
              Client: {testCustomerId ? '✓' : '✗'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
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
                  <Badge variant={test.status === 'failed' ? 'destructive' : 'default'}>
                    {test.status.toUpperCase()}
                  </Badge>
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
