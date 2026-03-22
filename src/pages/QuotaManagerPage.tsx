import React from 'react';
import { QuotaDashboard } from '@/components/quotas/QuotaDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Gauge } from 'lucide-react';

export default function QuotaManagerPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <RequirePlan minPlan="standard">
      <ChannablePageWrapper
        title={tPages('gestionDesQuotas.title')}
        description="Surveillez et gérez vos limites d'utilisation"
        heroImage="settings"
        badge={{ label: 'Quotas', icon: Gauge }}
      >
        <QuotaDashboard />
      </ChannablePageWrapper>
    </RequirePlan>
  );
}
