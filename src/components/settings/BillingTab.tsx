import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Crown, Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";

const plans = [
  {
    name: "Starter",
    price: 29,
    features: ["1000 produits", "Suivi basique", "Support email"],
    icon: "🚀"
  },
  {
    name: "Professional", 
    price: 79,
    features: ["Produits illimités", "IA avancée", "Support prioritaire", "API"],
    current: true,
    popular: true,
    icon: "⭐"
  },
  {
    name: "Enterprise",
    price: 199,
    features: ["Tout inclus", "White-label", "Support dédié", "Multi-utilisateurs"],
    icon: "👑"
  }
];

const invoices = [
  { id: 1, date: "01/02/2024", amount: 79, plan: "Professional", status: "paid" },
  { id: 2, date: "01/01/2024", amount: 79, plan: "Professional", status: "paid" },
  { id: 3, date: "01/12/2023", amount: 79, plan: "Professional", status: "paid" },
];

export function BillingTab() {
  const { isAdmin } = useEnhancedAuth();

  const handleUpgrade = (planName: string, price: number) => {
    if (!isAdmin) {
      toast.info(`Simulation: Mise à niveau vers ${planName} (${price}€/mois)`);
      return;
    }
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: `Mise à niveau vers ${planName}...`,
        success: `Plan ${planName} activé`,
        error: 'Erreur lors de la mise à niveau'
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Plan Professional</CardTitle>
                <CardDescription>Votre abonnement actuel</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">79€</div>
              <div className="text-sm text-muted-foreground">/mois</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {plans.find(p => p.current)?.features.map((feature, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Changer de plan
          </CardTitle>
          <CardDescription>Comparez et choisissez le plan adapté à vos besoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                  plan.current 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80">
                      Populaire
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">{plan.icon}</div>
                  <h5 className="font-semibold text-lg">{plan.name}</h5>
                  {plan.current && <Badge variant="secondary" className="mt-1">Actuel</Badge>}
                </div>
                
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {!plan.current && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleUpgrade(plan.name, plan.price)}
                  >
                    Choisir ce plan
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <CardTitle className="text-base">Historique des paiements</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Plan {invoice.plan}</div>
                    <div className="text-sm text-muted-foreground">{invoice.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{invoice.amount}€</div>
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Payé
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
