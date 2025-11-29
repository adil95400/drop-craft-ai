import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { RealSupplierStats } from '../marketplace/RealSupplierStats'
import { SupplierStatsChart } from '@/components/suppliers/SupplierStatsChart'
import { SupplierAnalyticsDashboard } from '@/components/suppliers/SupplierAnalyticsDashboard'
import { BarChart3, ArrowLeft } from 'lucide-react'

export default function SupplierAnalyticsPage() {
  const navigate = useNavigate()
  const { suppliers } = useRealSuppliers()

  return (
    <>
      <Helmet>
        <title>Analytics Fournisseurs - ShopOpti</title>
        <meta name="description" content="Analysez les performances de vos fournisseurs" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/suppliers')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics Fournisseurs
              </h1>
              <p className="text-muted-foreground mt-2">
                Analysez les performances et les KPIs de vos fournisseurs
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Stats */}
        <RealSupplierStats />

        {/* Analytics Dashboard */}
        <SupplierAnalyticsDashboard />

        {/* Charts */}
        <SupplierStatsChart suppliers={suppliers} />
      </div>
    </>
  )
}
