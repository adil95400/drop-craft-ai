/**
 * SidebarSearch - Barre de recherche pour la sidebar
 */
import { memo } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SidebarSearch = memo<SidebarSearchProps>(({ 
  value, 
  onChange, 
  placeholder = "Rechercher...",
  className 
}) => {
  return (
    <div className={cn("relative group", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
      <Input 
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 bg-sidebar-accent/50 border-sidebar-border/50 rounded-lg transition-all duration-200 focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onChange('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
})

SidebarSearch.displayName = 'SidebarSearch'
