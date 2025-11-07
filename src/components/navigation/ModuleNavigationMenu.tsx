import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ModuleNavigationMenu() {
  const { navigationGroups, canAccessModule, isActiveRoute } = useNavigation();

  // Afficher seulement les 4 premières catégories avec modules accessibles
  const topCategories = navigationGroups
    .filter(group => group.accessibleCount > 0)
    .slice(0, 4);

  if (topCategories.length === 0) return null;

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {topCategories.map((group) => (
          <NavigationMenuItem key={group.category.id}>
            <NavigationMenuTrigger className="h-9 text-sm">
              {group.category.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {group.accessibleCount}
              </Badge>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {group.modules.map((module) => {
                  const accessible = canAccessModule(module.id);
                  const active = isActiveRoute(module.route);

                  return (
                    <Link
                      key={module.id}
                      to={accessible ? module.route : '#'}
                      className={cn(
                        'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                        accessible
                          ? active
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                          : 'opacity-50 cursor-not-allowed',
                        'group'
                      )}
                      onClick={(e) => !accessible && e.preventDefault()}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium leading-none group-hover:underline">
                          {module.name}
                        </div>
                        {module.minPlan !== 'standard' && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              module.minPlan === 'ultra_pro'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none'
                                : 'bg-purple-500 text-white border-none'
                            )}
                          >
                            {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {module.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
