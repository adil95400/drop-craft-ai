import React, { useMemo } from 'react';
import { Star, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '@/stores/favoritesStore';
import { useModules } from '@/hooks/useModules';
import { MODULE_REGISTRY } from '@/config/modules';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FavoritesQuickAccessProps {
  className?: string;
  maxDisplay?: number;
  compact?: boolean;
}

export function FavoritesQuickAccess({
  className,
  maxDisplay = 6,
  compact = false
}: FavoritesQuickAccessProps) {
  const { favorites } = useFavorites();
  const { canAccess } = useModules();
  const navigate = useNavigate();

  const favoriteModules = useMemo(() => {
    return favorites
      .map(f => MODULE_REGISTRY[f.moduleId])
      .filter(m => m && canAccess(m.id))
      .slice(0, maxDisplay);
  }, [favorites, canAccess, maxDisplay]);

  if (favoriteModules.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favoris
          </CardTitle>
          <CardDescription className="text-xs">
            Aucun favori pour le moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Cliquez sur l'étoile ⭐ à côté des modules pour les ajouter en favoris.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn('space-y-1', className)}>
        {favoriteModules.map((module) => (
          <Button
            key={module.id}
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
            onClick={() => navigate(module.route)}
          >
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="truncate text-sm">{module.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Accès Rapide
            <Badge variant="secondary" className="text-xs">
              {favoriteModules.length}
            </Badge>
          </CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {favoriteModules.map((module) => (
            <Link
              key={module.id}
              to={module.route}
              className="group relative overflow-hidden rounded-lg border bg-card p-3 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <SettingsIcon className="h-4 w-4 text-primary" />
                  </div>
                  {module.minPlan !== 'standard' && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs h-5 px-1.5',
                        module.minPlan === 'ultra_pro'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-purple-500 text-white'
                      )}
                    >
                      {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {module.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
