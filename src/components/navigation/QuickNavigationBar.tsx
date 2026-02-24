import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/contexts/NavigationContext'
import { getIcon } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface QuickNavigationBarProps {
  className?: string
}

export function QuickNavigationBar({ className }: QuickNavigationBarProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { navigationGroups, canAccessModule, searchModules } = useNavigation()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((route: string) => {
    setOpen(false)
    setSearch('')
    navigate(route)
  }, [navigate])

  const filteredGroups = search
    ? navigationGroups
        .map((group) => ({
          ...group,
          modules: group.modules.filter(
            (m) =>
              m.name.toLowerCase().includes(search.toLowerCase()) ||
              m.description.toLowerCase().includes(search.toLowerCase()) ||
              m.features.some((f) => f.toLowerCase().includes(search.toLowerCase()))
          ),
        }))
        .filter((g) => g.modules.length > 0)
    : navigationGroups

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:w-64 md:w-40 lg:w-64',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">{t('header.search')}</span>
        <span className="inline-flex lg:hidden">{t('search')}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t('header.searchModule')}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>{t('header.noResultsFound')}</CommandEmpty>

          {filteredGroups.map((group) => {
            return (
              <CommandGroup
                key={group.category.id}
                heading={group.category.label}
              >
                {group.modules.map((module) => {
                  const IconComponent = getIcon(module.icon)
                  const isAccessible = canAccessModule(module.id)

                  return (
                    <CommandItem
                      key={module.id}
                      value={`${module.name} ${module.description}`}
                      onSelect={() => handleSelect(module.route)}
                      disabled={!isAccessible}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md',
                        isAccessible
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{module.name}</span>
                          {module.badge && (
                            <Badge
                              variant={module.badge === 'pro' ? 'default' : 'secondary'}
                              className="h-5 text-[10px] uppercase"
                            >
                              {module.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {module.description}
                        </span>
                      </div>
                      {!isAccessible && (
                        <Badge variant="outline" className="text-[10px]">
                          Upgrade
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
