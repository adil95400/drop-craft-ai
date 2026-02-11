import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutoTrackingManager } from '@/components/tracking/AutoTrackingManager'
import { UnifiedTrackingTimeline } from '@/components/tracking/UnifiedTrackingTimeline'
import { 
  Truck, Package, MapPin
} from 'lucide-react'

export default function AutoTrackingPage() {
  return (
    <>
      <Helmet>
        <title>Tracking Automatique — Suivi des colis en temps réel</title>
        <meta name="description" content="Suivi automatique des colis avec injection de numéros de tracking dans vos boutiques." />
      </Helmet>

      <ChannablePageWrapper
        title="Tracking Automatique"
        description="Suivez vos colis en temps réel et injectez automatiquement les numéros de suivi"
        heroImage="automation"
        badge={{ label: 'Tracking', icon: Truck }}
      >
        <Tabs defaultValue="manager" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Gestionnaire
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manager"><AutoTrackingManager /></TabsContent>
          <TabsContent value="timeline"><UnifiedTrackingTimeline /></TabsContent>
          <TabsContent value="config"><AutoTrackingManager /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
