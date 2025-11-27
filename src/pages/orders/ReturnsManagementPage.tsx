import { useState } from 'react';
import { useReturns } from '@/hooks/useReturns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertCircle, CheckCircle, Clock, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function ReturnsManagementPage() {
  const { toast } = useToast();
  const { returns, isLoading, processReturn } = useReturns();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const filteredReturns = returns?.filter((ret: any) => {
    const matchesSearch = ret.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: AlertCircle },
      refunded: { variant: 'default', icon: CheckCircle },
      processing: { variant: 'secondary', icon: RefreshCw }
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleProcessReturn = async (returnId: string) => {
    try {
      processReturn(returnId);
      toast({
        title: "✅ Retour traité",
        description: "Le retour a été traité automatiquement"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le retour",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Retours</h1>
          <p className="text-muted-foreground">Gérez les retours clients et les remboursements</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Nouveau Retour
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Retour</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="ID Commande" />
              <Input placeholder="Email Client" />
              <Textarea placeholder="Raison du retour" />
              <Input type="number" placeholder="Montant" />
              <Button className="w-full">Créer le Retour</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par commande ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
              <SelectItem value="refunded">Remboursé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Returns List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des retours...</p>
          </Card>
        ) : filteredReturns.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun retour</h3>
            <p className="text-muted-foreground">Aucun retour ne correspond à vos critères</p>
          </Card>
        ) : (
          filteredReturns.map((ret: any) => (
            <Card key={ret.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{ret.order_id || 'N/A'}</h3>
                    {getStatusBadge(ret.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Client: {ret.customer_email || 'N/A'}</p>
                    <p>Raison: {ret.reason || 'N/A'}</p>
                    <p>Montant: {ret.refund_amount?.toFixed(2)}€</p>
                    <p>Date: {ret.created_at ? format(new Date(ret.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {ret.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleProcessReturn(ret.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Traiter
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
