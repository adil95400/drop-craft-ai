/**
 * Wrapper de page Channable avec hero image et design professionnel
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import des images hero
import heroDashboard from '@/assets/images/hero-dashboard.png';
import heroStock from '@/assets/images/hero-stock.png';
import heroSettings from '@/assets/images/hero-settings.png';
import heroSupport from '@/assets/images/hero-support.png';
import heroAutomation from '@/assets/images/hero-automation.png';
import heroIntegrations from '@/assets/images/hero-integrations.png';
import heroAnalytics from '@/assets/images/hero-analytics.png';
import heroSchema from '@/assets/images/hero-schema.png';
import heroProducts from '@/assets/images/hero-products.png';
import heroMarketing from '@/assets/images/hero-marketing.png';
import heroOrders from '@/assets/images/hero-orders.png';
import heroAi from '@/assets/images/hero-ai.png';
import heroSuppliers from '@/assets/images/hero-suppliers.png';
import heroExtensions from '@/assets/images/hero-extensions.png';
import heroResearch from '@/assets/images/hero-research.png';
import heroImport from '@/assets/images/hero-import.png';
import heroNotifications from '@/assets/images/hero-notifications.png';
export const heroImages = {
  dashboard: heroDashboard,
  stock: heroStock,
  settings: heroSettings,
  support: heroSupport,
  automation: heroAutomation,
  integrations: heroIntegrations,
  analytics: heroAnalytics,
  schema: heroSchema,
  products: heroProducts,
  marketing: heroMarketing,
  orders: heroOrders,
  ai: heroAi,
  suppliers: heroSuppliers,
  extensions: heroExtensions,
  research: heroResearch,
  import: heroImport,
  notifications: heroNotifications
} as const;
export type HeroImageKey = keyof typeof heroImages;
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
  const backgroundImage = heroImages[heroImage];
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
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${backgroundImage})`
      }} />
        
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
        <div className="relative z-10 p-6 md:p-8 lg:p-10">
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
          }} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
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
          }} className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
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