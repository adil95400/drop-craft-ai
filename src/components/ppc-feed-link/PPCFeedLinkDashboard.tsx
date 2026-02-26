/**
 * PPC Feed Link Dashboard
 * Interface principale de gestion des liaisons PPC-Feed
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Settings2,
  Link2,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { 
  usePPCFeedLinks, 
  usePPCStats,
  useTogglePPCFeedLink,
  useDeletePPCFeedLink,
  useSyncPPCFeedLink,
} from '@/hooks/usePPCFeedLink';
import { CreatePPCLinkDialog } from './CreatePPCLinkDialog';
import { PPCSyncLogsPanel } from './PPCSyncLogsPanel';
import { PPCFeedLink, PPCFeedLinkService } from '@/services/PPCFeedLinkService';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const platformLabels: Record<string, { label: string; icon: string }> = {
  google_ads: { label: 'Google Ads', icon: '🔍' },
  meta_ads: { label: 'Meta Ads', icon: '📘' },
  microsoft_ads: { label: 'Microsoft Ads', icon: '🪟' },
  tiktok_ads: { label: 'TikTok Ads', icon: '🎵' },
  pinterest_ads: { label: 'Pinterest Ads', icon: '📌' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'outline' },
  syncing: { label: 'Sync...', variant: 'secondary' },
  synced: { label: 'Synchronisé', variant: 'default' },
  error: { label: 'Erreur', variant: 'destructive' },
};

export function PPCFeedLinkDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PPCFeedLink | null>(null);

  const { data: links = [], isLoading } = usePPCFeedLinks();
  const { data: stats } = usePPCStats();
  const toggleLink = useTogglePPCFeedLink();
  const deleteLink = useDeletePPCFeedLink();
  const syncLink = useSyncPPCFeedLink();

  const handleToggle = (linkId: string, isActive: boolean) => {
    toggleLink.mutate({ linkId, isActive });
  };

  const handleDelete = (linkId: string) => {
    if (confirm('Supprimer cette liaison ?')) {
      deleteLink.mutate(linkId);
    }
  };

  const handleSync = (linkId: string) => {
    syncLink.mutate({ linkId, syncType: 'manual' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PPC Feed Link</h1>
          <p className="text-muted-foreground">
            Liez vos flux produits à vos campagnes publicitaires
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle liaison
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalLinks || 0}</p>
                <p className="text-sm text-muted-foreground">Liaisons totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeLinks || 0}</p>
                <p className="text-sm text-muted-foreground">Liaisons actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.syncedToday || 0}</p>
                <p className="text-sm text-muted-foreground">Sync aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.errorLinks || 0}</p>
                <p className="text-sm text-muted-foreground">En erreur</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform breakdown */}
      {stats?.platformBreakdown && Object.keys(stats.platformBreakdown).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Répartition par plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
                <Badge key={platform} variant="secondary" className="text-sm py-1 px-3">
                  {platformLabels[platform]?.icon} {platformLabels[platform]?.label}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">Mes liaisons</TabsTrigger>
          <TabsTrigger value="logs">Historique sync</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement...
              </CardContent>
            </Card>
          ) : links.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucune liaison</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première liaison entre un feed et une plateforme PPC
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une liaison
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <Card key={link.id} className={!link.is_active ? 'opacity-60' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(checked) => handleToggle(link.id, checked)}
                        />
                        <div className="text-2xl">
                          {platformLabels[link.platform]?.icon || '🔗'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{link.name}</h3>
                            <Badge variant="outline">
                              {platformLabels[link.platform]?.label || link.platform}
                            </Badge>
                            <Badge variant={statusConfig[link.sync_status]?.variant || 'outline'}>
                              {statusConfig[link.sync_status]?.label || link.sync_status}
                            </Badge>
                          </div>
                          {link.description && (
                            <p className="text-sm text-muted-foreground">{link.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {link.products_synced} produits
                            </span>
                            {link.last_sync_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Sync: {formatDistanceToNow(new Date(link.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() })}
                              </span>
                            )}
                            <span>Fréquence: {link.sync_frequency}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(link.id)}
                          disabled={!link.is_active || syncLink.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncLink.isPending ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLink(link)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <PPCSyncLogsPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreatePPCLinkDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        editLink={selectedLink}
        onClose={() => setSelectedLink(null)}
      />
    </div>
  );
}
