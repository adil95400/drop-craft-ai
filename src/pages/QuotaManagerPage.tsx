import React from 'react';
import { QuotaDashboard } from '@/components/quotas/QuotaDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Gauge } from 'lucide-react';

export default function QuotaManagerPage() {
  return (
    <RequirePlan minPlan="standard">
      <ChannablePageWrapper
        title="Gestion des Quotas"
        description="Surveillez et gérez vos limites d'utilisation"
        heroImage="settings"
        badge={{ label: 'Quotas', icon: Gauge }}
      >
        <QuotaDashboard />
      </ChannablePageWrapper>
    </RequirePlan>
  );
}
