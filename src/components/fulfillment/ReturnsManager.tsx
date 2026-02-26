import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturns, useUpdateReturn } from '@/hooks/useFulfillment';
import { RotateCcw, CheckCircle, Clock, AlertTriangle, Package, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface RMAItem {
  id: string;
  rma_number: string;
  status: string;
  reason_category?: string;
  reason?: string;
  customer_notes?: string;
  refund_amount?: number;
  requested_at?: string;
  created_at?: string;
}

export function ReturnsManager() {
  const { data: returns, isLoading } = useReturns();
  const updateReturn = useUpdateReturn();
  const [selectedReturn, setSelectedReturn] = useState<RMAItem | null>(null);
  
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any; color: string }> = {
      requested: { label: 'Demandé', variant: 'outline', icon: Clock, color: 'text-muted-foreground' },
      approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      rejected: { label: 'Refusé', variant: 'destructive', icon: AlertTriangle, color: 'text-red-500' },
      shipped_back: { label: 'Expédié', variant: 'default', icon: Package, color: 'text-blue-500' },
      received: { label: 'Reçu', variant: 'default', icon: Package, color: 'text-purple-500' },
      inspected: { label: 'Inspecté', variant: 'outline', icon: Eye, color: 'text-orange-500' },
      refunded: { label: 'Remboursé', variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      exchanged: { label: 'Échangé', variant: 'default', icon: RotateCcw, color: 'text-green-500' },
      closed: { label: 'Fermé', variant: 'secondary', icon: CheckCircle, color: 'text-muted-foreground' }
    };
    return statusMap[status] || { label: status, variant: 'secondary', icon: Clock, color: 'text-muted-foreground' };
  };
  
  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      defective: 'Produit défectueux',
      wrong_item: 'Mauvais article',
      not_as_described: 'Non conforme',
      changed_mind: 'Changement d\'avis',
      arrived_late: 'Arrivé trop tard',
      damaged_in_shipping: 'Endommagé',
      other: 'Autre'
    };
    return reasons[reason] || reason;
  };
  
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const updates: any = { id, status: newStatus };
    if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
    if (newStatus === 'received') updates.received_at = new Date().toISOString();
    if (newStatus === 'refunded' || newStatus === 'exchanged' || newStatus === 'closed') {
      updates.completed_at = new Date().toISOString();
    }
    
    await updateReturn.mutateAsync(updates);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const rmaList = (returns || []) as RMAItem[];
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Gestion des retours (RMA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° RMA</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Remboursement</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rmaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune demande de retour
                    </TableCell>
                  </TableRow>
                ) : (
                  rmaList.map((rma) => {
                    const status = getStatusInfo(rma.status);
                    return (
                      <TableRow key={rma.id}>
                        <TableCell className="font-mono text-sm">
                          {rma.rma_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getReasonLabel(rma.reason_category || '')}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {rma.reason}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <status.icon className={`h-3 w-3 ${status.color}`} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {rma.refund_amount ? `${rma.refund_amount.toFixed(2)} €` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rma.requested_at ? format(new Date(rma.requested_at), 'dd/MM/yyyy', { locale: getDateFnsLocale() }) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(rma)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Retour {rma.rma_number}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Catégorie</p>
                                      <p className="font-medium">{getReasonLabel(rma.reason_category || '')}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Statut</p>
                                      <Badge variant={status.variant}>{status.label}</Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-muted-foreground">Raison détaillée</p>
                                    <p>{rma.reason}</p>
                                  </div>
                                  
                                  {rma.customer_notes && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Notes client</p>
                                      <p className="bg-muted p-2 rounded text-sm">{rma.customer_notes}</p>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Changer le statut</p>
                                    <Select
                                      value={rma.status}
                                      onValueChange={(value) => handleStatusUpdate(rma.id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="requested">Demandé</SelectItem>
                                        <SelectItem value="approved">Approuvé</SelectItem>
                                        <SelectItem value="rejected">Refusé</SelectItem>
                                        <SelectItem value="shipped_back">Expédié</SelectItem>
                                        <SelectItem value="received">Reçu</SelectItem>
                                        <SelectItem value="inspected">Inspecté</SelectItem>
                                        <SelectItem value="refunded">Remboursé</SelectItem>
                                        <SelectItem value="exchanged">Échangé</SelectItem>
                                        <SelectItem value="closed">Fermé</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex gap-2 pt-4 border-t">
                                    {rma.status === 'requested' && (
                                      <>
                                        <Button 
                                          variant="default"
                                          onClick={() => handleStatusUpdate(rma.id, 'approved')}
                                          disabled={updateReturn.isPending}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approuver
                                        </Button>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => handleStatusUpdate(rma.id, 'rejected')}
                                          disabled={updateReturn.isPending}
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-2" />
                                          Refuser
                                        </Button>
                                      </>
                                    )}
                                    {rma.status === 'received' && (
                                      <Button 
                                        onClick={() => handleStatusUpdate(rma.id, 'refunded')}
                                        disabled={updateReturn.isPending}
                                      >
                                        Procéder au remboursement
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
