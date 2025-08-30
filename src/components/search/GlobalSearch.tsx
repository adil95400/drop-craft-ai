import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, History, TrendingUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'order' | 'customer' | 'campaign' | 'automation';
  url?: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

interface GlobalSearchProps {
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max',
    description: 'Smartphone Apple dernière génération',
    type: 'product',
    relevanceScore: 95,
    metadata: { price: 1199, stock: 45 }
  },
  {
    id: '2', 
    title: 'Commande #CMD-2024-001',
    description: 'Commande client Marie Dupont - 3 articles',
    type: 'order',
    relevanceScore: 88,
    metadata: { total: 2400, status: 'delivered' }
  },
  {
    id: '3',
    title: 'Campagne Black Friday',
    description: 'Campagne marketing automatisée',
    type: 'campaign', 
    relevanceScore: 82,
    metadata: { conversion: 4.5, budget: 5000 }
  }
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Rechercher partout...",
  onResultSelect,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    
    return mockSearchResults
      .filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.description.toLowerCase().includes(query.toLowerCase());
        const matchesTab = activeTab === 'all' || result.type === activeTab;
        return matchesQuery && matchesTab;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [query, activeTab]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setIsOpen(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product': return '📦';
      case 'order': return '📋';
      case 'customer': return '👤';
      case 'campaign': return '🎯';
      case 'automation': return '⚡';
      default: return '📄';
    }
  };

  const getResultBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'order': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-purple-100 text-purple-800';
      case 'campaign': return 'bg-orange-100 text-orange-800';
      case 'automation': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full max-w-sm justify-start text-left font-normal",
            "hover:bg-accent/50 transition-colors",
            className
          )}
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{placeholder}</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche globale
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="product">Produits</TabsTrigger>
            <TabsTrigger value="order">Commandes</TabsTrigger>
            <TabsTrigger value="customer">Clients</TabsTrigger>
            <TabsTrigger value="campaign">Campagnes</TabsTrigger>
            <TabsTrigger value="automation">Automatisations</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="max-h-96 overflow-y-auto">
          {!query ? (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {searchHistory.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Recherches récentes
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="h-auto p-1 text-xs"
                      >
                        Effacer
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {searchHistory.map((item, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start h-auto p-2"
                          onClick={() => handleSearch(item)}
                        >
                          <Search className="mr-2 h-3 w-3 text-muted-foreground" />
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recherches populaires
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['iPhone', 'Commandes en cours', 'Clients VIP', 'Campagne été'].map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSearch(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-3">
                    {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} trouvé{filteredResults.length > 1 ? 's' : ''}
                  </div>
                  {filteredResults.map((result) => (
                    <Card
                      key={result.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-lg">{getResultIcon(result.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{result.title}</h4>
                                <Badge 
                                  variant="secondary"
                                  className={cn("text-xs", getResultBadgeColor(result.type))}
                                >
                                  {result.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                              {result.metadata && (
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  {Object.entries(result.metadata).map(([key, value]) => (
                                    <span key={key}>
                                      {key}: <span className="font-medium">{value}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.relevanceScore}% pertinent
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Aucun résultat trouvé</h3>
                  <p className="text-sm text-muted-foreground">
                    Essayez avec d'autres mots-clés
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};