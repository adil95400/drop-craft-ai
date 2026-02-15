/**
 * MainLayout - Utilise le nouveau design Channable
 * Includes real-time job notifications
 */
import React from 'react'
import { ChannableLayout } from '@/components/channable/navigation'
import { useJobRealtime } from '@/hooks/useJobRealtime'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  useJobRealtime()
  return <ChannableLayout>{children}</ChannableLayout>
}