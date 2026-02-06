/**
 * Bulk Orders Page
 * Page pour les commandes groupées multi-fournisseurs - Style Channable
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { BulkOrdersDashboard } from '@/components/bulk-orders';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function BulkOrdersPage() {
  const { data: stats } = useQuery({
    queryKey: ['bulk-orders-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, pending: 0, completed: 0 };
      
      const { data, error } = await supabase
        .from('bulk_orders')
        .select('status')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return {
        total: data?.length || 0,
        pending: data?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0
      };
    }
  });

  return (
    <>
      <Helmet>
        <title>Commandes Groupées | ShopOpti+</title>
        <meta 
          name="description" 
          content="Gérez vos commandes groupées multi-fournisseurs. Regroupez vos achats pour optimiser les coûts d'expédition." 
        />
      </Helmet>
      
      <ChannablePageWrapper
        title="Commandes Groupées"
        subtitle="Gestion en masse"
        description={`${stats?.total || 0} commandes groupées • ${stats?.pending || 0} en cours • Optimisez vos coûts d'expédition`}
        heroImage="orders"
        badge={{ label: "Bulk Orders", icon: ShoppingCart }}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle commande groupée
          </Button>
        }
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.bulkOrders} />
        <BulkOrdersDashboard />
      </ChannablePageWrapper>
    </>
  );
}
