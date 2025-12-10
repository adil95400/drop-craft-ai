import React from 'react';
import { ProductOptimizationPanel } from '@/components/intelligence/ProductOptimizationPanel';
import { BusinessIntelligenceDashboard } from '@/components/intelligence/BusinessIntelligenceDashboard';
import { ProductPerformanceAnalyzer } from '@/components/ai-intelligence/ProductPerformanceAnalyzer';
import { CrossSellUpsellEngine } from '@/components/ai-intelligence/CrossSellUpsellEngine';
import { SEORelevanceScorer } from '@/components/ai-intelligence/SEORelevanceScorer';
import { TrendSemanticAnalyzer } from '@/components/ai-intelligence/TrendSemanticAnalyzer';
import { MultilingualAIOptimizer } from '@/components/ai-intelligence/MultilingualAIOptimizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Target, TrendingUp, BarChart3, Search, Globe, ArrowRightLeft } from 'lucide-react';

export default function ProductIntelligencePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          Intelligence Produits IA
        </h1>
        <p className="text-muted-foreground">
          Analyses avancées et optimisations intelligentes de votre catalogue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Brain className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">IA Active</p><p className="text-2xl font-bold text-green-600">ON</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Target className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Produits Optimisés</p><p className="text-2xl font-bold">47</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">ROI Moyen</p><p className="text-2xl font-bold text-green-600">+23%</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg"><BarChart3 className="w-5 h-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Insights Générés</p><p className="text-2xl font-bold">156</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="performance"><BarChart3 className="w-4 h-4 mr-1" />Performance</TabsTrigger>
          <TabsTrigger value="crosssell"><ArrowRightLeft className="w-4 h-4 mr-1" />Cross-Sell</TabsTrigger>
          <TabsTrigger value="seo"><Search className="w-4 h-4 mr-1" />SEO</TabsTrigger>
          <TabsTrigger value="trends"><TrendingUp className="w-4 h-4 mr-1" />Tendances</TabsTrigger>
          <TabsTrigger value="multilingual"><Globe className="w-4 h-4 mr-1" />Multilingue</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="performance"><ProductPerformanceAnalyzer /></TabsContent>
        <TabsContent value="crosssell"><CrossSellUpsellEngine /></TabsContent>
        <TabsContent value="seo"><SEORelevanceScorer /></TabsContent>
        <TabsContent value="trends"><TrendSemanticAnalyzer /></TabsContent>
        <TabsContent value="multilingual"><MultilingualAIOptimizer /></TabsContent>
        <TabsContent value="optimization"><ProductOptimizationPanel /></TabsContent>
        <TabsContent value="intelligence"><BusinessIntelligenceDashboard /></TabsContent>
      </Tabs>
    </div>
  );
}