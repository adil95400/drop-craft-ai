import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';

interface Feature {
  name: string;
  starter: boolean | 'limited';
  pro: boolean | 'limited';
  enterprise: boolean | 'limited';
}

const features: Feature[] = [
  { name: 'Produits', starter: 'limited', pro: true, enterprise: true },
  { name: 'Boutiques connectées', starter: 'limited', pro: 'limited', enterprise: true },
  { name: 'Import multi-fournisseurs', starter: false, pro: true, enterprise: true },
  { name: 'Optimisation IA prix', starter: false, pro: true, enterprise: true },
  { name: 'Optimisation IA contenu', starter: false, pro: true, enterprise: true },
  { name: 'Analytics avancés', starter: false, pro: true, enterprise: true },
  { name: 'Support prioritaire', starter: false, pro: true, enterprise: true },
  { name: 'API complète', starter: false, pro: true, enterprise: true },
  { name: 'Automatisation commandes', starter: false, pro: true, enterprise: true },
  { name: 'Multi-marketplace sync', starter: false, pro: true, enterprise: true },
  { name: 'White label', starter: false, pro: false, enterprise: true },
  { name: 'Multi-tenant', starter: false, pro: false, enterprise: true },
  { name: 'Compte manager dédié', starter: false, pro: false, enterprise: true },
  { name: 'SLA 99.9%', starter: false, pro: false, enterprise: true },
  { name: 'Développements sur mesure', starter: false, pro: false, enterprise: true },
];

function FeatureIcon({ value }: { value: boolean | 'limited' }) {
  if (value === true) {
    return <CheckCircle2 className="h-5 w-5 text-success" />;
  }
  if (value === 'limited') {
    return <Minus className="h-5 w-5 text-warning" />;
  }
  return <XCircle className="h-5 w-5 text-muted-foreground/30" />;
}

export function ComparisonTable() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Comparaison détaillée des plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Fonctionnalité</th>
                <th className="text-center py-4 px-4">
                  <div className="space-y-1">
                    <div className="font-semibold">Starter</div>
                    <Badge variant="outline" className="text-xs">Gratuit</Badge>
                  </div>
                </th>
                <th className="text-center py-4 px-4">
                  <div className="space-y-1">
                    <div className="font-semibold">Pro</div>
                    <Badge className="text-xs bg-primary">49€/mois</Badge>
                  </div>
                </th>
                <th className="text-center py-4 px-4">
                  <div className="space-y-1">
                    <div className="font-semibold">Enterprise</div>
                    <Badge variant="secondary" className="text-xs">Sur mesure</Badge>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-secondary/20 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{feature.name}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <FeatureIcon value={feature.starter} />
                    </div>
                    {feature.starter === 'limited' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Limité
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <FeatureIcon value={feature.pro} />
                    </div>
                    {feature.pro === 'limited' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Jusqu'à 5
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <FeatureIcon value={feature.enterprise} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Inclus</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-warning" />
              <span>Limité</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground/30" />
              <span>Non inclus</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
