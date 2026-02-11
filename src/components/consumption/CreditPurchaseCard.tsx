/**
 * CreditPurchaseCard - Composant d'upsell pour acheter des crédits IA
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, ShoppingCart } from 'lucide-react';
import { useCreditAddons, CreditPack } from '@/hooks/useCreditAddons';
import { cn } from '@/lib/utils';

function PackOption({ pack, onPurchase, isPurchasing }: { 
  pack: CreditPack; 
  onPurchase: (id: string) => void; 
  isPurchasing: boolean;
}) {
  const pricePerCredit = (pack.price / pack.credits).toFixed(2);
  
  return (
    <Card className={cn(
      'relative transition-all hover:shadow-lg cursor-pointer group',
      pack.popular && 'border-primary shadow-md ring-2 ring-primary/20'
    )}>
      {pack.popular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Populaire
        </Badge>
      )}
      <CardHeader className="pb-3 pt-5 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
          <Sparkles className={cn(
            "h-6 w-6",
            pack.popular ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <CardTitle className="text-lg">{pack.credits} crédits</CardTitle>
        <CardDescription>{pricePerCredit}€ / crédit</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <div className="text-3xl font-bold">{pack.price}€</div>
        <Button 
          onClick={() => onPurchase(pack.id)}
          disabled={isPurchasing}
          className="w-full gap-2"
          variant={pack.popular ? 'default' : 'outline'}
        >
          <ShoppingCart className="h-4 w-4" />
          Acheter
        </Button>
      </CardContent>
    </Card>
  );
}

export function CreditPurchaseCard() {
  const { packs, totalCreditsRemaining, purchaseCredits, isPurchasing, addons } = useCreditAddons();

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-violet-500/5 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Crédits IA supplémentaires
            </CardTitle>
            <CardDescription className="mt-1">
              Achetez des crédits pour vos générations IA
            </CardDescription>
          </div>
          {totalCreditsRemaining > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {totalCreditsRemaining} crédit{totalCreditsRemaining > 1 ? 's' : ''} restant{totalCreditsRemaining > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map(pack => (
            <PackOption 
              key={pack.id} 
              pack={pack} 
              onPurchase={purchaseCredits}
              isPurchasing={isPurchasing}
            />
          ))}
        </div>
        {addons.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 inline mr-1" />
              {addons.length} pack(s) actif(s) · {totalCreditsRemaining} crédits disponibles
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
