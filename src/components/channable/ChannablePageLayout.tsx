/**
 * Layout de page style Channable
 * Wrapper principal pour toutes les pages avec le design Channable
 */

import { ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChannablePageLayoutProps {
  children: ReactNode
  title?: string
  metaTitle?: string
  metaDescription?: string
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  animate?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-[1600px]',
  full: 'max-w-full',
}

const paddingClasses = {
  none: '',
  sm: 'px-4 py-4',
  md: 'px-4 sm:px-6 py-6',
  lg: 'px-4 sm:px-6 lg:px-8 py-8',
}

export function ChannablePageLayout({
  children,
  title,
  metaTitle,
  metaDescription,
  className,
  maxWidth = '2xl',
  padding = 'md',
  animate = true
}: ChannablePageLayoutProps) {
  const Container = animate ? motion.div : 'div'
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <>
      {(metaTitle || title) && (
        <Helmet>
          <title>{metaTitle || title} | ShopOpti</title>
          {metaDescription && <meta name="description" content={metaDescription} />}
        </Helmet>
      )}

      <Container
        className={cn(
          "mx-auto space-y-6",
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          className
        )}
        {...animationProps}
      >
        {children}
      </Container>
    </>
  )
}
