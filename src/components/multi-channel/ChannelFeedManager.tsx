import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  Filter,
  CheckCircle2,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { ChannelCard, ChannelData } from '@/components/feed-management/ChannelCard';
import { FeedRulesPanel } from '@/components/feed-management/FeedRulesPanel';
import { QualityScoreCard } from '@/components/feed-management/QualityScoreCard';

// Mock data for channels - adapted to ChannelData interface
const mockChannels: ChannelData[] = [
  {
    id: '1',
    name: 'Google Shopping',
    platform: 'Google',
    status: 'active',
    products: { total: 1250, approved: 1180, pending: 38, rejected: 32 },
    lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    qualityScore: 87,
    rules: 5
  },
  {
    id: '2',
    name: 'Facebook Catalog',
    platform: 'Meta',
    status: 'active',
    products: { total: 1250, approved: 1220, pending: 15, rejected: 15 },
    lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    qualityScore: 92,
    rules: 3
  },
  {
    id: '3',
    name: 'Amazon Marketplace',
    platform: 'Amazon',
    status: 'syncing',
    products: { total: 980, approved: 920, pending: 15, rejected: 45 },
    lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    qualityScore: 78,
    rules: 8
  },
  {
    id: '4',
    name: 'TikTok Shop',
    platform: 'TikTok',
    status: 'error',
    products: { total: 500, approved: 350, pending: 30, rejected: 120 },
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    qualityScore: 65,
    rules: 2
  }
];

// Mock quality metrics - adapted to QualityMetric interface
const mockQualityMetrics = [
  { name: 'Titres', score: 92, maxScore: 100, description: 'Titres optimisés et complets' },
  { name: 'Descriptions', score: 78, maxScore: 100, description: 'Descriptions détaillées' },
  { name: 'Images', score: 95, maxScore: 100, description: 'Images haute résolution' },
  { name: 'Prix', score: 100, maxScore: 100, description: 'Prix valides et formatés' },
  { name: 'Catégories', score: 65, maxScore: 100, description: 'Mapping catégories Google' },
  { name: 'Identifiants', score: 88, maxScore: 100, description: 'GTIN/MPN présents' }
];

// Mock issues - adapted to QualityIssue interface
const mockIssues = [
  { 
    id: '1', 
    type: 'error' as const, 
    message: 'Catégorie manquante', 
    affectedProducts: 45, 
    field: 'category',
    suggestion: 'Ajouter une catégorie à tous les produits concernés'
  },
  { 
    id: '2', 
    type: 'warning' as const, 
    message: 'Description trop courte (<100 caractères)', 
    affectedProducts: 128, 
    field: 'description',
    suggestion: 'Enrichir les descriptions pour améliorer le référencement'
  },
  { 
    id: '3', 
    type: 'warning' as const, 
    message: 'Images en basse résolution', 
    affectedProducts: 23, 
    field: 'image',
    suggestion: 'Utiliser des images de minimum 800x800 pixels'
  },
  { 
    id: '4', 
    type: 'info' as const, 
    message: 'GTIN manquant', 
    affectedProducts: 56, 
    field: 'gtin',
    suggestion: 'Ajouter le code GTIN/EAN pour améliorer la visibilité'
  }
];

export function ChannelFeedManager() {
  const [activeTab, setActiveTab] = useState('channels');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleChannelSync = (channelId: string) => {
    console.log('Syncing channel:', channelId);
  };

  const handleChannelSettings = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const handleViewIssue = (issueId: string) => {
    console.log('Viewing issue:', issueId);
  };

  const handleFixIssue = (issueId: string) => {
    console.log('Fixing issue:', issueId);
  };

  const overallQualityScore = Math.round(
    mockQualityMetrics.reduce((sum, m) => sum + m.score, 0) / mockQualityMetrics.length
  );

  const totalProducts = mockChannels.reduce((sum, c) => sum + c.products.total, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux actifs</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockChannels.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              sur {mockChannels.length} canaux configurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits publiés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockChannels.reduce((sum, c) => sum + c.products.approved, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">
                {mockChannels.reduce((sum, c) => sum + c.products.rejected, 0)} erreurs
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score qualité</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallQualityScore}%</div>
            <Progress value={overallQualityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Règles actives</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockChannels.reduce((sum, c) => sum + c.rules, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {mockChannels.length} canaux
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="rules">Règles de feed</TabsTrigger>
            <TabsTrigger value="quality">Qualité</TabsTrigger>
          </TabsList>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un canal
          </Button>
        </div>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockChannels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onSync={handleChannelSync}
                onEdit={handleChannelSettings}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <FeedRulesPanel 
            channelId={selectedChannel || 'default'}
          />
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid grid-cols-1 gap-6">
            <QualityScoreCard 
              score={overallQualityScore}
              metrics={mockQualityMetrics}
              issues={mockIssues}
              totalProducts={totalProducts}
              onViewIssue={handleViewIssue}
              onFixIssue={handleFixIssue}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
