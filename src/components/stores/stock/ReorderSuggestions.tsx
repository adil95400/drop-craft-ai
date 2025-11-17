import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStockIntelligence } from '@/hooks/useStockIntelligence';
import { Check, X, Package, DollarSign } from 'lucide-react';

export function ReorderSuggestions() {
  const {
    suggestions,
    isLoadingSuggestions,
    approveSuggestion,
    rejectSuggestion,
    isApprovingSuggestion,
    isRejectingSuggestion,
  } = useStockIntelligence();

  if (isLoadingSuggestions) {
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suggestions de Réassort</h2>
          <p className="text-muted-foreground">
            Recommandations intelligentes basées sur l'IA
          </p>
        </div>
        {suggestions.length > 0 && (
          <Badge variant="secondary">{suggestions.length} en attente</Badge>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune suggestion de réassort</p>
          <p className="text-sm text-muted-foreground">
            Les suggestions seront générées automatiquement
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Quantité suggérée</TableHead>
                <TableHead>Coût estimé</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{suggestion.product_id}</span>
                      {suggestion.store_id && (
                        <span className="text-xs text-muted-foreground">
                          Store: {suggestion.store_id}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {suggestion.supplier_id ? (
                      <span className="text-sm">{suggestion.supplier_id}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non spécifié</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{suggestion.suggested_quantity}</span>
                      unités
                    </div>
                  </TableCell>

                  <TableCell>
                    {suggestion.estimated_cost ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {suggestion.estimated_cost.toFixed(2)} €
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {suggestion.priority_score !== null && (
                      <Badge
                        variant={
                          suggestion.priority_score > 75
                            ? 'destructive'
                            : suggestion.priority_score > 50
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {suggestion.priority_score.toFixed(0)}/100
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {suggestion.reasoning ? (
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {typeof suggestion.reasoning === 'object'
                            ? JSON.stringify(suggestion.reasoning)
                            : suggestion.reasoning}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Aucune raison</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveSuggestion(suggestion.id)}
                        disabled={isApprovingSuggestion}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectSuggestion(suggestion.id)}
                        disabled={isRejectingSuggestion}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
