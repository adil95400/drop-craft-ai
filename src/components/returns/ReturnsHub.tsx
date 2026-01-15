/**
 * Dashboard principal de gestion des retours - Optimisé
 * Combine stats, actions, vue Kanban/Liste
 */
import { useState, useCallback } from 'react'
import { useReturns } from '@/hooks/useReturns'
import { ReturnsQuickStats } from './ReturnsQuickStats'
import { ReturnsActionBar } from './ReturnsActionBar'
import { ReturnsKanban } from './ReturnsKanban'
import { ReturnsListView } from './ReturnsListView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, TrendingUp, Package } from 'lucide-react'
import { RefundAutomation } from './RefundAutomation'
import { ReturnsAnalytics } from './ReturnsAnalytics'

export function ReturnsHub() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [activeTab, setActiveTab] = useState('returns')

  const { returns, isLoading, refetch, updateStatus } = useReturns({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm
  })

  const handleStatusChange = useCallback((id: string, status: any) => {
    updateStatus({ id, status })
  }, [updateStatus])

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <ReturnsQuickStats />

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="returns" className="gap-2">
            <Package className="h-4 w-4" />
            Retours
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Bot className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-4">
          {/* Barre d'actions */}
          <ReturnsActionBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={refetch}
            isLoading={isLoading}
          />

          {/* Vue principale */}
          {viewMode === 'kanban' ? (
            <ReturnsKanban />
          ) : (
            <ReturnsListView 
              returns={returns} 
              onStatusChange={handleStatusChange}
            />
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <RefundAutomation />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ReturnsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
