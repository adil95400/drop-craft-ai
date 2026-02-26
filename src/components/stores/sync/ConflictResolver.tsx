import { useState } from 'react';
import { useSyncManager, type SyncConflict } from '@/hooks/useSyncManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function ConflictResolver() {
  const { conflicts, resolveConflict, isLoadingConflicts } = useSyncManager();
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  const handleResolve = (conflictId: string, strategy: string) => {
    resolveConflict({ conflictId, strategy });
    setSelectedConflict(null);
  };

  const getConflictTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      version_mismatch: 'bg-yellow-500',
      concurrent_update: 'bg-orange-500',
      deleted_remotely: 'bg-red-500',
      validation_error: 'bg-purple-500',
    };

    return (
      <Badge
        className={`${colors[type] || 'bg-gray-500'} text-white`}
        variant="secondary"
      >
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (isLoadingConflicts) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Conflits de synchronisation</h2>
          </div>
          {conflicts.length > 0 && (
            <Badge variant="destructive">{conflicts.length} conflits</Badge>
          )}
        </div>

        {conflicts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun conflit de synchronisation
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.map((conflict) => (
                  <TableRow key={conflict.id}>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {getConflictTypeBadge(conflict.conflict_type)}
                        <Badge variant="outline">{conflict.conflict_type}</Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[150px]">
                        {conflict.product_id || conflict.id}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-xs text-muted-foreground">
                        Détecté{' '}
                        {formatDistanceToNow(new Date(conflict.created_at), {
                          addSuffix: true,
                          locale: getDateFnsLocale(),
                        })}
                      </p>
                    </TableCell>

                    <TableCell>
                      {conflict.local_value && conflict.remote_value && (
                        <div className="text-xs">
                          <p className="font-medium">Local vs Remote</p>
                          <p className="text-muted-foreground">
                            {typeof conflict.local_value === 'object' ? Object.keys(conflict.local_value as Record<string, unknown>).length : 1} champs
                          </p>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResolve(conflict.id, 'local_wins')
                          }
                        >
                          Garder local
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResolve(conflict.id, 'remote_wins')
                          }
                        >
                          Garder distant
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolve(conflict.id, 'merge')}
                        >
                          Fusionner
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
