import React from 'react';
import { QuotaManager } from '@/components/quotas/QuotaManager';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { PageBanner } from '@/components/shared/PageBanner';
import { Gauge } from 'lucide-react';

export default function QuotaManagerPage() {
  return (
    <RequirePlan minPlan="standard">
      <div className="container mx-auto py-6 space-y-6">
        <PageBanner
          icon={Gauge}
          title="Gestion des Quotas"
          description="Surveillez et gérez vos limites d'utilisation"
          theme="orange"
        />
        <QuotaManager />
      </div>
    </RequirePlan>
  );
}