/**
 * Wrapper de page Channable — Premium hero with refined gradient overlay
 * Performance: hero images are lazy-loaded on demand
 */

import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy-load hero images on demand
const heroImageImports: Record<string, () => Promise<{ default: string }>> = {
  dashboard: () => import('@/assets/images/hero-dashboard.png'),
  stock: () => import('@/assets/images/hero-stock.png'),
  settings: () => import('@/assets/images/hero-settings.png'),
  support: () => import('@/assets/images/hero-support.png'),
  automation: () => import('@/assets/images/hero-automation.png'),
  integrations: () => import('@/assets/images/hero-integrations.png'),
  analytics: () => import('@/assets/images/hero-analytics.png'),
  schema: () => import('@/assets/images/hero-schema.png'),
  products: () => import('@/assets/images/hero-products.png'),
  marketing: () => import('@/assets/images/hero-marketing.png'),
  orders: () => import('@/assets/images/hero-orders.png'),
  ai: () => import('@/assets/images/hero-ai.png'),
  suppliers: () => import('@/assets/images/hero-suppliers.png'),
  extensions: () => import('@/assets/images/hero-extensions.png'),
  research: () => import('@/assets/images/hero-research.png'),
  import: () => import('@/assets/images/hero-import.png'),
  notifications: () => import('@/assets/images/hero-notifications.png'),
};

const imageCache: Record<string, string> = {};

function useHeroImage(key: string) {
  const [src, setSrc] = useState<string | undefined>(imageCache[key]);
  useEffect(() => {
    if (imageCache[key]) { setSrc(imageCache[key]); return; }
    const loader = heroImageImports[key];
    if (loader) {
      loader().then(mod => {
        imageCache[key] = mod.default;
        setSrc(mod.default);
      });
    }
  }, [key]);
  return src;
}

export const heroImageKeys = Object.keys(heroImageImports);
export type HeroImageKey = keyof typeof heroImageImports;

interface ChannablePageWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  heroImage?: HeroImageKey;
  badge?: {
    label: string;
    icon?: LucideIcon;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  actions?: ReactNode;
  className?: string;
}

export function ChannablePageWrapper({
  children,
  title,
  subtitle,
  description,
  heroImage = 'dashboard',
  badge,
  actions,
  className
}: ChannablePageWrapperProps) {
  const backgroundImage = useHeroImage(heroImage);
  const BadgeIcon = badge?.icon;

  return (
    <div className={cn("space-y-5 w-full max-w-full overflow-x-hidden", className)}>
      {/* Hero Section — cleaner, more pro */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-xl border border-border/30"
      >
        {/* Background Image */}
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-500",
            backgroundImage ? "opacity-100" : "opacity-0"
          )}
          style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
        />
        {!backgroundImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/8" />
        )}
        
        {/* Refined overlay — more solid for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/[0.97] via-background/[0.92] to-background/70" />
        
        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6 md:p-8">
          <div className="max-w-3xl">
            {/* Badge */}
            {badge && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-3"
              >
                <Badge variant={badge.variant || "secondary"} className="text-[11px] font-medium gap-1.5 rounded-lg px-2.5 py-1">
                  {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                  {badge.label}
                </Badge>
              </motion.div>
            )}
            
            {subtitle && (
              <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
            )}
            
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground"
              style={{ textWrap: 'balance' } as any}
            >
              {title}
            </motion.h1>
            
            {description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed mt-2"
              >
                {description}
              </motion.p>
            )}
            
            {actions && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 flex flex-wrap gap-2"
              >
                {actions}
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
      </motion.div>
      
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
