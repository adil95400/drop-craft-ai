import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendScanner } from './TrendScanner';
import { ViralProductFinder } from './ViralProductFinder';
import { ViralProductsScraper } from './ViralProductsScraper';
import { MarketSaturationAnalyzer } from './MarketSaturationAnalyzer';
import { SaturationAnalyzer } from './SaturationAnalyzer';
import { TrendPredictor } from './TrendPredictor';
import { WinningScoreCard } from './WinningScoreCard';
import { TrendingUp, Search, Activity, Award, Zap } from 'lucide-react';

export function ProductResearchScanner() {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="scanner" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Tendances</span>
        </TabsTrigger>
        <TabsTrigger value="viral" className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Scraper Social</span>
        </TabsTrigger>
        <TabsTrigger value="saturation" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Saturation Pro</span>
        </TabsTrigger>
        <TabsTrigger value="prediction" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Prédictions IA</span>
        </TabsTrigger>
        <TabsTrigger value="results" className="flex items-center gap-2">
          <Award className="w-4 h-4" />
          <span className="hidden sm:inline">Résultats</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scanner" className="space-y-4">
        <TrendScanner />
      </TabsContent>

      <TabsContent value="viral" className="space-y-4">
        <ViralProductsScraper />
      </TabsContent>

      <TabsContent value="saturation" className="space-y-4">
        <SaturationAnalyzer />
      </TabsContent>

      <TabsContent value="prediction" className="space-y-4">
        <TrendPredictor />
      </TabsContent>

      <TabsContent value="results" className="space-y-4">
        <WinningScoreCard />
      </TabsContent>
    </Tabs>
  );
}
