import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Crown, Users, TrendingUp, DollarSign, Gift, Calendar, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Mock data pour les abonnements
const mockSubscriptions = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'john.doe@example.com',
    userName: 'John Doe',
    plan: 'ultra_pro',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    amount: 299,
    currency: 'EUR',
    paymentMethod: 'card',
    nextBilling: '2024-02-15'
  },
  {
    id: '2', 
    userId: 'user-2',
    userEmail: 'marie.martin@example.com',
    userName: 'Marie Martin',
    plan: 'pro',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2025-02-01',
    amount: 99,
    currency: 'EUR',
    paymentMethod: 'card',
    nextBilling: '2024-03-01'
  },
  {
    id: '3',
    userId: 'user-3',
    userEmail: 'pierre.durand@example.com',
    userName: 'Pierre Durand',
    plan: 'standard',
    status: 'cancelled',
    startDate: '2023-12-01',
    endDate: '2024-01-01',
    amount: 29,
    currency: 'EUR',
    paymentMethod: 'card',
    nextBilling: null
  }
];

// Mock data pour les codes promo
const mockPromoCodes = [
  {
    id: '1',
    code: 'WELCOME2024',
    type: 'percentage',
    value: 20,
    description: 'Réduction de bienvenue 2024',
    usageLimit: 100,
    usageCount: 23,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'active',
    planRestriction: null
  },
  {
    id: '2',
    code: 'BLACKFRIDAY',
    type: 'fixed',
    value: 50,
    description: 'Offre Black Friday',
    usageLimit: 500,
    usageCount: 456,
    validFrom: '2024-11-25',
    validUntil: '2024-11-30',
    status: 'expired',
    planRestriction: 'pro'
  }
];

const AdminSubscriptions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const getPlanColor = (plan: string) => {
    switch(plan) {
      case 'ultra_pro': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalRevenue: mockSubscriptions.reduce((acc, sub) => sub.status === 'active' ? acc + sub.amount : acc, 0),
    activeSubscriptions: mockSubscriptions.filter(sub => sub.status === 'active').length,
    totalUsers: mockSubscriptions.length,
    conversionRate: 78.5
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Abonnements</h1>
          <p className="text-muted-foreground">Gérez les abonnements, plans et codes promotionnels</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Gift className="w-4 h-4 mr-2" />
                Nouveau Code Promo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Code Promo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="promoCode">Code Promo</Label>
                  <Input id="promoCode" placeholder="WELCOME2024" />
                </div>
                <div>
                  <Label htmlFor="promoType">Type de Réduction</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed">Montant Fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="promoValue">Valeur</Label>
                  <Input id="promoValue" type="number" placeholder="20" />
                </div>
                <div>
                  <Label htmlFor="promoDescription">Description</Label>
                  <Textarea id="promoDescription" placeholder="Description du code promo" />
                </div>
                <Button className="w-full">Créer le Code Promo</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Abonnement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue}€</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">+5% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+8% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">+2% ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="promo-codes">Codes Promo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par email ou nom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les plans</SelectItem>
                    <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions List */}
          <div className="space-y-4">
            {mockSubscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{subscription.userName}</h3>
                        <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getPlanColor(subscription.plan)}>
                        {subscription.plan.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold">{subscription.amount}€/{subscription.plan === 'standard' ? 'mois' : 'an'}</p>
                        {subscription.nextBilling && (
                          <p className="text-sm text-muted-foreground">
                            Prochaine facturation: {subscription.nextBilling}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="promo-codes" className="space-y-4">
          {/* Promo Codes List */}
          <div className="space-y-4">
            {mockPromoCodes.map((promo) => (
              <Card key={promo.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{promo.code}</h3>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs text-muted-foreground">
                            {promo.validFrom} - {promo.validUntil}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value}€`}
                        </p>
                        <p className="text-xs text-muted-foreground">Réduction</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{promo.usageCount}/{promo.usageLimit}</p>
                        <p className="text-xs text-muted-foreground">Utilisations</p>
                      </div>
                      <Badge className={getStatusColor(promo.status)}>
                        {promo.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptions;