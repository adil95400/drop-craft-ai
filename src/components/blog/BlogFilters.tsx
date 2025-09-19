import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X,
  TrendingUp,
  Calendar,
  Eye,
  Heart
} from 'lucide-react';

interface BlogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTag: string;
  onTagChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showTrendingOnly: boolean;
  onTrendingToggle: () => void;
  categories: string[];
  tags: string[];
}

export function BlogFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  showTrendingOnly,
  onTrendingToggle,
  categories,
  tags
}: BlogFiltersProps) {
  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onTagChange('all');
    onSortChange('date');
    if (showTrendingOnly) onTrendingToggle();
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedTag !== 'all' || sortBy !== 'date' || showTrendingOnly;

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher des articles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tag Filter */}
        <Select value={selectedTag} onValueChange={onTagChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tags</SelectItem>
            {tags.map(tag => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Plus récents
              </div>
            </SelectItem>
            <SelectItem value="views">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Plus vus
              </div>
            </SelectItem>
            <SelectItem value="likes">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Plus aimés
              </div>
            </SelectItem>
            <SelectItem value="trending">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tendances
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Trending Toggle */}
        <Button
          variant={showTrendingOnly ? "default" : "outline"}
          size="sm"
          onClick={onTrendingToggle}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Trending uniquement
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Recherche: "{searchTerm}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Catégorie: {selectedCategory}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onCategoryChange('all')}
              />
            </Badge>
          )}
          {selectedTag !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tag: {selectedTag}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onTagChange('all')}
              />
            </Badge>
          )}
          {showTrendingOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending uniquement
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={onTrendingToggle}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}