import React from 'react'
import { MarketplaceHub } from '@/domains/marketplace'
import { ChannablePageWrapper } from '@/components/channable'
import { Store } from 'lucide-react'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'

const MarketplaceHubPage: React.FC = () => {
  return (
    <ChannablePageWrapper
      title="Hub Marketplace"
      subtitle="Multi-canal"
      description="Gérez tous vos canaux de vente depuis une interface unique et maximisez votre visibilité."
      heroImage="integrations"
      badge={{ label: 'Multi-Marketplace', icon: Store }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.marketplace} />
      <MarketplaceHub />
    </ChannablePageWrapper>
  )
}

export default MarketplaceHubPage
