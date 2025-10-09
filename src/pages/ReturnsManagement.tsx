import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { RotateCcw, Package, CheckCircle, XCircle, Clock, TrendingUp, DollarSign } from 'lucide-react'

export default function ReturnsManagement() {
  const { toast } = useToast()
  const [selectedReturn, setSelectedReturn] = useState<number | null>(null)

  const returns = [
    {
      id: 1,
      returnNumber: "RET-2024-001",
      orderNumber: "ORD-2024-1234",
      customer: "Jean Dupont",
      product: "Smart LED Light Strip",
      reason: "Produit défectueux",
      status: "pending",
      requestDate: "2024-01-15",
      amount: 39.99,
      refundMethod: "original"
    },
    {
      id: 2,
      returnNumber: "RET-2024-002",
      orderNumber: "ORD-2024-1235",
      customer: "Marie Martin",
      product: "Portable Blender",
      reason: "Mauvaise taille",
      status: "approved",
      requestDate: "2024-01-14",
      amount: 42.99,
      refundMethod: "original"
    },
    {
      id: 3,
      returnNumber: "RET-2024-003",
      orderNumber: "ORD-2024-1236",
      customer: "Pierre Durant",
      product: "Wireless Car Charger",
      reason: "Ne correspond pas à la description",
      status: "completed",
      requestDate: "2024-01-12",
      amount: 29.99,
      refundMethod: "store_credit"
    }
  ]

  const stats = [
    {
      icon: RotateCcw,
      label: "Retours en cours",
      value: "8",
      change: "-12%",
      color: "text-warning"
    },
    {
      icon: Package,
      label: "Taux de retour",
      value: "3.2%",
      change: "-0.5%",
      color: "text-success"
    },
    {
      icon: DollarSign,
      label: "Montant total",
      value: "€1,245",
      change: "+8%",
      color: "text-destructive"
    },
    {
      icon: Clock,
      label: "Temps moyen",
      value: "2.5 jours",
      change: "-0.8j",
      color: "text-success"
    }
  ]

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'approved': return 'default'
      case 'completed': return 'default'
      case 'rejected': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'approved': return 'Approuvé'
      case 'completed': return 'Terminé'
      case 'rejected': return 'Refusé'
      default: return status
    }
  }

  const handleApprove = (returnId: number) => {
    toast({
      title: "Retour approuvé",
      description: "Le client a été notifié par email"
    })
  }

  const handleReject = (returnId: number) => {
    toast({
      title: "Retour refusé",
      description: "Le client a été notifié par email"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des retours</h1>
        <p className="text-muted-foreground">Gérez les demandes de retour et remboursements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Returns List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Demandes de retour</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="approved">Approuvés</TabsTrigger>
                <TabsTrigger value="completed">Terminés</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {returns.map((returnItem) => (
                  <Card key={returnItem.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{returnItem.returnNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Commande: {returnItem.orderNumber}
                            </p>
                          </div>
                          <Badge variant={getStatusColor(returnItem.status)}>
                            {getStatusLabel(returnItem.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Client</p>
                            <p className="font-medium">{returnItem.customer}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Produit</p>
                            <p className="font-medium">{returnItem.product}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Raison</p>
                            <p className="font-medium">{returnItem.reason}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Montant</p>
                            <p className="font-medium">€{returnItem.amount}</p>
                          </div>
                        </div>

                        {returnItem.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleReject(returnItem.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Refuser
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleApprove(returnItem.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="pending">
                <div className="text-center py-8 text-muted-foreground">
                  Filtrer les retours en attente
                </div>
              </TabsContent>

              <TabsContent value="approved">
                <div className="text-center py-8 text-muted-foreground">
                  Filtrer les retours approuvés
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="text-center py-8 text-muted-foreground">
                  Filtrer les retours terminés
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Return Policy & Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Politique de retour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Période de retour (jours)</Label>
                <Input type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label>Raisons de retour acceptées</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les raisons</SelectItem>
                    <SelectItem value="defective">Produit défectueux</SelectItem>
                    <SelectItem value="wrong">Mauvais produit</SelectItem>
                    <SelectItem value="size">Mauvaise taille</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Méthode de remboursement par défaut</Label>
                <Select defaultValue="original">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Méthode originale</SelectItem>
                    <SelectItem value="store_credit">Crédit boutique</SelectItem>
                    <SelectItem value="exchange">Échange uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frais de retour</Label>
                <Select defaultValue="customer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">À la charge du client</SelectItem>
                    <SelectItem value="store">À la charge de la boutique</SelectItem>
                    <SelectItem value="shared">Partagé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                Enregistrer la politique
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications automatiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email de confirmation</Label>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Email d'approbation</Label>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Email de remboursement</Label>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS de suivi</Label>
                <input type="checkbox" className="toggle" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
