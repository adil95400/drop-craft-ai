/**
 * Panneau Pricing inline — ajuster prix et marges depuis le catalogue
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tag, DollarSign, TrendingUp, Loader2, CheckCircle, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogPricingPanelProps {
  selectedProducts: Array<{
    id: string;
    name: string;
    price: number;
    cost_price?: number | null;
  }>;
  onClose: () => void;
  onRefresh: () => void;
}

type PricingStrategy = 'margin' | 'markup' | 'round' | 'undercut';

export function CatalogPricingPanel({ selectedProducts, onClose, onRefresh }: CatalogPricingPanelProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<PricingStrategy>('margin');
  const [targetMargin, setTargetMargin] = useState(35);
  const [roundTo, setRoundTo] = useState<'99' | '95' | '00'>('99');
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const simulation = useMemo(() => {
    return selectedProducts.map(p => {
      const cost = p.cost_price || p.price * 0.4;
      let newPrice = p.price;

      switch (strategy) {
        case 'margin':
          newPrice = cost / (1 - targetMargin / 100);
          break;
        case 'markup':
          newPrice = cost * (1 + targetMargin / 100);
          break;
        case 'undercut':
          newPrice = p.price * (1 - targetMargin / 100);
          break;
        default:
          newPrice = cost / (1 - targetMargin / 100);
      }

      // Psychological rounding
      if (roundTo === '99') {
        newPrice = Math.floor(newPrice) + 0.99;
      } else if (roundTo === '95') {
        newPrice = Math.floor(newPrice) + 0.95;
      } else {
        newPrice = Math.ceil(newPrice);
      }

      const margin = ((newPrice - cost) / newPrice) * 100;
      const profit = newPrice - cost;

      return {
        ...p,
        cost,
        newPrice: Math.max(newPrice, 0.01),
        oldPrice: p.price,
        margin,
        profit,
        diff: newPrice - p.price,
      };
    });
  }, [selectedProducts, strategy, targetMargin, roundTo]);

  const totals = useMemo(() => ({
    avgMargin: simulation.reduce((s, p) => s + p.margin, 0) / simulation.length,
    totalProfit: simulation.reduce((s, p) => s + p.profit, 0),
    avgDiff: simulation.reduce((s, p) => s + p.diff, 0) / simulation.length,
  }), [simulation]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const updates = simulation.map(p => 
        supabase.from('products').update({ price: Math.round(p.newPrice * 100) / 100 }).eq('id', p.id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`${errors.length} erreur(s)`);

      setApplied(true);
      toast({
        title: 'Prix mis à jour',
        description: `${simulation.length} produit(s) modifié(s), marge moyenne: ${totals.avgMargin.toFixed(1)}%`
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  if (applied) {
    return (
      <div className="space-y-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Prix appliqués
          </SheetTitle>
        </SheetHeader>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <p className="font-semibold">{simulation.length} produit(s) mis à jour</p>
            <p className="text-sm text-muted-foreground">
              Marge moyenne: {totals.avgMargin.toFixed(1)}%
            </p>
            <Button onClick={onClose} className="w-full">Fermer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Pricing ({selectedProducts.length} produits)
        </SheetTitle>
        <SheetDescription>
          Simulez et appliquez des règles de prix en masse
        </SheetDescription>
      </SheetHeader>

      {/* Strategy selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Stratégie</Label>
          <Select value={strategy} onValueChange={v => setStrategy(v as PricingStrategy)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="margin">Marge cible (%)</SelectItem>
              <SelectItem value="markup">Markup sur coût (%)</SelectItem>
              <SelectItem value="undercut">Réduction prix actuel (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              {strategy === 'margin' ? 'Marge cible' : strategy === 'markup' ? 'Markup' : 'Réduction'}
            </Label>
            <span className="text-sm font-mono font-bold">{targetMargin}%</span>
          </div>
          <Slider
            value={[targetMargin]}
            onValueChange={v => setTargetMargin(v[0])}
            min={strategy === 'undercut' ? 1 : 5}
            max={strategy === 'undercut' ? 50 : 80}
            step={1}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Arrondi psychologique</Label>
          <Select value={roundTo} onValueChange={v => setRoundTo(v as '99' | '95' | '00')}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="99">.99 €</SelectItem>
              <SelectItem value="95">.95 €</SelectItem>
              <SelectItem value="00">.00 €</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Simulation preview */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto border-t pt-3">
        {simulation.map(p => (
          <div key={p.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <span className="flex-1 truncate">{p.name}</span>
            <span className="text-muted-foreground line-through text-xs">{p.oldPrice.toFixed(2)} €</span>
            <span className="font-semibold">{p.newPrice.toFixed(2)} €</span>
            <Badge
              variant={p.margin >= 30 ? 'default' : p.margin >= 15 ? 'secondary' : 'destructive'}
              className="text-[10px] shrink-0"
            >
              {p.margin.toFixed(0)}%
            </Badge>
          </div>
        ))}
      </div>

      {/* Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{totals.avgMargin.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Marge moy.</p>
            </div>
            <div>
              <p className="text-lg font-bold">{totals.totalProfit.toFixed(0)} €</p>
              <p className="text-[10px] text-muted-foreground">Profit total</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${totals.avgDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {totals.avgDiff >= 0 ? '+' : ''}{totals.avgDiff.toFixed(2)} €
              </p>
              <p className="text-[10px] text-muted-foreground">Diff. moy.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button className="flex-1 gap-2" onClick={handleApply} disabled={isApplying}>
          {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          Appliquer les prix
        </Button>
      </div>
    </div>
  );
}
