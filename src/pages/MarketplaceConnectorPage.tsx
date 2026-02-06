import React from 'react';
import { MarketplaceDashboard } from '@/components/integrations/MarketplaceDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { PageBanner } from '@/components/shared/PageBanner';
import { ShoppingBag } from 'lucide-react';

export default function MarketplaceConnectorPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6 space-y-6">
        <PageBanner
          icon={ShoppingBag}
          title="Connecteurs Marketplace"
          description="Connectez et synchronisez vos marketplaces en un clic"
          theme="cyan"
        />
        <MarketplaceDashboard />
      </div>
    </RequirePlan>
  );
}