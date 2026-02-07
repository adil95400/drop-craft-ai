import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  MoreHorizontal,
  ExternalLink,
  Heart,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UnifiedProduct as Product } from "@/hooks/unified";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductActionButtonsProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onViewAnalytics?: (productId: string) => void;
  onView?: (product: Product) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

export const ProductActionButtons = ({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onViewAnalytics,
  onView,
  isFavorite: externalFavorite,
  compact = false
}: ProductActionButtonsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local favorite state
  const [localFavorite, setLocalFavorite] = useState(() => {
    if (externalFavorite !== undefined) return externalFavorite;
    const favorites = JSON.parse(localStorage.getItem('product-favorites') || '[]');
    return favorites.includes(product.id);
  });
  
  const isFavorite = externalFavorite ?? localFavorite;

  const handleViewProduct = () => {
    if (onView) {
      onView(product);
    } else {
      toast({
        title: "Détails du produit",
        description: `${product.name} - ${product.price}€`,
      });
    }
  };

  const handleEditProduct = () => {
    if (onEdit) {
      onEdit(product);
    } else {
      toast({
        title: "Modification",
        description: `Modification du produit ${product.name}`,
      });
    }
  };

  // Real delete handler with confirmation
  const handleDeleteProduct = async () => {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`);
    if (!confirmDelete) return;
    
    if (onDelete) {
      onDelete(product.id);
    } else {
      // Real delete
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast({
          title: "Produit supprimé",
          description: `${product.name} a été supprimé avec succès`,
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
      }
    }
  };

  // Real duplicate handler
  const handleDuplicateProduct = async () => {
    if (onDuplicate) {
      onDuplicate(product);
      toast({
        title: "Produit dupliqué",
        description: `Une copie de ${product.name} a été créée`,
      });
      return;
    }
    
    // Real duplicate
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('products').insert([{
        user_id: user.id,
        title: product.name,
        name: `${product.name} (copie)`,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        sku: product.sku ? `${product.sku}-COPY` : null,
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
        status: 'draft'
      }]);
      
      if (error) throw error;
      toast({
        title: "Produit dupliqué",
        description: `Une copie de ${product.name} a été créée`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de dupliquer", variant: "destructive" });
    }
  };

  const handleExportProduct = () => {
    // Exporter les données du produit en CSV/JSON
    const productData = {
      nom: product.name,
      description: product.description,
      prix: product.price,
      prix_achat: product.cost_price,
      stock: product.stock_quantity,
      sku: product.sku,
      categorie: product.category,
      statut: product.status,
      marge: product.profit_margin
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${product.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: "Export réussi",
      description: `Les données de ${product.name} ont été exportées`,
    });
  };

  // Local favorite toggle
  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    } else {
      // Local storage fallback
      const favorites = JSON.parse(localStorage.getItem('product-favorites') || '[]');
      const newFavorites = isFavorite 
        ? favorites.filter((id: string) => id !== product.id)
        : [...favorites, product.id];
      localStorage.setItem('product-favorites', JSON.stringify(newFavorites));
      setLocalFavorite(!isFavorite);
    }
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: `${product.name} ${isFavorite ? 'retiré des' : 'ajouté aux'} favoris`,
    });
  };

  const handleViewAnalytics = () => {
    if (onViewAnalytics) {
      onViewAnalytics(product.id);
    } else {
      // Navigate to analytics page
      window.location.href = `/products?id=${product.id}&tab=analytics`;
    }
    toast({
      title: "Analytics",
      description: `Ouverture des analytics pour ${product.name}`,
    });
  };

  const handleShareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Découvrez ce produit: ${product.name} - ${product.price}€`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback si partage natif échoue
        navigator.clipboard.writeText(`${product.name} - ${product.price}€ - ${window.location.href}`);
        toast({
          title: "Lien copié",
          description: "Le lien du produit a été copié dans le presse-papier",
        });
      }
    } else {
      // Fallback pour navigateurs sans support native share
      navigator.clipboard.writeText(`${product.name} - ${product.price}€ - ${window.location.href}`);
      toast({
        title: "Lien copié",
        description: "Le lien du produit a été copié dans le presse-papier",
      });
    }
  };

  const getStockBadge = () => {
    const stock = product.stock_quantity || 0;
    if (stock > 50) return <Badge className="bg-green-500">Stock OK</Badge>;
    if (stock > 10) return <Badge className="bg-orange-500">Stock limité</Badge>;
    return <Badge className="bg-red-500">Stock faible</Badge>;
  };

  const getProfitBadge = () => {
    const margin = product.profit_margin || 0;
    if (margin > 50) return <Badge className="bg-green-500">+{margin}%</Badge>;
    if (margin > 30) return <Badge className="bg-blue-500">+{margin}%</Badge>;
    return <Badge variant="outline">+{margin}%</Badge>;
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewProduct}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleEditProduct}>
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicateProduct}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleFavorite}>
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewAnalytics}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportProduct}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareProduct}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteProduct} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {getStockBadge()}
        {getProfitBadge()}
        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
          {product.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={handleViewProduct}
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir
        </Button>
        
        <Button
          onClick={handleEditProduct}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Gérer
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicateProduct}
          title="Dupliquer le produit"
        >
          <Copy className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleFavorite}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAnalytics}
          title="Voir les analytics"
        >
          <TrendingUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Utility actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportProduct}
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareProduct}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Partager
        </Button>
      </div>

      {/* Danger zone */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDeleteProduct}
        className="w-full"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </Button>
    </div>
  );
};