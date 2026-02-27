/**
 * Semantic status color system
 * 
 * Replace hardcoded Tailwind colors (text-green-500, bg-blue-100, etc.)
 * with semantic tokens aligned with the design system.
 * 
 * Usage:
 *   import { statusColors } from '@/lib/status-colors'
 *   <Icon className={statusColors.success.text} />
 *   <div className={statusColors.danger.bg}>...</div>
 */

export const statusColors = {
  success: {
    text: 'text-success',
    bg: 'bg-success/10',
    bgSolid: 'bg-success',
    border: 'border-success/20',
    badge: 'bg-success/10 text-success border-success/20',
    icon: 'text-success',
  },
  danger: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    bgSolid: 'bg-destructive',
    border: 'border-destructive/20',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: 'text-destructive',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    bgSolid: 'bg-warning',
    border: 'border-warning/20',
    badge: 'bg-warning/10 text-warning border-warning/20',
    icon: 'text-warning',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info/10',
    bgSolid: 'bg-info',
    border: 'border-info/20',
    badge: 'bg-info/10 text-info border-info/20',
    icon: 'text-info',
  },
  neutral: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    bgSolid: 'bg-muted',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
    icon: 'text-muted-foreground',
  },
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    bgSolid: 'bg-primary',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary border-primary/20',
    icon: 'text-primary',
  },
} as const

/**
 * Get score-based color tokens
 * @param score 0-100
 */
export function getScoreStatus(score: number) {
  if (score >= 80) return statusColors.success
  if (score >= 60) return statusColors.warning
  return statusColors.danger
}

/**
 * Get trend color (positive = success, negative = danger)
 */
export function getTrendStatus(value: number) {
  if (value > 0) return statusColors.success
  if (value < 0) return statusColors.danger
  return statusColors.neutral
}

export type StatusKey = keyof typeof statusColors
