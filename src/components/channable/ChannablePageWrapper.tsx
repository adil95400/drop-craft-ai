/**
 * Wrapper de page Channable avec hero image et design professionnel
 * Performance: hero images are lazy-loaded on demand instead of eagerly imported
 */

import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy-load hero images on demand to avoid importing all 17 at once
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

// Cache loaded images to avoid re-fetching
const imageCache: Record<string, string> = {};

function useHeroImage(key: string) {
  const [src, setSrc] = useState<string | undefined>(imageCache[key]);
  
  useEffect(() => {
    if (imageCache[key]) {
      setSrc(imageCache[key]);
      return;
    }
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
  return <div className={cn("space-y-6", className)}>
      {/* Hero Section avec image de fond */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }} className="relative overflow-hidden rounded-2xl">
        {/* Background Image - lazy loaded */}
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-500",
            backgroundImage ? "opacity-100" : "opacity-0"
          )}
          style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
        />
        {/* Fallback gradient while image loads */}
        {!backgroundImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        
        {/* Hexagon Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="hexagons-wrapper" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <polygon points="25,0 50,12.5 50,37.5 25,50 0,37.5 0,12.5" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons-wrapper)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="max-w-3xl">
            {/* Badge */}
            {badge && <motion.div initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.1
          }}>
                
              </motion.div>}
            
            {/* Subtitle */}
            {subtitle}
            
            {/* Title */}
            <motion.h1 initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                {title}
              </span>
            </motion.h1>
            
            {/* Description */}
            {description && <motion.p initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.25
          }} className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
                {description}
              </motion.p>}
            
            {/* Actions */}
            {actions && <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }} className="mt-6 flex flex-wrap gap-3">
                {actions}
              </motion.div>}
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </motion.div>
      
      {/* Main Content */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.35,
      duration: 0.4
    }}>
        {children}
      </motion.div>
    </div>;
}