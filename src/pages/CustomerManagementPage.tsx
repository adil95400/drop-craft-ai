/**
 * CustomerManagementPage - Gestion Clients
 */
import { CustomerManagement } from '@/components/customer/CustomerManagement'
import { RequirePlan } from '@/components/plan/RequirePlan'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Users } from 'lucide-react'

export default function CustomerManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <ChannablePageWrapper
        title="Gestion Clients"
        description="Segmentez, analysez et fidélisez votre base clients"
        heroImage="orders"
        badge={{ label: 'CRM', icon: Users }}
      >
        <CustomerManagement />
      </ChannablePageWrapper>
    </RequirePlan>
  )
}
