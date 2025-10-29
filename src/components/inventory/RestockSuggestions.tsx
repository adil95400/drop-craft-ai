import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventoryPredictor } from '@/hooks/useInventoryPredictor';
import { RefreshCw, Lightbulb, Calendar, DollarSign, Package } from 'lucide-react';

export function RestockSuggestions() {
  const { suggestions, isLoadingSuggestions, applySuggestion } = useInventoryPredictor();

  if (isLoadingSuggestions) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'bg-red-500', variant: 'destructive' as const, label: 'Urgent' };
      case 'high':
        return { color: 'bg-orange-500', variant: 'destructive' as const, label: 'Haute' };
      case 'medium':
        return { color: 'bg-yellow-500', variant: 'secondary' as const, label: 'Moyenne' };
      default:
        return { color: 'bg-blue-500', variant: 'default' as const, label: 'Basse' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Suggestions de Réapprovisionnement IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Recommandations intelligentes pour optimiser votre stock
        </p>
      </div>

      {(!suggestions || suggestions.length === 0) ? (
        <Card className="p-12 text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Aucune suggestion disponible. Générez des prédictions pour obtenir des recommandations.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suggestions.map((suggestion: any) => {
            const config = getPriorityConfig(suggestion.priority);

            return (
              <Card key={suggestion.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {suggestion.inventory_items?.product_name || 'Produit'}
                      </h3>
                      <Badge variant={config.variant}>
                        Priorité {config.label}
                      </Badge>
                    </div>
                    {suggestion.inventory_items?.sku && (
                      <p className="text-sm text-muted-foreground">
                        SKU: {suggestion.inventory_items.sku}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion(suggestion.id)}
                  >
                    Appliquer
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-accent/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quantité Suggérée</p>
                      <p className="text-xl font-bold">{suggestion.suggested_quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date Suggérée</p>
                      <p className="text-sm font-semibold">
                        {new Date(suggestion.suggested_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Coût Estimé</p>
                      <p className="text-xl font-bold">
                        {suggestion.estimated_cost?.toFixed(2) || '0.00'}€
                      </p>
                    </div>
                  </div>
                </div>

                {suggestion.reasoning && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Analyse IA
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.reasoning}
                    </p>
                  </div>
                )}

                <div className="mt-3 text-xs text-muted-foreground">
                  Créée le {new Date(suggestion.created_at).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(suggestion.created_at).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}