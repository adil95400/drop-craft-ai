import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ScrollableTabsProps extends React.ComponentPropsWithoutRef<typeof Tabs> {
  children: React.ReactNode
}

interface ScrollableTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  children: React.ReactNode
}

/**
 * ScrollableTabs - Wrapper for Tabs that makes TabsList scrollable on mobile
 */
export function ScrollableTabs({ children, className, ...props }: ScrollableTabsProps) {
  return (
    <Tabs className={cn("space-y-4", className)} {...props}>
      {children}
    </Tabs>
  )
}

/**
 * ScrollableTabsList - Horizontally scrollable tabs list for mobile
 */
export function ScrollableTabsList({ children, className, ...props }: ScrollableTabsListProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
      <TabsList 
        className={cn(
          "inline-flex w-max md:w-full min-w-full gap-1 h-auto p-1",
          className
        )} 
        {...props}
      >
        {children}
      </TabsList>
    </div>
  )
}

/**
 * ScrollableTabsTrigger - Tab trigger optimized for mobile
 */
export function ScrollableTabsTrigger({ 
  children, 
  className,
  icon,
  shortLabel,
  ...props 
}: React.ComponentPropsWithoutRef<typeof TabsTrigger> & {
  icon?: React.ReactNode
  shortLabel?: string
}) {
  return (
    <TabsTrigger 
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm",
        className
      )} 
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {shortLabel ? (
        <>
          <span className="hidden sm:inline">{children}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </>
      ) : (
        children
      )}
    </TabsTrigger>
  )
}

export { TabsContent }
