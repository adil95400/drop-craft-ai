/**
 * RealTimeIndicator — Simple network/online status indicator
 * No Supabase realtime. Just navigator.onLine.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RealTimeIndicatorProps {
  className?: string
  showMetrics?: boolean
}

export function RealTimeIndicator({ className }: RealTimeIndicatorProps) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOn = () => setOnline(true)
    const onOff = () => setOnline(false)
    window.addEventListener('online', onOn)
    window.addEventListener('offline', onOff)
    return () => {
      window.removeEventListener('online', onOn)
      window.removeEventListener('offline', onOff)
    }
  }, [])

  const Icon = online ? Wifi : WifiOff
  const label = online ? 'En ligne' : 'Hors ligne'
  const color = online ? 'text-emerald-500' : 'text-muted-foreground'
  const bg = online ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-muted-foreground/30'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border', bg, className)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className={cn('text-xs font-medium', color)}>{label}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">{online ? 'Connecté au réseau' : 'Aucune connexion réseau'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
