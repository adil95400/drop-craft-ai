import { StoreStats } from '@/hooks/useUnifiedStores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';

interface StoreComparisonTableProps {
  stats: StoreStats[];
}

export function StoreComparisonTable({ stats }: StoreComparisonTableProps) {
  if (stats.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucune donnée de comparaison disponible
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Boutique</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Domaine</TableHead>
            <TableHead className="text-right">Intégrations</TableHead>
            <TableHead className="text-right">Actives</TableHead>
            <TableHead>Plateformes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat) => {
            const activeRate = stat.total_integrations > 0
              ? (stat.active_integrations / stat.total_integrations) * 100
              : 0;

            return (
              <TableRow key={stat.store_id}>
                <TableCell className="font-medium">{stat.store_name}</TableCell>
                <TableCell>
                  {stat.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {stat.domain || '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {stat.total_integrations}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-medium">{stat.active_integrations}</span>
                    {activeRate >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : activeRate < 50 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {stat.integrations_summary.slice(0, 3).map((int, idx) => (
                      <Badge
                        key={idx}
                        variant={int.status === 'connected' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {int.platform}
                      </Badge>
                    ))}
                    {stat.integrations_summary.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{stat.integrations_summary.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
