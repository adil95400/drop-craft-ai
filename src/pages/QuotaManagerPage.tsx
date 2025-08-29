import React from 'react';
import { QuotaManager } from '@/components/quotas/QuotaManager';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function QuotaManagerPage() {
  return (
    <RequirePlan minPlan="standard">
      <div className="container mx-auto py-6">
        <QuotaManager />
      </div>
    </RequirePlan>
  );
}