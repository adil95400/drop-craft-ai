import React from 'react';
import { MarketplaceDashboard } from '@/components/integrations/MarketplaceDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function MarketplaceConnectorPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <MarketplaceDashboard />
      </div>
    </RequirePlan>
  );
}