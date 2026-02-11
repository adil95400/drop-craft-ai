/**
 * Page Admin - Vue globale de la consommation
 */

import { AdminConsumptionDashboard } from '@/components/consumption';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { CreditCard } from 'lucide-react';

export default function AdminConsumptionPage() {
  return (
    <ChannablePageWrapper
      title="Suivi de consommation"
      description="Vue globale de la consommation de tous les utilisateurs"
      heroImage="analytics"
      badge={{ label: 'Admin', icon: CreditCard }}
    >
      <AdminConsumptionDashboard />
    </ChannablePageWrapper>
  );
}
