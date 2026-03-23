import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAbandonedCarts } from '@/hooks/useAbandonedCarts';
import { toast } from 'sonner';
import {
  ShoppingCart, Mail, Clock, Send, CheckCircle2,
  XCircle, ArrowRight, Zap, Eye, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RECOVERY_SEQUENCE = [
  { delay: '1h', channel: 'email', subject: 'Vous avez oublié quelque chose !', description: 'Rappel doux avec les produits du panier' },
  { delay: '24h', channel: 'email', subject: 'Votre panier vous attend', description: 'Rappel + avis clients sur les produits' },
  { delay: '48h', channel: 'email', subject: 'Dernière chance – offre spéciale', description: 'Incitation avec réduction personnalisée' },
];

export function CartRecoveryAutomation() {
  const { carts, isLoading, stats, sendRecoveryEmail, isSending, markRecovered, dismissCart } = useAbandonedCarts();
  const [autoRecovery, setAutoRecovery] = useState(true);
  const [discountPercent, setDiscountPercent] = useState('10');

  return (
    <div className="space-y-6">
      {/* Config Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Séquence de récupération
            </CardTitle>
            <CardDescription>Workflow automatique déclenché après abandon du panier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECOVERY_SEQUENCE.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    {i < RECOVERY_SEQUENCE.length - 1 && (
                      <div className="w-0.5 h-8 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{step.subject}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        +{step.delay}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-recovery" className="text-sm">Récupération automatique</Label>
              <Switch
                id="auto-recovery"
                checked={autoRecovery}
                onCheckedChange={setAutoRecovery}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm">Réduction incitative (3e email)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-20"
                  min={0}
                  max={50}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Détection auto : panier inactif &gt; 1h</p>
              <p>• Max 3 tentatives par panier</p>
              <p>• Envoi via Brevo (email transactionnel)</p>
              <p>• Cron job toutes les 15 minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'En attente', value: stats.pending, color: 'text-warning' },
          { label: 'Contactés', value: stats.contacted, color: 'text-info' },
          { label: 'Récupérés', value: stats.recovered, color: 'text-success' },
          { label: 'Valeur totale', value: `€${stats.totalValue.toLocaleString()}`, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Paniers abandonnés récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : carts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun panier abandonné détecté</p>
              <p className="text-xs mt-1">Les paniers inactifs depuis plus d'1h apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carts.slice(0, 20).map((cart) => (
                <div key={cart.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cart.customer_name || cart.customer_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(cart.abandoned_at), { addSuffix: true, locale: fr })}
                        {' • '}
                        {Array.isArray(cart.cart_items) ? cart.cart_items.length : 0} articles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">€{Number(cart.cart_value).toFixed(2)}</span>
                    <Badge
                      variant={
                        cart.recovery_status === 'recovered' ? 'default' :
                        cart.recovery_status === 'contacted' ? 'secondary' :
                        'outline'
                      }
                      className={
                        cart.recovery_status === 'recovered' ? 'bg-success/20 text-success border-success/30' : ''
                      }
                    >
                      {cart.recovery_status === 'pending' && 'En attente'}
                      {cart.recovery_status === 'contacted' && `Contacté (${cart.recovery_attempts}x)`}
                      {cart.recovery_status === 'recovered' && 'Récupéré'}
                      {cart.recovery_status === 'dismissed' && 'Ignoré'}
                    </Badge>
                    <div className="flex gap-1">
                      {cart.recovery_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendRecoveryEmail(cart.id)}
                          disabled={isSending}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Relancer
                        </Button>
                      )}
                      {cart.recovery_status !== 'recovered' && cart.recovery_status !== 'dismissed' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => markRecovered(cart.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => dismissCart(cart.id)}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
