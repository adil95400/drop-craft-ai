/**
 * MainLayout - Utilise le nouveau design Channable
 */
import React from 'react'
import { ChannableLayout } from '@/components/channable/navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return <ChannableLayout>{children}</ChannableLayout>
}