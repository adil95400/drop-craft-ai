/**
 * Premium Platform Card - Channable Design
 * Glassmorphism card for platform selection
 */

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformLogo } from '@/components/ui/platform-logo';
import { Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  category: 'store' | 'marketplace' | 'advertising';
  description: string;
  longDescription: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    required: boolean;
    secret?: boolean;
    multiline?: boolean;
  }>;
  helpUrl: string;
  features: string[];
  popular?: boolean;
}

interface PlatformCardProps {
  platform: PlatformConfig;
  compact?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export function PlatformCard({ platform, compact, selected, onClick }: PlatformCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}>

      <Card
        className={cn(
          "cursor-pointer transition-all group overflow-hidden relative",
          "backdrop-blur-xl bg-card/80 border-border/50",
          "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40",
          compact && "hover:scale-[1.02]",
          selected && "ring-2 ring-primary border-primary/50 shadow-lg shadow-primary/20"
        )}
        onClick={onClick}>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Selected indicator */}
        {selected &&
        <div className="absolute top-2 right-2 z-10">
            <div className="p-1 rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="h-3 w-3" />
            </div>
          </div>
        }
        
        <CardContent className={cn("p-4 relative z-[1]", compact && "p-3")}>
          <div className={cn(
            "flex items-center gap-3",
            !compact && "flex-col text-center sm:flex-row sm:text-left"
          )}>
            {/* Platform Logo with glow effect */}
            <div className={cn(
              "rounded-xl bg-white shadow-sm flex items-center justify-center p-2 group-hover:shadow-lg transition-all relative",
              compact ? "w-11 h-11" : "w-14 h-14"
            )}>
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-md"
                style={{ backgroundColor: platform.color }} />

              <PlatformLogo platform={platform.id} size={compact ? "md" : "lg"} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                





                {platform.popular && !compact







                }
              </div>
              {!compact &&
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {platform.description}
                </p>
              }
            </div>
            
            {!compact &&
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
            }
          </div>
          
          {/* Features preview for non-compact */}
          {!compact && platform.features.length > 0 &&
          <div className="flex flex-wrap gap-1 mt-3 justify-center sm:justify-start">
              {platform.features.slice(0, 2).map((feature) =>
            <span
              key={feature}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">

                  {feature}
                </span>
            )}
              {platform.features.length > 2 &&
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  +{platform.features.length - 2}
                </span>
            }
            </div>
          }
        </CardContent>
      </Card>
    </motion.div>);

}

// Compact grid card for popular section
export function PlatformCardCompact({ platform, onClick }: Omit<PlatformCardProps, 'compact'>) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}>

      <Card
        className={cn(
          "cursor-pointer transition-all group overflow-hidden relative",
          "backdrop-blur-xl bg-card/80 border-border/50",
          "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40"
        )}
        onClick={onClick}>

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="p-3 relative z-[1]">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-xl bg-white shadow-sm flex items-center justify-center p-2 w-12 h-12 group-hover:shadow-md transition-shadow relative">
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-md"
                style={{ backgroundColor: platform.color }} />

              <PlatformLogo platform={platform.id} size="lg" />
            </div>
            
          </div>
        </CardContent>
      </Card>
    </motion.div>);

}