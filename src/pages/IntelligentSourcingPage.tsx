import { Helmet } from 'react-helmet-async'
import { IntelligentSourcingHub } from '@/components/sourcing/IntelligentSourcingHub'

export default function IntelligentSourcingPage() {
  return (
    <>
      <Helmet>
        <title>Sourcing Intelligent - ShopOpti</title>
        <meta name="description" content="Découvrez des produits gagnants, analysez les niches et espionnez la concurrence avec notre IA de sourcing intelligent style Minea." />
      </Helmet>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <IntelligentSourcingHub />
      </div>
    </>
  )
}
