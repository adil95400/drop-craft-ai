import { Link } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/contexts/NavigationContext'
import { NAV_GROUPS } from '@/config/modules'
import { getIcon } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

interface ModuleNavigationMenuProps {
  className?: string
}

export function ModuleNavigationMenu({ className }: ModuleNavigationMenuProps) {
  const { navigationGroups, canAccessModule, isActiveRoute } = useNavigation()

  return (
    <NavigationMenu className={cn('hidden md:flex', className)}>
      <NavigationMenuList>
        {NAV_GROUPS.map((group) => {
          const navGroup = navigationGroups.find(
            (ng) => ng.category.id === group.id
          )
          if (!navGroup || navGroup.modules.length === 0) return null

          const GroupIcon = getIcon(group.icon)
          const isGroupActive = navGroup.modules.some((m) =>
            isActiveRoute(m.route)
          )

          // For single module groups like Home, render direct link
          if (navGroup.modules.length === 1) {
            const module = navGroup.modules[0]
            return (
              <NavigationMenuItem key={group.id}>
                <Link to={module.route}>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isGroupActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <GroupIcon className="mr-2 h-4 w-4" />
                    {group.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={group.id}>
              <NavigationMenuTrigger
                className={cn(
                  isGroupActive && 'bg-accent text-accent-foreground'
                )}
              >
                <GroupIcon className="mr-2 h-4 w-4" />
                {group.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px] lg:grid-cols-3 bg-popover">
                  {navGroup.modules.map((module) => {
                    const ModuleIcon = getIcon(module.icon)
                    const isAccessible = canAccessModule(module.id)
                    const isActive = isActiveRoute(module.route)

                    return (
                      <li key={module.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={isAccessible ? module.route : '#'}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                              isAccessible
                                ? 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                                : 'opacity-50 cursor-not-allowed',
                              isActive && 'bg-accent/50'
                            )}
                            onClick={(e) => !isAccessible && e.preventDefault()}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-md',
                                  isAccessible
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                <ModuleIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium leading-none">
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
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    )
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
