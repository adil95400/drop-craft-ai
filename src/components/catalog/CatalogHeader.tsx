import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Star, Bell, Zap, Target } from "lucide-react";
import { useState } from "react";

interface CatalogHeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

export const CatalogHeader = ({ onSearch, onFilterChange }: CatalogHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");

  const handleAiSearch = () => {
    if (aiQuery) {
      onSearch(aiQuery);
      setAiQuery("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Catalogue Mondial
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            275,000+ produits de fournisseurs premium • Recherche IA • Détection Winners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Alertes (5)
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                <Zap className="w-4 h-4 mr-2" />
                Recherche IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recherche IA Avancée</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Décrivez ce que vous cherchez... Ex: 'Produits tendance pour l'été avec marge >40% et livraison Europe'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleAiSearch} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Analyser avec IA
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher produits, marques, niches..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtres Avancés
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <Select defaultValue="all" onValueChange={(value) => onFilterChange({ supplier: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Fournisseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous fournisseurs</SelectItem>
              <SelectItem value="bigbuy">BigBuy</SelectItem>
              <SelectItem value="vidaxl">VidaXL</SelectItem>
              <SelectItem value="printful">Printful</SelectItem>
              <SelectItem value="aliexpress">AliExpress</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={(value) => onFilterChange({ category: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="electronics">Électronique</SelectItem>
              <SelectItem value="fashion">Mode & Beauté</SelectItem>
              <SelectItem value="home">Maison & Jardin</SelectItem>
              <SelectItem value="sports">Sport & Loisirs</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={(value) => onFilterChange({ price: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Prix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous prix</SelectItem>
              <SelectItem value="0-25">0€ - 25€</SelectItem>
              <SelectItem value="25-50">25€ - 50€</SelectItem>
              <SelectItem value="50-100">50€ - 100€</SelectItem>
              <SelectItem value="100+">100€+</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={(value) => onFilterChange({ margin: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Marge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marges</SelectItem>
              <SelectItem value="30+">30%+</SelectItem>
              <SelectItem value="40+">40%+</SelectItem>
              <SelectItem value="50+">50%+</SelectItem>
              <SelectItem value="60+">60%+</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="rating" onValueChange={(value) => onFilterChange({ sort: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Mieux notés</SelectItem>
              <SelectItem value="bestseller">Best sellers</SelectItem>
              <SelectItem value="margin">Marge élevée</SelectItem>
              <SelectItem value="trending">Tendance</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          <Star className="w-3 h-3 mr-1" />
          Winners détectés
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          Stock Europe
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          Livraison rapide
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          Marge 40%+
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          Nouveautés
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          Best sellers
        </Badge>
      </div>
    </div>
  );
};