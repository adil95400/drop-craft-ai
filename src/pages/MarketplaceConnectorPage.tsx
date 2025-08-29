import React from 'react';
import { MarketplaceConnector } from '@/components/integrations/MarketplaceConnector';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function MarketplaceConnectorPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <MarketplaceConnector />
      </div>
    </RequirePlan>
  );
}