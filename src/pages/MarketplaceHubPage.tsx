import React from 'react'
import { MarketplaceHub } from '@/domains/marketplace'
import { ChannablePageWrapper } from '@/components/channable'
import { Store } from 'lucide-react'

const MarketplaceHubPage: React.FC = () => {
  return (
    <ChannablePageWrapper
      title="Hub Marketplace"
      subtitle="Multi-canal"
      description="Gérez tous vos canaux de vente depuis une interface unique et maximisez votre visibilité."
      heroImage="integrations"
      badge={{ label: 'Multi-Marketplace', icon: Store }}
    >
      <MarketplaceHub />
    </ChannablePageWrapper>
  )
}

export default MarketplaceHubPage
