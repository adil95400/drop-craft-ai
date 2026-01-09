import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsSearchPanel } from './AdsSearchPanel';
import { AdsTrendingPanel } from './AdsTrendingPanel';
import { AdsCollectionsPanel } from './AdsCollectionsPanel';
import { AdsScrapePanel } from './AdsScrapePanel';
import { StoreSpyPanel } from './StoreSpyPanel';
import { InfluencerSpyPanel } from './InfluencerSpyPanel';
import { TopWinnersSection } from './TopWinnersSection';
import { QuickFilters } from './QuickFilters';
import { Search, TrendingUp, FolderHeart, Globe, Store, Users, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdsSpyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    setActiveTab('search');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Ads Spy Pro
            </h1>
            <p className="text-muted-foreground">
              Espionnez les publicités gagnantes et découvrez les stratégies de vos concurrents
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pubs analysées</p>
                <p className="text-2xl font-bold">12,847</p>
              </div>
              <Search className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Winners détectés</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Boutiques espionnées</p>
                <p className="text-2xl font-bold">567</p>
              </div>
              <Store className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Influenceurs suivis</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Users className="w-8 h-8 text-pink-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters - Minea Style */}
      <QuickFilters onSelectFilter={handleQuickFilter} activeFilter={quickFilter} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2 py-3">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Adspy</span>
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2 py-3">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Boutiques</span>
          </TabsTrigger>
          <TabsTrigger value="influencers" className="flex items-center gap-2 py-3">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Influenceurs</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2 py-3">
            <FolderHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Collections</span>
          </TabsTrigger>
          <TabsTrigger value="scrape" className="flex items-center gap-2 py-3">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Scraper</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <TopWinnersSection />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <AdsSearchPanel initialFilter={quickFilter} onClearFilter={() => setQuickFilter(null)} />
        </TabsContent>

        <TabsContent value="stores" className="mt-6">
          <StoreSpyPanel />
        </TabsContent>

        <TabsContent value="influencers" className="mt-6">
          <InfluencerSpyPanel />
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <AdsCollectionsPanel />
        </TabsContent>

        <TabsContent value="scrape" className="mt-6">
          <AdsScrapePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
