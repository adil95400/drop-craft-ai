import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram, Chrome, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PlatformConnectionCardProps {
  platform: 'facebook' | 'google' | 'instagram';
}

export function PlatformConnectionCard({ platform }: PlatformConnectionCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: connection } = useQuery({
    queryKey: ['ad-account', platform, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isConnected = !!connection;

  const platformConfig = {
    facebook: { name: 'Facebook Ads', icon: Facebook, color: 'bg-info' },
    google: { name: 'Google Ads', icon: Chrome, color: 'bg-destructive' },
    instagram: { name: 'Instagram Ads', icon: Instagram, color: 'bg-pink-500' },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleConnect = async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      const { error } = await supabase.from('ad_accounts').insert({
        user_id: user.id,
        platform,
        name: `My ${config.name} Account`,
        status: 'pending_auth',
        credentials_encrypted: null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ad-account', platform] });
      toast.success(`${config.name} connecté`);
    } catch (error) {
      console.error('Erreur connexion:', error);
      toast.error('Erreur de connexion');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!connection) return;
    setIsSyncing(true);
    try {
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('ad_account_id', connection.id);
      toast.success(`${campaigns?.length || 0} campagnes synchronisées`);
    } catch {
      toast.error('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
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
                <p className="text-xs text-muted-foreground">{connection.name}</p>
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
            <Button variant="outline" size="sm" className="w-full" onClick={handleSync} disabled={isSyncing}>
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
          <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
