import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from '@/components/AppSidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Bell, Search, Crown, Menu } from 'lucide-react'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { UserDropdown } from '@/shared/components/UserDropdown'

export function DashboardLayout() {
  const { isAdmin } = useUnifiedSystem()
  const navigate = useNavigate()
  const [notificationCount] = useState(0)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="md:ml-[--sidebar-width] md:peer-data-[state=collapsed]:ml-[--sidebar-width-icon] transition-[margin] duration-200 ease-linear">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="hidden lg:block">
                <h2 className="text-xl font-semibold text-foreground">
                  Commerce Hub
                </h2>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-9 bg-muted/30 border-0 focus:bg-background"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Crown className="h-3 w-3 mr-1" />
                  Ultra Pro
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard/notifications')}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
              
              <UserDropdown />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}