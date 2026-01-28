import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { Facebook, Instagram, Chrome, CheckCircle2, RefreshCw } from 'lucide-react';

interface PlatformConnectionCardProps {
  platform: 'facebook' | 'google' | 'instagram';
}

export function PlatformConnectionCard({ platform }: PlatformConnectionCardProps) {
  const {} = useAdsManagerNew();
  
  // Mock data for now
  const connections: any[] = [];
  const connectPlatform = () => {};
  const isConnecting = false;
  const syncCampaigns = () => {};
  const isSyncing = false;
  const [showConnect, setShowConnect] = useState(false);

  const connection = connections.find(c => c.platform === platform);
  const isConnected = connection?.is_active;

  const platformConfig = {
    facebook: {
      name: 'Facebook Ads',
      icon: Facebook,
      color: 'bg-blue-500',
    },
    google: {
      name: 'Google Ads',
      icon: Chrome,
      color: 'bg-red-500',
    },
    instagram: {
      name: 'Instagram Ads',
      icon: Instagram,
      color: 'bg-pink-500',
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleConnect = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Non authentifié');
        return;
      }
      
      // Insérer la connexion dans la base de données
      const { error } = await supabase.from('ad_accounts').insert({
        user_id: user.id,
        platform: platform,
        name: `My ${config.name} Account`,
        status: 'pending_auth',
        credentials_encrypted: null // À remplir après OAuth réel
      });
      
      if (error) throw error;
      
      connectPlatform();
      setShowConnect(false);
    } catch (error) {
      console.error('Erreur connexion:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{config.name}</h3>
              {isConnected && (
                <p className="text-xs text-muted-foreground">
                  {connection.account_name}
                </p>
              )}
            </div>
          </div>
          {isConnected && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => syncCampaigns()}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Campaigns
            </Button>
            {connection.last_sync_at && (
              <p className="text-xs text-muted-foreground text-center">
                Last synced: {new Date(connection.last_sync_at).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
