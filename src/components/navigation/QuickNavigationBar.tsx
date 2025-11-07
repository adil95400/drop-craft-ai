import React, { useState, useCallback } from 'react';
import { Search, Command, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function QuickNavigationBar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { searchModules, navigationGroups, canAccessModule } = useNavigation();
  const { currentPlan } = useUnifiedPlan();

  // Raccourcis clavier
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
    setSearchQuery('');
  }, [navigate]);

  const searchResults = searchQuery ? searchModules(searchQuery) : [];

  const getPlanBadge = (minPlan: string) => {
    if (minPlan === 'ultra_pro') {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
          <Crown className="w-3 h-3 mr-1" />
          ULTRA
        </Badge>
      );
    }
    if (minPlan === 'pro') {
      return (
        <Badge className="bg-purple-500 text-white text-xs">
          <Zap className="w-3 h-3 mr-1" />
          PRO
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64',
          'hover:bg-accent hover:text-accent-foreground transition-colors'
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Rechercher un module...</span>
        <span className="inline-flex lg:hidden">Rechercher...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Rechercher un module, fonctionnalité..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          {searchQuery && searchResults.length > 0 ? (
            <CommandGroup heading="Résultats de recherche">
              {searchResults.map((module) => {
                const accessible = canAccessModule(module.id);
                return (
                  <CommandItem
                    key={module.id}
                    onSelect={() => accessible && handleSelect(module.route)}
                    disabled={!accessible}
                    className={cn(!accessible && 'opacity-50 cursor-not-allowed')}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{module.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {module.description}
                        </span>
                      </div>
                      {getPlanBadge(module.minPlan)}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            navigationGroups.map((group, idx) => (
              <React.Fragment key={group.category.id}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.category.name}>
                  {group.modules.slice(0, 5).map((module) => {
                    const accessible = canAccessModule(module.id);
                    return (
                      <CommandItem
                        key={module.id}
                        onSelect={() => accessible && handleSelect(module.route)}
                        disabled={!accessible}
                        className={cn(!accessible && 'opacity-50 cursor-not-allowed')}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{module.name}</span>
                          {getPlanBadge(module.minPlan)}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
