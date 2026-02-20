/**
 * Winning Products - AI-powered product research with real data
 */
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendScanner } from '@/components/product-research/TrendScanner'
import { ViralProductFinder } from '@/components/product-research/ViralProductFinder'
import { MarketSaturationAnalyzer } from '@/components/product-research/MarketSaturationAnalyzer'
import { WinningScoreCard } from '@/components/product-research/WinningScoreCard'
import { useProductResearch } from '@/hooks/useProductResearch'
import {
  Trophy, TrendingUp, Flame, Activity, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WinningProductsPage() {
  const [activeTab, setActiveTab] = useState('trends')
  const { loadSavedProducts, savedProducts } = useProductResearch()

  useEffect(() => {
    loadSavedProducts()
  }, [])

  return (
    <>
      <Helmet>
        <title>Produits Gagnants IA | ShopOpti</title>
        <meta name="description" content="Trouvez les produits gagnants grâce à l'IA. Scan de tendances, détection virale, analyse de saturation." />
      </Helmet>

      <ChannablePageWrapper
        title="Produits Gagnants"
        description="Scanner IA de tendances, produits viraux et saturation marché en temps réel."
        heroImage="research"
        badge={{ label: 'Intelligence IA', icon: Sparkles }}
        actions={
          <Button size="sm" variant="outline" onClick={loadSavedProducts}>
            <Trophy className="mr-2 h-4 w-4" />
            {savedProducts.length} produits sauvegardés
          </Button>
        }
      >
        {/* Saved products overview */}
        <WinningScoreCard />

        {/* Main research tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="viral" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Viral
            </TabsTrigger>
            <TabsTrigger value="saturation" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Saturation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-6">
            <TrendScanner />
          </TabsContent>

          <TabsContent value="viral" className="mt-6">
            <ViralProductFinder />
          </TabsContent>

          <TabsContent value="saturation" className="mt-6">
            <MarketSaturationAnalyzer />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
