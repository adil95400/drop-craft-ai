/**
 * Actions rapides style Channable
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChannableQuickAction } from './types';
import { ArrowRight } from 'lucide-react';

interface ChannableQuickActionsProps {
  actions: ChannableQuickAction[];
  title?: string;
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
  columns?: 2 | 3 | 4;
}

export function ChannableQuickActions({
  actions,
  title,
  className,
  variant = 'grid',
  columns = 4
}: ChannableQuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4'
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {actions.map((action, index) =>
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}>

            











          </motion.div>
        )}
      </div>);

  }

  if (variant === 'list') {
    return (
      <Card className={className}>
        {title &&
        <CardHeader className="pb-3">
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
        }
        <CardContent className={cn(!title && "pt-6")}>
          <div className="space-y-2">
            {actions.map((action, index) =>
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                action.disabled ?
                "opacity-50 cursor-not-allowed" :
                "hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
              )}>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{action.label}</p>
                    {action.description &&
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  }
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>);

  }

  // Grid variant (default)
  return (
    <div className={className}>
      {title &&
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      }
      <div className={cn("grid gap-4", gridCols[columns])}>
        {actions.map((action, index) =>
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          whileHover={!action.disabled ? { y: -2 } : undefined}>

            <button
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "w-full flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-200",
              action.disabled ?
              "opacity-50 cursor-not-allowed bg-muted/30" :
              "hover:bg-muted/50 hover:border-primary/30 hover:shadow-lg cursor-pointer"
            )}>

              <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center",
              action.variant === 'primary' ?
              "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" :
              "bg-primary/10"
            )}>
                <action.icon className={cn(
                "h-7 w-7",
                action.variant !== 'primary' && "text-primary"
              )} />
              </div>
              <div className="text-center">
                <p className="font-medium">{action.label}</p>
                {action.description &&
              <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              }
              </div>
            </button>
          </motion.div>
        )}
      </div>
    </div>);

}