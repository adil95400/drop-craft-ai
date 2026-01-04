import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsSearchPanel } from './AdsSearchPanel';
import { AdsTrendingPanel } from './AdsTrendingPanel';
import { AdsCollectionsPanel } from './AdsCollectionsPanel';
import { AdsScrapePanel } from './AdsScrapePanel';
import { Search, TrendingUp, FolderHeart, Globe } from 'lucide-react';

export function AdsSpyDashboard() {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          🕵️ Ads Spy
        </h1>
        <p className="text-muted-foreground">
          Analysez les publicités de vos concurrents et découvrez les stratégies gagnantes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Recherche</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Tendances</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <FolderHeart className="w-4 h-4" />
            <span className="hidden sm:inline">Collections</span>
          </TabsTrigger>
          <TabsTrigger value="scrape" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Scraper</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <AdsSearchPanel />
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <AdsTrendingPanel />
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
