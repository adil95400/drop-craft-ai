/**
 * Bulk Orders Page
 * Page pour les commandes groupées multi-fournisseurs
 */
import { Helmet } from 'react-helmet-async';
import { BulkOrdersDashboard } from '@/components/bulk-orders';
import { ShoppingCart } from 'lucide-react';

export default function BulkOrdersPage() {
  return (
    <>
      <Helmet>
        <title>Commandes Groupées | Shopopti</title>
        <meta 
          name="description" 
          content="Gérez vos commandes groupées multi-fournisseurs. Regroupez vos achats pour optimiser les coûts d'expédition." 
        />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Commandes Groupées</h1>
            <p className="text-muted-foreground">
              Regroupez vos achats multi-fournisseurs
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <BulkOrdersDashboard />
      </div>
    </>
  );
}
