import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSupportedCurrencies, getCurrencySymbol } from '@/hooks/useCurrency';
import { DollarSign } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
}

export function CurrencySelector({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  showSymbol = true
}: CurrencySelectorProps) {
  const { data: currencies, isLoading } = useSupportedCurrencies();

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner une devise">
            {value && (
              <span className="flex items-center gap-2">
                <span className="font-medium">{getCurrencySymbol(value)}</span>
                <span>{value}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies?.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                {showSymbol && (
                  <span className="w-6 text-center font-medium">
                    {currency.symbol}
                  </span>
                )}
                <span className="font-medium">{currency.code}</span>
                <span className="text-muted-foreground text-sm">
                  {currency.name}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Version compacte pour la navbar
export function CurrencySelectorCompact({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: currencies } = useSupportedCurrencies();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-20 h-8 text-xs">
        <DollarSign className="h-3 w-3 mr-1" />
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies?.slice(0, 10).map((currency) => (
          <SelectItem key={currency.code} value={currency.code} className="text-xs">
            <span className="flex items-center gap-1">
              <span className="w-4">{currency.symbol}</span>
              <span>{currency.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
