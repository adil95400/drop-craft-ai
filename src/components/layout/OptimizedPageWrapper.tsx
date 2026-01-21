/**
 * Page Wrapper Optimisé avec animations et lazy loading
 * Remplace ChannablePageWrapper avec des améliorations performance
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Helmet } from "react-helmet-async"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrefersReducedMotion } from "@/hooks/use-media-query"

interface OptimizedPageWrapperProps {
  title: string
  subtitle?: string
  description?: string
  children: React.ReactNode
  /** Hero section image */
  heroImage?: string
  /** Badge to show in hero */
  badge?: React.ReactNode
  /** Action buttons */
  actions?: React.ReactNode
  /** Loading state */
  isLoading?: boolean
  /** Custom className */
  className?: string
  /** Show breadcrumb */
  breadcrumb?: React.ReactNode
  /** SEO meta description */
  metaDescription?: string
  /** Gradient variant */
  gradientVariant?: "primary" | "secondary" | "accent" | "muted"
}

const gradientClasses = {
  primary: "from-primary/10 via-primary/5 to-transparent",
  secondary: "from-secondary/10 via-secondary/5 to-transparent",
  accent: "from-accent/30 via-accent/10 to-transparent",
  muted: "from-muted/50 via-muted/20 to-transparent",
}

export function OptimizedPageWrapper({
  title,
  subtitle,
  description,
  children,
  heroImage,
  badge,
  actions,
  isLoading,
  className,
  breadcrumb,
  metaDescription,
  gradientVariant = "primary",
}: OptimizedPageWrapperProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  }

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{title} | ShopOpti</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
      </Helmet>

      <div className={cn("min-h-screen bg-background", className)}>
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={cn(
            "relative overflow-hidden border-b bg-gradient-to-b",
            gradientClasses[gradientVariant]
          )}
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb */}
            {breadcrumb && (
              <motion.div variants={itemVariants} className="mb-4">
                {breadcrumb}
              </motion.div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-4">
                {/* Badge */}
                {badge && (
                  <motion.div variants={itemVariants}>
                    {badge}
                  </motion.div>
                )}

                {/* Title */}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                >
                  {title}
                </motion.h1>

                {/* Subtitle */}
                {subtitle && (
                  <motion.p
                    variants={itemVariants}
                    className="text-lg text-muted-foreground"
                  >
                    {subtitle}
                  </motion.p>
                )}

                {/* Description */}
                {description && (
                  <motion.p
                    variants={itemVariants}
                    className="text-sm text-muted-foreground max-w-2xl"
                  >
                    {description}
                  </motion.p>
                )}

                {/* Actions */}
                {actions && (
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap gap-3 pt-2"
                  >
                    {actions}
                  </motion.div>
                )}
              </div>

              {/* Hero Image */}
              {heroImage && (
                <motion.div
                  variants={itemVariants}
                  className="hidden lg:block w-64 h-48 relative"
                >
                  <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.3 }}
          className="container mx-auto px-4 py-6 md:py-8"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <PageSkeleton key="skeleton" />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      </div>
    </>
  )
}

/**
 * Page loading skeleton
 */
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Content area */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Table or grid */}
      <div className="space-y-2">
        <Skeleton className="h-12 rounded-lg" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * Section wrapper avec animation
 */
export function PageSection({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("space-y-4", className)}
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </motion.section>
  )
}

/**
 * Card avec animation hover
 */
export function AnimatedCard({
  children,
  className,
  onClick,
  hoverEffect = true,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverEffect?: boolean
}) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-shadow",
        hoverEffect && "hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stats grid avec animations staggered
 */
export function StatsGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}) {
  const columnClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
      className={cn("grid grid-cols-1 gap-4", columnClasses[columns], className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
