/**
 * OrderFulfillmentPanel - Split fulfillment, batch labels, timeline expédition
 * Module Enterprise pour gestion avancée des commandes
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Package, Truck, Printer, Split, CheckCircle2, 
  Clock, AlertCircle, MapPin, FileText, Tag,
  ArrowRight, Box, Timer, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  fulfilled_quantity: number;
  unit_price: number;
  image_url?: string;
}

interface FulfillmentEvent {
  id: string;
  type: 'created' | 'processing' | 'partial_shipped' | 'shipped' | 'delivered' | 'issue';
  timestamp: string;
  description: string;
  user?: string;
  tracking_number?: string;
}

interface OrderFulfillmentPanelProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  status: string;
  tracking_number?: string;
  events?: FulfillmentEvent[];
  onFulfill?: (itemIds: string[], quantities: Record<string, number>, carrier: string, tracking: string) => void;
  onPrintLabel?: (items: string[]) => void;
}

const carriers = [
  { id: 'colissimo', name: 'Colissimo', logo: '📦' },
  { id: 'chronopost', name: 'Chronopost', logo: '⚡' },
  { id: 'ups', name: 'UPS', logo: '🟫' },
  { id: 'dhl', name: 'DHL', logo: '🟡' },
  { id: 'fedex', name: 'FedEx', logo: '🟣' },
  { id: 'mondialrelay', name: 'Mondial Relay', logo: '📬' },
];

export function OrderFulfillmentPanel({
  orderId,
  orderNumber,
  items = [],
  status,
  tracking_number,
  events = [],
  onFulfill,
  onPrintLabel,
}: OrderFulfillmentPanelProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [partialQuantities, setPartialQuantities] = useState<Record<string, number>>({});
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const fulfilledItems = items.reduce((sum, item) => sum + item.fulfilled_quantity, 0);
  const fulfillmentProgress = totalItems > 0 ? (fulfilledItems / totalItems) * 100 : 0;

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handlePartialQuantityChange = (itemId: string, quantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const maxQuantity = item.quantity - item.fulfilled_quantity;
      setPartialQuantities(prev => ({
        ...prev,
        [itemId]: Math.min(Math.max(0, quantity), maxQuantity)
      }));
    }
  };

  const handleFulfill = () => {
    if (!selectedCarrier) {
      toast.error('Sélectionnez un transporteur');
      return;
    }

    const quantities: Record<string, number> = {};
    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        quantities[itemId] = partialQuantities[itemId] || (item.quantity - item.fulfilled_quantity);
      }
    });

    onFulfill?.(selectedItems, quantities, selectedCarrier, trackingNumber);
    
    toast.success(`${selectedItems.length} article(s) marqué(s) pour expédition`);
    setIsFulfillDialogOpen(false);
    setSelectedItems([]);
    setPartialQuantities({});
    setTrackingNumber('');
    setFulfillmentNotes('');
  };

  const handlePrintLabels = () => {
    if (selectedItems.length === 0) {
      toast.error('Sélectionnez des articles');
      return;
    }
    onPrintLabel?.(selectedItems);
    toast.success(`Impression de ${selectedItems.length} étiquette(s)...`);
  };

  const getStatusIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      created: <Package className="h-4 w-4" />,
      processing: <Clock className="h-4 w-4" />,
      partial_shipped: <Split className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      delivered: <CheckCircle2 className="h-4 w-4" />,
      issue: <AlertCircle className="h-4 w-4" />,
    };
    return icons[type] || <Package className="h-4 w-4" />;
  };

  const getStatusColor = (type: string) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-500',
      processing: 'bg-amber-500',
      partial_shipped: 'bg-purple-500',
      shipped: 'bg-indigo-500',
      delivered: 'bg-green-500',
      issue: 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // Mock events if none provided
  const displayEvents = events.length > 0 ? events : [
    { id: '1', type: 'created' as const, timestamp: new Date().toISOString(), description: 'Commande créée' },
  ];

  return (
    <div className="space-y-6">
      {/* Fulfillment Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Fulfillment
            </CardTitle>
            <Badge variant={fulfillmentProgress === 100 ? "default" : "secondary"}>
              {fulfilledItems}/{totalItems} articles
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={fulfillmentProgress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{fulfillmentProgress.toFixed(0)}% complété</span>
              {tracking_number && (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {tracking_number}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Articles à expédier</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedItems.length === items.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => {
              const remainingQty = item.quantity - item.fulfilled_quantity;
              const isFullyFulfilled = remainingQty === 0;
              const isSelected = selectedItems.includes(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    isFullyFulfilled ? "bg-muted/50 opacity-60" : "hover:bg-muted/30",
                    isSelected && !isFullyFulfilled && "border-primary bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !isFullyFulfilled && toggleItemSelection(item.id)}
                    disabled={isFullyFulfilled}
                  />
                  
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Box className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.product_name}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      <span>{item.unit_price.toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity selector for partial fulfillment */}
                    {isSelected && !isFullyFulfilled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Qté:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={remainingQty}
                          value={partialQuantities[item.id] || remainingQty}
                          onChange={(e) => handlePartialQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                        />
                        <span className="text-sm text-muted-foreground">/ {remainingQty}</span>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={isFullyFulfilled ? "default" : "outline"}>
                          {item.fulfilled_quantity}/{item.quantity}
                        </Badge>
                        {isFullyFulfilled && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <AnimatePresence>
            {selectedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex gap-3 mt-6 pt-4 border-t"
              >
                <Dialog open={isFulfillDialogOpen} onOpenChange={setIsFulfillDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 gap-2">
                      <Truck className="h-4 w-4" />
                      Expédier ({selectedItems.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Expédier les articles</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Transporteur</Label>
                        <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un transporteur" />
                          </SelectTrigger>
                          <SelectContent>
                            {carriers.map((carrier) => (
                              <SelectItem key={carrier.id} value={carrier.id}>
                                <span className="flex items-center gap-2">
                                  <span>{carrier.logo}</span>
                                  {carrier.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Numéro de suivi</Label>
                        <Input
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Ex: LA123456789FR"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes internes</Label>
                        <Textarea
                          value={fulfillmentNotes}
                          onChange={(e) => setFulfillmentNotes(e.target.value)}
                          placeholder="Notes optionnelles..."
                          rows={3}
                        />
                      </div>

                      <Separator />

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Récapitulatif</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {selectedItems.map(itemId => {
                            const item = items.find(i => i.id === itemId);
                            if (!item) return null;
                            const qty = partialQuantities[itemId] || (item.quantity - item.fulfilled_quantity);
                            return (
                              <li key={itemId}>• {item.product_name} × {qty}</li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsFulfillDialogOpen(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleFulfill} className="flex-1">
                          Confirmer l'expédition
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="gap-2" onClick={handlePrintLabels}>
                  <Printer className="h-4 w-4" />
                  Imprimer étiquettes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Fulfillment Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Timer className="h-5 w-5 text-primary" />
            Historique d'expédition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {displayEvents.map((event, index) => (
              <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {index < displayEvents.length - 1 && (
                  <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-32px)] bg-border" />
                )}
                
                {/* Status icon */}
                <div className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white",
                  getStatusColor(event.type)
                )}>
                  {getStatusIcon(event.type)}
                </div>

                {/* Event content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{event.description}</p>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {event.tracking_number && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Suivi: {event.tracking_number}
                    </p>
                  )}
                  {event.user && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Par: {event.user}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
