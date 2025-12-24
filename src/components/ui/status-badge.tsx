import { Badge } from "@/components/ui/badge"
import { getStatusLabel, getStatusColorClass } from "@/utils/statusLabels"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Pause,
  Archive
} from "lucide-react"

type StatusCategory = 'order' | 'product' | 'sync' | 'integration' | 'alert' | 'job'

interface StatusBadgeProps {
  status: string
  category?: StatusCategory
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  delivered: CheckCircle,
  completed: CheckCircle,
  success: CheckCircle,
  active: CheckCircle,
  connected: CheckCircle,
  paid: CheckCircle,
  published: CheckCircle,
  in_stock: Package,
  synced: CheckCircle,
  
  pending: Clock,
  queued: Clock,
  on_hold: Pause,
  
  processing: RefreshCw,
  syncing: RefreshCw,
  running: Loader2,
  
  shipped: Truck,
  
  cancelled: XCircle,
  failed: XCircle,
  error: XCircle,
  critical: AlertCircle,
  disconnected: XCircle,
  out_of_stock: XCircle,
  
  draft: Archive,
  inactive: Archive,
  archived: Archive,
  
  warning: AlertCircle,
  low_stock: AlertCircle,
  info: AlertCircle,
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
}

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

export function StatusBadge({ 
  status, 
  category = 'order',
  showIcon = true,
  size = 'md',
  className 
}: StatusBadgeProps) {
  const label = getStatusLabel(status, category)
  const colorClass = getStatusColorClass(status)
  const IconComponent = statusIcons[status?.toLowerCase()]
  const isAnimated = ['processing', 'syncing', 'running'].includes(status?.toLowerCase())
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium border-0 gap-1.5",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={cn(
          iconSizeClasses[size],
          isAnimated && "animate-spin"
        )} />
      )}
      {label}
    </Badge>
  )
}

// Composant pour afficher plusieurs statuts
export function StatusBadgeGroup({ 
  statuses,
  category = 'order',
  className 
}: { 
  statuses: string[]
  category?: StatusCategory
  className?: string 
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {statuses.map((status, index) => (
        <StatusBadge 
          key={index}
          status={status}
          category={category}
          size="sm"
        />
      ))}
    </div>
  )
}
