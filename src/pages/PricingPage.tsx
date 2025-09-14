import { Helmet } from 'react-helmet-async'
import { SmartPlanSelector } from '@/components/plan/SmartPlanSelector'
import { FeatureComparison } from '@/components/commercial/FeatureComparison'

export default function PricingPage() {
  return (
    <>
      <Helmet>
        <title>Tarifs - Plans et fonctionnalités</title>
        <meta name="description" content="Découvrez nos plans tarifaires et choisissez celui qui correspond le mieux à vos besoins." />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Plans & Tarifs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. 
            Démarrez gratuitement et évoluez selon votre croissance.
          </p>
        </div>

        <SmartPlanSelector />
        
        <FeatureComparison />
      </div>
    </>
  )
}