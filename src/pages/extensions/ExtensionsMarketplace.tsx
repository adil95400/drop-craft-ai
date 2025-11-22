import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Download } from 'lucide-react';

export default function ExtensionsMarketplace() {
  const extensions = [
    {
      id: 1,
      name: 'Advanced Analytics',
      description: 'Analyses approfondies de vos ventes',
      rating: 4.8,
      downloads: 1234,
      price: 'Gratuit'
    },
    {
      id: 2,
      name: 'SEO Optimizer',
      description: 'Optimisez automatiquement votre SEO',
      rating: 4.6,
      downloads: 892,
      price: '29€/mois'
    },
    {
      id: 3,
      name: 'Multi-Currency',
      description: 'Support de plusieurs devises',
      rating: 4.9,
      downloads: 2156,
      price: '19€/mois'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez les meilleures extensions pour votre boutique
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une extension..." className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {extensions.map((extension) => (
          <Card key={extension.id} className="p-6">
            <h3 className="font-semibold text-lg mb-2">{extension.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{extension.description}</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{extension.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Download className="h-4 w-4" />
                <span>{extension.downloads}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{extension.price}</span>
              <Button size="sm">Installer</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
