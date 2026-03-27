/**
 * Branded Tracking Page — Public page for end customers
 * /tracking/:orderNumber
 * No auth required. Shows order tracking with merchant branding.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Truck, CheckCircle2, Clock, MapPin, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingStep {
  label: string;
  description: string;
  date?: string;
  completed: boolean;
  current: boolean;
  icon: React.ReactNode;
}

const STATUS_MAP: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', step: 0 },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500', step: 1 },
  processing: { label: 'En préparation', color: 'bg-blue-500', step: 1 },
  shipped: { label: 'Expédiée', color: 'bg-indigo-500', step: 2 },
  in_transit: { label: 'En transit', color: 'bg-indigo-500', step: 2 },
  out_for_delivery: { label: 'En livraison', color: 'bg-purple-500', step: 3 },
  delivered: { label: 'Livrée', color: 'bg-green-500', step: 4 },
  cancelled: { label: 'Annulée', color: 'bg-red-500', step: -1 },
};

export default function BrandedTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchValue, setSearchValue] = useState(orderNumber || '');
  const [activeOrder, setActiveOrder] = useState(orderNumber || '');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['tracking', activeOrder],
    queryFn: async () => {
      if (!activeOrder) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.eq.${activeOrder},id.eq.${activeOrder}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrder,
  });

  const statusInfo = STATUS_MAP[order?.status || 'pending'] || STATUS_MAP.pending;

  const steps: TrackingStep[] = [
    {
      label: 'Commande reçue',
      description: 'Votre commande a été confirmée',
      date: order?.created_at,
      completed: statusInfo.step >= 0,
      current: statusInfo.step === 0,
      icon: <Clock className="h-5 w-5" />,
    },
    {
      label: 'En préparation',
      description: 'Votre colis est en cours de préparation',
      date: statusInfo.step >= 1 ? order?.updated_at : undefined,
      completed: statusInfo.step >= 1,
      current: statusInfo.step === 1,
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: 'Expédiée',
      description: order?.tracking_number
        ? `Numéro de suivi : ${order.tracking_number}`
        : 'Votre colis a été remis au transporteur',
      date: statusInfo.step >= 2 ? order?.updated_at : undefined,
      completed: statusInfo.step >= 2,
      current: statusInfo.step === 2,
      icon: <Truck className="h-5 w-5" />,
    },
    {
      label: 'En livraison',
      description: 'Votre colis est en cours de livraison',
      completed: statusInfo.step >= 3,
      current: statusInfo.step === 3,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: 'Livrée',
      description: 'Votre commande a été livrée avec succès',
      date: statusInfo.step >= 4 ? order?.updated_at : undefined,
      completed: statusInfo.step >= 4,
      current: statusInfo.step === 4,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  ];

  const handleSearch = () => {
    if (searchValue.trim()) {
      setActiveOrder(searchValue.trim());
    }
  };

  return (
    <>
      <Helmet>
        <title>Suivi de commande | Drop Craft AI</title>
        <meta name="description" content="Suivez votre commande en temps réel avec notre page de suivi brandée." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Suivi de commande</h1>
                <p className="text-xs text-muted-foreground">Powered by Drop Craft AI</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Search Bar */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Entrez votre numéro de commande..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} className="gap-2">
                  <Search className="h-4 w-4" />
                  Suivre
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !order && activeOrder && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-semibold">Commande introuvable</h2>
                <p className="text-muted-foreground text-sm">
                  Aucune commande trouvée pour "{activeOrder}". Vérifiez le numéro et réessayez.
                </p>
              </CardContent>
            </Card>
          )}

          {order && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Commande {order.order_number || `#${order.id?.slice(0, 8)}`}
                    </CardTitle>
                    <Badge className={`${statusInfo.color} text-white`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  {order.created_at && (
                    <p className="text-sm text-muted-foreground">
                      Passée le {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {order.total_amount != null && (
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="font-semibold">{Number(order.total_amount).toFixed(2)} {order.currency || 'EUR'}</p>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div>
                        <p className="text-muted-foreground">N° de suivi</p>
                        <p className="font-mono font-semibold">{order.tracking_number}</p>
                      </div>
                    )}
                    {order.carrier && (
                      <div>
                        <p className="text-muted-foreground">Transporteur</p>
                        <p className="font-semibold capitalize">{order.carrier}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        {/* Vertical line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                              step.completed
                                ? 'border-primary bg-primary text-primary-foreground'
                                : step.current
                                ? 'border-primary bg-primary/10 text-primary animate-pulse'
                                : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                            }`}
                          >
                            {step.icon}
                          </div>
                          {index < steps.length - 1 && (
                            <div
                              className={`w-0.5 flex-1 min-h-[40px] transition-all ${
                                step.completed ? 'bg-primary' : 'bg-muted-foreground/20'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-6 pt-1">
                          <p
                            className={`font-medium ${
                              step.completed || step.current ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(step.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estimated delivery */}
              {order.estimated_delivery && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Livraison estimée</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.estimated_delivery), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help section */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Un problème avec votre commande ?{' '}
                    <a href="/contact" className="text-primary hover:underline font-medium">
                      Contactez-nous
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!activeOrder && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-semibold">Suivez votre commande</h2>
                <p className="text-muted-foreground text-sm">
                  Entrez votre numéro de commande pour voir le statut de votre livraison en temps réel.
                </p>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 py-6 bg-card/50">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Drop Craft AI — Suivi sécurisé de commande</p>
          </div>
        </footer>
      </div>
    </>
  );
}
