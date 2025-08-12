import { useState } from "react";
import { Package, TrendingUp, AlertTriangle, BarChart3, Cpu, Zap, Users, DollarSign, Search, Filter, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function StockUltraPro() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Mock data pour stock avec IA prédictive
  const stockEvolution = [
    { month: 'Jan', valeur: 45000, volume: 1200, prediction: 47000 },
    { month: 'Fév', valeur: 48000, volume: 1350, prediction: 49000 },
    { month: 'Mar', valeur: 52000, volume: 1450, prediction: 53000 },
    { month: 'Avr', valeur: 49000, volume: 1380, prediction: 51000 },
    { month: 'Mai', valeur: 55000, volume: 1520, prediction: 57000 },
    { month: 'Jun', valeur: 58000, volume: 1600, prediction: 60000 }
  ];

  const stockAlerts = [
    {
      type: "rupture",
      product: "iPhone 15 Pro",
      sku: "IPH15P-128",
      stockActuel: 0,
      seuilAlerte: 10,
      demandePrevue: 25,
      priorite: "critique"
    },
    {
      type: "faible",
      product: "Samsung Galaxy S24",
      sku: "SAM-S24-256",
      stockActuel: 3,
      seuilAlerte: 15,
      demandePrevue: 12,
      priorite: "haute"
    },
    {
      type: "surstock",
      product: "Écouteurs Bluetooth",
      sku: "BT-ECT-001",
      stockActuel: 450,
      seuilAlerte: 100,
      demandePrevue: 8,
      priorite: "moyenne"
    }
  ];

  const aiPredictions = [
    {
      product: "iPhone 15 Pro",
      stockActuel: 45,
      predictionJ7: 32,
      predictionJ14: 18,
      predictionJ30: 5,
      actionRecommandee: "Commande urgente +50 unités",
      confiance: 94
    },
    {
      product: "AirPods Pro 2",
      stockActuel: 120,
      predictionJ7: 105,
      predictionJ14: 85,
      predictionJ30: 45,
      actionRecommandee: "Réappro dans 15 jours",
      confiance: 87
    }
  ];

  const handlePredictiveOrder = () => {
    toast({
      title: "Commande Prédictive IA",
      description: "Génération automatique des commandes basée sur l'IA...",
    });
  };

  const handleOptimizeStock = () => {
    toast({
      title: "Optimisation Stock IA",
      description: "Réorganisation intelligente du stock en cours...",
    });
  };

  const getAlertColor = (priorite: string) => {
    switch (priorite) {
      case "critique": return "text-red-600";
      case "haute": return "text-orange-600";
      case "moyenne": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "rupture": return <Badge variant="destructive">Rupture</Badge>;
      case "faible": return <Badge variant="secondary">Stock Faible</Badge>;
      case "surstock": return <Badge variant="outline">Surstock</Badge>;
      default: return <Badge>Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Stock Ultra Pro
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground">Gestion intelligente du stock avec IA prédictive</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOptimizeStock}>
              <Cpu className="w-4 h-4 mr-2" />
              Optimisation IA
            </Button>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white" onClick={handlePredictiveOrder}>
              <Zap className="w-4 h-4 mr-2" />
              Commande Prédictive
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valeur Stock</p>
                  <p className="text-2xl font-bold">€58,240</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Articles Critiques</p>
                  <p className="text-2xl font-bold text-red-600">12</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rotation Stock</p>
                  <p className="text-2xl font-bold">4.2x</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Précision IA</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes Critiques */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alertes Stock Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertBadge(alert.type)}
                    <div>
                      <h4 className="font-semibold">{alert.product}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {alert.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getAlertColor(alert.priorite)}`}>
                      Stock: {alert.stockActuel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Demande prévue: {alert.demandePrevue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher produits, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="critique">Critique</SelectItem>
                    <SelectItem value="faible">Stock faible</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="surstock">Surstock</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres IA
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="predictions">Prédictions IA</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
            <TabsTrigger value="optimization">Optimisation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution de la Valeur Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stockEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="valeur" stroke="#8b5cf6" fill="#8b5cf6" />
                      <Area type="monotone" dataKey="prediction" stroke="#06b6d4" fill="none" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Volume vs Prédictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stockEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="prediction" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  Prédictions Stock IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Prév. 7j</TableHead>
                      <TableHead>Prév. 14j</TableHead>
                      <TableHead>Prév. 30j</TableHead>
                      <TableHead>Action Recommandée</TableHead>
                      <TableHead>Confiance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiPredictions.map((pred, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pred.product}</TableCell>
                        <TableCell>{pred.stockActuel}</TableCell>
                        <TableCell>{pred.predictionJ7}</TableCell>
                        <TableCell>{pred.predictionJ14}</TableCell>
                        <TableCell className={pred.predictionJ30 < 10 ? "text-red-600 font-semibold" : ""}>
                          {pred.predictionJ30}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pred.predictionJ30 < 10 ? "destructive" : "default"}>
                            {pred.actionRecommandee}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pred.confiance} className="w-16 h-2" />
                            <span className="text-sm">{pred.confiance}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Mouvements de Stock Intelligents
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analyse IA des mouvements de stock et optimisation automatique
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Recommandations d'Optimisation IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-green-600">✓ Réduction Coûts</h4>
                    <p className="text-sm text-muted-foreground">Optimisation des niveaux de stock : -15% de coûts de stockage</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600">→ Automatisation</h4>
                    <p className="text-sm text-muted-foreground">Commandes automatiques basées sur les prédictions IA</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600">⚡ Rotation Optimale</h4>
                    <p className="text-sm text-muted-foreground">Amélioration de la rotation : FIFO intelligent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}