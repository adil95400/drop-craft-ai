import { useState, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingCart, Sparkles, Crown } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface MobileNavigationMenuProps {
  className?: string
}

export const MobileNavigationMenu = memo(function MobileNavigationMenu({ 
  className 
}: MobileNavigationMenuProps) {
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
    <div className={cn(className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex h-full flex-col">
            {/* Header compact */}
            <div className="border-b bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow">
                    <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold">ShopOpti</h1>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[10px] capitalize text-muted-foreground">
                        {effectivePlan || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle collapsed={true} variant="ghost" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation compacte */}
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
                          'rounded-md px-2 py-2 hover:bg-accent hover:no-underline text-sm',
                          isGroupActive && 'bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className={cn(
                            "h-4 w-4",
                            isGroupActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="font-medium">{navGroup.category.label}</span>
                          <Badge
                            variant="secondary"
                            className="ml-auto mr-2 h-4 px-1 text-[9px]"
                          >
                            {navGroup.modules.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-1 pt-0.5">
                        <div className="space-y-0.5 pl-1">
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
                                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : isAccessible
                                      ? 'hover:bg-accent'
                                      : 'cursor-not-allowed opacity-40'
                                )}
                              >
                                <ModuleIcon className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate flex-1">{module.name}</span>
                                {module.badge && (
                                  <Badge
                                    variant={module.badge === 'pro' ? 'default' : 'secondary'}
                                    className="h-4 px-1 text-[8px] uppercase"
                                  >
                                    {module.badge}
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

            {/* Footer compact */}
            <div className="border-t bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">© 2024 ShopOpti</span>
                <Badge variant="outline" className="text-[9px] h-5">
                  <Crown className="mr-1 h-2.5 w-2.5" />
                  {effectivePlan || 'Standard'}
                </Badge>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
})
