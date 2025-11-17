import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncQueueDashboard } from '@/components/stores/sync/SyncQueueDashboard';
import { SyncLogsViewer } from '@/components/stores/sync/SyncLogsViewer';
import { ConflictResolver } from '@/components/stores/sync/ConflictResolver';
import { Activity, FileText, AlertTriangle } from 'lucide-react';

export default function StoreSyncDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion de la Synchronisation
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez et gérez toutes vos synchronisations multi-boutiques
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">
            <Activity className="h-4 w-4 mr-2" />
            File d'attente
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Conflits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <SyncQueueDashboard />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <SyncLogsViewer />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <ConflictResolver />
        </TabsContent>
      </Tabs>
    </div>
  );
}
