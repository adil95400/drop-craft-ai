import { useState } from 'react';
import { useSyncManager } from '@/hooks/useSyncManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ConflictResolver() {
  const { conflicts, isLoadingConflicts, resolveConflict } = useSyncManager();
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [resolution, setResolution] = useState<string>('remote_wins');

  const handleResolve = () => {
    if (!selectedConflict) return;

    resolveConflict({
      conflictId: selectedConflict.id,
      strategy: resolution,
    });

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
    <>
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
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className="p-4 border-l-4 border-l-yellow-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getConflictTypeBadge(conflict.conflict_type)}
                        <Badge variant="outline">{conflict.entity_type}</Badge>
                      </div>

                      <p className="text-sm font-medium mb-1">
                        Entité: {conflict.entity_id}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Détecté{' '}
                        {formatDistanceToNow(new Date(conflict.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>

                      {conflict.local_data && conflict.remote_data && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">
                              Données locales:
                            </p>
                            <ScrollArea className="h-20 rounded bg-muted p-2">
                              <pre className="text-xs">
                                {JSON.stringify(conflict.local_data, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">
                              Données distantes:
                            </p>
                            <ScrollArea className="h-20 rounded bg-muted p-2">
                              <pre className="text-xs">
                                {JSON.stringify(conflict.remote_data, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setSelectedConflict(conflict)}
                    >
                      Résoudre
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Resolution Dialog */}
      <Dialog
        open={!!selectedConflict}
        onOpenChange={() => setSelectedConflict(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le conflit</DialogTitle>
            <DialogDescription>
              Choisissez comment résoudre ce conflit de synchronisation
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={resolution} onValueChange={setResolution}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local_wins" id="local" />
                <Label htmlFor="local" className="cursor-pointer">
                  <span className="font-medium">Garder les données locales</span>
                  <p className="text-xs text-muted-foreground">
                    Les modifications locales écraseront les données distantes
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remote_wins" id="remote" />
                <Label htmlFor="remote" className="cursor-pointer">
                  <span className="font-medium">Garder les données distantes</span>
                  <p className="text-xs text-muted-foreground">
                    Les données distantes écraseront les modifications locales
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="cursor-pointer">
                  <span className="font-medium">Fusionner les données</span>
                  <p className="text-xs text-muted-foreground">
                    Tentative de fusion automatique des changements
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="cursor-pointer">
                  <span className="font-medium">Résolution manuelle</span>
                  <p className="text-xs text-muted-foreground">
                    Marquer pour résolution manuelle ultérieure
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConflict(null)}>
              Annuler
            </Button>
            <Button onClick={handleResolve}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
