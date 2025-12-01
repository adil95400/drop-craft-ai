import { Helmet } from 'react-helmet-async'
import { ProductionReadinessChecker } from '@/components/testing/ProductionReadinessChecker'

export default function ProductionReadinessPage() {
  return (
    <>
      <Helmet>
        <title>Production Readiness - ShopOpti</title>
        <meta name="description" content="Verify ShopOpti production readiness with comprehensive system checks." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Production Readiness</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive system verification before launch
          </p>
        </div>

        <ProductionReadinessChecker />
      </div>
    </>
  )
}
