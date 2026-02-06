import { Helmet } from 'react-helmet-async'
import { ABTestManager } from '@/components/marketing/ABTestManager'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'

export default function ABTestingPage() {
  return (
    <>
      <Helmet>
        <title>Tests A/B Marketing - Optimisation Statistique</title>
        <meta name="description" content="Optimisez vos campagnes marketing avec des tests A/B statistiquement significatifs et des insights avancés." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.abTesting} />
        <ABTestManager />
      </div>
    </>
  )
}