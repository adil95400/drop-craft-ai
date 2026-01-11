import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Trash2, 
  ExternalLink, 
  ShoppingCart,
  Star,
  TrendingUp
} from 'lucide-react';
import { WinnerProduct } from './WinnerProductCard';

interface FavoritesPanelProps {
  favorites: WinnerProduct[];
  onRemoveFavorite: (id: string) => void;
  onImport: (product: WinnerProduct) => void;
}

export function FavoritesPanel({ favorites, onRemoveFavorite, onImport }: FavoritesPanelProps) {
  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="w-5 h-5 text-red-500" />
            Mes Favoris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun produit favori</p>
            <p className="text-sm mt-1">Cliquez sur ❤️ pour sauvegarder</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Mes Favoris
          </CardTitle>
          <Badge variant="secondary">{favorites.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4 pt-0">
            {favorites.map((product) => (
              <div 
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <img
                  src={product.image || '/placeholder.svg'}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {product.winnerScore}%
                    </Badge>
                    <span className="text-sm font-semibold text-green-600">
                      {product.price}€
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onImport(product)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={() => onRemoveFavorite(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
