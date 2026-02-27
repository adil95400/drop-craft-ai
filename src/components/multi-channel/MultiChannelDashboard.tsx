import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Store, 
  RefreshCw, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Settings,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import { useSalesChannels, useChannelSyncLogs, useChannelStats, useStartChannelSync, useDeleteSalesChannel } from '@/hooks/useMultiChannel';
import { CreateChannelDialog } from './CreateChannelDialog';
import { EmailMarketingTab } from './EmailMarketingTab';
import { SocialMediaTab } from './SocialMediaTab';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { SalesChannel } from '@/services/MultiChannelService';

export function MultiChannelDashboard() {
  const [activeTab, setActiveTab] = useState('channels');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: channels = [], isLoading: loadingChannels } = useSalesChannels();
  const { data: syncLogs = [] } = useChannelSyncLogs();
  const { data: stats } = useChannelStats();
  const startSync = useStartChannelSync();
  const deleteChannel = useDeleteSalesChannel();

  const handleSync = (channelId: string) => {
    startSync.mutate({ channelId, syncType: 'full' });
  };

  const handleDelete = (channelId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce canal ?')) {
      deleteChannel.mutate(channelId);
    }
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, string> = {
      shopify: '🛒',
      amazon: '📦',
      ebay: '🏷️',
      woocommerce: '🔧',
      prestashop: '🛍️',
      custom: '⚙️'
    };
    return icons[type] || '📦';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      inactive: { variant: 'secondary', icon: <Pause className="h-3 w-3 mr-1" /> },
      syncing: { variant: 'outline', icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> },
      error: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> }
    };
    const config = variants[status] || variants.inactive;
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSyncStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      running: 'secondary',
      completed: 'default',
      failed: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux totaux</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChannels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canaux actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeChannels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits synchronisés</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProductsSynced || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingSync || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList className="flex-wrap">
            <TabsTrigger value="channels">Canaux de vente</TabsTrigger>
            <TabsTrigger value="sync-logs">Historique sync</TabsTrigger>
            <TabsTrigger value="email">Email Marketing</TabsTrigger>
            <TabsTrigger value="social">Réseaux sociaux</TabsTrigger>
          </TabsList>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un canal
          </Button>
        </div>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Canaux de vente</CardTitle>
              <CardDescription>Gérez vos canaux de vente et synchronisations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Dernière sync</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getChannelIcon(channel.channel_type)}</span>
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{channel.channel_type}</TableCell>
                      <TableCell>{getStatusBadge(channel.status)}</TableCell>
                      <TableCell>{channel.products_synced}</TableCell>
                      <TableCell>
                        {channel.last_sync_at 
                          ? formatDistanceToNow(new Date(channel.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() })
                          : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSync(channel.id)}
                            disabled={channel.status === 'syncing'}
                          >
                            <RefreshCw className={`h-4 w-4 ${channel.status === 'syncing' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(channel.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {channels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun canal de vente configuré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-logs">
          <Card>
            <CardHeader>
              <CardTitle>Historique de synchronisation</CardTitle>
              <CardDescription>Dernières opérations de synchronisation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Traités</TableHead>
                    <TableHead>Succès</TableHead>
                    <TableHead>Échecs</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.channel?.name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{log.sync_type}</TableCell>
                      <TableCell>{getSyncStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.items_processed}</TableCell>
                      <TableCell className="text-green-600">{log.items_succeeded}</TableCell>
                      <TableCell className="text-red-600">{log.items_failed}</TableCell>
                      <TableCell>
                        {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: getDateFnsLocale() })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {syncLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Aucune synchronisation effectuée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailMarketingTab />
        </TabsContent>

        <TabsContent value="social">
          <SocialMediaTab />
        </TabsContent>
      </Tabs>

      <CreateChannelDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
