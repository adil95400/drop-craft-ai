import React from 'react';
import { CustomerManagement } from '@/components/customer/CustomerManagement';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function CustomerManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6 space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.customers} />
        <CustomerManagement />
      </div>
    </RequirePlan>
  );
}