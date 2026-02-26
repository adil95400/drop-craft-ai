import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Package,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Truck,
  RefreshCw,
  AlertCircle,
  Camera,
  MessageSquare,
  ArrowRight,
  ArrowDown,
  Loader2,
  CreditCard,
  Gift,
  Mail
} from 'lucide-react';
import { Return, useReturns } from '@/hooks/useReturns';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

// Timeline step component
interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  date?: string;
  isCompleted: boolean;
  isActive: boolean;
  isLast?: boolean;
}

function TimelineStep({ icon, title, description, date, isCompleted, isActive, isLast }: TimelineStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-100 text-green-600'
              : isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isCompleted ? <CheckCircle className="h-5 w-5" /> : icon}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 h-16 transition-colors ${
              isCompleted ? 'bg-green-200' : 'bg-muted'
            }`}
          />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${isActive ? 'text-primary' : ''}`}>{title}</h4>
          {date && (
            <span className="text-sm text-muted-foreground">
              {format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

// Status workflow
const STATUS_WORKFLOW = [
  { key: 'pending', label: 'En attente', icon: <Clock className="h-5 w-5" /> },
  { key: 'approved', label: 'Approuvé', icon: <CheckCircle className="h-5 w-5" /> },
  { key: 'received', label: 'Reçu', icon: <Package className="h-5 w-5" /> },
  { key: 'inspecting', label: 'Inspection', icon: <Eye className="h-5 w-5" /> },
  { key: 'refunded', label: 'Remboursé', icon: <RefreshCw className="h-5 w-5" /> },
  { key: 'completed', label: 'Terminé', icon: <CheckCircle className="h-5 w-5" /> },
];

interface EnhancedReturnFlowProps {
  returnItem: Return;
  onClose: () => void;
}

export function EnhancedReturnFlow({ returnItem, onClose }: EnhancedReturnFlowProps) {
  const { updateStatus, updateReturn, isUpdating } = useReturns();
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState(String(returnItem.refund_amount || ''));
  const [trackingNumber, setTrackingNumber] = useState(returnItem.tracking_number || '');
  const [carrier, setCarrier] = useState(returnItem.carrier || '');
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const currentStepIndex = STATUS_WORKFLOW.findIndex((s) => s.key === returnItem.status);

  // Get timeline events
  const getTimelineEvents = () => {
    const events = [
      {
        key: 'created',
        icon: <RotateCcw className="h-5 w-5" />,
        title: 'Demande créée',
        date: returnItem.created_at,
        isCompleted: true,
      },
    ];

    if (returnItem.status !== 'pending' && returnItem.status !== 'rejected') {
      events.push({
        key: 'approved',
        icon: <CheckCircle className="h-5 w-5" />,
        title: 'Demande approuvée',
        date: returnItem.updated_at, // Should ideally have approved_at
        isCompleted: true,
      });
    }

    if (returnItem.received_at) {
      events.push({
        key: 'received',
        icon: <Package className="h-5 w-5" />,
        title: 'Colis reçu',
        date: returnItem.received_at,
        isCompleted: true,
      });
    }

    if (returnItem.inspected_at) {
      events.push({
        key: 'inspected',
        icon: <Eye className="h-5 w-5" />,
        title: 'Inspection terminée',
        date: returnItem.inspected_at,
        isCompleted: true,
      });
    }

    if (returnItem.refunded_at) {
      events.push({
        key: 'refunded',
        icon: <CreditCard className="h-5 w-5" />,
        title: `Remboursement effectué (${returnItem.refund_amount}€)`,
        date: returnItem.refunded_at,
        isCompleted: true,
      });
    }

    if (returnItem.status === 'rejected') {
      events.push({
        key: 'rejected',
        icon: <XCircle className="h-5 w-5" />,
        title: 'Demande rejetée',
        date: returnItem.updated_at,
        isCompleted: true,
      });
    }

    return events;
  };

  const handleStatusUpdate = (newStatus: Return['status']) => {
    updateStatus(
      { id: returnItem.id, status: newStatus, notes: notes || undefined },
      { onSuccess: () => setNotes('') }
    );
  };

  const handleRefund = () => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) return;

    updateReturn({
      id: returnItem.id,
      updates: {
        refund_amount: amount,
        status: 'refunded' as const,
        refunded_at: new Date().toISOString(),
      },
    });
    setShowRefundDialog(false);
  };

  const handleAddTracking = () => {
    if (!trackingNumber) return;
    updateReturn({
      id: returnItem.id,
      updates: {
        tracking_number: trackingNumber,
        carrier: carrier || undefined,
      },
    });
  };

  // Calculate refund suggestion
  const suggestedRefund = returnItem.items?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) || 0;

  // Get next actions
  const getNextActions = () => {
    switch (returnItem.status) {
      case 'pending':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Examinez la demande et décidez de l'approuver ou la rejeter.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleStatusUpdate('approved')}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        );

      case 'approved':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              En attente de réception du colis. Ajoutez le numéro de suivi si disponible.
            </p>
            
            {!returnItem.tracking_number && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Numéro de suivi</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Entrez le numéro de suivi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transporteur (optionnel)</Label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="Ex: Colissimo, UPS, DHL..."
                  />
                </div>
                <Button
                  onClick={handleAddTracking}
                  disabled={!trackingNumber || isUpdating}
                  className="w-full"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Ajouter le suivi
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => handleStatusUpdate('received')}
              disabled={isUpdating}
            >
              <Package className="h-4 w-4 mr-2" />
              Marquer comme reçu
            </Button>
          </div>
        );

      case 'received':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le colis a été reçu. Procédez à l'inspection du produit.
            </p>
            <Button
              className="w-full"
              onClick={() => handleStatusUpdate('inspecting')}
              disabled={isUpdating}
            >
              <Eye className="h-4 w-4 mr-2" />
              Commencer l'inspection
            </Button>
          </div>
        );

      case 'inspecting':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Après inspection, procédez au remboursement ou rejetez la demande.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setShowRefundDialog(true)}
                disabled={isUpdating}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Rembourser
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        );

      case 'refunded':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le remboursement a été effectué. Marquez le retour comme terminé.
            </p>
            <Button
              className="w-full"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminer le retour
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const events = getTimelineEvents();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold font-mono">{returnItem.rma_number}</h2>
              <Badge
                variant={
                  returnItem.status === 'completed' || returnItem.status === 'refunded'
                    ? 'default'
                    : returnItem.status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {STATUS_WORKFLOW.find((s) => s.key === returnItem.status)?.label || returnItem.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Créé {formatDistanceToNow(new Date(returnItem.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {returnItem.status !== 'rejected' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progression</span>
              <span>{Math.round(((currentStepIndex + 1) / STATUS_WORKFLOW.length) * 100)}%</span>
            </div>
            <Progress
              value={((currentStepIndex + 1) / STATUS_WORKFLOW.length) * 100}
              className="h-2"
            />
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="timeline">Historique</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Reason */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Raison du retour</h4>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{returnItem.reason}</p>
                      {returnItem.description && (
                        <p className="text-sm text-muted-foreground mt-1">{returnItem.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Articles ({returnItem.items?.length || 0})
              </h4>
              <div className="space-y-2">
                {returnItem.items?.map((item, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{(item.price * item.quantity).toFixed(2)}€</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Refund info */}
            {returnItem.refund_amount && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Remboursement</h4>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Montant remboursé</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {returnItem.refund_amount}€
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tracking */}
            {returnItem.tracking_number && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Suivi</h4>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-mono font-medium">{returnItem.tracking_number}</p>
                      {returnItem.carrier && (
                        <p className="text-sm text-muted-foreground">{returnItem.carrier}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notes */}
            {returnItem.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">{returnItem.notes}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {events.map((event, idx) => (
                  <TimelineStep
                    key={event.key}
                    icon={event.icon}
                    title={event.title}
                    date={event.date}
                    isCompleted={event.isCompleted}
                    isActive={false}
                    isLast={idx === events.length - 1}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Prochaine étape</CardTitle>
                <CardDescription>
                  {returnItem.status === 'completed'
                    ? 'Ce retour est terminé'
                    : returnItem.status === 'rejected'
                    ? 'Cette demande a été rejetée'
                    : 'Actions disponibles pour ce retour'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Notes input */}
                {returnItem.status !== 'completed' && returnItem.status !== 'rejected' && (
                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label>Ajouter une note</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes internes..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {getNextActions()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Effectuer le remboursement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant du remboursement (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Suggéré: ${suggestedRefund.toFixed(2)}€`}
              />
              {suggestedRefund > 0 && (
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setRefundAmount(suggestedRefund.toFixed(2))}
                >
                  Utiliser le montant suggéré ({suggestedRefund.toFixed(2)}€)
                </Button>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Méthode de remboursement</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>
                  {returnItem.refund_method === 'store_credit'
                    ? 'Avoir boutique'
                    : returnItem.refund_method === 'exchange'
                    ? 'Échange'
                    : 'Moyen de paiement original'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRefund} disabled={!refundAmount || isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer le remboursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
