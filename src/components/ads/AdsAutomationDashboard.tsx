import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdsManager } from '@/hooks/useAdsManager';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  RefreshCw,
  Plus,
  Facebook,
  Instagram,
  Chrome,
  Sparkles
} from 'lucide-react';
import { AdCreatorModal } from './AdCreatorModal';
import { ABTestingPanel } from './ABTestingPanel';
import { PlatformConnectionCard } from './PlatformConnectionCard';

export function AdsAutomationDashboard() {
  const { 
    campaigns, 
    connections, 
    stats, 
    isLoadingCampaigns,
    syncCampaigns,
    isSyncing 
  } = useAdsManager();
  
  const [showAdCreator, setShowAdCreator] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const platformIcons: any = {
    facebook: Facebook,
    instagram: Instagram,
    google: Chrome,
  };

  const getPlatformColor = (platform: string) => {
    const colors: any = {
      facebook: 'bg-blue-500',
      instagram: 'bg-pink-500',
      google: 'bg-red-500',
      tiktok: 'bg-black',
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCampaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <Progress 
              value={(stats.totalSpent / stats.totalBudget) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgROAS.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">Return on ad spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedPlatforms}</div>
            <p className="text-xs text-muted-foreground">Active integrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
          <CardDescription>
            Connect and sync your advertising platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <PlatformConnectionCard platform="facebook" />
            <PlatformConnectionCard platform="google" />
            <PlatformConnectionCard platform="instagram" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => setShowAdCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
        <Button variant="outline" onClick={() => syncCampaigns('facebook')} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync All Platforms
        </Button>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Optimize All
        </Button>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>
            Manage your advertising campaigns across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCampaigns ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns yet. Create your first campaign!
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const Icon = platformIcons[campaign.platform] || Target;
                return (
                  <div 
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCampaign(campaign.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getPlatformColor(campaign.platform)}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{campaign.campaign_name}</h4>
                          {campaign.ai_generated && (
                            <Badge variant="secondary">
                              <Sparkles className="mr-1 h-3 w-3" />
                              AI Generated
                            </Badge>
                          )}
                          <Badge variant={
                            campaign.status === 'active' ? 'default' : 
                            campaign.status === 'paused' ? 'secondary' : 
                            'outline'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {campaign.campaign_type} • {campaign.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-semibold">${campaign.budget_spent.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROAS</p>
                        <p className="font-semibold">
                          {campaign.performance_metrics?.roas?.toFixed(2) || '0.00'}x
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-semibold">
                          {campaign.performance_metrics?.ctr?.toFixed(2) || '0.00'}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* A/B Testing Panel */}
      {selectedCampaign && (
        <ABTestingPanel campaignId={selectedCampaign} />
      )}

      {/* Ad Creator Modal */}
      <AdCreatorModal 
        open={showAdCreator}
        onOpenChange={setShowAdCreator}
      />
    </div>
  );
}
