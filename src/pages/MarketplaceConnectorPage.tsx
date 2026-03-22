import React from 'react';
import { MarketplaceDashboard } from '@/components/integrations/MarketplaceDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';

export default function MarketplaceConnectorPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <RequirePlan minPlan="pro">
      <ChannablePageWrapper
        title={tPages('connecteursMarketplace.title')}
        description="Connectez et synchronisez vos marketplaces en un clic"
        heroImage="integrations"
        badge={{ label: 'Marketplace', icon: ShoppingBag }}
      >
        <MarketplaceDashboard />
      </ChannablePageWrapper>
    </RequirePlan>
  );
}
