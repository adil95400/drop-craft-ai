import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Package, CheckCircle, XCircle, Clock, TrendingDown } from 'lucide-react';

const ReturnManagementPage: React.FC = () => {
  const returns = [
    {
      id: 'RET-001',
      orderNumber: 'ORD-12345',
      customer: 'Marie Dupont',
      product: 'Product A',
      reason: 'Taille incorrecte',
      status: 'pending',
      requestDate: '2024-01-15',
      amount: 49.99,
    },
    {
      id: 'RET-002',
      orderNumber: 'ORD-12346',
      customer: 'Jean Martin',
      product: 'Product B',
      reason: 'Produit défectueux',
      status: 'approved',
      requestDate: '2024-01-14',
      amount: 89.99,
    },
    {
      id: 'RET-003',
      orderNumber: 'ORD-12347',
      customer: 'Sophie Leblanc',
      product: 'Product C',
      reason: 'Ne correspond pas à la description',
      status: 'completed',
      requestDate: '2024-01-10',
      amount: 34.99,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      case 'completed':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Complété</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des retours</h1>
          <p className="text-muted-foreground">
            Traitez et suivez les demandes de retour
          </p>
        </div>
        <Button>
          <RotateCcw className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retours en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Action requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de retour</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4%</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût des retours</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1,234</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de traitement</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3j</div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuvés</TabsTrigger>
          <TabsTrigger value="completed">Complétés</TabsTrigger>
          <TabsTrigger value="rejected">Refusés</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes en attente</CardTitle>
              <CardDescription>Retours nécessitant votre attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returns.filter(r => r.status === 'pending').map((ret) => (
                  <div
                    key={ret.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{ret.id} - {ret.product}</h3>
                        <p className="text-sm text-muted-foreground">
                          Client: {ret.customer} • Commande: {ret.orderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Raison: {ret.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{ret.amount}</div>
                        <div className="text-xs text-muted-foreground">{ret.requestDate}</div>
                      </div>
                      {getStatusBadge(ret.status)}
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          Approuver
                        </Button>
                        <Button size="sm" variant="outline">
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Retours approuvés</CardTitle>
              <CardDescription>En attente de réception</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returns.filter(r => r.status === 'approved').map((ret) => (
                  <div
                    key={ret.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{ret.id} - {ret.product}</h3>
                        <p className="text-sm text-muted-foreground">
                          Client: {ret.customer}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{ret.amount}</div>
                      </div>
                      {getStatusBadge(ret.status)}
                      <Button size="sm">Produit reçu</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Retours complétés</CardTitle>
              <CardDescription>Historique des retours traités</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des retours complétés...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Retours refusés</CardTitle>
              <CardDescription>Demandes refusées avec raison</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des retours refusés...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReturnManagementPage;
