/**
 * Setting Toggle - Channable Premium Design
 * Glassmorphism toggle component for sync settings
 */

import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SettingToggleProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon: React.ComponentType<{ className?: string }>
}

export function SettingToggle({ 
  label, 
  description, 
  checked, 
  onCheckedChange,
  icon: Icon 
}: SettingToggleProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
        "backdrop-blur-xl bg-card/80 hover:bg-muted/50",
        checked && "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          checked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  )
}
