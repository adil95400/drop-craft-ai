import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, RefreshCw } from "lucide-react";
import { useInternationalization } from "@/hooks/useInternationalization";

export const CurrenciesTab = () => {
  const { useCurrencies, updateCurrencyRates } = useInternationalization();
  const { data: currencies, isLoading } = useCurrencies();

  const handleUpdateRates = () => {
    updateCurrencyRates.mutate('EUR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Gestion des Devises
        </CardTitle>
        <CardDescription>
          Configurez les devises supportées et les taux de change
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {currencies?.length || 0} devises configurées
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUpdateRates} disabled={updateCurrencyRates.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser les taux
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une devise
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : currencies && currencies.length > 0 ? (
          <div className="space-y-2">
            {currencies.map((currency: any) => (
              <div key={currency.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{currency.currency_code} - {currency.currency_name}</p>
                  <p className="text-sm text-muted-foreground">Symbole: {currency.currency_symbol}</p>
                </div>
                <div className="flex items-center gap-2">
                  {currency.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Par défaut
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune devise configurée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};