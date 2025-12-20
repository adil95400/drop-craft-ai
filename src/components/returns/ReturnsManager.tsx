import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Package, CheckCircle, XCircle, Clock, Search } from "lucide-react"
import { format } from "date-fns"

interface Return {
  id: string
  order_id: string
  customer_id: string
  status: string
  reason: string
  refund_amount: number
  created_at: string
  order?: {
    order_number: string
  }
  customer?: {
    name: string
  }
}

export const ReturnsManager = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<string>("")
  const [returnReason, setReturnReason] = useState("")
  const [refundAmount, setRefundAmount] = useState("")

  const { data: orders } = useQuery({
    queryKey: ['orders-for-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status')
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          details,
          created_at,
          action
        `)
        .eq('action', 'return_request')
        .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      return data?.map(log => {
        const meta = (log.details as any) || {}
        return {
          id: log.id,
          order_id: meta.order_id,
          customer_id: meta.customer_id,
          status: meta.status || 'pending',
          reason: meta.reason || '',
          refund_amount: meta.refund_amount || 0,
          created_at: log.created_at || new Date().toISOString(),
          order: { order_number: meta.order_number },
          customer: { name: meta.customer_name }
        }
      }) as Return[]
    }
  })

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const order = orders?.find(o => o.id === selectedOrder)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id,
          action: 'return_request',
          description: `Demande de retour créée pour la commande ${order?.order_number}`,
          details: {
            order_id: selectedOrder,
            order_number: order?.order_number,
            reason: returnReason,
            refund_amount: parseFloat(refundAmount),
            status: 'pending',
            created_at: new Date().toISOString()
          }
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({
        title: "Demande de retour créée",
        description: "La demande a été enregistrée avec succès"
      })
      setSelectedOrder("")
      setReturnReason("")
      setRefundAmount("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de retour",
        variant: "destructive"
      })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ returnId, newStatus }: { returnId: string, newStatus: string }) => {
      const returnItem = returns?.find(r => r.id === returnId)
      
      const { error } = await supabase
        .from('activity_logs')
        .update({
          details: {
            ...returnItem,
            status: newStatus,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', returnId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast({
        title: "Statut mis à jour",
        description: "Le statut du retour a été modifié"
      })
    }
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      completed: { variant: "secondary", icon: Package }
    }
    const config = variants[status] || variants.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const filteredReturns = returns?.filter(ret => {
    const matchesSearch = ret.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro de commande ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Package className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une demande de retour</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle demande de retour client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Commande</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders?.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {order.total_amount}€
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Raison du retour</Label>
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Expliquez la raison du retour..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant du remboursement</Label>
                  <Input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  onClick={() => createReturnMutation.mutate({})}
                  disabled={!selectedOrder || !returnReason || !refundAmount}
                  className="w-full"
                >
                  Créer la demande
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement...</p>
          ) : filteredReturns?.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune demande de retour</p>
          ) : (
            filteredReturns?.map((ret) => (
              <Card key={ret.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{ret.order?.order_number}</p>
                      {getStatusBadge(ret.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Client: {ret.customer?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Raison: {ret.reason}
                    </p>
                    <p className="text-sm">
                      Montant: <span className="font-semibold">{ret.refund_amount}€</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ret.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {ret.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ returnId: ret.id, newStatus: 'approved' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ returnId: ret.id, newStatus: 'rejected' })}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                    {ret.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatusMutation.mutate({ returnId: ret.id, newStatus: 'completed' })}
                      >
                        Marquer comme terminé
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
