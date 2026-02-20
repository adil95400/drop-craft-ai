/**
 * Winning Products - Pro-level product research hub (Minea/Spocket competitor)
 * Daily feed, Ads Spy, Trend Scanner, Viral Detection, Saturation Analysis
 */
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DailyFeedPanel } from '@/components/product-research/DailyFeedPanel'
import { AdsSpyPanel } from '@/components/product-research/AdsSpyPanel'
import { TrendScanner } from '@/components/product-research/TrendScanner'
import { ViralProductFinder } from '@/components/product-research/ViralProductFinder'
import { MarketSaturationAnalyzer } from '@/components/product-research/MarketSaturationAnalyzer'
import {
  Flame, Megaphone, TrendingUp, Zap, Activity, Sparkles
} from 'lucide-react'

export default function WinningProductsPage() {
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <>
      <Helmet>
        <title>Produits Gagnants IA | Drop-Craft-AI</title>
        <meta name="description" content="Trouvez les produits gagnants avec l'IA. Flux quotidien, Ads Spy, détection virale, analyse de saturation." />
      </Helmet>

      <ChannablePageWrapper
        title="Produits Gagnants"
        description="Intelligence IA pour la recherche de produits gagnants, Ads Spy et analyse de marché en temps réel."
        heroImage="research"
        badge={{ label: 'Intelligence IA Pro', icon: Sparkles }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="feed" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Flux Daily</span>
              <span className="sm:hidden">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="ads-spy" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Ads Spy</span>
              <span className="sm:hidden">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tendances</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="viral" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              Viral
            </TabsTrigger>
            <TabsTrigger value="saturation" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Saturation</span>
              <span className="sm:hidden">Sat.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <DailyFeedPanel />
          </TabsContent>

          <TabsContent value="ads-spy" className="mt-6">
            <AdsSpyPanel />
          </TabsContent>

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
