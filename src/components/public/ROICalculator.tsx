import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';

export function ROICalculator() {
  const [monthlyOrders, setMonthlyOrders] = useState(500);
  const [avgOrderValue, setAvgOrderValue] = useState(50);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(30);

  // Calculations
  const monthlyRevenue = monthlyOrders * avgOrderValue;
  const timesSaved = hoursPerWeek * 4.33; // hours per month
  const moneySaved = timesSaved * hourlyRate;
  const conversionIncrease = monthlyRevenue * 0.32; // 32% average increase
  const totalMonthlyGain = moneySaved + conversionIncrease;
  const yearlyGain = totalMonthlyGain * 12;
  const planCost = 49; // Pro plan
  const roi = ((totalMonthlyGain - planCost) / planCost) * 100;

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Calculateur ROI</CardTitle>
            <CardDescription>Estimez vos économies avec ShopOpti</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Commandes par mois</Label>
            <Input
              type="number"
              value={monthlyOrders}
              onChange={(e) => setMonthlyOrders(Number(e.target.value))}
              className="text-lg"
            />
            <Slider
              value={[monthlyOrders]}
              onValueChange={(v) => setMonthlyOrders(v[0])}
              max={10000}
              step={100}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <Label>Panier moyen (€)</Label>
            <Input
              type="number"
              value={avgOrderValue}
              onChange={(e) => setAvgOrderValue(Number(e.target.value))}
              className="text-lg"
            />
            <Slider
              value={[avgOrderValue]}
              onValueChange={(v) => setAvgOrderValue(v[0])}
              max={500}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <Label>Heures de travail / semaine</Label>
            <Input
              type="number"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="text-lg"
            />
            <Slider
              value={[hoursPerWeek]}
              onValueChange={(v) => setHoursPerWeek(v[0])}
              max={80}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <Label>Coût horaire (€)</Label>
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="text-lg"
            />
            <Slider
              value={[hourlyRate]}
              onValueChange={(v) => setHourlyRate(v[0])}
              max={200}
              step={5}
              className="mt-2"
            />
          </div>
        </div>

        {/* Results */}
        <div className="pt-6 border-t space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Temps économisé</span>
              </div>
              <div className="text-2xl font-bold text-primary">{timesSaved.toFixed(0)}h/mois</div>
              <div className="text-sm text-muted-foreground mt-1">soit {moneySaved.toFixed(0)}€</div>
            </div>

            <div className="p-4 rounded-lg bg-success/10 border border-success/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-muted-foreground">Revenue boost</span>
              </div>
              <div className="text-2xl font-bold text-success">+{conversionIncrease.toFixed(0)}€/mois</div>
              <div className="text-sm text-muted-foreground mt-1">+32% en moyenne</div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-white animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">ROI mensuel</span>
              </div>
              <div className="text-2xl font-bold">{roi.toFixed(0)}%</div>
              <div className="text-sm opacity-90 mt-1">+{totalMonthlyGain.toFixed(0)}€/mois</div>
            </div>
          </div>

          <div className="p-4 bg-secondary/50 rounded-lg text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground">
              Économies annuelles estimées
            </Badge>
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {yearlyGain.toFixed(0)}€
            </div>
            <p className="text-sm text-muted-foreground">
              Basé sur nos statistiques moyennes clients
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
