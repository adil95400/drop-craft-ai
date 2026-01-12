import { MarketingDashboard } from "@/components/marketing/MarketingDashboard"
import { ChannablePageWrapper } from '@/components/channable'
import { Megaphone } from 'lucide-react'

const MarketingAutomation = () => {
  return (
    <ChannablePageWrapper
      title="Marketing Automation"
      subtitle="Campagnes intelligentes"
      description="Automatisez vos campagnes marketing et touchez vos clients au bon moment avec le bon message."
      heroImage="marketing"
      badge={{ label: 'Automation', icon: Megaphone }}
    >
      <MarketingDashboard />
    </ChannablePageWrapper>
  )
}

export default MarketingAutomation
