/**
 * ExtensionQuickImportCard - Composant React pour afficher le mode Quick Import
 * Reflète les fonctionnalités de l'extension Chrome dans le SaaS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings, TrendingUp, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickImportStats {
  today: number;
  thisWeek: number;
  total: number;
  avgQualityScore: number;
}

interface ExtensionQuickImportCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  stats?: QuickImportStats;
  className?: string;
}

export const ExtensionQuickImportCard: React.FC<ExtensionQuickImportCardProps> = ({
  enabled,
  onToggle,
  stats = { today: 0, thisWeek: 0, total: 0, avgQualityScore: 0 },
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        enabled 
          ? 'border-primary/50 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5' 
          : 'border-border/50',
        className
      )}>
        {/* Gradient overlay when enabled */}
        {enabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        )}

        <CardContent className="p-4 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl transition-all duration-300',
                enabled 
                  ? 'bg-gradient-to-br from-primary to-primary-glow text-white shadow-lg shadow-primary/30' 
                  : 'bg-muted text-muted-foreground'
              )}>
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Mode Rapide
                  {enabled && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/20">
                      Actif
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Import 1-clic sans confirmation
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Stats when enabled */}
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Clock className="h-3 w-3" />
                    <span className="text-lg font-bold">{stats.today}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Aujourd'hui
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Star className="h-3 w-3" />
                    <span className="text-lg font-bold">{stats.avgQualityScore}%</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Score moyen
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-lg font-bold">{stats.total}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Description when disabled */}
          {!enabled && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
              <p className="flex items-start gap-2">
                <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Activez le mode rapide pour importer des produits en 1 clic, 
                  sans passer par l'écran de confirmation. Idéal pour les utilisateurs expérimentés.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
