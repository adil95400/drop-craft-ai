/**
 * ImportHistoryTab — Extracted from ImportHub for maintainability
 * Displays filterable, sortable import history with actions
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Search, History, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  MoreVertical, Eye, RotateCcw, Pause, Trash2, SortAsc, SortDesc
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';
import { ImportDetailedLogs } from '@/components/import/engine';

interface ImportMethod {
  id: string;
  source_type: string;
  method_name?: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  created_at: string;
  configuration?: any;
}

interface ImportHistoryTabProps {
  imports: ImportMethod[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (sourceType: string) => void;
  prefersReducedMotion: boolean;
}

const statusConfigs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', label: 'Terminé' },
  processing: { icon: Loader2, color: 'text-info', bgColor: 'bg-info/10', label: 'En cours' },
  failed: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Échoué' },
  pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'En attente' },
  partial: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Partiel' },
};

function safeProgress(processed: number, total: number): number {
  return total > 0 ? Math.round((processed / total) * 100) : 0;
}

export function ImportHistoryTab({
  imports, searchQuery, onSearchChange, statusFilter, onStatusFilterChange,
  sortOrder, onSortOrderToggle, onRetry, onCancel, onDelete, onViewDetails,
  prefersReducedMotion
}: ImportHistoryTabProps) {
  return (
    <div className="space-y-6">
      <ImportDetailedLogs imports={imports} onRetryItem={(jobId) => onRetry(jobId)} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Historique des imports</CardTitle>
              <CardDescription>Gérez et suivez tous vos imports</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={onSortOrderToggle}>
                {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Aucun import trouvé</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par importer des produits'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {imports.map((imp) => {
                const config = statusConfigs[imp.status] || statusConfigs.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={imp.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bgColor)}>
                        <StatusIcon className={cn("w-5 h-5", config.color, imp.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                      </div>
                      <div>
                        <p className="font-medium">{imp.source_type || imp.method_name || 'Import'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-medium">{imp.success_rows || 0} / {imp.total_rows || 0}</p>
                        <p className="text-xs text-muted-foreground">produits importés</p>
                      </div>

                      {imp.status === 'processing' && imp.total_rows > 0 && (
                        <div className="w-24 hidden md:block">
                          <Progress value={safeProgress(imp.processed_rows, imp.total_rows)} className="h-1.5" />
                        </div>
                      )}

                      <Badge variant="secondary" className={cn("flex items-center gap-1", config.bgColor, config.color)}>
                        <StatusIcon className={cn("w-3 h-3", imp.status === 'processing' && !prefersReducedMotion && 'animate-spin')} />
                        {config.label}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(imp.source_type || '')}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {imp.status === 'failed' && (
                            <DropdownMenuItem onClick={() => onRetry(imp.id)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Relancer
                            </DropdownMenuItem>
                          )}
                          {imp.status === 'processing' && (
                            <DropdownMenuItem onClick={() => onCancel(imp.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(imp.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
