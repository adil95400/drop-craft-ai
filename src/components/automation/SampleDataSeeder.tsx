import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAutomation } from '@/hooks/useAutomation';
import { useRealCustomers } from '@/hooks/useRealCustomers';
import { useRealOrders } from '@/hooks/useRealOrders';
import { useRealSuppliers } from '@/hooks/useRealSuppliers';
import { Database, Users, Package, Truck, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SampleDataSeeder() {
  const { seedSampleData, isSeeding } = useAutomation();
  const { customers } = useRealCustomers();
  const { orders } = useRealOrders();
  const { suppliers } = useRealSuppliers();

  const handleSeedData = async () => {
    await seedSampleData();
  };

  const dataStats = [
    {
      label: 'Clients',
      count: customers.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Commandes',
      count: orders.length,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Fournisseurs',
      count: suppliers.length,
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const hasData = customers.length > 0 || orders.length > 0 || suppliers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Données d'Exemple
        </CardTitle>
        <CardDescription>
          Créez des données de test pour explorer toutes les fonctionnalités
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dataStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            {hasData ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">Données disponibles</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Aucune donnée trouvée</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {hasData 
                ? 'Vous pouvez ajouter plus de données ou tester les automatisations'
                : 'Créez des données d\'exemple pour commencer à tester'
              }
            </p>
          </div>
          
          <Button 
            onClick={handleSeedData}
            disabled={isSeeding}
            className="min-w-[160px]"
          >
            <Database className="w-4 h-4 mr-2" />
            {isSeeding ? 'Création...' : hasData ? 'Ajouter données' : 'Créer données test'}
          </Button>
        </div>

        {/* What will be created */}
        {!hasData && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Données qui seront créées :</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Clients</Badge>
                <span>3 profils clients avec historique</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Commandes</Badge>
                <span>3 commandes avec différents statuts</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Fournisseurs</Badge>
                <span>3 fournisseurs européens</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Automatisation</Badge>
                <span>3 déclencheurs avec actions associées</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}