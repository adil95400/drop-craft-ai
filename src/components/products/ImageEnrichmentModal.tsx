import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wand2, Search, Globe } from 'lucide-react';

interface ImageEnrichmentModalProps {
  open: boolean;
  onClose: () => void;
  onEnrich: (method: 'scrape' | 'ai' | 'search') => void;
  selectedCount: number;
  hasSourceUrls: number;
}

export function ImageEnrichmentModal({ 
  open, 
  onClose, 
  onEnrich, 
  selectedCount,
  hasSourceUrls 
}: ImageEnrichmentModalProps) {
  const methods = [
    {
      id: 'scrape' as const,
      title: 'Re-scraper depuis la source',
      description: 'Récupérer toutes les images disponibles depuis l\'URL source du produit (Amazon, Shopify, etc.)',
      icon: Globe,
      recommended: hasSourceUrls > 0,
      available: hasSourceUrls,
      badge: hasSourceUrls > 0 ? `${hasSourceUrls} avec URL` : 'Aucune URL'
    },
    {
      id: 'ai' as const,
      title: 'Génération IA',
      description: 'Créer des images supplémentaires basées sur le produit existant avec l\'IA générative',
      icon: Wand2,
      recommended: false,
      available: selectedCount,
      badge: 'Lovable AI'
    },
    {
      id: 'search' as const,
      title: 'Recherche d\'images similaires',
      description: 'Trouver des images similaires sur le web à partir de l\'image existante',
      icon: Search,
      recommended: false,
      available: selectedCount,
      badge: 'Bientôt'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enrichir les images</DialogTitle>
          <DialogDescription>
            Choisissez une méthode pour ajouter des images aux {selectedCount} produits sélectionnés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {methods.map(method => (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                method.id === 'search' ? 'opacity-50 cursor-not-allowed' : ''
              } ${method.recommended ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => method.id !== 'search' && onEnrich(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${method.recommended ? 'bg-primary/10' : 'bg-muted'}`}>
                    <method.icon className={`h-6 w-6 ${method.recommended ? 'text-primary' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.title}</span>
                      {method.recommended && <Badge>Recommandé</Badge>}
                      <Badge variant="outline">{method.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
