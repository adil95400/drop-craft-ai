import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from './CurrencySelector';
import { useConvertPrice, formatCurrency } from '@/hooks/useCurrency';
import { ArrowRightLeft, Calculator, RefreshCw } from 'lucide-react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  
  const convertPrice = useConvertPrice();

  const handleConvert = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;
    
    convertPrice.mutate({
      amount: numAmount,
      fromCurrency,
      toCurrency
    });
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Convertisseur de Devises
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          {/* Montant source */}
          <div className="space-y-2">
            <CurrencySelector
              label="De"
              value={fromCurrency}
              onChange={setFromCurrency}
            />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant"
              className="text-lg"
            />
          </div>

          {/* Bouton swap */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="h-10 w-10 self-end mb-0.5"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          {/* Montant cible */}
          <div className="space-y-2">
            <CurrencySelector
              label="Vers"
              value={toCurrency}
              onChange={setToCurrency}
            />
            <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 text-lg font-medium">
              {convertPrice.data
                ? convertPrice.data.formattedConverted
                : formatCurrency(parseFloat(amount) || 0, toCurrency)
              }
            </div>
          </div>
        </div>

        <Button 
          onClick={handleConvert} 
          className="w-full"
          disabled={convertPrice.isPending}
        >
          {convertPrice.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Convertir
        </Button>

        {/* Résultat détaillé */}
        {convertPrice.data && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taux de change:</span>
              <span className="font-medium">
                1 {fromCurrency} = {convertPrice.data.rate.toFixed(4)} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant converti:</span>
              <span className="font-semibold text-lg">
                {convertPrice.data.formattedConverted}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini convertisseur pour intégration dans d'autres composants
export function MiniCurrencyConverter({
  amount,
  fromCurrency,
  toCurrency,
  onConvert
}: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  onConvert?: (result: { amount: number; rate: number }) => void;
}) {
  const convertPrice = useConvertPrice();

  React.useEffect(() => {
    if (amount && fromCurrency !== toCurrency) {
      convertPrice.mutate(
        { amount, fromCurrency, toCurrency },
        {
          onSuccess: (data) => {
            onConvert?.({ amount: data.convertedAmount, rate: data.rate });
          }
        }
      );
    }
  }, [amount, fromCurrency, toCurrency]);

  if (fromCurrency === toCurrency) {
    return <span>{formatCurrency(amount, toCurrency)}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {convertPrice.isPending ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : convertPrice.data ? (
        convertPrice.data.formattedConverted
      ) : (
        formatCurrency(amount, fromCurrency)
      )}
    </span>
  );
}
