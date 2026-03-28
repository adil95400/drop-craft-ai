/**
 * MainLayout - Utilise le nouveau design Channable
 * Includes real-time job notifications + beta feedback widget
 */
import React from 'react'
import { ChannableLayout } from '@/components/channable/navigation'
import { useJobRealtime } from '@/hooks/useJobRealtime'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import BetaFeedbackWidget from '@/components/beta/BetaFeedbackWidget'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  useJobRealtime()
  useRealtimeNotifications()
  return (
    <ChannableLayout>
      {children}
      <BetaFeedbackWidget />
    </ChannableLayout>
  )
}