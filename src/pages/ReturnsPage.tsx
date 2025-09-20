import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Package, RefreshCw, MessageSquare, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReturnRequest {
  id: string
  orderNumber: string
  productName: string
  customerName: string
  customerEmail: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  amount: number
  createdAt: string
  description: string
}

interface RefundRequest {
  id: string
  returnId: string
  amount: number
  method: 'original' | 'store_credit' | 'bank_transfer'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processedAt?: string
}

const ReturnsPage = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('returns')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Mock data
  const returnRequests: ReturnRequest[] = [
    {
      id: 'RET-001',
      orderNumber: 'ORD-2024-001',
      productName: 'Chaise de bureau ergonomique',
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@email.com',
      reason: 'Produit défectueux',
      status: 'pending',
      amount: 299.99,
      createdAt: '2024-01-15',
      description: 'Le mécanisme de réglage de hauteur ne fonctionne pas'
    },
    {
      id: 'RET-002',
      orderNumber: 'ORD-2024-002',
      productName: 'Table basse moderne',
      customerName: 'Marie Martin',
      customerEmail: 'marie.martin@email.com',
      reason: 'Ne correspond pas à la description',
      status: 'approved',
      amount: 189.50,
      createdAt: '2024-01-14',
      description: 'La couleur ne correspond pas à celle affichée sur le site'
    },
    {
      id: 'RET-003',
      orderNumber: 'ORD-2024-003',
      productName: 'Lampe de bureau LED',
      customerName: 'Pierre Durant',
      customerEmail: 'pierre.durant@email.com',
      reason: 'Changement d\'avis',
      status: 'completed',
      amount: 79.99,
      createdAt: '2024-01-13',
      description: 'Finalement pas adapté à mon bureau'
    }
  ]

  const refundRequests: RefundRequest[] = [
    {
      id: 'REF-001',
      returnId: 'RET-002',
      amount: 189.50,
      method: 'original',
      status: 'processing',
    },
    {
      id: 'REF-002',
      returnId: 'RET-003',
      amount: 79.99,
      method: 'original',
      status: 'completed',
      processedAt: '2024-01-16'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = (returnId: string, newStatus: string) => {
    toast({
      title: "Statut mis à jour",
      description: `Le retour ${returnId} a été marqué comme ${newStatus}`,
    })
  }

  const handleProcessRefund = (refundId: string) => {
    toast({
      title: "Remboursement traité",
      description: `Le remboursement ${refundId} a été traité avec succès`,
    })
  }

  const filteredReturns = returnRequests.filter(request =>
    (statusFilter === 'all' || request.status === statusFilter) &&
    (request.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     request.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Retours & SAV</h1>
          <p className="text-muted-foreground">Gestion des retours, remboursements et service client</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contacter CRM
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retours en attente</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 depuis hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remboursements du mois</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,847</div>
            <p className="text-xs text-muted-foreground">-12% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+1.2% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de traitement moyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3j</div>
            <p className="text-xs text-muted-foreground">-0.5j vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="returns">Demandes de retour</TabsTrigger>
          <TabsTrigger value="refunds">Remboursements</TabsTrigger>
          <TabsTrigger value="crm">Liaison CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher par commande, client ou produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Returns List */}
          <div className="space-y-4">
            {filteredReturns.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.id} - {request.productName}</CardTitle>
                      <CardDescription>
                        Commande {request.orderNumber} • {request.customerName} • {request.createdAt}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Raison:</strong> {request.reason}</p>
                      <p><strong>Description:</strong> {request.description}</p>
                      <p><strong>Montant:</strong> €{request.amount}</p>
                      <p><strong>Email:</strong> {request.customerEmail}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select onValueChange={(value) => handleStatusUpdate(request.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Changer le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approuver</SelectItem>
                          <SelectItem value="rejected">Rejeter</SelectItem>
                          <SelectItem value="processing">Mettre en traitement</SelectItem>
                          <SelectItem value="completed">Marquer comme terminé</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contacter le client
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <div className="space-y-4">
            {refundRequests.map((refund) => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Remboursement {refund.id}</CardTitle>
                      <CardDescription>Retour associé: {refund.returnId}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(refund.status)}>
                      {refund.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Montant:</strong> €{refund.amount}</p>
                      <p><strong>Méthode:</strong> {refund.method}</p>
                      {refund.processedAt && <p><strong>Traité le:</strong> {refund.processedAt}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {refund.status === 'pending' && (
                        <Button onClick={() => handleProcessRefund(refund.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Traiter le remboursement
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="crm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration CRM</CardTitle>
              <CardDescription>Intégration avec votre système CRM pour une gestion unifiée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="crm-provider">Fournisseur CRM</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre CRM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="hubspot">HubSpot</SelectItem>
                      <SelectItem value="pipedrive">Pipedrive</SelectItem>
                      <SelectItem value="zoho">Zoho CRM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="api-key">Clé API</Label>
                  <Input type="password" placeholder="Entrez votre clé API" />
                </div>
              </div>
              <Button>
                <CheckCircle className="mr-2 h-4 w-4" />
                Tester la connexion
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Synchronisation automatique</CardTitle>
              <CardDescription>Configuration des règles de synchronisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sync-returns" defaultChecked />
                  <Label htmlFor="sync-returns">Synchroniser les demandes de retour</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sync-refunds" defaultChecked />
                  <Label htmlFor="sync-refunds">Synchroniser les remboursements</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sync-customers" defaultChecked />
                  <Label htmlFor="sync-customers">Synchroniser les données clients</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReturnsPage