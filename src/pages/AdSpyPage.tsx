import { AdSpyDashboard } from '@/components/adspy'
import { Helmet } from 'react-helmet-async'

export default function AdSpyPage() {
  return (
    <>
      <Helmet>
        <title>Ad Intelligence Hub - ShopOpti</title>
        <meta name="description" content="Analysez les publicités, trouvez les produits gagnants et surveillez vos concurrents avec notre intelligence publicitaire style Minea." />
      </Helmet>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <AdSpyDashboard />
      </div>
    </>
  )
}
