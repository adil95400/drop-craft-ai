/**
 * Filtre par catégories style Channable
 */

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ChannableCategory } from './types'
import { Globe } from 'lucide-react'

interface ChannableCategoryFilterProps {
  categories: ChannableCategory[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  showAll?: boolean
  allLabel?: string
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

export function ChannableCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  showAll = true,
  allLabel = 'Tous',
  className,
  variant = 'default'
}: ChannableCategoryFilterProps) {
  const allCategories = showAll 
    ? [{ id: 'all', label: allLabel, icon: Globe }, ...categories]
    : categories

  if (variant === 'pills') {
    return (
      <ScrollArea className={cn("w-full", className)}>
        <div className="flex gap-2 pb-2">
          {allCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "whitespace-nowrap transition-all duration-200",
                    isSelected && "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.label}
                  {category.count !== undefined && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-2 text-xs",
                        isSelected && "bg-primary-foreground/20 text-primary-foreground"
                      )}
                    >
                      {category.count}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
  }

  if (variant === 'underline') {
    return (
      <div className={cn("border-b", className)}>
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-px">
            {allCategories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 -mb-px",
                    isSelected 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  {category.count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({category.count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  }

  // Default: card-style filter
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3", className)}>
      {allCategories.map((category, index) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id

        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ y: -2 }}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
              isSelected 
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                : "bg-card hover:bg-muted/50 border-border hover:border-primary/30"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{category.label}</span>
            {category.count !== undefined && (
              <span className={cn(
                "text-xs",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {category.count}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
