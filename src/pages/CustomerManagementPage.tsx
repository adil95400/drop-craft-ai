import React from 'react';
import { CustomerManagement } from '@/components/customer/CustomerManagement';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function CustomerManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <CustomerManagement />
      </div>
    </RequirePlan>
  );
}