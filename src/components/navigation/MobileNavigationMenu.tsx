import React, { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export function MobileNavigationMenu() {
  const [open, setOpen] = useState(false);
  const { navigationGroups, canAccessModule, isActiveRoute } = useNavigation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Accordion type="multiple" className="w-full">
            {navigationGroups.map((group) => (
              <AccordionItem key={group.category.id} value={group.category.id}>
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span>{group.category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.accessibleCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pl-4">
                    {group.modules.map((module) => {
                      const accessible = canAccessModule(module.id);
                      const active = isActiveRoute(module.route);

                      return (
                        <Link
                          key={module.id}
                          to={accessible ? module.route : '#'}
                          onClick={(e) => {
                            if (!accessible) {
                              e.preventDefault();
                            } else {
                              setOpen(false);
                            }
                          }}
                          className={cn(
                            'flex items-center justify-between py-2 px-3 rounded-md text-sm transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground font-medium'
                              : accessible
                              ? 'hover:bg-accent hover:text-accent-foreground'
                              : 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span>{module.name}</span>
                          <div className="flex items-center gap-2">
                            {module.minPlan !== 'standard' && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  module.minPlan === 'ultra_pro'
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none'
                                    : 'bg-purple-500 text-white border-none'
                                )}
                              >
                                {module.minPlan === 'ultra_pro' ? 'ULTRA' : 'PRO'}
                              </Badge>
                            )}
                            {accessible && <ChevronRight className="h-4 w-4" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
