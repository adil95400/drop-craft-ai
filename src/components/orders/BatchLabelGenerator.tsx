/**
 * BatchLabelGenerator - Génération d'étiquettes en lot
 * Interface Enterprise pour impression batch
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Printer, FileDown, Package, Truck, CheckCircle2, 
  Loader2, AlertCircle, Settings, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BatchOrder {
  id: string;
  order_number: string;
  customer_name: string;
  items_count: number;
  status: string;
  carrier?: string;
  shipping_address?: {
    city?: string;
    country?: string;
  };
}

interface BatchLabelGeneratorProps {
  orders: BatchOrder[];
  onGenerateLabels: (orderIds: string[], format: string, carrier: string) => Promise<void>;
  onPrintLabels: (orderIds: string[]) => Promise<void>;
}

const labelFormats = [
  { id: 'a4', name: 'A4 (210×297mm)', icon: '📄' },
  { id: 'a6', name: 'A6 (105×148mm)', icon: '📋' },
  { id: '10x15', name: '10×15cm', icon: '🏷️' },
  { id: 'thermal', name: 'Thermique 4×6"', icon: '🖨️' },
];

const defaultCarriers = [
  { id: 'colissimo', name: 'Colissimo' },
  { id: 'chronopost', name: 'Chronopost' },
  { id: 'ups', name: 'UPS' },
  { id: 'dhl', name: 'DHL' },
  { id: 'mondialrelay', name: 'Mondial Relay' },
];

export function BatchLabelGenerator({
  orders = [],
  onGenerateLabels,
  onPrintLabels,
}: BatchLabelGeneratorProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('a6');
  const [selectedCarrier, setSelectedCarrier] = useState('colissimo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState(0);

  const pendingOrders = orders.filter(o => 
    o.status === 'pending' || o.status === 'processing'
  );

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === pendingOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(pendingOrders.map(o => o.id));
    }
  };

  const handleGenerateLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Sélectionnez au moins une commande');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress for each order
      for (let i = 0; i < selectedOrders.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(((i + 1) / selectedOrders.length) * 100);
      }

      await onGenerateLabels(selectedOrders, selectedFormat, selectedCarrier);
      toast.success(`${selectedOrders.length} étiquette(s) générée(s)`);
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handlePrintLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Sélectionnez au moins une commande');
      return;
    }

    setIsPrinting(true);

    try {
      await onPrintLabels(selectedOrders);
      toast.success(`Impression de ${selectedOrders.length} étiquette(s)...`);
    } catch (error) {
      toast.error('Erreur lors de l\'impression');
    } finally {
      setIsPrinting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      processing: { label: 'En cours', variant: 'outline' },
      shipped: { label: 'Expédié', variant: 'default' },
    };
    const config = configs[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Configuration des étiquettes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format d'étiquette</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {labelFormats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <span className="flex items-center gap-2">
                        <span>{format.icon}</span>
                        {format.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transporteur par défaut</label>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultCarriers.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Commandes à traiter
              <Badge variant="secondary" className="ml-2">
                {pendingOrders.length}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedOrders.length === pendingOrders.length 
                ? 'Désélectionner tout' 
                : 'Sélectionner tout'
              }
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucune commande en attente</p>
              <p className="text-sm">Toutes les commandes ont été traitées</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {pendingOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                      selectedOrders.includes(order.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => toggleOrder(order.id)}
                  >
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrder(order.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.order_number}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer_name} • {order.items_count} article(s)
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      {order.shipping_address?.city && (
                        <div>{order.shipping_address.city}</div>
                      )}
                      {order.shipping_address?.country && (
                        <div>{order.shipping_address.country}</div>
                      )}
                    </div>

                    {order.carrier && (
                      <Badge variant="outline">{order.carrier}</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isGenerating && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Génération en cours...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          className="flex-1 gap-2"
          onClick={handleGenerateLabels}
          disabled={selectedOrders.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Générer {selectedOrders.length > 0 && `(${selectedOrders.length})`}
        </Button>

        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handlePrintLabels}
          disabled={selectedOrders.length === 0 || isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          Imprimer {selectedOrders.length > 0 && `(${selectedOrders.length})`}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-primary">{selectedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Sélectionnées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingOrders.length}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'shipped').length}
            </div>
            <div className="text-sm text-muted-foreground">Expédiées</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
