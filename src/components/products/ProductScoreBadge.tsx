import { TrendingUp, Trophy, Star, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductScoreBadgeProps {
  score: number
  type: 'ai' | 'trend' | 'competition' | 'profit'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ProductScoreBadge({ 
  score, 
  type, 
  size = 'md', 
  showLabel = true,
  className 
}: ProductScoreBadgeProps) {
  const config = {
    ai: {
      icon: Star,
      label: 'Score IA',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    trend: {
      icon: TrendingUp,
      label: 'Tendance',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    competition: {
      icon: Target,
      label: 'Concurrence',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    profit: {
      icon: Trophy,
      label: 'Profit',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    }
  }

  const { icon: Icon, label, color, bg, border } = config[type]

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-300'
    if (score >= 60) return 'text-blue-700 bg-blue-100 border-blue-300'
    if (score >= 40) return 'text-orange-700 bg-orange-100 border-orange-300'
    return 'text-red-700 bg-red-100 border-red-300'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeClasses[size],
        getScoreColor(score),
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{Math.round(score)}</span>
      {showLabel && size !== 'sm' && (
        <span className="opacity-75 font-normal">/ 100</span>
      )}
    </div>
  )
}

interface ProductBadgeGroupProps {
  isWinner?: boolean
  isTrending?: boolean
  isBestseller?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProductBadgeGroup({ 
  isWinner, 
  isTrending, 
  isBestseller,
  size = 'md',
  className 
}: ProductBadgeGroupProps) {
  const badges = []

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (isWinner) {
    badges.push(
      <div
        key="winner"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold',
          sizeClasses[size]
        )}
      >
        <Trophy className={iconSizes[size]} />
        Winner
      </div>
    )
  }

  if (isTrending) {
    badges.push(
      <div
        key="trending"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold',
          sizeClasses[size]
        )}
      >
        <TrendingUp className={iconSizes[size]} />
        Tendance
      </div>
    )
  }

  if (isBestseller) {
    badges.push(
      <div
        key="bestseller"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold',
          sizeClasses[size]
        )}
      >
        <Star className={iconSizes[size]} />
        Best-seller
      </div>
    )
  }

  if (badges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges}
    </div>
  )
}
