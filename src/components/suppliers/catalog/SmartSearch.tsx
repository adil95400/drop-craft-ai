/**
 * SmartSearch - Recherche intelligente avec suggestions
 * Autocomplétion, historique et suggestions contextuelles
 */

import { memo, useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
  Truck,
  Tag,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from './CatalogProductCard';

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  products: CatalogProduct[];
  suppliers: { id: string; name: string }[];
  categories: string[];
  onSelectProduct?: (product: CatalogProduct) => void;
  onFilterByCategory?: (category: string) => void;
  onFilterBySupplier?: (supplierId: string) => void;
  placeholder?: string;
  className?: string;
}

const MAX_HISTORY = 5;
const STORAGE_KEY = 'catalog-search-history';

export const SmartSearch = memo(function SmartSearch({
  value,
  onChange,
  products,
  suppliers,
  categories,
  onSelectProduct,
  onFilterByCategory,
  onFilterBySupplier,
  placeholder = "Rechercher par nom, SKU, description...",
  className,
}: SmartSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history');
      }
    }
  }, []);

  // Save to history on search
  const addToHistory = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, MAX_HISTORY);
    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // Suggestions based on current input
  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return { products: [], categories: [], suppliers: [] };

    const searchLower = value.toLowerCase();
    
    const matchingProducts = products
      .filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, 5);

    const matchingCategories = categories
      .filter(c => c !== 'all' && c.toLowerCase().includes(searchLower))
      .slice(0, 3);

    const matchingSuppliers = suppliers
      .filter(s => s.name.toLowerCase().includes(searchLower))
      .slice(0, 3);

    return {
      products: matchingProducts,
      categories: matchingCategories,
      suppliers: matchingSuppliers,
    };
  }, [value, products, categories, suppliers]);

  // Trending searches (products with high scores)
  const trendingProducts = useMemo(() => 
    products
      .filter(p => p.is_trending || p.ai_score > 0.85)
      .slice(0, 5),
    [products]
  );

  const handleSelect = (term: string) => {
    onChange(term);
    addToHistory(term);
    setOpen(false);
  };

  const handleProductSelect = (product: CatalogProduct) => {
    addToHistory(product.name);
    setOpen(false);
    onSelectProduct?.(product);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasResults = suggestions.products.length > 0 || 
                      suggestions.categories.length > 0 || 
                      suggestions.suppliers.length > 0;

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setOpen(true)}
              className="pl-10 pr-10"
            />
            {value && (
              <button
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[400px] p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              {/* Search Results */}
              {value && hasResults && (
                <>
                  {suggestions.products.length > 0 && (
                    <CommandGroup heading="Produits">
                      {suggestions.products.map((product) => (
                        <CommandItem
                          key={product.id}
                          onSelect={() => handleProductSelect(product)}
                          className="flex items-center gap-3 py-2"
                        >
                          <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium">{Math.round(product.ai_score * 100)}%</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {suggestions.categories.length > 0 && (
                    <CommandGroup heading="Catégories">
                      {suggestions.categories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => {
                            onFilterByCategory?.(category);
                            setOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{category}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {suggestions.suppliers.length > 0 && (
                    <CommandGroup heading="Fournisseurs">
                      {suggestions.suppliers.map((supplier) => (
                        <CommandItem
                          key={supplier.id}
                          onSelect={() => {
                            onFilterBySupplier?.(supplier.id);
                            setOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}

              {/* Empty state when searching */}
              {value && !hasResults && (
                <CommandEmpty>
                  <div className="py-6 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun résultat pour "{value}"</p>
                  </div>
                </CommandEmpty>
              )}

              {/* When not searching, show history and trending */}
              {!value && (
                <>
                  {searchHistory.length > 0 && (
                    <CommandGroup heading={
                      <div className="flex items-center justify-between">
                        <span>Recherches récentes</span>
                        <button
                          onClick={handleClearHistory}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Effacer
                        </button>
                      </div>
                    }>
                      {searchHistory.map((term, idx) => (
                        <CommandItem
                          key={idx}
                          onSelect={() => handleSelect(term)}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{term}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {trendingProducts.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Produits tendance">
                        {trendingProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => handleProductSelect(product)}
                            className="flex items-center gap-3 py-2"
                          >
                            <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-purple-500" />
                                <span className="text-xs text-muted-foreground">Tendance</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {product.retail_price.toFixed(2)}€
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});
