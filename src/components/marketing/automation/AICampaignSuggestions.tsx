/**
 * AICampaignSuggestions — AI-powered campaign recommendations
 * Analyzes store data to suggest marketing actions
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ShoppingCart, TrendingUp, Users, Package, Star,
  ArrowRight, Loader2, Zap, Target, RefreshCw
} from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'abandoned_cart' | 'upsell' | 'restock' | 'seasonal' | 'winback';
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  icon: React.ElementType;
  action: string;
}

export function AICampaignSuggestions() {
  const [applying, setApplying] = useState<string | null>(null);

  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-campaign-suggestions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Gather store signals
      const [
        { data: carts },
        { data: products },
        { data: orders },
        { data: customers },
      ] = await Promise.all([
        supabase.from('abandoned_carts').select('id, cart_value, recovery_status')
          .eq('user_id', user.id).eq('recovery_status', 'pending').limit(100),
        supabase.from('products').select('id, title, stock_quantity, price')
          .eq('user_id', user.id).order('stock_quantity', { ascending: true }).limit(50),
        supabase.from('orders').select('id, total_amount, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('customers').select('id, total_spent, last_order_date')
          .eq('user_id', user.id).limit(200),
      ]);

      const result: Suggestion[] = [];

      // 1. Abandoned cart opportunity
      const pendingCarts = carts || [];
      if (pendingCarts.length > 0) {
        const totalValue = pendingCarts.reduce((s, c: any) => s + (c.cart_value || 0), 0);
        result.push({
          id: 'cart-recovery',
          title: `${pendingCarts.length} paniers abandonnés à récupérer`,
          description: `Valeur totale : ${totalValue.toFixed(0)}€. Activez une séquence de relance automatique pour récupérer jusqu'à 15% de ces paniers.`,
          type: 'abandoned_cart',
          priority: 'high',
          expectedImpact: `+${Math.round(totalValue * 0.15)}€ potentiel`,
          icon: ShoppingCart,
          action: 'Créer une relance panier',
        });
      }

      // 2. Low stock alert campaign
      const lowStock = (products || []).filter((p: any) => p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity < 10);
      if (lowStock.length > 0) {
        result.push({
          id: 'scarcity-campaign',
          title: `${lowStock.length} produits bientôt en rupture`,
          description: `Créez une campagne "Dernières pièces" pour accélérer les ventes avec un effet d'urgence sur ${lowStock.map((p: any) => p.title).slice(0, 3).join(', ')}...`,
          type: 'restock',
          priority: 'high',
          expectedImpact: '+25% vélocité de vente',
          icon: Package,
          action: 'Lancer une campagne urgence',
        });
      }

      // 3. Win-back dormant customers
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dormant = (customers || []).filter((c: any) =>
        c.last_order_date && new Date(c.last_order_date) < thirtyDaysAgo && (c.total_spent || 0) > 50
      );
      if (dormant.length > 0) {
        result.push({
          id: 'winback',
          title: `${dormant.length} clients VIP inactifs`,
          description: `Ces clients ont dépensé en moyenne ${Math.round(dormant.reduce((s: number, c: any) => s + (c.total_spent || 0), 0) / dormant.length)}€ mais n'ont pas commandé depuis 30+ jours. Une offre personnalisée pourrait les réactiver.`,
          type: 'winback',
          priority: 'medium',
          expectedImpact: `${Math.round(dormant.length * 0.2)} commandes estimées`,
          icon: Users,
          action: 'Créer une campagne win-back',
        });
      }

      // 4. Top products upsell
      const topProducts = (products || []).filter((p: any) => (p.stock_quantity || 0) > 20).slice(0, 5);
      if (topProducts.length > 0 && (orders || []).length > 10) {
        result.push({
          id: 'upsell',
          title: 'Opportunité de cross-sell détectée',
          description: `Vos ${topProducts.length} produits les plus stockés peuvent être promus via des recommandations post-achat automatiques.`,
          type: 'upsell',
          priority: 'medium',
          expectedImpact: '+12% panier moyen',
          icon: TrendingUp,
          action: 'Configurer le cross-sell',
        });
      }

      // 5. Seasonal/general
      result.push({
        id: 'seasonal',
        title: 'Campagne saisonnière suggérée',
        description: 'Anticipez les tendances avec une campagne thématique. L\'IA peut générer les visuels et les copies publicitaires adaptés à votre catalogue.',
        type: 'seasonal',
        priority: 'low',
        expectedImpact: '+18% trafic estimé',
        icon: Star,
        action: 'Générer avec l\'IA',
      });

      return result;
    },
  });

  const handleApply = async (id: string) => {
    setApplying(id);
    // Simulate action — in production this would create the campaign
    await new Promise(r => setTimeout(r, 1500));
    setApplying(null);
  };

  const priorityStyles = {
    high: 'border-destructive/30 bg-destructive/5',
    medium: 'border-warning/30 bg-warning/5',
    low: 'border-primary/20 bg-primary/5',
  };

  const priorityLabels = {
    high: { label: 'Haute', variant: 'destructive' as const },
    medium: { label: 'Moyenne', variant: 'default' as const },
    low: { label: 'Basse', variant: 'secondary' as const },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggestions IA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyse de votre boutique...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune suggestion pour le moment</p>
            <p className="text-xs">Ajoutez des produits et des commandes pour obtenir des recommandations</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-lg border ${priorityStyles[suggestion.priority]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-background shadow-sm">
                      <suggestion.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                        <Badge variant={priorityLabels[suggestion.priority].variant} className="text-xs">
                          {priorityLabels[suggestion.priority].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Zap className="h-3 w-3" />
                          {suggestion.expectedImpact}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={applying === suggestion.id}
                          onClick={() => handleApply(suggestion.id)}
                        >
                          {applying === suggestion.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3 w-3" />
                          )}
                          {suggestion.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
