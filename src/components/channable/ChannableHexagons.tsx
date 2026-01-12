/**
 * Hexagones animés style Channable pour les hero sections
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HexagonConfig {
  x: number
  y: number
  size: number
  delay: number
  color: string
}

const defaultHexColors = [
  'from-pink-500 to-rose-500',
  'from-orange-400 to-amber-500',
  'from-yellow-400 to-yellow-500',
  'from-emerald-400 to-green-500',
  'from-cyan-400 to-blue-500',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-fuchsia-500 to-pink-500',
]

const defaultHexagons: HexagonConfig[] = [
  { x: 350, y: 80, size: 60, delay: 0, color: defaultHexColors[6] },
  { x: 420, y: 140, size: 50, delay: 0.1, color: defaultHexColors[0] },
  { x: 380, y: 200, size: 55, delay: 0.2, color: defaultHexColors[1] },
  { x: 450, y: 220, size: 45, delay: 0.3, color: defaultHexColors[5] },
  { x: 300, y: 160, size: 40, delay: 0.4, color: defaultHexColors[2] },
  { x: 480, y: 300, size: 50, delay: 0.5, color: defaultHexColors[4] },
  { x: 400, y: 320, size: 55, delay: 0.6, color: defaultHexColors[3] },
  { x: 320, y: 280, size: 35, delay: 0.7, color: defaultHexColors[7] },
]

interface ChannableHexagonsProps {
  hexagons?: HexagonConfig[]
  className?: string
  showLines?: boolean
}

export function ChannableHexagons({ 
  hexagons = defaultHexagons, 
  className,
  showLines = true 
}: ChannableHexagonsProps) {
  return (
    <div className={cn(
      "absolute right-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none hidden lg:block",
      className
    )}>
      {showLines && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400" fill="none">
          <motion.path
            d="M100 200 L200 150 L300 180 L400 120"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <motion.path
            d="M150 280 L250 250 L350 300 L420 250"
            stroke="url(#lineGradient2)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.8 }}
          />
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {hexagons.map((hex, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-xl bg-gradient-to-br shadow-lg", hex.color)}
          style={{
            left: hex.x - hex.size / 2,
            top: hex.y - hex.size / 2,
            width: hex.size,
            height: hex.size,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: hex.delay }}
        />
      ))}
    </div>
  )
}
