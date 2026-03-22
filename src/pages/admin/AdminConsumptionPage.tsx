/**
 * Page Admin - Vue globale de la consommation
 */

import { AdminConsumptionDashboard } from '@/components/consumption';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

export default function AdminConsumptionPage() {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('suiviDeConsommation.title')}
      description="Vue globale de la consommation de tous les utilisateurs"
      heroImage="analytics"
      badge={{ label: 'Admin', icon: CreditCard }}
    >
      <AdminConsumptionDashboard />
    </ChannablePageWrapper>
  );
}
