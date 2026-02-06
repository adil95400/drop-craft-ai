import React from 'react';
import { CustomerManagement } from '@/components/customer/CustomerManagement';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { PageBanner } from '@/components/shared/PageBanner';
import { Users } from 'lucide-react';

export default function CustomerManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6 space-y-6">
        <PageBanner
          icon={Users}
          title="Gestion Clients"
          description="Segmentez, analysez et fidélisez votre base clients"
          theme="rose"
        />
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.customers} />
        <CustomerManagement />
      </div>
    </RequirePlan>
  );
}