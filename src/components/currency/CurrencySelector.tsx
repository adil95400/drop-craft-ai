import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSupportedCurrencies, getCurrencySymbol } from '@/hooks/useCurrency';
import { DollarSign, Loader2 } from 'lucide-react';

// Liste de devises par défaut en fallback avec drapeaux
const DEFAULT_CURRENCIES = [
  { code: 'MAD', symbol: 'د.م.', name: 'Dirham marocain', flag: '🇲🇦' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', name: 'Dollar américain', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'Livre sterling', flag: '🇬🇧' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chinois', flag: '🇨🇳' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonais', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Dollar canadien', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Dollar australien', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc suisse', flag: '🇨🇭' },
  { code: 'HKD', symbol: 'HK$', name: 'Dollar de Hong Kong', flag: '🇭🇰' },
  { code: 'SGD', symbol: 'S$', name: 'Dollar de Singapour', flag: '🇸🇬' },
  { code: 'SEK', symbol: 'kr', name: 'Couronne suédoise', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Couronne norvégienne', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Couronne danoise', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Zloty polonais', flag: '🇵🇱' },
  { code: 'CZK', symbol: 'Kč', name: 'Couronne tchèque', flag: '🇨🇿' },
  { code: 'TRY', symbol: '₺', name: 'Livre turque', flag: '🇹🇷' },
  { code: 'INR', symbol: '₹', name: 'Roupie indienne', flag: '🇮🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Réal brésilien', flag: '🇧🇷' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicain', flag: '🇲🇽' },
  { code: 'ZAR', symbol: 'R', name: 'Rand sud-africain', flag: '🇿🇦' },
  { code: 'KRW', symbol: '₩', name: 'Won sud-coréen', flag: '🇰🇷' },
  { code: 'THB', symbol: '฿', name: 'Baht thaïlandais', flag: '🇹🇭' },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit malaisien', flag: '🇲🇾' },
  { code: 'PHP', symbol: '₱', name: 'Peso philippin', flag: '🇵🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Roupie indonésienne', flag: '🇮🇩' },
  { code: 'VND', symbol: '₫', name: 'Dong vietnamien', flag: '🇻🇳' },
  { code: 'RUB', symbol: '₽', name: 'Rouble russe', flag: '🇷🇺' },
  { code: 'HUF', symbol: 'Ft', name: 'Forint hongrois', flag: '🇭🇺' },
  { code: 'RON', symbol: 'lei', name: 'Leu roumain', flag: '🇷🇴' },
  { code: 'BGN', symbol: 'лв', name: 'Lev bulgare', flag: '🇧🇬' },
];

// Map code devise -> drapeau pour lookup rapide
const FLAG_MAP: Record<string, string> = Object.fromEntries(
  DEFAULT_CURRENCIES.map(c => [c.code, c.flag])
);

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
  const { data: currencies, isLoading, isError } = useSupportedCurrencies();
  
  // Utiliser les devises de l'API ou le fallback
  const currencyList = currencies && currencies.length > 0 ? currencies : DEFAULT_CURRENCIES;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Sélectionner une devise">
            {value && (
              <span className="flex items-center gap-2">
                <span className="text-base">{FLAG_MAP[value] || '🏳️'}</span>
                <span className="font-medium">{getCurrencySymbol(value)}</span>
                <span>{value}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg z-50 max-h-[300px]">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {currencyList.map((currency) => (
            <SelectItem 
              key={currency.code} 
              value={currency.code}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{FLAG_MAP[currency.code] || '🏳️'}</span>
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
  const currencyList = currencies && currencies.length > 0 ? currencies : DEFAULT_CURRENCIES;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-20 h-8 text-xs bg-background">
        <DollarSign className="h-3 w-3 mr-1" />
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border shadow-lg z-50">
        {currencyList.slice(0, 10).map((currency) => (
          <SelectItem key={currency.code} value={currency.code} className="text-xs">
            <span className="flex items-center gap-1">
              <span>{FLAG_MAP[currency.code] || '🏳️'}</span>
              <span className="w-4">{currency.symbol}</span>
              <span>{currency.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
