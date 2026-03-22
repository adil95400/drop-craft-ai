/**
 * CustomerManagementPage - Gestion Clients
 */
import { CustomerManagement } from '@/components/customer/CustomerManagement'
import { RequirePlan } from '@/components/plan/RequirePlan'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next';

export default function CustomerManagementPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <RequirePlan minPlan="pro">
      <ChannablePageWrapper
        title={tPages('gestionClients.title')}
        description="Segmentez, analysez et fidélisez votre base clients"
        heroImage="orders"
        badge={{ label: 'CRM', icon: Users }}
      >
        <CustomerManagement />
      </ChannablePageWrapper>
    </RequirePlan>
  )
}
