import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const perPage = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('automation-security-engine', {
        body: { action: 'get_audit_logs', filters, page, per_page: perPage },
      });
      if (response.error) throw response.error;
      return response.data;
    },
  });

  const severityColor: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-500',
    warn: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-red-500/10 text-red-500',
    critical: 'bg-red-600/10 text-red-600',
  };

  const totalPages = Math.ceil((data?.total || 0) / perPage);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journal d'Audit ({data?.total || 0} entrées)
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Select
            value={filters.action_category || 'all'}
            onValueChange={(v) => {
              setFilters((f) => (v === 'all' ? { ...f, action_category: '' } : { ...f, action_category: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="pricing">Pricing</SelectItem>
              <SelectItem value="inventory">Inventaire</SelectItem>
              <SelectItem value="security">Sécurité</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.severity || 'all'}
            onValueChange={(v) => {
              setFilters((f) => (v === 'all' ? { ...f, severity: '' } : { ...f, severity: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : !data?.items?.length ? (
          <div className="text-center py-8 text-muted-foreground">Aucune entrée d'audit</div>
        ) : (
          <div className="space-y-2">
            {data.items.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className={`text-xs shrink-0 ${severityColor[log.severity] || ''}`}>
                    {log.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{log.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.description || log.resource_type || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <Badge variant="outline" className="text-xs">{log.action_category}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.created_at), 'dd MMM HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
