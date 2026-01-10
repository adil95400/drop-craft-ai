import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Search, ChevronDown, Crown, Sparkles, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useNavigation } from '@/contexts/NavigationContext'
import { getIcon } from '@/lib/icon-map'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { QuickNavigationBar } from './QuickNavigationBar'
import { cn } from '@/lib/utils'

interface MobileNavigationMenuProps {
  className?: string
}

export function MobileNavigationMenu({ className }: MobileNavigationMenuProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { navigationGroups, canAccessModule, isActiveRoute } = useNavigation()
  const { effectivePlan } = useUnifiedPlan()

  const handleNavigate = useCallback(
    (route: string, isAccessible: boolean) => {
      if (isAccessible) {
        navigate(route)
        setOpen(false)
      }
    },
    [navigate]
  )

  // Get active groups for default open state
  const activeGroups = navigationGroups
    .filter((group) => group.modules.some((m) => isActiveRoute(m.route)))
    .map((g) => g.category.id)

  return (
    <div className={cn('md:hidden', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b bg-gradient-to-br from-primary/5 to-background p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">ShopOpti</h1>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs capitalize text-muted-foreground">
                        {effectivePlan || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle collapsed={true} variant="ghost" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Search in mobile */}
              <div className="mt-4">
                <QuickNavigationBar className="w-full" />
              </div>
            </div>

            {/* Navigation Groups with Accordions */}
            <ScrollArea className="flex-1">
              <Accordion
                type="multiple"
                defaultValue={activeGroups}
                className="w-full px-2 py-2"
              >
                {navigationGroups.map((navGroup) => {
                  if (navGroup.modules.length === 0) return null

                  const GroupIcon = getIcon(navGroup.category.icon)
                  const isGroupActive = navGroup.modules.some((m) =>
                    isActiveRoute(m.route)
                  )

                  return (
                    <AccordionItem
                      key={navGroup.category.id}
                      value={navGroup.category.id}
                      className="border-b-0"
                    >
                      <AccordionTrigger
                        className={cn(
                          'rounded-lg px-3 py-2.5 hover:bg-accent hover:no-underline',
                          isGroupActive && 'bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-md',
                              isGroupActive
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <GroupIcon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{navGroup.category.label}</span>
                          <Badge
                            variant="secondary"
                            className="ml-auto mr-2 h-5 px-1.5 text-[10px]"
                          >
                            {navGroup.accessibleCount}/{navGroup.modules.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-2 pt-1">
                        <div className="space-y-1 pl-2">
                          {navGroup.modules.map((module) => {
                            const ModuleIcon = getIcon(module.icon)
                            const isAccessible = canAccessModule(module.id)
                            const isActive = isActiveRoute(module.route)

                            return (
                              <button
                                key={module.id}
                                onClick={() =>
                                  handleNavigate(module.route, isAccessible)
                                }
                                disabled={!isAccessible}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : isAccessible
                                      ? 'hover:bg-accent active:scale-[0.98]'
                                      : 'cursor-not-allowed opacity-50'
                                )}
                              >
                                <ModuleIcon
                                  className={cn(
                                    'h-4 w-4 shrink-0',
                                    isActive
                                      ? 'text-primary-foreground'
                                      : 'text-muted-foreground'
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        'truncate text-sm font-medium',
                                        isActive && 'text-primary-foreground'
                                      )}
                                    >
                                      {module.name}
                                    </span>
                                    {module.badge && (
                                      <Badge
                                        variant={
                                          module.badge === 'pro'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="h-4 px-1 text-[9px] uppercase"
                                      >
                                        {module.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p
                                    className={cn(
                                      'line-clamp-1 text-xs',
                                      isActive
                                        ? 'text-primary-foreground/80'
                                        : 'text-muted-foreground'
                                    )}
                                  >
                                    {module.description}
                                  </p>
                                </div>
                                {!isAccessible && (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 text-[10px]"
                                  >
                                    Upgrade
                                  </Badge>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  © 2024 ShopOpti
                </span>
                <Badge variant="outline" className="text-[10px]">
                  <Crown className="mr-1 h-3 w-3" />
                  {effectivePlan || 'Standard'}
                </Badge>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
