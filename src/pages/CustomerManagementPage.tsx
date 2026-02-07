/**
 * CustomerManagementPage - Gestion Clients
 * Migré sur socle PageLayout + PageBanner
 */
import { CustomerManagement } from '@/components/customer/CustomerManagement'
import { RequirePlan } from '@/components/plan/RequirePlan'
import { PageLayout, PageBanner } from '@/components/shared'
import { Users } from 'lucide-react'

export default function CustomerManagementPage() {
  return (
    <RequirePlan minPlan="pro">
      <PageLayout
        title="Gestion Clients"
        subtitle="Segmentez, analysez et fidélisez votre base clients"
      >
        <PageBanner
          icon={Users}
          title="CRM & Fidélisation"
          description="Segmentez, analysez et fidélisez votre base clients"
          theme="rose"
        />
        <CustomerManagement />
      </PageLayout>
    </RequirePlan>
  )
}
