/**
 * Types pour le système de design Channable
 */

import { LucideIcon } from 'lucide-react'

export interface ChannableCategory {
  id: string
  label: string
  icon: LucideIcon
  count?: number
}

export interface ChannableStat {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info'
}

export interface ChannableQuickAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}
