import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  CreditCard, 
  PieChart,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface FinanceData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  cashFlow: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  issueDate: string;
}

export function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  
  const financeData: FinanceData = {
    revenue: 45680.50,
    expenses: 28340.25,
    profit: 17340.25,
    profitMargin: 37.9,
    cashFlow: 12560.80,
    pendingInvoices: 8,
    overdueInvoices: 3
  };

  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'INV-2024-001',
      client: 'Entreprise ABC',
      amount: 2450.00,
      status: 'paid',
      dueDate: '2024-01-15',
      issueDate: '2024-01-01'
    },
    {
      id: '2',
      number: 'INV-2024-002',
      client: 'Société XYZ',
      amount: 1890.50,
      status: 'pending',
      dueDate: '2024-01-25',
      issueDate: '2024-01-10'
    },
    {
      id: '3',
      number: 'INV-2024-003',
      client: 'Start-up 123',
      amount: 950.75,
      status: 'overdue',
      dueDate: '2024-01-20',
      issueDate: '2024-01-05'
    }
  ];

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      draft: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'paid' && 'Payée'}
        {status === 'pending' && 'En attente'}
        {status === 'overdue' && 'En retard'}
        {status === 'draft' && 'Brouillon'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPIs Financiers */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-green-600">
                  {financeData.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% vs mois dernier
                </p>
              </div>
              <Euro className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {financeData.expenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3.2% vs mois dernier
                </p>
              </div>
              <Receipt className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bénéfice Net</p>
                <p className="text-2xl font-bold text-blue-600">
                  {financeData.profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Marge: {financeData.profitMargin}%
                </p>
              </div>
              <PieChart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trésorerie</p>
                <p className="text-2xl font-bold">
                  {financeData.cashFlow.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flux de trésorerie positif
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau de Bord Financier</CardTitle>
          <CardDescription>
            Gérez vos finances, factures et analyses de rentabilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="expenses">Dépenses</TabsTrigger>
              <TabsTrigger value="reports">Rapports</TabsTrigger>
              <TabsTrigger value="taxes">TVA & Taxes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Résumé mensuel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé Mensuel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Chiffre d'affaires</span>
                        <span className="font-medium text-green-600">
                          {financeData.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Dépenses</span>
                        <span className="font-medium text-red-600">
                          {financeData.expenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="font-medium">Bénéfice Net</span>
                        <span className="font-bold text-blue-600">
                          {financeData.profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alertes financières */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alertes Financières</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-red-50">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Factures en retard</div>
                        <div className="text-xs text-muted-foreground">
                          {financeData.overdueInvoices} factures nécessitent un suivi
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Factures en attente</div>
                        <div className="text-xs text-muted-foreground">
                          {financeData.pendingInvoices} factures en cours de paiement
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Trésorerie saine</div>
                        <div className="text-xs text-muted-foreground">
                          Flux de trésorerie positif ce mois
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Gestion des Factures</h3>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Nouvelle Facture
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">N° Facture</th>
                      <th className="px-4 py-3 text-left font-medium">Client</th>
                      <th className="px-4 py-3 text-right font-medium">Montant</th>
                      <th className="px-4 py-3 text-left font-medium">Statut</th>
                      <th className="px-4 py-3 text-left font-medium">Échéance</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-sm">{invoice.number}</td>
                        <td className="px-4 py-3 font-medium">{invoice.client}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getInvoiceStatusIcon(invoice.status)}
                            {getInvoiceStatusBadge(invoice.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline">
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Gestion des dépenses et frais</p>
                <p className="text-sm">Catégorisez et suivez vos dépenses d'entreprise</p>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <PieChart className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-medium mb-1">Rapport P&L</h3>
                    <p className="text-sm text-muted-foreground">Compte de résultat détaillé</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <h3 className="font-medium mb-1">Analyse de Rentabilité</h3>
                    <p className="text-sm text-muted-foreground">Marges et profitabilité par produit</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <h3 className="font-medium mb-1">Rapport Mensuel</h3>
                    <p className="text-sm text-muted-foreground">Synthèse financière mensuelle</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <h3 className="font-medium mb-1">Flux de Trésorerie</h3>
                    <p className="text-sm text-muted-foreground">Analyse des entrées et sorties</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="taxes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion TVA et Taxes</CardTitle>
                  <CardDescription>
                    Suivi automatique de la TVA et préparation des déclarations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">2,890€</p>
                          <p className="text-sm text-muted-foreground">TVA Collectée</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">1,245€</p>
                          <p className="text-sm text-muted-foreground">TVA Déductible</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">1,645€</p>
                          <p className="text-sm text-muted-foreground">TVA à Payer</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      Générer Déclaration TVA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}