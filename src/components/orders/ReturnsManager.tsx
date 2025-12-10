// RETURNS MANAGER - Gestion automatisée des retours et litiges
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  RotateCcw, 
  AlertTriangle, 
  MessageSquare, 
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  type: 'return' | 'refund' | 'exchange';
  amount: number;
  createdAt: string;
  rmaNumber?: string;
}

interface Dispute {
  id: string;
  orderId: string;
  customerName: string;
  issue: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  messages: number;
}

const MOCK_RETURNS: ReturnRequest[] = [
  {
    id: '1',
    orderId: 'ORD-2024-001',
    customerName: 'Jean Dupont',
    productName: 'Montre connectée Pro',
    reason: 'Produit défectueux',
    status: 'pending',
    type: 'refund',
    amount: 129.99,
    createdAt: '2024-12-09'
  },
  {
    id: '2',
    orderId: 'ORD-2024-002',
    customerName: 'Marie Martin',
    productName: 'Écouteurs sans fil',
    reason: 'Ne correspond pas à la description',
    status: 'approved',
    type: 'exchange',
    amount: 79.99,
    createdAt: '2024-12-08',
    rmaNumber: 'RMA-2024-001'
  }
];

const MOCK_DISPUTES: Dispute[] = [
  {
    id: '1',
    orderId: 'ORD-2024-003',
    customerName: 'Pierre Durand',
    issue: 'Colis non reçu',
    status: 'open',
    priority: 'high',
    createdAt: '2024-12-10',
    messages: 3
  },
  {
    id: '2',
    orderId: 'ORD-2024-004',
    customerName: 'Sophie Bernard',
    issue: 'Produit endommagé à la réception',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-12-08',
    messages: 5
  }
];

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-blue-500/10 text-blue-500',
  rejected: 'bg-red-500/10 text-red-500',
  completed: 'bg-green-500/10 text-green-500',
  open: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  resolved: 'bg-green-500/10 text-green-500',
  escalated: 'bg-red-500/10 text-red-500'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500'
};

export default function ReturnsManager() {
  const [returns, setReturns] = useState<ReturnRequest[]>(MOCK_RETURNS);
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    orderId: '',
    reason: '',
    type: 'refund' as const
  });

  const handleApproveReturn = (id: string) => {
    setReturns(prev => prev.map(r => 
      r.id === id 
        ? { ...r, status: 'approved' as const, rmaNumber: `RMA-${Date.now()}` }
        : r
    ));
    toast.success('Retour approuvé - Numéro RMA généré');
  };

  const handleRejectReturn = (id: string) => {
    setReturns(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'rejected' as const } : r
    ));
    toast.info('Retour rejeté');
  };

  const handleResolveDispute = (id: string) => {
    setDisputes(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'resolved' as const } : d
    ));
    toast.success('Litige résolu');
  };

  const createReturn = () => {
    if (!newReturn.orderId || !newReturn.reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const newReturnRequest: ReturnRequest = {
      id: Date.now().toString(),
      orderId: newReturn.orderId,
      customerName: 'Client',
      productName: 'Produit',
      reason: newReturn.reason,
      status: 'pending',
      type: newReturn.type,
      amount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReturns(prev => [newReturnRequest, ...prev]);
    setIsCreateOpen(false);
    setNewReturn({ orderId: '', reason: '', type: 'refund' });
    toast.success('Demande de retour créée');
  };

  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retours en attente</p>
                <p className="text-2xl font-bold">{pendingReturns}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Litiges ouverts</p>
                <p className="text-2xl font-bold">{openDisputes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remboursements ce mois</p>
                <p className="text-2xl font-bold">€ 1,234</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de résolution</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Retours / Litiges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des retours et litiges</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une demande de retour</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Numéro de commande</Label>
                  <Input
                    placeholder="ORD-2024-XXX"
                    value={newReturn.orderId}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, orderId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de demande</Label>
                  <Select
                    value={newReturn.type}
                    onValueChange={(v) => setNewReturn(prev => ({ ...prev, type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Remboursement</SelectItem>
                      <SelectItem value="exchange">Échange</SelectItem>
                      <SelectItem value="return">Retour simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motif</Label>
                  <Textarea
                    placeholder="Décrivez le motif de la demande..."
                    value={newReturn.reason}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={createReturn}>
                  Créer la demande
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="returns">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="returns">
                Retours ({returns.length})
              </TabsTrigger>
              <TabsTrigger value="disputes">
                Litiges ({disputes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="returns" className="space-y-4 mt-4">
              {returns.map((returnReq) => (
                <div 
                  key={returnReq.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{returnReq.orderId}</p>
                        <Badge className={STATUS_COLORS[returnReq.status]}>
                          {returnReq.status === 'pending' ? 'En attente' :
                           returnReq.status === 'approved' ? 'Approuvé' :
                           returnReq.status === 'rejected' ? 'Rejeté' : 'Terminé'}
                        </Badge>
                        {returnReq.rmaNumber && (
                          <Badge variant="outline">{returnReq.rmaNumber}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {returnReq.customerName} • {returnReq.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">{returnReq.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">€ {returnReq.amount.toFixed(2)}</span>
                    {returnReq.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproveReturn(returnReq.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRejectReturn(returnReq.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="disputes" className="space-y-4 mt-4">
              {disputes.map((dispute) => (
                <div 
                  key={dispute.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{dispute.orderId}</p>
                        <Badge className={STATUS_COLORS[dispute.status]}>
                          {dispute.status === 'open' ? 'Ouvert' :
                           dispute.status === 'in_progress' ? 'En cours' :
                           dispute.status === 'resolved' ? 'Résolu' : 'Escaladé'}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[dispute.priority]}>
                          {dispute.priority === 'high' ? 'Urgent' :
                           dispute.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dispute.customerName} • {dispute.issue}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {dispute.messages} messages
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{dispute.createdAt}</span>
                    {(dispute.status === 'open' || dispute.status === 'in_progress') && (
                      <Button 
                        size="sm"
                        onClick={() => handleResolveDispute(dispute.id)}
                      >
                        Résoudre
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
