import { useState, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Trash2, Edit, Check, X } from 'lucide-react'

interface SwipeableActionsProps {
  children: ReactNode
  onDelete?: () => void
  onEdit?: () => void
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

export function SwipeableActions({
  children,
  onDelete,
  onEdit,
  onApprove,
  onReject,
  className
}: SwipeableActionsProps) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current
    const newOffset = Math.max(0, Math.min(diff, 160))
    setOffset(newOffset)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offset > 80) {
      setOffset(160)
    } else {
      setOffset(0)
    }
  }

  const resetOffset = () => setOffset(0)

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Actions (behind content) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {onEdit && (
          <button
            onClick={() => { onEdit(); resetOffset(); }}
            className="w-20 bg-blue-500 flex items-center justify-center text-white"
          >
            <Edit className="h-5 w-5" />
          </button>
        )}
        {onApprove && (
          <button
            onClick={() => { onApprove(); resetOffset(); }}
            className="w-20 bg-green-500 flex items-center justify-center text-white"
          >
            <Check className="h-5 w-5" />
          </button>
        )}
        {onReject && (
          <button
            onClick={() => { onReject(); resetOffset(); }}
            className="w-20 bg-orange-500 flex items-center justify-center text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => { onDelete(); resetOffset(); }}
            className="w-20 bg-destructive flex items-center justify-center text-white"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div
        className="relative bg-background transition-transform duration-200"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
