import { Helmet } from 'react-helmet-async'
import { ABTestManager } from '@/components/marketing/ABTestManager'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next';

export default function ABTestingPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Tests A/B Marketing - Optimisation Statistique</title>
        <meta name="description" content="Optimisez vos campagnes marketing avec des tests A/B statistiquement significatifs et des insights avancés." />
      </Helmet>
      <ChannablePageWrapper
        title={tPages('testsABMarketing.title')}
        description="Optimisez vos campagnes avec des tests statistiquement significatifs"
        heroImage="marketing"
        badge={{ label: 'A/B Testing', icon: FlaskConical }}
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.abTesting} />
        <ABTestManager />
      </ChannablePageWrapper>
    </>
  )
}
