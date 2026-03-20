/**
 * Financial KPIs row — chiffre d'affaires potentiel, COGS, profit net
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface Product {
  price: number;
  cost_price?: number | null;
  stock_quantity?: number | null;
}

interface CatalogFinancialKPIsProps {
  products: Product[];
}

export function CatalogFinancialKPIs({ products }: CatalogFinancialKPIsProps) {
  const kpis = useMemo(() => {
    const revenue = products.reduce((sum, p) => sum + p.price * (p.stock_quantity || 0), 0);
    const cogs = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_quantity || 0), 0);
    const profit = revenue - cogs;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const withCost = products.filter(p => p.cost_price && p.cost_price > 0);
    const missingCost = products.length - withCost.length;

    return { revenue, cogs, profit, profitMargin, missingCost };
  }, [products]);

  const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none">{fmt(kpis.revenue)} €</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">CA potentiel (stock)</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none">{fmt(kpis.cogs)} €</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Coût marchandises</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${kpis.profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <TrendingUp className={`h-4 w-4 ${kpis.profit >= 0 ? 'text-primary' : 'text-destructive'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-lg font-bold leading-none ${kpis.profit < 0 ? 'text-destructive' : ''}`}>
              {fmt(kpis.profit)} €
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Profit brut estimé</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
            <DollarSign className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none">{kpis.profitMargin.toFixed(1)}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Marge nette
              {kpis.missingCost > 0 && <span className="text-warning"> · {kpis.missingCost} sans coût</span>}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
