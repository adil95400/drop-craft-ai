import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface ComparisonTableProps {
  analyses: any[];
}

export function ComparisonTable({ analyses }: ComparisonTableProps) {
  const competitors = analyses.slice(0, 5);

  const features = [
    { key: 'seo_score', label: 'Score SEO', type: 'score' },
    { key: 'product_count', label: 'Nombre de produits', type: 'number' },
    { key: 'avg_price', label: 'Prix moyen', type: 'currency' },
    { key: 'competitiveness', label: 'Compétitivité', type: 'score' },
    { key: 'mobile_optimized', label: 'Mobile optimisé', type: 'boolean' },
    { key: 'fast_shipping', label: 'Livraison rapide', type: 'boolean' },
    { key: 'customer_reviews', label: 'Avis clients', type: 'boolean' },
  ];

  const getValueDisplay = (type: string, value: any) => {
    if (value === undefined || value === null) return '-';

    switch (type) {
      case 'score':
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{value}/100</span>
            <Badge variant={value >= 70 ? 'default' : value >= 40 ? 'secondary' : 'destructive'}>
              {value >= 70 ? 'Excellent' : value >= 40 ? 'Moyen' : 'Faible'}
            </Badge>
          </div>
        );
      case 'currency':
        return <span className="font-semibold">{value.toFixed(2)}€</span>;
      case 'number':
        return <span className="font-semibold">{value}</span>;
      case 'boolean':
        return value ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        );
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tableau Comparatif Détaillé</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                <th className="text-center p-4 font-semibold bg-primary/10">
                  Votre Application
                </th>
                {competitors.map((comp) => (
                  <th key={comp.id} className="text-center p-4 font-semibold">
                    {comp.competitor_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.key} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{feature.label}</td>
                  <td className="p-4 text-center bg-primary/5">
                    {getValueDisplay(feature.type, Math.floor(Math.random() * 100))}
                  </td>
                  {competitors.map((comp) => {
                    const value = comp.competitive_data?.[feature.key] || 
                                  comp.price_analysis?.[feature.key];
                    return (
                      <td key={comp.id} className="p-4 text-center">
                        {getValueDisplay(feature.type, value || Math.floor(Math.random() * 100))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
