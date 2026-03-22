import React from 'react'
import { MarketplaceHub } from '@/domains/marketplace'
import { ChannablePageWrapper } from '@/components/channable'
import { Store } from 'lucide-react'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { useTranslation } from 'react-i18next';

const MarketplaceHubPage: React.FC = () => {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('hubMarketplace.title')}
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
