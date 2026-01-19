import React from 'react';
import { useCurrencyConverter, formatCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRightLeft } from 'lucide-react';

interface PriceDisplayProps {
  amount: number;
  currency: string;
  showOriginal?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showConversionRate?: boolean;
}

export function PriceDisplay({
  amount,
  currency,
  showOriginal = false,
  size = 'md',
  className = '',
  showConversionRate = false
}: PriceDisplayProps) {
  const { convert, settings, isReady } = useCurrencyConverter();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  if (!isReady) {
    return (
      <span className={cn(sizeClasses[size], 'text-muted-foreground', className)}>
        {formatCurrency(amount, currency)}
      </span>
    );
  }

  const conversion = convert(amount, currency);
  const isConverted = currency !== settings?.display_currency;

  if (!isConverted || !settings?.auto_convert_prices) {
    return (
      <span className={cn(sizeClasses[size], className)}>
        {formatCurrency(amount, currency)}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(sizeClasses[size], 'cursor-help', className)}>
            <span className="font-medium">
              {conversion.formattedConverted}
            </span>
            {showOriginal && settings.show_original_prices && (
              <span className="text-muted-foreground ml-1 text-sm">
                ({conversion.formattedOriginal})
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span>{conversion.formattedOriginal}</span>
              <ArrowRightLeft className="h-3 w-3" />
              <span>{conversion.formattedConverted}</span>
            </div>
            {showConversionRate && (
              <div className="text-muted-foreground">
                Taux: 1 {currency} = {conversion.rate.toFixed(4)} {settings.display_currency}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Version pour afficher un prix avec les deux devises
export function DualPriceDisplay({
  amount,
  currency,
  className = ''
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  const { convert, settings, isReady } = useCurrencyConverter();

  if (!isReady) {
    return (
      <span className={className}>
        {formatCurrency(amount, currency)}
      </span>
    );
  }

  const conversion = convert(amount, currency);
  const isConverted = currency !== settings?.display_currency;

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="font-semibold">
        {conversion.formattedConverted}
      </span>
      {isConverted && settings?.show_original_prices && (
        <span className="text-xs text-muted-foreground">
          ≈ {conversion.formattedOriginal}
        </span>
      )}
    </div>
  );
}

// Composant pour afficher la marge avec conversion
export function MarginDisplay({
  costPrice,
  costCurrency,
  sellingPrice,
  sellingCurrency,
  className = ''
}: {
  costPrice: number;
  costCurrency: string;
  sellingPrice: number;
  sellingCurrency: string;
  className?: string;
}) {
  const { convert, isReady } = useCurrencyConverter();

  if (!isReady) {
    const margin = sellingPrice - costPrice;
    const marginPercent = (margin / costPrice) * 100;
    
    return (
      <span className={cn(
        'font-medium',
        margin >= 0 ? 'text-green-600' : 'text-red-600',
        className
      )}>
        {margin >= 0 ? '+' : ''}{formatCurrency(margin, sellingCurrency)} ({marginPercent.toFixed(1)}%)
      </span>
    );
  }

  // Convertir les deux prix dans la même devise
  const convertedCost = convert(costPrice, costCurrency, sellingCurrency);
  const margin = sellingPrice - convertedCost.convertedAmount;
  const marginPercent = (margin / convertedCost.convertedAmount) * 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'font-medium cursor-help',
            margin >= 0 ? 'text-green-600' : 'text-red-600',
            className
          )}>
            {margin >= 0 ? '+' : ''}{formatCurrency(margin, sellingCurrency)} ({marginPercent.toFixed(1)}%)
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div>Coût: {convertedCost.formattedConverted}</div>
            <div>Vente: {formatCurrency(sellingPrice, sellingCurrency)}</div>
            {costCurrency !== sellingCurrency && (
              <div className="text-muted-foreground">
                Coût original: {convertedCost.formattedOriginal}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
